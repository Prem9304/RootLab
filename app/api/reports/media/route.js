import { NextResponse } from 'next/server';
import Docker from 'dockerode';

const docker = new Docker();
const CONTAINER_NAME = 'kali-default';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'File parameter is required' }, { status: 400 });
  }

  // Basic security to ensure we only read expected file types from root
  if (!file.startsWith('/') || (!file.endsWith('.png') && !file.endsWith('.mp4') && !file.endsWith('.txt') && !file.endsWith('.json'))) {
    return NextResponse.json({ error: 'Invalid file requested' }, { status: 403 });
  }

  try {
    const containers = await docker.listContainers({ all: true, filters: { name: [`^/${CONTAINER_NAME}$`] } });
    if (containers.length === 0) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }
    const container = docker.getContainer(containers[0].Id);

    // Use docker.getArchive to reliably get raw binary data (it comes as a tar stream)
    const tarStream = await container.getArchive({ path: file });
    
    // We need to extract the file from the tar stream
    // For simplicity in a Next.js API route without external tar parsers, 
    // it's easier to use docker exec cat which will dump raw stdout, but we must handle the 8-byte header
    
    return new Promise((resolve, reject) => {
        container.exec({
          Cmd: ['cat', file],
          AttachStdout: true,
          AttachStderr: false
        }, (err, exec) => {
          if (err) return resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          
          exec.start({ hijack: true }, (err, stream) => {
            if (err) return resolve(NextResponse.json({ error: err.message }, { status: 500 }));
            
            const chunks = [];
            
            // Docker's stream format: [8 byte header][payload]
            // We need to parse this out to get pure binary data
            stream.on('data', (chunk) => {
              // The docker exec stream attaches an 8-byte header to every chunk
              // [0]: stream type (1 = stdout)
              // [4-7]: size of payload (big endian)
              let offset = 0;
              while (offset < chunk.length) {
                const streamType = chunk[offset];
                if (streamType === 1) { // stdout
                   const size = chunk.readUInt32BE(offset + 4);
                   chunks.push(chunk.slice(offset + 8, offset + 8 + size));
                   offset += 8 + size;
                } else {
                   // if we somehow lost sync, just break to avoid infinite loop
                   break;
                }
              }
            });
            
            stream.on('end', () => {
              const buffer = Buffer.concat(chunks);
              
              let contentType = 'application/octet-stream';
              if (file.endsWith('.png')) contentType = 'image/png';
              if (file.endsWith('.mp4')) contentType = 'video/mp4';
              if (file.endsWith('.txt')) contentType = 'text/plain';
              if (file.endsWith('.json')) contentType = 'application/json';
              
              resolve(new NextResponse(buffer, {
                headers: {
                  'Content-Type': contentType,
                  'Content-Length': buffer.length.toString(),
                  'Cache-Control': 'public, max-age=31536000'
                }
              }));
            });
            
            stream.on('error', (err) => {
               resolve(NextResponse.json({ error: err.message }, { status: 500 }));
            });
          });
        });
    });

  } catch (error) {
    console.error('Error in /api/reports/media:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

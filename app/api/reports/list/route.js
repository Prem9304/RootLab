import { NextResponse } from 'next/server';
import Docker from 'dockerode';

const docker = new Docker();
const CONTAINER_NAME = 'kali-default';

export async function GET() {
  try {
    const containers = await docker.listContainers({ all: true, filters: { name: [`^/${CONTAINER_NAME}$`] } });
    if (containers.length === 0) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }
    const container = docker.getContainer(containers[0].Id);
    
    // Command to list all possible output files
    const cmd = 'ls -1 /*.txt /*.json /*.png /*.mp4 2>/dev/null || echo ""';

    const result = await new Promise((resolve, reject) => {
      container.exec({
        Cmd: ['sh', '-c', cmd],
        AttachStdout: true,
        AttachStderr: true
      }, (err, exec) => {
        if (err) return reject(err);
        exec.start({ hijack: true }, (err, stream) => {
          if (err) return reject(err);
          let output = '';
          stream.on('data', (chunk) => {
             output += chunk.toString('utf8');
          });
          stream.on('end', () => resolve(output));
        });
      });
    });

    const cleanOutput = (out) => {
        if (!out) return [];
        // Extract valid absolute paths with allowed extensions, ignoring Docker stream headers
        const matches = out.match(/\/[^\s\x00-\x1F]+?\.(txt|json|png|mp4)/g) || [];
        return matches;
    };

    const files = cleanOutput(result);

    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error('Error in /api/reports/list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

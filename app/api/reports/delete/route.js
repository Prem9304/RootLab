import { NextResponse } from 'next/server';
import Docker from 'dockerode';

const docker = new Docker();
const CONTAINER_NAME = 'kali-default';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
      return NextResponse.json({ error: 'File parameter is required' }, { status: 400 });
    }

    // Basic security to ensure we only delete expected file types from root
    if (!file.startsWith('/') || (!file.endsWith('.png') && !file.endsWith('.mp4') && !file.endsWith('.txt') && !file.endsWith('.json'))) {
      return NextResponse.json({ error: 'Invalid file requested' }, { status: 403 });
    }

    const containers = await docker.listContainers({ all: true, filters: { name: [`^/${CONTAINER_NAME}$`] } });
    if (containers.length === 0) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }
    const container = docker.getContainer(containers[0].Id);

    const cmd = `rm -f "${file.replace(/"/g, '\\"')}"`;

    await new Promise((resolve, reject) => {
      container.exec({
        Cmd: ['sh', '-c', cmd],
        AttachStdout: true,
        AttachStderr: true
      }, (err, exec) => {
        if (err) return reject(err);
        exec.start({ hijack: true }, (err, stream) => {
          if (err) return reject(err);
          stream.on('end', () => resolve());
        });
      });
    });

    return NextResponse.json({ success: true, message: `Deleted ${file}` });
  } catch (error) {
    console.error('Error in /api/reports/delete:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

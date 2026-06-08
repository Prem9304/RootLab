const net = require('net');
const { spawn } = require('child_process');

const LOCAL_PORT = 8834;

const server = net.createServer((localSocket) => {
    const dockerProc = spawn('docker', [
        'exec', '-i', 'kali-default', 
        'socat', 'STDIO', 'TCP:127.0.0.1:8834'
    ], { shell: true });

    localSocket.on('error', (err) => {
        dockerProc.kill();
    });

    dockerProc.on('error', (err) => {
        localSocket.destroy();
    });

    dockerProc.stdin.on('error', () => {});
    dockerProc.stdout.on('error', () => {});

    localSocket.pipe(dockerProc.stdin);
    dockerProc.stdout.pipe(localSocket);

    localSocket.on('close', () => dockerProc.kill());
    dockerProc.on('close', () => localSocket.destroy());
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

server.listen(LOCAL_PORT, () => {
    console.log(`Docker-Native TCP Proxy active: Forwarding localhost:${LOCAL_PORT} -> kali-default:8834`);
    console.log(`Open https://localhost:${LOCAL_PORT} in your browser to access Nessus.`);
});

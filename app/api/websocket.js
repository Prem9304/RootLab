// pages/api/websocket.js
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';

const containerName = 'kali-default';
const restrictedPatterns = [
  /\brm\s+-rf\b/,
  /\bshutdown\b/, /\breboot\b/, /\binit\b/,
  />/, />>/, /\bchmod\s+777\b/, /\bdd\b/,
  /\bnohup\b/, /&\s*$/,
];

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  console.log('[ws] Handler invoked:', req.method, req.url);

  // Only initialize once
  if (!res.socket.server.wss) {
    console.log('[ws] Creating WebSocketServer');
    const wss = new WebSocketServer({ noServer: true });
    res.socket.server.wss = wss;
    res.socket.server.wsClients = new Map();

    // Attach raw HTTP upgrade listener
    res.socket.server.on('upgrade', (request, socket, head) => {
      console.log('[ws] Upgrade event for:', request.url);
      if (request.url === '/api/websocket') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          console.log('[ws] Handshake complete, emitting connection');
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    // Handle new WebSocket connections
    wss.on('connection', (ws, request) => {
      console.log('[ws] Client connected:', request.socket.remoteAddress);
      // Send initial prompt
      ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));

      ws.on('message', (message) => {
        const command = message.toString().trim();
        console.log('[ws] Received command:', command);

        // Empty input => just re-prompt
        if (!command) {
          ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));
          return;
        }

        // Security check
        if (restrictedPatterns.some((rx) => rx.test(command))) {
          console.warn('[ws] Restricted command attempt:', command);
          ws.send(JSON.stringify({ type: 'error', content: 'Command restricted' }));
          ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));
          return;
        }

        // Prevent concurrent commands
        if (res.socket.server.wsClients.has(ws)) {
          ws.send(JSON.stringify({ type: 'error', content: 'Another command is already running' }));
          return;
        }

        // Spawn the Docker exec
        try {
          const child = spawn(
            'docker',
            ['exec', '-i', containerName, 'bash', '-lc', command],
            { stdio: ['ignore', 'pipe', 'pipe'] }
          );
          res.socket.server.wsClients.set(ws, child);
          console.log('[ws] Executing:', command);
          ws.send(JSON.stringify({ type: 'command', content: command }));

          const sendData = (data, type) => {
            data.toString().split('\n').forEach((line) => {
              if (line) ws.send(JSON.stringify({ type, content: line }));
            });
          };

          child.stdout.on('data', (data) => sendData(data, 'output'));
          child.stderr.on('data', (data) => sendData(data, 'error'));

          child.on('close', (code) => {
            console.log('[ws] Process exited with code:', code);
            res.socket.server.wsClients.delete(ws);
            ws.send(JSON.stringify({ type: 'system', content: `Process exited with code ${code}` }));
            ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));
          });

          child.on('error', (err) => {
            console.error('[ws] Execution error:', err);
            res.socket.server.wsClients.delete(ws);
            ws.send(JSON.stringify({ type: 'error', content: err.message }));
            ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));
          });
        } catch (err) {
          console.error('[ws] Spawn error:', err);
          ws.send(JSON.stringify({ type: 'error', content: 'Failed to start command' }));
          ws.send(JSON.stringify({ type: 'prompt', content: 'root@vm:~# ' }));
        }
      });

      ws.on('close', () => {
        console.log('[ws] Client disconnected');
        const child = res.socket.server.wsClients.get(ws);
        if (child) {
          child.kill('SIGTERM');
          res.socket.server.wsClients.delete(ws);
        }
      });

      ws.on('error', (err) => {
        console.error('[ws] WS error:', err);
      });
    });
  }

  // Always respond to the initial HTTP request
  res.status(200).end();
}

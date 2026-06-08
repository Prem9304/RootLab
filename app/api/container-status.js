// pages/api/container-status.js
import { exec } from 'child_process';

export default function handler(req, res) {
  const containerName = 'kali-default';

  exec(`docker inspect --format='{{.State.Running}}' ${containerName}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error checking container: ${error.message}`);
      return res.status(500).json({
        error: error.message,
        containerName,
        running: false,
        message: 'Error checking container status'
      });
    }

    const isRunning = stdout.trim() === 'true';

    res.status(200).json({
      containerName,
      running: isRunning,
      message: isRunning ? 'Container is running' : 'Container is not running'
    });
  });
}
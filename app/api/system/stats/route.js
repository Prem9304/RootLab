import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import os from 'os';

const docker = new Docker();
const CONTAINER_NAME = 'kali-default';

export async function GET() {
  try {
    const containers = await docker.listContainers({ all: true, filters: { name: [`^/${CONTAINER_NAME}$`] } });
    
    // System level stats
    const sysStats = {
      cpuCount: os.cpus().length,
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
    };

    if (containers.length === 0) {
      return NextResponse.json({ status: 'offline', system: sysStats });
    }

    const containerInfo = containers[0];
    const isRunning = containerInfo.State === 'running';

    if (!isRunning) {
      return NextResponse.json({ status: 'stopped', system: sysStats });
    }

    const container = docker.getContainer(containerInfo.Id);
    const stats = await container.stats({ stream: false });

    // Calculate CPU usage %
    let cpuPercent = 0.0;
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    if (systemDelta > 0.0 && cpuDelta > 0.0) {
      cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100.0;
    }

    // Calculate memory usage %
    const memUsage = stats.memory_stats.usage || 0;
    const memLimit = stats.memory_stats.limit || 0;
    let memPercent = 0.0;
    if (memLimit > 0) {
      memPercent = (memUsage / memLimit) * 100.0;
    }

    // Network stats
    let rxBytes = 0;
    let txBytes = 0;
    if (stats.networks) {
      for (const net of Object.values(stats.networks)) {
        rxBytes += net.rx_bytes;
        txBytes += net.tx_bytes;
      }
    }

    return NextResponse.json({
      status: 'running',
      container: {
        cpuPercent: cpuPercent.toFixed(2),
        memUsage: memUsage,
        memLimit: memLimit,
        memPercent: memPercent.toFixed(2),
        rxBytes,
        txBytes
      },
      system: sysStats
    });

  } catch (error) {
    console.error('Error fetching system stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

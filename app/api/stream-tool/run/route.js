// app/api/stream-tool/run/route.js
import { NextResponse } from "next/server";
import { spawn } from "child_process";
import containerName from "../../../lib/containerName";

// Store running process globally so stop endpoint can kill it
global.__streamToolProcess = null;

const ALLOWED_TOOLS = ["nmap", "nikto", "whois", "theHarvester", "httpx-pd", "katana-pd"];

export async function POST(request) {
  try {
    const { command } = await request.json();

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Invalid command" }, { status: 400 });
    }

    const trimmed = command.trim();
    const isAllowed = ALLOWED_TOOLS.some(tool => trimmed.startsWith(`${tool} `) || trimmed === tool);
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Command not permitted by stream-tool endpoint" }, { status: 403 });
    }

    let spawnCmd = "docker";
    let spawnArgs = ["exec", containerName, "sh", "-c", trimmed];

    // Create a ReadableStream that pipes output
    const stream = new ReadableStream({
      start(controller) {
        const proc = spawn(spawnCmd, spawnArgs, {
          stdio: ["ignore", "pipe", "pipe"],
        });

        global.__streamToolProcess = proc;

        const push = (chunk) => {
          try {
            controller.enqueue(new TextEncoder().encode(chunk));
          } catch (_) {}
        };

        proc.stdout.on("data", (data) => push(data.toString()));
        proc.stderr.on("data", (data) => push(data.toString()));

        proc.on("close", (code) => {
          global.__streamToolProcess = null;
          try {
            if (code !== 0 && code !== null) {
              push(`\n[Process exited with code ${code}]`);
            }
            controller.close();
          } catch (_) {}
        });

        proc.on("error", (err) => {
          global.__streamToolProcess = null;
          try {
            push(`\n[ERROR] Could not spawn process: ${err.message}\n`);
            controller.close();
          } catch (_) {}
        });
      },
      cancel() {
        if (global.__streamToolProcess) {
          try { global.__streamToolProcess.kill("SIGKILL"); } catch (_) {}
          global.__streamToolProcess = null;
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

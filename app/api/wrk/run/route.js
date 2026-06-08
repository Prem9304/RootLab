// app/api/wrk/run/route.js
import { NextResponse } from "next/server";
import { spawn } from "child_process";
import containerName from "../../../lib/containerName";

// Store running process globally so stop endpoint can kill it
global.__wrkProcess = null;

export async function POST(request) {
  try {
    const { command } = await request.json();

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Invalid command" }, { status: 400 });
    }

    // Only allow wrk commands
    const trimmed = command.trim();
    if (!trimmed.startsWith("wrk ")) {
      return NextResponse.json({ error: "Only wrk commands are permitted" }, { status: 403 });
    }

    // Build docker exec command (run as array to avoid shell injection)
    const dockerArgs = ["exec", containerName, "sh", "-c", trimmed];

    // Create a ReadableStream that pipes docker exec output
    const stream = new ReadableStream({
      start(controller) {
        const proc = spawn("docker", dockerArgs, {
          stdio: ["ignore", "pipe", "pipe"],
        });

        global.__wrkProcess = proc;

        const push = (chunk) => {
          try {
            controller.enqueue(new TextEncoder().encode(chunk));
          } catch (_) {}
        };

        proc.stdout.on("data", (data) => push(data.toString()));
        proc.stderr.on("data", (data) => push(data.toString()));

        proc.on("close", (code) => {
          global.__wrkProcess = null;
          try {
            if (code !== 0 && code !== null) {
              push(`\n[Process exited with code ${code}]`);
            }
            controller.close();
          } catch (_) {}
        });

        proc.on("error", (err) => {
          global.__wrkProcess = null;
          try {
            push(`\n[ERROR] Could not spawn process: ${err.message}\n\nTip: Make sure wrk is installed:\n  apt-get install wrk\n`);
            controller.close();
          } catch (_) {}
        });
      },
      cancel() {
        if (global.__wrkProcess) {
          try { global.__wrkProcess.kill("SIGKILL"); } catch (_) {}
          global.__wrkProcess = null;
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

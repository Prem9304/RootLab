// app/api/execute/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import containerName from "../../lib/containerName";

const execPromise = promisify(exec);

// Securely restrict dangerous commands
const restrictedPatterns = [
  /\brm\s+-rf\b/, // Prevents variations like "rm  -rf" (extra spaces)
  /\bshutdown\b/,
  /\breboot\b/,
  /\binit\b/, // System control
  />/,
  />>/, // File overwriting
  /\bchmod\s+777\b/, // Dangerous permission changes
  /\bdd\b/, // Low-level disk operations
];

export async function POST(request) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request format", details: parseError.message },
        { status: 400 }
      );
    }

    const { command } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Invalid command" }, { status: 400 });
    }

    // Check for restricted commands using regex
    if (restrictedPatterns.some((pattern) => pattern.test(command))) {
      return NextResponse.json(
        { error: "This command is restricted for security reasons" },
        { status: 403 }
      );
    }

    // Verify if the VM container is running.
    try {
      let { stdout: runningContainers } = await execPromise(
        `docker ps -q -f name=${containerName}`
      );
      
      if (!runningContainers.trim()) {
        // If not running, try to start it.
        try {
          const { stdout: startOutput, stderr: startError } = await execPromise(
            `docker start ${containerName}`
          );
          
          if (startError) {
            console.error("Error starting container:", startError);
          }
          
          if (!startOutput.trim()) {
            return NextResponse.json(
              { error: "VM is not running and could not be started. Start the VM first." },
              { status: 400 }
            );
          }
        } catch (startError) {
          console.error("Container start error:", startError);
          return NextResponse.json(
            { error: `Failed to start VM: ${startError.message}` },
            { status: 500 }
          );
        }
      }
    } catch (containerCheckError) {
      console.error("Container check error:", containerCheckError);
      return NextResponse.json(
        { error: `Failed to check VM status: ${containerCheckError.message}` },
        { status: 500 }
      );
    }

    // Execute the command inside the container using the Kali image's container
    const dockerCommand = `docker exec ${containerName} ${command}`;
    console.log("Executing docker command:", dockerCommand);

    try {
      const { stdout, stderr } = await execPromise(dockerCommand, { 
        timeout: 300000,  // 5 minute timeout for bulky installations
        maxBuffer: 1024 * 1024 * 5  // 5MB buffer for larger outputs
      });
      
      return NextResponse.json({
        output: stdout || stderr || "Command executed successfully",
      });
    } catch (execError) {
      console.error("Command execution error:", execError);
      const errorOutput = execError.stderr || execError.message || "Error executing command";
      
      return NextResponse.json(
        {
          error: true,
          output: errorOutput
        },
        { status: 200 }  // Return 200 even for command errors to allow frontend to display the error output
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Handle CORS for OPTIONS requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
const http = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");
const Docker = require("dockerode");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log("[Server] Initializing Docker client...");
const docker = new Docker();

const CONTAINER_NAME = "kali-default"; // Display name
const IMAGE_NAME = "kalilinux/kali-rolling"; // Default Kali Linux image
console.log(
  `[Server] Config - Container ID: ${CONTAINER_ID}`
);

async function getContainer() {
  try {
    // Get container by ID directly
    const container = docker.getContainer(CONTAINER_ID);
    // Test if container exists by inspecting it
    await container.inspect();
    return container;
  } catch (error) {
    console.error(
      `[Docker] Error getting container ${CONTAINER_ID}:`,
      error.statusCode,
      error.message || error.reason || error
    );
    if (error.statusCode === 404) return null;
    throw error;
  }
}

function sendJsonResponse(res, statusCode, data) {
  const jsonResponse = JSON.stringify(data);
  console.log(
    `[API:Response] Sending ${statusCode}: ${jsonResponse.substring(0, 200)}${
      jsonResponse.length > 200 ? "..." : ""
    }`
  );
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(jsonResponse);
}

async function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        console.error("[API:Request] Invalid JSON in request body:", e.message);
        reject(new Error("Invalid JSON in request body"));
      }
    });
    req.on("error", (err) => {
      console.error("[API:Request] Error reading request body:", err);
      reject(err);
    });
  });
}

app
  .prepare()
  .then(() => {
    console.log("[Server] Next.js app prepared.");
    const server = http.createServer(async (req, res) => {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      try {
        if (pathname === "/api/vm/start" && req.method === "POST") {
          console.log("[API:Start] Received request.");
          try {
            let container = await getContainer();
            if (container) {
              const info = await container.inspect();
              if (!info.State.Running) {
                console.log(
                  `[API:Start] Starting existing container ${CONTAINER_ID}...`
                );
                await container.start();
                sendJsonResponse(res, 200, {
                  status: "started",
                  message: `Container ${CONTAINER_ID} started.`,
                });
              } else {
                console.log(
                  `[API:Start] Container ${CONTAINER_ID} is already running.`
                );
                sendJsonResponse(res, 200, {
                  status: "already_running",
                  message: `Container ${CONTAINER_ID} is already running.`,
                });
              }
            } else {
              console.log(`[API:Start] Container ${CONTAINER_ID} not found.`);
              sendJsonResponse(res, 404, {
                status: "not_found",
                message: `Container ${CONTAINER_ID} not found.`,
              });
            }
          } catch (error) {
            console.error(
              "[API:Start] Error:",
              error.statusCode,
              error.message || error.reason || error
            );
            sendJsonResponse(res, error.statusCode || 500, {
              error: "Failed to start container",
              details: error.message || error.reason || error.toString(),
            });
          }
          return;
        } else if (pathname === "/api/vm/stop" && req.method === "POST") {
          console.log("[API:Stop] Received request.");
          try {
            const container = await getContainer();
            if (container) {
              const info = await container.inspect();
              if (info.State.Running) {
                console.log(
                  `[API:Stop] Stopping container ${CONTAINER_ID}...`
                );
                await container.stop({ t: 5 });
                console.log(`[API:Stop] Container ${CONTAINER_ID} stopped.`);
                sendJsonResponse(res, 200, {
                  status: "stopped",
                  message: `Container ${CONTAINER_ID} stopped.`,
                });
              } else {
                console.log(
                  `[API:Stop] Container ${CONTAINER_ID} is already stopped.`
                );
                sendJsonResponse(res, 200, {
                  status: "already_stopped",
                  message: `Container ${CONTAINER_ID} is already stopped.`,
                });
              }
            } else {
              console.log(`[API:Stop] Container ${CONTAINER_ID} not found.`);
              sendJsonResponse(res, 404, {
                status: "not_found",
                message: `Container ${CONTAINER_ID} not found.`,
              });
            }
          } catch (error) {
            console.error(
              "[API:Stop] Error:",
              error.statusCode,
              error.message || error.reason || error
            );
            sendJsonResponse(res, error.statusCode || 500, {
              error: "Failed to stop container",
              details: error.message || error.reason || error.toString(),
            });
          }
          return;
        } else if (pathname === "/api/vm/status" && req.method === "GET") {
          try {
            const container = await getContainer();
            if (container) {
              const info = await container.inspect();
              const responseData = {
                status: info.State.Status,
                running: info.State.Running,
                containerId: info.Id,
                name: info.Name.substring(1) || CONTAINER_NAME,
              };
              sendJsonResponse(res, 200, responseData);
            } else {
              sendJsonResponse(res, 200, {
                status: "not_found",
                running: false,
              });
            }
          } catch (error) {
            if (error.statusCode === 404) {
              sendJsonResponse(res, 200, {
                status: "not_found",
                running: false,
              });
            } else {
              console.error(
                "[API:Status] Error:",
                error.statusCode,
                error.message || error.reason || error
              );
              sendJsonResponse(res, error.statusCode || 500, {
                error: "Failed to get container status",
                details: error.message || error.reason || error.toString(),
              });
            }
          }
          return;
        }

        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("[HTTP] Unhandled error during request processing:", err);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      }
    });

    console.log("[WebSocket] Initializing WebSocketServer...");
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      const parsedUrl = parse(request.url, true);
      console.log(
        `[WebSocket] Upgrade requested for path: ${parsedUrl.pathname}`
      );
      if (parsedUrl.pathname === "/api/terminal") {
        console.log("[WebSocket] Handling upgrade for /api/terminal...");
        wss.handleUpgrade(request, socket, head, (ws) => {
          console.log(
            "[WebSocket] Upgrade successful, emitting connection event."
          );
          wss.emit("connection", ws, request);
        });
      } else {
        console.log(
          `[WebSocket] Destroying socket for unhandled path: ${parsedUrl.pathname}`
        );
        socket.destroy();
      }
    });

    wss.on("connection", (ws, req) => {
      const connectionId = Math.random().toString(36).substring(2, 8);
      console.log(`[WebSocket:Connect][${connectionId}] Client connected.`);

      const parsedUrl = parse(req.url, true);
      const terminalContainerId = parsedUrl.query.containerId || CONTAINER_ID;

      console.log(
        `[WebSocket:Connect][${connectionId}] Attempting terminal connection to container ID: ${terminalContainerId}`
      );

      if (!terminalContainerId) {
        console.error(
          `[WebSocket:Connect][${connectionId}] Error: Missing containerId.`
        );
        ws.close(1008, "Missing containerId");
        return;
      }

      const cmd = ["/bin/bash"];
      console.log(
        `[WebSocket:Connect][${connectionId}] Using command: ${cmd.join(" ")}`
      );

      const execOptions = {
        Cmd: cmd,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
      };

      let execInstance;
      let streamInstance;

      let cleanedUp = false;
      const cleanup = (source) => {
        if (cleanedUp) return;
        cleanedUp = true;
        console.log(
          `[Cleanup][${connectionId}] Cleaning up connection (triggered by ${source})...`
        );
        streamInstance?.removeAllListeners();
        ws?.removeAllListeners();

        if (
          streamInstance &&
          typeof streamInstance.destroy === "function" &&
          !streamInstance.destroyed
        ) {
          console.log(`[Cleanup][${connectionId}] Destroying Docker stream.`);
          streamInstance.destroy();
        } else {
          console.log(
            `[Cleanup][${connectionId}] Docker stream already destroyed/unavailable.`
          );
        }

        if (
          ws &&
          (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING)
        ) {
          console.log(`[Cleanup][${connectionId}] Closing WebSocket.`);
          ws.close(1000, "Session terminated");
        } else {
          console.log(
            `[Cleanup][${connectionId}] WebSocket already closed/closing.`
          );
        }
        console.log(`[Cleanup][${connectionId}] Cleanup finished.`);
      };

      console.log(
        `[WebSocket:Connect][${connectionId}] Getting container object for ${terminalContainerId}...`
      );
      let container;
      try {
        container = docker.getContainer(terminalContainerId);
      } catch (getContainerError) {
        console.error(
          `[WebSocket:Connect][${connectionId}] Error getting container ${terminalContainerId}:`,
          getContainerError
        );
        ws.close(1011, "Server error: Cannot get container");
        return;
      }

      console.log(
        `[WebSocket:Connect][${connectionId}] Creating exec instance in ${terminalContainerId}...`
      );
      container.exec(execOptions, (err, exec) => {
        if (err || !exec) {
          console.error(
            `[WebSocket:Connect][${connectionId}] Docker exec creation failed:`,
            err
          );
          ws.close(
            1011,
            `Server error: ${err?.message || "Failed to create exec instance"}`
          );
          return;
        }
        console.log(
          `[WebSocket:Connect][${connectionId}] Exec instance created. Starting stream...`
        );
        execInstance = exec;

        exec.start({ hijack: true, stdin: true }, (err, stream) => {
          if (err || !stream) {
            console.error(
              `[WebSocket:Connect][${connectionId}] Docker exec stream start failed:`,
              err
            );
            ws.close(
              1011,
              `Server error: ${err?.message || "Failed to start stream"}`
            );
            return;
          }
          streamInstance = stream;
          console.log(
            `[WebSocket:Connect][${connectionId}] Attached terminal stream successfully.`
          );

          stream.on("data", (chunk) => {
            if (ws.readyState === ws.OPEN) {
              try {
                ws.send(chunk);
              } catch (e) {
                console.error(
                  `[WebSocket:Error][${connectionId}] Send error:`,
                  e
                );
              }
            } else {
              console.log(
                `[Stream:Data][${connectionId}] WebSocket not open (state: ${ws.readyState}), cannot send data.`
              );
            }
          });

          ws.on("message", (message) => {
            try {
              const msgData = JSON.parse(message.toString());
              if (msgData.type === "resize" && msgData.cols && msgData.rows) {
                console.log(
                  `[WebSocket:Message][${connectionId}] Resizing PTY to ${msgData.cols}x${msgData.rows}`
                );
                if (execInstance) {
                  execInstance.resize(
                    { w: msgData.cols, h: msgData.rows },
                    (resizeErr) => {
                      if (resizeErr)
                        console.error(
                          `[WebSocket:Error][${connectionId}] PTY resize error:`,
                          resizeErr
                        );
                    }
                  );
                } else {
                  console.error(
                    `[WebSocket:Error][${connectionId}] Cannot resize, execInstance not available.`
                  );
                }
              } else {
                console.warn(
                  `[WebSocket:Message][${connectionId}] Received unknown JSON message type:`,
                  msgData.type
                );
              }
            } catch (e) {
              if (
                streamInstance &&
                !streamInstance.destroyed &&
                streamInstance.writable
              ) {
                streamInstance.write(message);
              } else {
                console.error(
                  `[Stream:Error][${connectionId}] Stream not writable or destroyed, cannot forward input.`
                );
              }
            }
          });

          stream.on("error", (streamErr) => {
            console.error(
              `!!! [Stream:Error][${connectionId}] Docker stream error:`,
              streamErr
            );
            cleanup("stream error");
          });
          ws.on("error", (wsErr) => {
            console.error(
              `!!! [WebSocket:Error][${connectionId}] WebSocket error:`,
              wsErr
            );
            cleanup("ws error");
          });
          stream.on("end", () => {
            console.log(`[Stream:Event][${connectionId}] Docker stream ended.`);
            cleanup("stream end");
          });
          stream.on("close", () => {
            console.log(
              `[Stream:Event][${connectionId}] Docker stream closed.`
            );
            cleanup("stream close");
          });
          ws.on("close", (code, reason) => {
            const reasonString = reason ? reason.toString() : "N/A";
            console.log(
              `[WebSocket:Event][${connectionId}] WebSocket closed. Code: ${code}, Reason: ${reasonString}`
            );
            cleanup("ws close");
          });
        });
      });
    });

    server.listen(port, hostname, (err) => {
      if (err) {
        console.error("[Server] Failed to start server:", err);
        throw err;
      }
      console.log(`[Server] > Ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("[Server] Error during Next.js app preparation:", err);
    process.exit(1);
  });
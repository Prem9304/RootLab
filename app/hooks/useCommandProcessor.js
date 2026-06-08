// hooks/useCommandProcessor.js
import { useState } from "react";

export default function useCommandProcessor(addTerminalOutput) {
  const [commandHistory, setCommandHistory] = useState([]);

  const processCommand = async (command) => {
    addTerminalOutput("command", `root@vm:~# ${command}`);
    setCommandHistory((prev) => [...prev, command]);

    if (command === "clear") {
      // The caller can use clearTerminal if needed.
      return "clear";
    } else if (command === "help") {
      addTerminalOutput(
        "output",
        "Available commands: clear, help, [custom commands]"
      );
    } else {
      addTerminalOutput("output", `Executing: ${command}`);
      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        });
        const data = await res.json();
        if (data.output) {
          addTerminalOutput("output", data.output);
        } else {
          addTerminalOutput("error", `Error: ${data.error}`);
        }
      } catch (error) {
        addTerminalOutput("error", `Connection error: ${error.message}`);
      }
    }

    addTerminalOutput("prompt", "root@vm:~#");
  };

  return { processCommand, commandHistory };
}

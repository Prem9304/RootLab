// hooks/useTerminal.js
import { useState, useEffect, useRef, useCallback } from "react";

const MAX_OUTPUT_LINES = 500; // Limit buffer size to prevent memory issues

export default function useTerminal(initialOutput = []) {
  const [terminalOutput, setTerminalOutput] = useState(initialOutput);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalVisible, setTerminalVisible] = useState(false); // Default to hidden
  const terminalRef = useRef(null);

  // Append a new line to terminal output, managing buffer size
  const addTerminalOutput = useCallback((type, content) => {
    setTerminalOutput((prev) => {
        const newLine = { type, content };
        const newOutput = [...prev, newLine];
        // Trim output if it exceeds the max line limit
        if (newOutput.length > MAX_OUTPUT_LINES) {
            return newOutput.slice(newOutput.length - MAX_OUTPUT_LINES);
        }
        return newOutput;
     });
  }, []); // No dependencies, safe to use useCallback

  // Clear the terminal content
  const clearTerminal = useCallback(() => {
    setTerminalOutput([]);
  }, []); // No dependencies

  // Auto-scroll terminal to the bottom on new output
  useEffect(() => {
    if (terminalRef.current) {
      // Use setTimeout to ensure scroll happens after DOM update
      setTimeout(() => {
         if(terminalRef.current) {
             terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
         }
      }, 0);
    }
  }, [terminalOutput]); // Trigger scroll on output change

  return {
    terminalOutput,
    setTerminalOutput, // Expose direct setter for clearing/initial messages
    terminalInput,
    setTerminalInput,
    terminalVisible,
    setTerminalVisible,
    addTerminalOutput,
    clearTerminal,
    terminalRef,
  };
}
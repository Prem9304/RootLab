"use client";

import React, { useEffect, useRef, useState, useContext } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit"; // <-- Imported FitAddon
import "@xterm/xterm/css/xterm.css";
import { VMContext } from "../contexts/VMContext";
import { useWindowManager } from "../contexts/WindowManagerContext";
import { useAIChat } from "../contexts/AIChatContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { Play, Sparkles, TerminalSquare, AlertTriangle, HelpCircle } from "lucide-react";

function TerminalComponent() {
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null); // <-- Reference for the addon
  const resizeObserver = useRef(null); // <-- Reference for the observer
  const websocket = useRef(null);
  const lastCommandTimestamp = useRef(null);
  
  const { vmStatus, containerId } = useContext(VMContext);
  const { commandToRun, clearCommandToRun } = useWindowManager();
  const { addMessage } = useAIChat();
  const { reportTerminalOutput } = useWorkspace();
  const reportTerminalOutputRef = useRef(reportTerminalOutput);
  useEffect(() => { reportTerminalOutputRef.current = reportTerminalOutput; }, [reportTerminalOutput]);

  // Rolling text buffer for workspace reporting (strip ANSI codes)
  const terminalTextBuffer = useRef("");
  const terminalFlushTimer = useRef(null);

  const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*[a-zA-Z]|\x1b[()][A-Z0-9]|[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");

  const bufferTerminalText = (raw) => {
    const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
    const clean = stripAnsi(text);
    if (!clean.trim()) return;
    terminalTextBuffer.current += clean;
    // Flush to workspace every 3 seconds of inactivity
    if (terminalFlushTimer.current) clearTimeout(terminalFlushTimer.current);
    terminalFlushTimer.current = setTimeout(() => {
      if (terminalTextBuffer.current.trim()) {
        reportTerminalOutputRef.current(terminalTextBuffer.current);
        terminalTextBuffer.current = "";
      }
    }, 3000);
  };

  const addMessageRef = useRef(addMessage);
  useEffect(() => { addMessageRef.current = addMessage; }, [addMessage]);

  const isAgentWaiting = useRef(false);
  const agentBuffer = useRef("");
  const agentTimeout = useRef(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [overlayMessage, setOverlayMessage] = useState("Initializing terminal bridge...");
  const [inputText, setInputText] = useState("");

  const terminalConfig = {
    // Removed strict rows/cols so FitAddon can take over
    cursorBlink: true,
    fontSize: 13,
    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
    theme: {
      background: "#050814",
      foreground: "#cbd5e1",
      cursor: "#00f0ff",
      selectionBackground: "rgba(0, 240, 255, 0.2)",
      black: "#000000",
      red: "#f43f5e",
      green: "#10b981",
      yellow: "#fbbf24",
      blue: "#3b82f6",
      magenta: "#8b5cf6",
      cyan: "#06b6d4",
      white: "#f3f4f6"
    },
    scrollback: 1000,
  };

  const sendToServer = (data) => {
    if (websocket.current?.readyState === WebSocket.OPEN) {
      try {
        websocket.current.send(data);
        return true;
      } catch (error) {
        console.error("Send error:", error);
        return false;
      }
    }
    return false;
  };

  const cleanup = () => {
    // Disconnect the resize observer
    if (resizeObserver.current) {
      resizeObserver.current.disconnect();
      resizeObserver.current = null;
    }
    if (websocket.current) {
      if (websocket.current.readyState <= WebSocket.OPEN) {
        websocket.current.close(1000, "Component cleanup");
      }
      websocket.current = null;
    }
    if (terminal.current) {
      terminal.current.dispose();
      terminal.current = null;
    }
    if (fitAddon.current) {
      fitAddon.current.dispose();
      fitAddon.current = null;
    }
  };

  const getOverlayMessage = () => {
    if (vmStatus === "Loading..." || vmStatus === "Checking...") return "Establishing hypervisor handshakes...";
    if (vmStatus === "Starting...") return "Booting virtual Kali Linux kernel...";
    if (vmStatus === "Stopping...") return "Shutting down virtual interfaces...";
    if (vmStatus === "Stopped" || vmStatus === "Not Found") return "Sandbox VM is stopped. Please activate it to initialize terminal.";
    if (vmStatus.startsWith("Error")) return `Sandbox Error: ${vmStatus.split(": ")[1] || "Operation timeout"}.`;
    if (vmStatus !== "Started") return `Status: ${vmStatus}. Activator linkage required.`;
    if (!containerId) return "Hypervisor active. Awaiting container ID...";
    return "";
  };

  const initializeTerminal = () => {
    try {
      terminal.current = new Terminal(terminalConfig);
      fitAddon.current = new FitAddon();
      
      // Load the addon
      terminal.current.loadAddon(fitAddon.current);
      terminal.current.open(terminalRef.current);
      
      // Initial fit
      fitAddon.current.fit();

      // Setup observer to watch for window resizing and refit automatically
      resizeObserver.current = new ResizeObserver(() => {
        if (fitAddon.current && terminalRef.current && terminalRef.current.clientWidth > 0) {
          fitAddon.current.fit();
        }
      });
      resizeObserver.current.observe(terminalRef.current);

      /* Optional: If your websocket backend supports catching resize events to update the PTY dimensions
      terminal.current.onResize(({ cols, rows }) => {
         // sendToServer(JSON.stringify({ type: 'resize', cols, rows }));
      });
      */

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/terminal?containerId=${encodeURIComponent(containerId)}`;
      
      websocket.current = new WebSocket(wsUrl);

      websocket.current.onopen = () => {
        setIsConnected(true);
        terminal.current?.writeln("\r\n\x1b[1;36m[+] PIPELINE CONNECTED. SECURE SHELL ACTIVE.\x1b[0m\r\n");
        terminal.current?.focus();
      };

      websocket.current.onclose = (event) => {
        setIsConnected(false);
        terminal.current?.writeln(`\r\n\x1b[1;31m[-] SESSION ENDED (Code: ${event.code}).\x1b[0m`);
        
        if (!event.wasClean && !showOverlay) {
          setShowOverlay(true);
          setOverlayMessage(`Bridge disconnected (Code: ${event.code}). Check hypervisor.`);
        }
      };

      websocket.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      websocket.current.onmessage = (event) => {
        if (!terminal.current) return;

        try {
          let data;
          
          const processAgentData = (bufferData) => {
            if (isAgentWaiting.current) {
               if (agentTimeout.current) clearTimeout(agentTimeout.current);
               agentTimeout.current = setTimeout(() => {
                 if (!isAgentWaiting.current) return;
                 isAgentWaiting.current = false;

                 let outputText = "";
                 const activeBuffer = terminal.current?.buffer?.active;
                 if (activeBuffer) {
                     const endY = activeBuffer.baseY + activeBuffer.cursorY;
                     const startY = Math.max(0, endY - 60); 
                     for (let i = startY; i <= endY; i++) {
                         const line = activeBuffer.getLine(i);
                         if (line) {
                             outputText += line.translateToString(true) + "\n";
                         }
                     }
                 }
                 
                 addMessageRef.current(
                   `[Terminal Context - Automessage]\nThe command output has paused. Here is the recent fully-parsed terminal screen (last 60 lines):\n\`\`\`\n${outputText.trim()}\n\`\`\`\nAnalyze this output. If further action is required, propose it using confirmrun. If no action, briefly summarize the results.`,
                   true
                 );
               }, 2000); 
            }
          };

          if (event.data instanceof Blob) {
            event.data.arrayBuffer().then((buffer) => {
              if (terminal.current) {
                const uintArray = new Uint8Array(buffer);
                terminal.current.write(uintArray);
                bufferTerminalText(uintArray);
                processAgentData(uintArray);
              }
            });
            return;
          }
          
          if (typeof event.data === "string") {
            data = event.data;
          } else if (event.data instanceof ArrayBuffer) {
            data = new Uint8Array(event.data);
          } else {
            return;
          }

          if (data) {
            terminal.current.write(data);
            bufferTerminalText(data);
            processAgentData(data);
          }
        } catch (error) {
          console.error("Message handling error:", error);
        }
      };

      terminal.current.onData((data) => {
        sendToServer(data);
      });

      terminal.current.writeln("\x1b[33m[~] Handshaking terminal socket...\x1b[0m");
      
    } catch (error) {
      console.error("Terminal initialization error:", error);
      setShowOverlay(true);
      setOverlayMessage(`Setup error: ${error.message}`);
      cleanup();
    }
  };

  useEffect(() => {
    const message = getOverlayMessage();
    if (message) {
      cleanup();
      setShowOverlay(true);
      setOverlayMessage(message);
      return;
    }
    
    setShowOverlay(false);
    // Add check to ensure the container layout has completed before booting xterm
    if (vmStatus === "Started" && containerId && !terminal.current && terminalRef.current) {
      // Small timeout to guarantee the DOM is fully painted before the first Fit calculation
      const initTimer = setTimeout(() => {
        initializeTerminal();
      }, 50);
      return () => clearTimeout(initTimer);
    }
    return cleanup;
  }, [vmStatus, containerId]);

  useEffect(() => {
    if (commandToRun?.cmd && commandToRun.timestamp > (lastCommandTimestamp.current || 0)) {
      const command = commandToRun.cmd.endsWith("\n") || commandToRun.cmd.endsWith("\r") 
        ? commandToRun.cmd 
        : `${commandToRun.cmd}\r`;
      
      if (sendToServer(command)) {
        lastCommandTimestamp.current = commandToRun.timestamp;
        if (commandToRun.isAgent) {
           isAgentWaiting.current = true;
           agentBuffer.current = "";
        }
      }
      clearCommandToRun();
    }
  }, [commandToRun, clearCommandToRun]);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendToServer(inputText + "\r");
      setInputText("");
      focusTerminal();
    }
  };

  const focusTerminal = () => {
    if (terminal.current && !showOverlay) {
      terminal.current.focus();
    }
  };

  const sendSpecialKey = (key) => {
    sendToServer(key);
    focusTerminal();
  };

  const sendShortcutCommand = (cmd) => {
    sendToServer(cmd + "\r");
    focusTerminal();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050814] overflow-hidden relative font-mono text-xs">
      
      {/* Terminal Top Info Bar */}
      <div className="h-9 px-3 bg-slate-950 border-b border-slate-900 flex items-center justify-between text-gray-500 shrink-0">
        <div className="flex items-center gap-2">
          <TerminalSquare size={13} className="text-[#00f0ff]" />
          <span className="text-[10px] font-bold tracking-wider">ROOT@KALI-VM: ~</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-bold">
          <span className={`flex items-center gap-1.5 ${isConnected ? 'text-green-400' : 'text-amber-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
            {isConnected ? 'STABLE' : 'CONNECTING'}
          </span>
          <span className="text-gray-700">|</span>
          <span className="text-gray-600">BAUD 9600</span>
        </div>
      </div>

      {/* Terminal Content Screen */}
      <div 
        className="flex-1 relative overflow-hidden bg-[#050814] w-full"
        onClick={focusTerminal}
      >
        {showOverlay && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050814]/95 text-slate-400 p-5 text-center leading-relaxed">
            <div className="max-w-md w-full p-6 bg-slate-950/40 rounded-xl border border-cyan-500/10">
              <div className="text-[10px] font-mono text-cyan-500/40 text-left space-y-1 mb-4 border-b border-slate-900 pb-3">
                <div>&gt; ROOTLAB SYSTEM CORE v0.1.0</div>
                <div>&gt; VM STATE LINK: {vmStatus.toUpperCase()}</div>
                <div>&gt; NET_BRIDGE: WS://127.0.0.1:3000/API/TERMINAL</div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Loader size={18} className="animate-spin text-[#00f0ff]" />
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{overlayMessage}</span>
              </div>
            </div>
          </div>
        )}

        <div
          ref={terminalRef}
          className={`absolute inset-2 ${showOverlay ? "hidden" : "block"}`}
          style={{ width: "calc(100% - 16px)", height: "calc(100% - 16px)" }}
        />
      </div>

      {/* Quick Shell Action Keys */}
      {!showOverlay && isConnected && (
        <div className="bg-slate-950/80 border-t border-slate-900 p-2 flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button onClick={() => sendSpecialKey("\x03")} className="px-2.5 py-1 bg-red-950/20 border border-red-900/30 text-red-400 hover:text-white rounded text-[10px] font-bold cursor-pointer whitespace-nowrap">CTRL+C</button>
            <button onClick={() => sendSpecialKey("\t")} className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-300 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap">TAB</button>
            <button onClick={() => sendSpecialKey("\x04")} className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-300 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap">CTRL+D</button>
            <button onClick={() => sendShortcutCommand("clear")} className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-300 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap">CLEAR</button>
            <button onClick={() => sendShortcutCommand("ls -la")} className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-350 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap">LS -LA</button>
            <button onClick={() => sendShortcutCommand("ifconfig")} className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-350 rounded text-[10px] font-bold cursor-pointer whitespace-nowrap">IP_ADDR</button>
          </div>

          <form onSubmit={handleInputSubmit} className="flex gap-1.5">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send command to container shell..."
              className="flex-1 bg-slate-950 border border-slate-900 rounded px-2.5 py-1.5 text-[11px] text-gray-300 placeholder-slate-700 outline-none focus:border-cyan-500/30 min-w-0"
            />
            <button type="submit" className="px-4 py-1.5 bg-[#00f0ff] hover:bg-cyan-400 text-black font-bold rounded text-[10px] uppercase cursor-pointer shrink-0">SEND</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Loader({ size, className }) {
  return (
    <div className={`w-${size} h-${size} border-2 border-[#00f0ff]/30 border-t-[#00f0ff] rounded-full animate-spin ${className}`} style={{ width: size, height: size }} />
  );
}

export default TerminalComponent;
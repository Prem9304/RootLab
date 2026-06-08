// components/AIChatContent.js
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAIChat } from "../contexts/AIChatContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { Copy, Terminal, ShieldAlert, Sparkles, ChevronDown, ChevronUp, Activity, Zap, Eye, EyeOff, Send, RotateCcw } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useWindowManager } from "../contexts/WindowManagerContext";
import ReactMarkdown from "react-markdown";

/* ---- AutoRun block ---- */
const AutoRunCommand = ({ blockId, codeStr, handleExecuteInTerminal, executedBlocks }) => {
  useEffect(() => {
    if (!executedBlocks.current.has(blockId)) {
      executedBlocks.current.add(blockId);
      setTimeout(() => handleExecuteInTerminal(), 100);
    }
  }, [blockId, handleExecuteInTerminal, executedBlocks]);

  return (
    <div className="my-3 border border-purple-500/30 rounded-xl overflow-hidden bg-purple-950/10 font-mono">
      <div className="bg-purple-950/20 px-3 py-2 border-b border-purple-500/20 flex items-center gap-2">
        <Sparkles size={14} className="text-purple-400 animate-pulse" />
        <span className="text-purple-300 font-bold text-xs tracking-wider uppercase">Autonomous Dispatch</span>
      </div>
      <div className="p-3 text-xs text-gray-300 bg-black leading-relaxed">{codeStr}</div>
    </div>
  );
};

/* ---- Markdown renderer ---- */
const MessageMarkdown = ({ content, messageId, openWindow, WINDOW_TYPES, sendCommandToTerminal, addMessage, executedBlocks }) => {
  const MarkdownComponents = React.useMemo(() => ({
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeStr = String(children).replace(/\n$/, "");
      const language = match ? match[1] : "bash";

      const handleExecuteInTerminal = () => {
        if (!codeStr) return;
        let finalCommand = codeStr;
        if (finalCommand.trim().toLowerCase() === "ctrl+c") finalCommand = "\x03";
        else if (finalCommand.trim().toLowerCase() === "ctrl+d") finalCommand = "\x04";
        else if (!finalCommand.includes("\x03") && !finalCommand.includes("\x04")) finalCommand += "\n";

        openWindow({ type: WINDOW_TYPES.TERMINAL, title: "Terminal" });
        setTimeout(() => {
          try { sendCommandToTerminal(finalCommand, true); } catch (_) {}
        }, 300);
      };

      if (language === "confirmrun") {
        return (
          <div className="my-3 border border-amber-500/30 rounded-xl overflow-hidden bg-amber-950/10 font-mono">
            <div className="bg-amber-950/20 px-3 py-2 border-b border-amber-500/20 flex items-center gap-2">
              <ShieldAlert size={14} className="text-amber-400" />
              <span className="text-amber-300 font-bold text-xs tracking-wider uppercase">Approval Required</span>
            </div>
            <div className="p-3">
              <div className="text-xs text-gray-300 mb-3 bg-black p-2.5 rounded border border-white/5 leading-relaxed font-mono">{codeStr}</div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => handleExecuteInTerminal()} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer uppercase">
                  <Terminal size={12} /> Approve & Run
                </button>
                <button onClick={() => addMessage(`I chose not to execute: ${codeStr}`)} className="px-3 py-1.5 bg-black border border-white/10 hover:border-white/20 text-gray-400 hover:text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer uppercase">
                  Decline
                </button>
              </div>
            </div>
          </div>
        );
      }

      if (language === "autorun") {
        return (
          <AutoRunCommand
            blockId={`${messageId}-${codeStr}`}
            codeStr={codeStr}
            handleExecuteInTerminal={handleExecuteInTerminal}
            executedBlocks={executedBlocks}
          />
        );
      }

      return !inline ? (
        <div className="relative group my-3 border border-white/10 rounded-xl overflow-hidden shadow-inner">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            className="p-3 text-xs leading-relaxed"
            customStyle={{ margin: 0, background: "#000", maxHeight: "250px", overflow: "auto" }}
            wrapLongLines={true}
            PreTag="div"
            {...props}
          >
            {codeStr}
          </SyntaxHighlighter>
          <div className="absolute top-1.5 right-1.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => navigator.clipboard.writeText(codeStr)} className="p-1 bg-black border border-white/10 rounded text-gray-400 hover:text-white cursor-pointer" title="Copy code">
              <Copy size={11} />
            </button>
            <button onClick={handleExecuteInTerminal} className="p-1 bg-black border border-white/10 rounded text-gray-400 hover:text-cyan-400 cursor-pointer" title="Execute in terminal">
              <Terminal size={11} />
            </button>
          </div>
        </div>
      ) : (
        <code className="bg-black text-cyan-400 border border-white/10 px-1 py-0.5 rounded text-xs font-mono break-all" {...props}>
          {children}
        </code>
      );
    },
    p({ children }) { return <p className="leading-relaxed mb-2 last:mb-0 text-xs font-mono">{children}</p>; },
    a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline font-mono text-xs">{children}</a>; },
    ul({ children }) { return <ul className="list-disc pl-5 mb-2 text-xs font-mono text-gray-300">{children}</ul>; },
    ol({ children }) { return <ol className="list-decimal pl-5 mb-2 text-xs font-mono text-gray-300">{children}</ol>; },
    li({ children }) { return <li className="mb-1">{children}</li>; },
    h1({ children }) { return <h1 className="text-sm font-bold mb-2 mt-4 text-cyan-400 font-mono border-b border-white/10 pb-1">{children}</h1>; },
    h2({ children }) { return <h2 className="text-xs font-bold mb-2 mt-3 text-purple-400 font-mono">{children}</h2>; },
    h3({ children }) { return <h3 className="text-xs font-semibold mb-2 mt-2 text-gray-300 font-mono">{children}</h3>; },
  }), [messageId, openWindow, WINDOW_TYPES, sendCommandToTerminal, addMessage, executedBlocks]);

  return <ReactMarkdown components={MarkdownComponents}>{content}</ReactMarkdown>;
};

/* ---- Context Panel ---- */
function ContextPanel({ toolResults, wrkHistory, terminalHistory }) {
  const [open, setOpen] = useState(false);

  const toolCount = Object.keys(toolResults).length;
  const wrkCount = wrkHistory.length;
  const termLines = terminalHistory.length;
  const hasContext = toolCount > 0 || wrkCount > 0 || termLines > 0;

  return (
    <div className="border-b border-white/10 shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[9px] uppercase tracking-widest font-bold cursor-pointer hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Eye size={10} className={hasContext ? "text-cyan-500" : "text-gray-600"} />
          <span className={hasContext ? "text-cyan-500" : "text-gray-600"}>
            AI Context
          </span>
          {hasContext && (
            <span className="flex items-center gap-1.5">
              {toolCount > 0 && <span className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 rounded text-[8px]">{toolCount} tool{toolCount !== 1 ? "s" : ""}</span>}
              {wrkCount > 0 && <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/25 text-purple-400 rounded text-[8px]">{wrkCount} wrk</span>}
              {termLines > 0 && <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/25 text-green-400 rounded text-[8px]">{termLines} lines</span>}
            </span>
          )}
          {!hasContext && <span className="text-gray-700">No context yet</span>}
        </div>
        {open ? <ChevronUp size={10} className="text-gray-600" /> : <ChevronDown size={10} className="text-gray-600" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto scrollbar-none">
          {toolCount === 0 && wrkCount === 0 && termLines === 0 && (
            <p className="text-[9px] text-gray-700 italic">Run a tool or use the terminal — the AI will automatically gain awareness of your results.</p>
          )}

          {Object.entries(toolResults).map(([name, data]) => {
            const age = Math.round((Date.now() - data.timestamp) / 1000);
            return (
              <div key={name} className="bg-cyan-500/5 border border-cyan-500/15 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-cyan-400 uppercase">{name}</span>
                  <span className="text-[8px] text-gray-600">{age}s ago</span>
                </div>
                {data.rawOutput && (
                  <pre className="text-[8px] text-gray-500 truncate font-mono leading-tight">{data.rawOutput.slice(0, 120)}...</pre>
                )}
              </div>
            );
          })}

          {wrkHistory.slice(0, 2).map((run, i) => {
            const age = Math.round((Date.now() - run.timestamp) / 1000);
            return (
              <div key={i} className="bg-purple-500/5 border border-purple-500/15 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-purple-400 uppercase">WRK</span>
                  <span className="text-[8px] text-gray-600">{age}s ago</span>
                </div>
                <p className="text-[8px] text-gray-500 font-mono truncate">{run.params?.url}</p>
                {run.metrics && run.metrics.reqPerSec && (
                  <p className="text-[8px] text-purple-300 font-mono">{run.metrics.reqPerSec} req/s · {run.metrics.latencyAvg || "?"} avg latency</p>
                )}
              </div>
            );
          })}

          {termLines > 0 && (
            <div className="bg-green-500/5 border border-green-500/15 rounded-lg p-2">
              <span className="text-[9px] font-bold text-green-400 uppercase">Terminal</span>
              <p className="text-[8px] text-gray-600 mt-1">{termLines} lines captured</p>
              <pre className="text-[8px] text-gray-500 font-mono leading-tight truncate mt-1">{terminalHistory.slice(-2).join("\n").slice(0, 120)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Suggestion chips ---- */
const SUGGESTIONS = [
  { label: "Analyze results", prompt: "Analyze all the tool results in my workspace and give me a security summary." },
  { label: "Next steps", prompt: "Based on what you can see in my workspace, what should I do next?" },
  { label: "Explain findings", prompt: "Explain what the current tool outputs mean in simple terms." },
  { label: "Fix errors", prompt: "I see errors in my workspace. Help me understand and fix them." },
  { label: "Suggest commands", prompt: "Suggest the next commands I should run based on my current results." },
  { label: "WRK analysis", prompt: "Analyze my WRK benchmark results. Are the numbers good? What do they mean?" },
];

/* ---- Main Component ---- */
export default function AIChatContent() {
  const { messages, addMessage, isLoading, clearChat } = useAIChat();
  const { toolResults, wrkHistory, terminalHistory } = useWorkspace();
  const { openWindow, WINDOW_TYPES, sendCommandToTerminal } = useWindowManager();
  const [inputMessage, setInputMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const executedBlocks = useRef(new Set());
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback((text) => {
    const msg = (text || inputMessage).trim();
    if (msg && !isLoading) {
      addMessage(msg);
      setInputMessage("");
      setShowSuggestions(false);
    }
  }, [inputMessage, isLoading, addMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContext = Object.keys(toolResults).length > 0 || wrkHistory.length > 0 || terminalHistory.length > 0;
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full text-white text-xs select-text bg-black font-mono overflow-hidden">

      {/* Context Panel */}
      <ContextPanel toolResults={toolResults} wrkHistory={wrkHistory} terminalHistory={terminalHistory} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 px-4 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
              <Sparkles size={18} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-wider">HiveMind AI</p>
              <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest">Context-Aware Security Assistant</p>
            </div>
            {hasContext ? (
              <p className="text-[10px] text-cyan-400/70">
                I can see your workspace. Ask me to analyze results, suggest next steps, or explain findings.
              </p>
            ) : (
              <p className="text-[10px] text-gray-600">
                Run a tool or use the terminal — I'll automatically gain awareness of your results and help you act on them.
              </p>
            )}
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.isHidden) return null;
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id || i}
              className={`p-3 rounded-xl max-w-[90%] border leading-relaxed ${
                isUser
                  ? "bg-cyan-500/5 border-cyan-500/15 text-cyan-200 ml-auto"
                  : "bg-white/3 border-white/8 text-gray-200 mr-auto"
              }`}
            >
              <div className="max-w-full overflow-hidden">
                <MessageMarkdown
                  content={msg.content}
                  messageId={msg.id || i}
                  openWindow={openWindow}
                  WINDOW_TYPES={WINDOW_TYPES}
                  sendCommandToTerminal={sendCommandToTerminal}
                  addMessage={addMessage}
                  executedBlocks={executedBlocks}
                />
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="p-3 rounded-xl bg-white/3 border border-white/8 w-max mr-auto">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce" />
              <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips - show when no messages or after messages */}
      {showSuggestions && !isLoading && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {SUGGESTIONS.map(s => (
            <button
              key={s.label}
              onClick={() => handleSend(s.prompt)}
              className="px-2 py-1 text-[9px] bg-black border border-white/10 hover:border-cyan-500/40 hover:text-cyan-400 text-gray-500 rounded-full transition-colors cursor-pointer uppercase tracking-wide"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-white/10 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasContext ? "Ask about your results, next steps, or anything..." : "Ask HiveMind anything..."}
              rows={1}
              disabled={isLoading}
              className="w-full bg-black border border-white/10 focus:border-cyan-500/40 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-700 outline-none transition-colors resize-none scrollbar-none leading-relaxed"
              style={{ minHeight: "36px", maxHeight: "100px" }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
            />
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputMessage.trim()}
              className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-900 disabled:text-gray-700 text-black rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Send"
            >
              <Send size={13} />
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => { clearChat(); setShowSuggestions(true); }}
                className="p-2 bg-black border border-white/10 hover:border-white/20 text-gray-600 hover:text-gray-300 rounded-xl transition-all cursor-pointer"
                title="Clear chat"
              >
                <RotateCcw size={11} />
              </button>
            )}
          </div>
        </div>
        {hasContext && (
          <p className="text-[8px] text-gray-700 mt-1.5 text-center">
            AI has live context: {Object.keys(toolResults).length > 0 ? `${Object.keys(toolResults).length} tool(s)` : ""}{wrkHistory.length > 0 ? ` ${wrkHistory.length} wrk run(s)` : ""}{terminalHistory.length > 0 ? ` ${terminalHistory.length} terminal lines` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
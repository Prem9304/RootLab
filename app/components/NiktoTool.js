"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Server, Play, Square, List, Check,
  Activity, Hash, FileText, Zap, ShieldAlert,
  Sparkles, BrainCircuit, Loader2
} from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function NiktoTool() {
  const { reportToolResult } = useWorkspace();
  const [target, setTarget] = useState("http://127.0.0.1");
  const [useSsl, setUseSsl] = useState(false);
  const [tuning, setTuning] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState("config");
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiOutput, setAiOutput] = useState("");

  const abortRef = useRef(null);
  const outputEndRef = useRef(null);
  const aiOutputEndRef = useRef(null);

  useEffect(() => {
    if (outputEndRef.current && isRunning) {
      outputEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output, isRunning]);

  useEffect(() => {
    if (aiOutputEndRef.current && isAnalyzing) {
      aiOutputEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiOutput, isAnalyzing]);

  const handleStart = useCallback(async () => {
    if (!target.trim()) return;

    setIsRunning(true);
    setOutput("");
    setAiOutput("");
    setActiveTab("output");

    const controller = new AbortController();
    abortRef.current = controller;

    let cmd = `nikto -h ${target.trim()}`;
    if (useSsl) cmd += " -ssl";
    if (tuning) cmd += ` -Tuning ${tuning}`;

    try {
      const res = await fetch("/api/stream-tool/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setOutput(`[ERROR] API request failed: ${errorData.error || res.statusText}\n`);
        setIsRunning(false);
        return;
      }

      if (!res.body) {
        setOutput("[ERROR] ReadableStream not supported by the browser.\n");
        setIsRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullOutput = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullOutput += chunk;
        setOutput((prev) => prev + chunk);
      }

      reportToolResult("Nikto", { target }, fullOutput);

      // Auto-trigger AI analysis
      handleAnalyze(fullOutput);

    } catch (err) {
      if (err.name === "AbortError") {
        setOutput((prev) => prev + "\n[Process stopped by user]\n");
      } else {
        setOutput((prev) => prev + `\n[Fetch Error] ${err.message}\n`);
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [target, useSsl, tuning, reportToolResult]);

  const handleStop = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    try {
      await fetch("/api/stream-tool/stop", { method: "POST" });
    } catch (e) {
      console.error("Failed to stop process via API", e);
    }
    setIsRunning(false);
  }, []);

  const handleAnalyze = useCallback(async (overrideOutput) => {
    const dataToAnalyze = typeof overrideOutput === 'string' ? overrideOutput : output;
    if (!dataToAnalyze.trim()) return;
    setIsAnalyzing(true);
    setActiveTab("ai");
    setAiOutput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a cybersecurity expert. Analyze the following Nikto scan output. Provide a highly structured Markdown report. Extract the server details, key vulnerabilities found, information disclosure issues, and recommended remediations. Use markdown tables to list specific findings and bold the critical severities."
            },
            {
              role: "user",
              content: `Analyze these Nikto results for ${target}:\n\n${dataToAnalyze}`
            }
          ]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setAiOutput(`**Error during AI Analysis:** ${data.error || 'Unknown error'}`);
      } else {
        setAiOutput(data.content);
      }
    } catch (error) {
      setAiOutput(`**Failed to contact AI service:** ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [output, target]);

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <ShieldAlert className="text-purple-400" size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              NIKTO SCANNER
              {isRunning && <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-pulse" />}
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Web Server Scanner</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-14 border-r border-white/5 bg-black/20 flex flex-col items-center py-4 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("config")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "config" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
            }`}
            title="Configuration"
          >
            <Server size={18} />
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "output" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
            }`}
            title="Live Output"
          >
            <Activity size={18} />
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "ai" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
            }`}
            title="AI Analysis"
          >
            <Sparkles size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-[#0a0a0a]">
          {/* Config Tab */}
          <div className={`absolute inset-0 p-6 sm:p-8 overflow-y-auto transition-opacity duration-300 ${activeTab === "config" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}>
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server size={18} className="text-purple-500" />
                  Target Configuration
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Configure the Nikto scan to detect vulnerabilities, outdated software, and misconfigurations.
                </p>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={12} /> Target URL or IP
                  </label>
                  <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="http://example.com"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-purple-50 font-mono focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-gray-700"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 bg-black/40 cursor-pointer transition-colors group">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${useSsl ? "bg-purple-500 border-purple-500 text-black" : "bg-black border-white/20 text-transparent group-hover:border-white/40"}`}>
                      <Check size={14} />
                    </div>
                    <input type="checkbox" className="hidden" checked={useSsl} onChange={(e) => setUseSsl(e.target.checked)} />
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Force SSL</div>
                      <div className="text-[10px] text-gray-500">Force scan over HTTPS</div>
                    </div>
                  </label>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       Tuning Options
                    </label>
                    <input
                      type="text"
                      value={tuning}
                      onChange={(e) => setTuning(e.target.value)}
                      placeholder="e.g. 1 2 3 (leave empty for all)"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-purple-50 font-mono focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-gray-700"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                {!isRunning ? (
                  <button
                    onClick={handleStart}
                    disabled={!target.trim()}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)]"
                  >
                    <Play size={18} fill="currentColor" />
                    Launch Nikto Scan
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  >
                    <Square size={18} fill="currentColor" />
                    Stop Scan
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Output Tab */}
          <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${activeTab === "output" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}>
            <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/5">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Activity size={12} className={isRunning ? "text-purple-500 animate-pulse" : "text-gray-500"} />
                Terminal Output
              </span>
              <div className="flex items-center gap-2">
                {output && !isRunning && (
                  <button onClick={handleAnalyze} className="px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-500/20 transition-colors flex items-center gap-1.5">
                    <Sparkles size={12} />
                    AI Analyze
                  </button>
                )}
                {isRunning && (
                  <button onClick={handleStop} className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] font-bold uppercase tracking-wider border border-red-500/20 transition-colors">
                    Stop
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-black font-mono text-xs sm:text-sm text-gray-300 leading-relaxed custom-scrollbar">
              {!output && !isRunning ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3">
                  <FileText size={32} className="opacity-20" />
                  <p>Run a scan to see Nikto results here.</p>
                </div>
              ) : (
                <>
                  <pre className="whitespace-pre-wrap break-words">{output}</pre>
                  <div ref={outputEndRef} className="h-4" />
                </>
              )}
            </div>
          </div>

          {/* AI Results Tab */}
          <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${activeTab === "ai" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}>
            <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/5">
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <BrainCircuit size={12} className={isAnalyzing ? "animate-pulse" : ""} />
                AI Structured Results
              </span>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-[#0a0a0a] text-gray-200 custom-scrollbar prose prose-invert prose-sm max-w-none prose-headings:text-purple-400 prose-a:text-cyan-400 prose-strong:text-purple-300 prose-pre:bg-black prose-pre:border prose-pre:border-white/10 prose-td:border-white/10 prose-th:border-white/10 prose-th:bg-white/5">
              {!output && !aiOutput && !isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3">
                  <Sparkles size={32} className="opacity-20 text-purple-500" />
                  <p>Run a scan first to generate an AI analysis.</p>
                </div>
              ) : !aiOutput && !isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                  <BrainCircuit size={48} className="opacity-40 text-purple-500 mb-2" />
                  <p className="text-sm">Scan completed. Ready for AI processing.</p>
                  <button
                    onClick={handleAnalyze}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  >
                    <Sparkles size={16} />
                    Generate Structured Report
                  </button>
                </div>
              ) : isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center text-purple-400 gap-4">
                  <Loader2 size={32} className="animate-spin" />
                  <p className="text-sm animate-pulse tracking-wide font-mono">Synthesizing Nikto Data...</p>
                </div>
              ) : (
                <div className="pb-8">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiOutput}</ReactMarkdown>
                  <div ref={aiOutputEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Status */}
      <div className="h-7 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning || isAnalyzing ? (isAnalyzing ? "bg-purple-500 animate-pulse" : "bg-purple-500 animate-pulse") : "bg-gray-600"}`} />
            {isAnalyzing ? "AI ANALYZING" : isRunning ? "SCAN IN PROGRESS" : "READY"}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Globe, Play, Square, Server, Code, FileText, 
  Activity, Search, Zap, Sparkles, BrainCircuit, Loader2, Info
} from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function HttpxTool() {
  const { reportToolResult } = useWorkspace();
  const [target, setTarget] = useState("hackerone.com");
  const [ports, setPorts] = useState("80,443,8080");
  const [threads, setThreads] = useState("50");
  const [techDetect, setTechDetect] = useState(true);
  const [statusCode, setStatusCode] = useState(true);
  const [title, setTitle] = useState(true);
  
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

    // Use the downloaded httpx-pd binary inside docker
    let cmd = `httpx-pd -u ${target.trim()}`;
    if (ports) cmd += ` -p ${ports.trim()}`;
    if (threads) cmd += ` -t ${threads.trim()}`;
    if (techDetect) cmd += ` -tech-detect`;
    if (statusCode) cmd += ` -sc`;
    if (title) cmd += ` -title`;
    
    // Add -nc for no color to keep parsing clean
    cmd += ` -nc`;

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

      reportToolResult("HTTPX", { target, ports, threads, techDetect, statusCode, title }, fullOutput);

      // Auto-trigger AI analysis if output isn't empty
      if (fullOutput.trim()) {
        handleAnalyze(fullOutput);
      }

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
  }, [target, ports, threads, techDetect, statusCode, title, reportToolResult]);

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
              content: "You are a web application security expert. Analyze the following httpx output. Provide a highly structured Markdown report. If there are multiple findings, present them in neat markdown tables (e.g. Host/URL, Status Code, Technologies Detected, Page Title). Highlight any critical anomalies or highly sensitive technologies exposed."
            },
            {
              role: "user",
              content: `Analyze these httpx results for ${target}:\n\n${dataToAnalyze}`
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
    <div className="flex flex-col h-full bg-[#050505] text-white font-sans selection:bg-orange-500/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
            <Zap className="text-orange-400" size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              HTTPX TOOLKIT
              {isRunning && <span className="flex h-2 w-2 rounded-full bg-orange-400 animate-pulse" />}
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Web Application Probing</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-14 border-r border-white/5 bg-black/20 flex flex-col items-center py-4 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("config")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "config" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
            }`}
            title="Configuration"
          >
            <Server size={18} />
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "output" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
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
                  <Search size={18} className="text-orange-500" />
                  Prober Configuration
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Configure advanced multi-threaded HTTP probing and technology fingerprinting.
                </p>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Globe size={12} /> Target / IP / Subnet
                  </label>
                  <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="example.com"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-orange-50 font-mono focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-gray-700"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                       Ports to Probe (-p)
                    </label>
                    <input
                      type="text"
                      value={ports}
                      onChange={(e) => setPorts(e.target.value)}
                      placeholder="80,443,8080"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                       Concurrent Threads (-t)
                    </label>
                    <input
                      type="number"
                      value={threads}
                      onChange={(e) => setThreads(e.target.value)}
                      placeholder="50"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Code size={12} /> Probing Signatures
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${techDetect ? 'bg-orange-500/10 border-orange-500/30' : 'bg-black border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}>
                      <span className="text-xs font-mono text-gray-300 tracking-wide uppercase">-tech-detect</span>
                      <input type="checkbox" className="hidden" checked={techDetect} onChange={(e) => setTechDetect(e.target.checked)} />
                      <div className={`w-3 h-3 rounded-full ${techDetect ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-gray-700'}`} />
                    </label>
                    
                    <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${statusCode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-black border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}>
                      <span className="text-xs font-mono text-gray-300 tracking-wide uppercase">-sc (Status)</span>
                      <input type="checkbox" className="hidden" checked={statusCode} onChange={(e) => setStatusCode(e.target.checked)} />
                      <div className={`w-3 h-3 rounded-full ${statusCode ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-gray-700'}`} />
                    </label>
                    
                    <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${title ? 'bg-orange-500/10 border-orange-500/30' : 'bg-black border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}>
                      <span className="text-xs font-mono text-gray-300 tracking-wide uppercase">-title</span>
                      <input type="checkbox" className="hidden" checked={title} onChange={(e) => setTitle(e.target.checked)} />
                      <div className={`w-3 h-3 rounded-full ${title ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-gray-700'}`} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                {!isRunning ? (
                  <button
                    onClick={handleStart}
                    disabled={!target.trim()}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]"
                  >
                    <Play size={18} fill="currentColor" />
                    Launch Prober
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  >
                    <Square size={18} fill="currentColor" />
                    Stop Prober
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Output Tab */}
          <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${activeTab === "output" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}>
            <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/5">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Activity size={12} className={isRunning ? "text-orange-500 animate-pulse" : "text-gray-500"} />
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
                  <p>Run httpx to see live probing results here.</p>
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
                  <p>Run a probe first to generate an AI analysis.</p>
                </div>
              ) : !aiOutput && !isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                  <BrainCircuit size={48} className="opacity-40 text-purple-500 mb-2" />
                  <p className="text-sm">Probing completed. Ready for AI processing.</p>
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
                  <p className="text-sm animate-pulse tracking-wide font-mono">Synthesizing httpx Signatures...</p>
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
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning || isAnalyzing ? (isAnalyzing ? "bg-purple-500 animate-pulse" : "bg-orange-500 animate-pulse") : "bg-gray-600"}`} />
            {isAnalyzing ? "AI ANALYZING" : isRunning ? "PROBING IN PROGRESS" : "READY"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-600">
            <Info size={10} /> Powered by ProjectDiscovery httpx
        </div>
      </div>
    </div>
  );
}

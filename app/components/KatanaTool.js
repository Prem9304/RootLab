"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Globe, Play, Square, Server, Code, FileText, 
  Activity, Search, Network, Sparkles, BrainCircuit, Loader2, Info
} from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function KatanaTool() {
  const { reportToolResult } = useWorkspace();
  const [target, setTarget] = useState("hackerone.com");
  const [depth, setDepth] = useState("3");
  const [concurrency, setConcurrency] = useState("10");
  const [headless, setHeadless] = useState(false);
  const [jsParsing, setJsParsing] = useState(true);
  const [knownFiles, setKnownFiles] = useState(false);
  
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

    // Use the downloaded katana-pd binary inside docker
    let cmd = `katana-pd -u ${target.trim()}`;
    if (depth) cmd += ` -d ${depth.trim()}`;
    if (concurrency) cmd += ` -c ${concurrency.trim()}`;
    if (headless) cmd += ` -hl`;
    if (jsParsing) cmd += ` -jc`;
    if (knownFiles) cmd += ` -kf all`;
    
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

      reportToolResult("Katana", { target, depth, concurrency, headless, jsParsing, knownFiles }, fullOutput);

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
  }, [target, depth, concurrency, headless, jsParsing, knownFiles, reportToolResult]);

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
              content: "You are a web application security expert. Analyze the following Katana crawler output. Extract interesting endpoints (APIs, parameters, sensitive files) and present them in a clean Markdown table format. Highlight any unusual or highly interesting paths."
            },
            {
              role: "user",
              content: `Analyze these Katana crawled endpoints for ${target}:\n\n${dataToAnalyze}`
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
    <div className="flex flex-col h-full bg-[#050505] text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Network className="text-indigo-400" size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              KATANA CRAWLER
              {isRunning && <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />}
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Web Application Crawling</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-14 border-r border-white/5 bg-black/20 flex flex-col items-center py-4 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("config")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "config" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
            }`}
            title="Configuration"
          >
            <Server size={18} />
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeTab === "output" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
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
                  <Search size={18} className="text-indigo-500" />
                  Crawler Configuration
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Configure deep web crawling and endpoint discovery using ProjectDiscovery Katana.
                </p>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-2xl p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Globe size={12} /> Target URL
                  </label>
                  <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-indigo-50 font-mono focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-gray-700"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                       Max Depth (-d)
                    </label>
                    <input
                      type="number"
                      value={depth}
                      onChange={(e) => setDepth(e.target.value)}
                      placeholder="3"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                       Concurrency (-c)
                    </label>
                    <input
                      type="number"
                      value={concurrency}
                      onChange={(e) => setConcurrency(e.target.value)}
                      placeholder="10"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Code size={12} /> Advanced Options
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${headless ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-black border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}>
                      <span className="text-xs font-mono text-gray-300 tracking-wide uppercase">-hl (Headless)</span>
                      <input type="checkbox" className="hidden" checked={headless} onChange={(e) => setHeadless(e.target.checked)} />
                      <div className={`w-3 h-3 rounded-full ${headless ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-gray-700'}`} />
                    </label>
                    
                    <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${jsParsing ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-black border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}>
                      <span className="text-xs font-mono text-gray-300 tracking-wide uppercase">-jc (JS Parse)</span>
                      <input type="checkbox" className="hidden" checked={jsParsing} onChange={(e) => setJsParsing(e.target.checked)} />
                      <div className={`w-3 h-3 rounded-full ${jsParsing ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-gray-700'}`} />
                    </label>
                    
                    <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${knownFiles ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-black border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}>
                      <span className="text-xs font-mono text-gray-300 tracking-wide uppercase">-kf (Known Files)</span>
                      <input type="checkbox" className="hidden" checked={knownFiles} onChange={(e) => setKnownFiles(e.target.checked)} />
                      <div className={`w-3 h-3 rounded-full ${knownFiles ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-gray-700'}`} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                {!isRunning ? (
                  <button
                    onClick={handleStart}
                    disabled={!target.trim()}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
                  >
                    <Play size={18} fill="currentColor" />
                    Launch Crawler
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  >
                    <Square size={18} fill="currentColor" />
                    Stop Crawler
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Output Tab */}
          <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${activeTab === "output" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}>
            <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/5">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Activity size={12} className={isRunning ? "text-indigo-500 animate-pulse" : "text-gray-500"} />
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
                  <p>Run Katana to see live crawling results here.</p>
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
                  <p>Run a crawl first to generate an AI analysis.</p>
                </div>
              ) : !aiOutput && !isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                  <BrainCircuit size={48} className="opacity-40 text-purple-500 mb-2" />
                  <p className="text-sm">Crawling completed. Ready for AI processing.</p>
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
                  <p className="text-sm animate-pulse tracking-wide font-mono">Synthesizing Katana Crawl Data...</p>
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
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning || isAnalyzing ? (isAnalyzing ? "bg-purple-500 animate-pulse" : "bg-indigo-500 animate-pulse") : "bg-gray-600"}`} />
            {isAnalyzing ? "AI ANALYZING" : isRunning ? "CRAWLING IN PROGRESS" : "READY"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-600">
            <Info size={10} /> Powered by ProjectDiscovery Katana
        </div>
      </div>
    </div>
  );
}

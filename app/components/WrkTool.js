"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Zap, Square, Play, RotateCcw, Copy, Check, ChevronDown, ChevronUp,
  Clock, Activity, Globe, Server, AlertTriangle, TrendingUp,
  BarChart2, List, Trash2, Info
} from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";

/* ---- Utility helpers ---- */
function parseWrkOutput(raw) {
  if (!raw) return null;
  const metrics = {};

  const latencyMatch = raw.match(/Latency\s+([\d.]+\w+)\s+([\d.]+\w+)\s+([\d.]+\w+)\s+([\d.]+%)/);
  if (latencyMatch) {
    metrics.latencyAvg = latencyMatch[1];
    metrics.latencyStdev = latencyMatch[2];
    metrics.latencyMax = latencyMatch[3];
  }

  const rpsMatch = raw.match(/Req\/Sec\s+([\d.]+\w*)\s+([\d.]+\w*)\s+([\d.]+\w*)/);
  if (rpsMatch) {
    metrics.rpsAvg = rpsMatch[1];
    metrics.rpsStdev = rpsMatch[2];
    metrics.rpsMax = rpsMatch[3];
  }

  const reqMatch = raw.match(/([\d,]+)\s+requests in/);
  if (reqMatch) metrics.totalRequests = reqMatch[1];

  const rpsLineMatch = raw.match(/Requests\/sec:\s+([\d.]+)/);
  if (rpsLineMatch) metrics.reqPerSec = parseFloat(rpsLineMatch[1]).toFixed(2);

  const transferMatch = raw.match(/Transfer\/sec:\s+([\d.]+\w+)/);
  if (transferMatch) metrics.transferPerSec = transferMatch[1];

  const errMatch = raw.match(/Non-2xx or 3xx responses:\s+([\d,]+)/);
  if (errMatch) metrics.errors = errMatch[1];

  const socketErrMatch = raw.match(/Socket errors: connect (\d+), read (\d+), write (\d+), timeout (\d+)/);
  if (socketErrMatch) {
    metrics.socketErrors = {
      connect: socketErrMatch[1],
      read: socketErrMatch[2],
      write: socketErrMatch[3],
      timeout: socketErrMatch[4],
    };
  }

  return Object.keys(metrics).length > 0 ? metrics : null;
}

function MetricCard({ label, value, sub, color, icon: Icon }) {
  color = color || "cyan";
  const colors = {
    cyan:   { bg: "bg-cyan-500/5",   border: "border-cyan-500/20",   text: "text-cyan-300",   icon: "text-cyan-500" },
    green:  { bg: "bg-green-500/5",  border: "border-green-500/20",  text: "text-green-300",  icon: "text-green-500" },
    amber:  { bg: "bg-amber-500/5",  border: "border-amber-500/20",  text: "text-amber-300",  icon: "text-amber-500" },
    red:    { bg: "bg-red-500/5",    border: "border-red-500/20",    text: "text-red-300",    icon: "text-red-500" },
    purple: { bg: "bg-purple-500/5", border: "border-purple-500/20", text: "text-purple-300", icon: "text-purple-500" },
  };
  const c = colors[color] || colors.cyan;
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-3 flex flex-col gap-1`}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={11} className={c.icon} />}
        <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">{label}</span>
      </div>
      <span className={`text-lg font-black font-mono ${c.text} leading-none`}>{value != null ? value : "-"}</span>
      {sub && <span className="text-[9px] text-gray-600 font-mono">{sub}</span>}
    </div>
  );
}

function HistoryRow({ item, idx, onRerun }) {
  const [open, setOpen] = useState(false);
  const hasErrors = item.metrics && (item.metrics.errors || item.metrics.socketErrors);
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden bg-black/40">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors group cursor-pointer"
      >
        <span className="text-[9px] font-mono text-gray-600 w-5 text-center">#{idx + 1}</span>
        <span className="flex-1 text-xs font-mono text-gray-300 truncate">{item.url}</span>
        {item.metrics && item.metrics.reqPerSec && (
          <span className="text-xs font-bold font-mono text-cyan-400 shrink-0">{item.metrics.reqPerSec} req/s</span>
        )}
        {hasErrors && <AlertTriangle size={12} className="text-amber-400 shrink-0" />}
        <span className="text-[9px] text-gray-600 shrink-0">{new Date(item.timestamp).toLocaleTimeString()}</span>
        <button
          onClick={e => { e.stopPropagation(); onRerun(item); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 rounded hover:bg-cyan-500/10 text-cyan-500 cursor-pointer shrink-0"
          title="Re-run"
        >
          <RotateCcw size={11} />
        </button>
        {open ? <ChevronUp size={12} className="text-gray-500 shrink-0" /> : <ChevronDown size={12} className="text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-white/5 pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {item.metrics && item.metrics.latencyAvg && <MetricCard label="Avg Latency" value={item.metrics.latencyAvg} color="cyan" icon={Clock} />}
            {item.metrics && item.metrics.latencyMax && <MetricCard label="Max Latency" value={item.metrics.latencyMax} color="amber" icon={Clock} />}
            {item.metrics && item.metrics.reqPerSec && <MetricCard label="Req/sec" value={item.metrics.reqPerSec} color="green" icon={Zap} />}
            {item.metrics && item.metrics.transferPerSec && <MetricCard label="Transfer/sec" value={item.metrics.transferPerSec} color="purple" icon={Activity} />}
            {item.metrics && item.metrics.totalRequests && <MetricCard label="Total Requests" value={item.metrics.totalRequests} color="cyan" icon={TrendingUp} />}
            {item.metrics && item.metrics.errors && <MetricCard label="Errors" value={item.metrics.errors} color="red" icon={AlertTriangle} />}
          </div>
          <pre className="text-[10px] font-mono text-gray-400 bg-black/60 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto scrollbar-none border border-white/5">{item.raw}</pre>
        </div>
      )}
    </div>
  );
}

/* ---- Main Component ---- */
export default function WrkTool() {
  const { reportWrkResult } = useWorkspace();

  const [url, setUrl] = useState("https://");
  const [threads, setThreads] = useState("4");
  const [connections, setConnections] = useState("100");
  const [duration, setDuration] = useState("30");
  const [timeoutVal, setTimeoutVal] = useState("5");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState("");
  const [body, setBody] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rateLimit, setRateLimit] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("config");
  const [copied, setCopied] = useState(false);

  const abortRef = useRef(null);
  const timerRef = useRef(null);
  const outputEndRef = useRef(null);

  useEffect(() => {
    if (outputEndRef.current && isRunning) {
      outputEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output, isRunning]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const buildCommand = useCallback(() => {
    if (!url.trim()) return null;
    let cmd = `wrk -t${threads} -c${connections} -d${duration}s`;
    if (timeoutVal) cmd += ` --timeout ${timeoutVal}s`;
    if (method && method !== "GET") cmd += ` -m ${method}`;
    if (rateLimit) cmd += ` -R ${rateLimit}`;
    if (headers) {
      headers.split("\n").forEach(h => {
        const trimmed = h.trim();
        if (trimmed) cmd += ` -H "${trimmed.replace(/"/g, '\\"')}"`;
      });
    }
    if (body && method !== "GET") {
      cmd += ` --body "${body.trim().replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
    }
    cmd += ` ${url.trim()}`;
    return cmd;
  }, [url, threads, connections, duration, timeoutVal, method, headers, body, rateLimit]);

  const handleStart = useCallback(async () => {
    const cmd = buildCommand();
    if (!cmd) return;

    setIsRunning(true);
    setOutput("");
    setMetrics(null);
    setElapsed(0);
    setActiveTab("output");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/wrk/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setOutput(`[ERROR] ${err.error || "Failed to start wrk"}\n\nMake sure wrk is installed in the container:\n  apt-get install wrk`);
        setIsRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullOutput = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullOutput += chunk;
        setOutput(fullOutput);
      }

      const parsed = parseWrkOutput(fullOutput);
      setMetrics(parsed);

      if (parsed || fullOutput.trim()) {
        const runEntry = {
          url: url.trim(),
          command: cmd,
          raw: fullOutput,
          metrics: parsed,
          timestamp: Date.now(),
          threads, connections, duration,
        };
        setHistory(prev => [runEntry, ...prev.slice(0, 19)]);
        // Report to workspace so AI has full context
        reportWrkResult({ url: url.trim(), threads, connections, duration }, parsed, fullOutput);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setOutput(prev => prev + `\n[CLIENT ERROR] ${err.message}`);
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [buildCommand, url, threads, connections, duration]);

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      setOutput(prev => prev + "\n\n[STOPPED by user]");
      setIsRunning(false);
    }
    fetch("/api/wrk/stop", { method: "POST" }).catch(() => {});
  }, []);

  const handleRerun = useCallback((item) => {
    setUrl(item.url);
    setThreads(item.threads || "4");
    setConnections(item.connections || "100");
    setDuration(item.duration || "30");
    setActiveTab("config");
  }, []);

  const copyOutput = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [output]);

  const previewCmd = buildCommand();
  const urlValid = url.trim() && url !== "https://";

  return (
    <div className="h-full flex flex-col bg-black text-white font-mono text-xs overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 bg-black">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
            <Zap size={16} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">WRK Benchmark</h2>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">HTTP Load Testing Tool</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRunning && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/25 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-green-400 uppercase">Live {elapsed}s</span>
            </div>
          )}
          {isRunning ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 rounded-lg transition-all text-[10px] font-bold uppercase cursor-pointer"
            >
              <Square size={11} /> Stop
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={!urlValid}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-black font-black rounded-lg transition-all text-[10px] uppercase cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Play size={11} /> Launch
            </button>
          )}
        </div>
      </div>

      {/* Live Metrics Bar */}
      {metrics && !isRunning && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 px-4 py-3 border-b border-white/10 bg-black shrink-0">
          {metrics.latencyAvg && <MetricCard label="Avg Latency" value={metrics.latencyAvg} color="cyan" icon={Clock} />}
          {metrics.latencyMax && <MetricCard label="Max Latency" value={metrics.latencyMax} color="amber" icon={Clock} />}
          {metrics.reqPerSec  && <MetricCard label="Req/sec"     value={metrics.reqPerSec}  color="green"  icon={Zap} />}
          {metrics.transferPerSec && <MetricCard label="Transfer/s" value={metrics.transferPerSec} color="purple" icon={Activity} />}
          {metrics.totalRequests && <MetricCard label="Total Req"  value={metrics.totalRequests} color="cyan" icon={TrendingUp} />}
          {metrics.errors && <MetricCard label="Errors" value={metrics.errors} color="red" icon={AlertTriangle} />}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-0 border-b border-white/10 shrink-0 bg-black px-4">
        {[
          { id: "config",  label: "Config",  icon: Server },
          { id: "output",  label: "Output",  icon: BarChart2 },
          { id: "history", label: `History (${history.length})`, icon: List },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <tab.icon size={11} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none">

        {/* CONFIG TAB */}
        {activeTab === "config" && (
          <div className="p-4 space-y-4">
            {/* URL + Method */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Target URL *</label>
              <div className="flex gap-2">
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  className="bg-black border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300 outline-none focus:border-cyan-500/50 cursor-pointer appearance-none min-w-[72px]"
                >
                  {["GET","POST","PUT","PATCH","DELETE","HEAD"].map(m => (
                    <option key={m} value={m} className="bg-black">{m}</option>
                  ))}
                </select>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 bg-black border border-white/10 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-700 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Core Params Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Threads (-t)", val: threads, set: setThreads, placeholder: "4", hint: "CPU cores to use" },
                { label: "Connections (-c)", val: connections, set: setConnections, placeholder: "100", hint: "Concurrent connections" },
                { label: "Duration (-d) sec", val: duration, set: setDuration, placeholder: "30", hint: "Test duration in seconds" },
                { label: "Timeout (s)", val: timeoutVal, set: setTimeoutVal, placeholder: "5", hint: "Socket timeout" },
                { label: "Rate Limit (-R) req/s", val: rateLimit, set: setRateLimit, placeholder: "unlimited", hint: "0 = no limit" },
              ].map(({ label, val, set, placeholder, hint }) => (
                <div key={label} className="space-y-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{label}</label>
                  <input
                    type="number"
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-black border border-white/10 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-700 outline-none transition-colors"
                  />
                  {hint && <p className="text-[8px] text-gray-700">{hint}</p>}
                </div>
              ))}
            </div>

            {/* Advanced toggle */}
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Advanced Options
            </button>

            {showAdvanced && (
              <div className="space-y-3 border-l-2 border-white/10 pl-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">HTTP Headers</label>
                  <textarea
                    value={headers}
                    onChange={e => setHeaders(e.target.value)}
                    placeholder={"Content-Type: application/json\nAuthorization: Bearer token123"}
                    rows={3}
                    className="w-full bg-black border border-white/10 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-700 outline-none transition-colors resize-none scrollbar-none"
                  />
                  <p className="text-[8px] text-gray-700">One header per line (Key: Value)</p>
                </div>

                {method !== "GET" && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Request Body</label>
                    <textarea
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      placeholder={'{"key": "value"}'}
                      rows={3}
                      className="w-full bg-black border border-white/10 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-700 outline-none transition-colors resize-none scrollbar-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Command Preview */}
            {previewCmd && (
              <div className="bg-black border border-white/10 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-600 uppercase tracking-widest font-bold flex items-center gap-1">
                    <Globe size={9} /> Command Preview
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(previewCmd)}
                    className="text-[9px] text-gray-600 hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={9} /> Copy
                  </button>
                </div>
                <code className="text-[10px] text-cyan-300/80 break-all leading-relaxed block">{previewCmd}</code>
              </div>
            )}

            {/* Warning */}
            <div className="flex gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[9px] text-amber-400/80 leading-relaxed">
                <strong>Educational / Authorized Use Only.</strong> Only benchmark servers you own or have explicit permission to test.
              </p>
            </div>
          </div>
        )}

        {/* OUTPUT TAB */}
        {activeTab === "output" && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0 bg-black">
              <div className="flex items-center gap-2">
                {isRunning ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] text-green-400 uppercase font-bold">Running...</span>
                  </div>
                ) : output ? (
                  <span className="text-[9px] text-gray-600 uppercase">Done</span>
                ) : (
                  <span className="text-[9px] text-gray-700 uppercase">No output yet - run benchmark first</span>
                )}
              </div>
              {output && (
                <button
                  onClick={copyOutput}
                  className="flex items-center gap-1 text-[9px] text-gray-600 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-black scrollbar-none">
              {output ? (
                <pre className="text-[11px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed break-all">
                  {output}
                  <span ref={outputEndRef} />
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <BarChart2 size={32} className="text-gray-800 mx-auto" />
                    <p className="text-[10px] text-gray-700 uppercase tracking-wider">No results yet</p>
                    <p className="text-[9px] text-gray-800">Configure and launch a benchmark to see output here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="p-4 space-y-2">
            {history.length > 0 ? (
              <React.Fragment>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] text-gray-600 uppercase tracking-widest">
                    {history.length} benchmark{history.length !== 1 ? "s" : ""} recorded
                  </span>
                  <button
                    onClick={() => setHistory([])}
                    className="flex items-center gap-1 text-[9px] text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={10} /> Clear
                  </button>
                </div>
                {history.map((item, i) => (
                  <HistoryRow key={item.timestamp} item={item} idx={i} onRerun={handleRerun} />
                ))}
              </React.Fragment>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <List size={28} className="text-gray-800 mx-auto" />
                  <p className="text-[10px] text-gray-700 uppercase tracking-wider">No history yet</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer action bar - only on config tab */}
      {activeTab === "config" && (
        <div className="px-4 py-3 border-t border-white/10 shrink-0 bg-black flex items-center gap-2">
          <div className="flex-1 text-[9px] text-gray-700 font-mono truncate">
            {previewCmd ? previewCmd : "Set a URL to preview the command..."}
          </div>
          {isRunning ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-5 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all"
            >
              <Square size={11} /> Stop Test
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={!urlValid}
              className="flex items-center gap-1.5 px-6 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:bg-gray-900 disabled:text-gray-700 disabled:cursor-not-allowed text-black font-black rounded-lg text-[10px] uppercase cursor-pointer transition-all shadow-lg shadow-cyan-500/20"
            >
              <Play size={11} /> Launch Benchmark
            </button>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Shield, Play, Square, AlertTriangle, Settings, 
  Terminal, Server, Activity, Zap, Plus,
  List, RefreshCw, Download, Pause, ExternalLink
} from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useWindowManager } from "../contexts/WindowManagerContext";

export default function NessusTool() {
  const [activeTab, setActiveTab] = useState("scans"); 
  
  // Settings State
  const [nessusUrl, setNessusUrl] = useState("https://127.0.0.1:8834");
  const [accessKey, setAccessKey] = useState("586f590b90a5e48daa450151a4933b6614028c10475928374ead4851c6ef0d72");
  const [secretKey, setSecretKey] = useState("ff41e4c08720764f18155d6425c0dc71826bb91ce87c12c8e0c62347e864c87f");
  const [useSimulator, setUseSimulator] = useState(false);

  // Scan State
  const [target, setTarget] = useState("");
  const [scanName, setScanName] = useState("");
  const [policy, setPolicy] = useState("basic");
  
  // Data State
  const [scans, setScans] = useState([]);
  const [activeScanId, setActiveScanId] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [liveLog, setLiveLog] = useState("");

  const { reportToolResult } = useWorkspace();
  const { openWindow, WINDOW_TYPES } = useWindowManager();
  
  const pollIntervalRef = useRef(null);
  const abortRef = useRef(null);

  const getActiveScan = () => scans.find(s => s.id === activeScanId);

  // Hardened API Caller
  const callNessusApi = async (endpoint, method = 'GET', body = null) => {
    try {
      const res = await fetch("/api/nessus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: nessusUrl,
          accessKey,
          secretKey,
          endpoint,
          method,
          body
        })
      });
      
      const data = await res.json().catch(() => ({})); 
      
      if (!res.ok) {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMsg);
      }
      
      return data.data || data; 
    } catch (err) {
      throw err;
    }
  };

  const handleTestConnection = async () => {
    try {
      setLiveLog("Testing connection to Nessus daemon...\n");
      const data = await callNessusApi('/server/properties');
      setLiveLog(prev => prev + `Success! Connected to Nessus v${data.nessus_type} (${data.server_version})\n`);
    } catch (err) {
      setLiveLog(prev => prev + `[ERROR] Connection failed: ${err.message}\n`);
    }
  };

  const fetchScans = useCallback(async () => {
    try {
      const data = await callNessusApi('/scans');
      if (data && data.scans) {
        const formattedScans = data.scans.map(s => ({
          id: s.id,
          name: s.name,
          target: s.text_targets || s.starttime ? `${s.text_targets || 'Multiple targets'}` : 'See scan details',
          status: s.status,
          date: new Date((s.creation_date || s.starttime || Date.now()/1000) * 1000).toISOString(),
          vulns: { 
            critical: s.counts?.statuses?.find(x => x.status === 'critical')?.count || 0,
            high: s.counts?.statuses?.find(x => x.status === 'high')?.count || 0,
            medium: s.counts?.statuses?.find(x => x.status === 'medium')?.count || 0,
            low: s.counts?.statuses?.find(x => x.status === 'low')?.count || 0,
            info: s.counts?.statuses?.find(x => x.status === 'info')?.count || 0
          },
          nessus_uuid: s.uuid
        }));
        setScans(formattedScans);
      }
    } catch (err) {
      console.error("Failed to fetch initial scans", err);
    }
  }, [accessKey, secretKey, nessusUrl]);

  useEffect(() => {
    if (!useSimulator) {
      fetchScans();
      const autoRefresh = setInterval(fetchScans, 30000);
      return () => clearInterval(autoRefresh);
    }
  }, [useSimulator, fetchScans]);

  useEffect(() => {
    return () => clearInterval(pollIntervalRef.current);
  }, []);

  const handleLaunchScan = async () => {
    if (!target || !scanName) return;
    
    const newScan = {
      id: Date.now(),
      name: scanName,
      target,
      status: "running",
      date: new Date().toISOString(),
      vulns: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      log: "Initiating Nessus daemon connection...\n"
    };

    setScans([newScan, ...scans]);
    setActiveScanId(newScan.id);
    setActiveTab("report");
    setIsRunning(true);
    setLiveLog(newScan.log);

    if (useSimulator) {
      setTimeout(() => {
        setLiveLog(prev => prev + "[SIMULATOR] Error: Real API selected but simulator toggle clicked.\n");
        setIsRunning(false);
      }, 1000);
      return;
    }

    try {
      setLiveLog(prev => prev + "Authenticating & Fetching Environment Defaults...\n");
      
      const templateData = await callNessusApi('/editor/scan/templates');
      if (!templateData || !templateData.templates) throw new Error("Could not fetch Nessus scan templates");

      const basicTemplate = templateData.templates.find(t => 
        policy === 'basic' ? t.name.toLowerCase().includes('basic') :
        policy === 'discovery' ? t.name.toLowerCase().includes('discovery') :
        policy === 'web' ? t.name.toLowerCase().includes('web') :
        t.name.toLowerCase().includes('basic')
      ) || templateData.templates.find(t => t.name === 'basic_network_scan') || templateData.templates[0];
      
      setLiveLog(prev => prev + `Using Template: ${basicTemplate.title} (${basicTemplate.uuid})\n`);

      // Simplified, minimal required payload. 
      // Letting Nessus default the folder_id and scanner_id to prevent permission conflicts.
      const payload = {
        uuid: basicTemplate.uuid,
        settings: {
          name: scanName,
          text_targets: target
        }
      };

      setLiveLog(prev => prev + `[DEBUG] Creating scan instance with minimal payload...\n`);

      let createData;
      try {
        createData = await callNessusApi('/scans', 'POST', payload);
      } catch (createErr) {
        setLiveLog(prev => prev + `\n[FATAL API REJECTION]\nPayload Sent: ${JSON.stringify(payload, null, 2)}\n\nDaemon Response: ${createErr.message}\n`);
        throw createErr;
      }
      
      const nessusScanId = createData.scan.id;
      
      setScans(prev => prev.map(s => s.id === newScan.id ? { ...s, id: nessusScanId } : s));
      setActiveScanId(nessusScanId);

      setLiveLog(prev => prev + `Scan Created Successfully (ID: ${nessusScanId}). Launching engine...\n`);
      await callNessusApi(`/scans/${nessusScanId}/launch`, 'POST');
      
      setLiveLog(prev => prev + `Scan engine running. Polling for results...\n`);
      pollIntervalRef.current = setInterval(() => pollScanStatus(nessusScanId, target, scanName), 10000);

    } catch (err) {
      setIsRunning(false);
      setScans(prev => prev.map(s => s.id === newScan.id ? { ...s, status: "failed" } : s));
    }
  };

  const pollScanStatus = async (scanId, scanTarget, name) => {
    try {
      const data = await callNessusApi(`/scans/${scanId}`);
      const status = data.info.status;
      
      setLiveLog(prev => prev + `[POLL] Status: ${status}\n`);

      if (status === 'completed' || status === 'canceled') {
        clearInterval(pollIntervalRef.current);
        setIsRunning(false);
        
        const vulns = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
        const cves = [];

        if (data.vulnerabilities) {
          data.vulnerabilities.forEach(v => {
            if (v.severity === 4) vulns.critical += v.count;
            if (v.severity === 3) vulns.high += v.count;
            if (v.severity === 2) vulns.medium += v.count;
            if (v.severity === 1) vulns.low += v.count;
            if (v.severity === 0) vulns.info += v.count;

            const sevStr = v.severity === 4 ? 'critical' : v.severity === 3 ? 'high' : v.severity === 2 ? 'medium' : v.severity === 1 ? 'low' : 'info';
            cves.push({
              id: `Plugin ${v.plugin_id}: ${v.plugin_name}`,
              severity: sevStr,
              cvss: v.cvss_base_score || 0,
              description: `Family: ${v.plugin_family}`,
              service: "Detected Service",
              link: `https://www.tenable.com/plugins/nessus/${v.plugin_id}`
            });
          });
        }

        setScans(prev => prev.map(s => s.id === scanId ? { 
          ...s, 
          status, 
          vulns, 
          details: cves,
          rawOutput: JSON.stringify(data.vulnerabilities, null, 2)
        } : s));

        if (activeScanId === scanId) {
          setActiveReport({ counts: vulns, cves });
        }

        reportToolResult("Nessus Scanner", { target: scanTarget, name }, JSON.stringify(data.vulnerabilities, null, 2));
      }
    } catch (err) {
      console.error("Polling error", err);
    }
  };

  const handleStop = async () => {
    if (useSimulator) {
      if (abortRef.current) abortRef.current.abort();
    } else {
      try {
        setLiveLog(prev => prev + "Stopping scan via API...\n");
        await callNessusApi(`/scans/${activeScanId}/stop`, 'POST');
      } catch (err) {
        setLiveLog(prev => prev + `[ERROR] Failed to stop: ${err.message}\n`);
      }
    }
    
    clearInterval(pollIntervalRef.current);
    setIsRunning(false);
    setScans(prev => prev.map(s => s.id === activeScanId ? { ...s, status: "canceled" } : s));
  };

  const handlePauseScan = async () => {
    if (!activeScanId) return;
    try {
      setLiveLog(prev => prev + "Pausing scan via API...\n");
      await callNessusApi(`/scans/${activeScanId}/pause`, 'POST');
      setScans(prev => prev.map(s => s.id === activeScanId ? { ...s, status: "paused" } : s));
      setLiveLog(prev => prev + "Scan paused successfully.\n");
    } catch (err) {
      setLiveLog(prev => prev + `[ERROR] Failed to pause: ${err.message}\n`);
    }
  };

  const handleResumeScan = async (scanId) => {
    try {
      setLiveLog(prev => prev + "Resuming scan via API...\n");
      await callNessusApi(`/scans/${scanId}/resume`, 'POST');
      setScans(prev => prev.map(s => s.id === scanId ? { ...s, status: "running" } : s));
      setIsRunning(true);
      pollIntervalRef.current = setInterval(() => pollScanStatus(scanId, getActiveScan()?.target, getActiveScan()?.name), 10000);
      setLiveLog(prev => prev + "Scan resumed. Polling for results...\n");
    } catch (err) {
      setLiveLog(prev => prev + `[ERROR] Failed to resume: ${err.message}\n`);
    }
  };

  const handleExportReport = () => {
    const scan = getActiveScan();
    if (!scan) return;
    const reportData = {
      scanName: scan.name,
      target: scan.target,
      status: scan.status,
      date: scan.date,
      vulnCounts: scan.vulns,
      vulnerabilities: scan.details || [],
      rawData: scan.rawOutput || ""
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nessus-report-${scan.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLiveLog(prev => prev + `[EXPORT] Report downloaded as JSON.\n`);
  };

  const viewReport = async (scan) => {
    setActiveScanId(scan.id);
    setActiveTab("report");
    setLiveLog(`Fetching detailed report for Scan ID: ${scan.id}...\n`);
    
    if (scan.status === "completed" && !scan.details && !useSimulator) {
      try {
        const data = await callNessusApi(`/scans/${scan.id}`);
        const vulns = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
        const cves = [];
        
        if (data.vulnerabilities) {
          data.vulnerabilities.forEach(v => {
            if (v.severity === 4) vulns.critical += v.count;
            if (v.severity === 3) vulns.high += v.count;
            if (v.severity === 2) vulns.medium += v.count;
            if (v.severity === 1) vulns.low += v.count;
            if (v.severity === 0) vulns.info += v.count;

            const sevStr = v.severity === 4 ? 'critical' : v.severity === 3 ? 'high' : v.severity === 2 ? 'medium' : v.severity === 1 ? 'low' : 'info';
            cves.push({
              id: `Plugin ${v.plugin_id}: ${v.plugin_name}`,
              severity: sevStr,
              cvss: v.cvss_base_score || 0,
              description: `Family: ${v.plugin_family}`,
              service: "Detected Service",
              link: `https://www.tenable.com/plugins/nessus/${v.plugin_id}`
            });
          });
        }

        const reportData = { counts: vulns, cves };
        setActiveReport(reportData);
        setScans(prev => prev.map(s => s.id === scan.id ? { ...s, vulns, details: cves, rawOutput: JSON.stringify(data.vulnerabilities) } : s));
        setLiveLog(prev => prev + "Report parsed successfully.\n");
        
        reportToolResult("Nessus Scanner", { target: scan.target || "Historical Target", name: scan.name }, JSON.stringify(data.vulnerabilities, null, 2));
      } catch (err) {
        setLiveLog(prev => prev + `[ERROR] Failed to fetch report: ${err.message}\n`);
      }
    } else if (scan.details) {
      setActiveReport({ counts: scan.vulns, cves: scan.details });
      setLiveLog(scan.rawOutput ? "Logs recovered from local state.\n" : "Logs loaded.\n");
      reportToolResult("Nessus Scanner", { target: scan.target, name: scan.name }, scan.rawOutput);
    } else {
      setActiveReport(null);
    }
  };

  const openAIChat = () => {
    openWindow({ type: WINDOW_TYPES.AI_CHAT, title: "AI Chat" });
  };

  const activeScanData = getActiveScan();

  return (
    <div className="flex h-full bg-[#0a0a0a] text-gray-200 font-sans">
      
      {/* Side Navigation */}
      <div className="w-56 bg-[#111] border-r border-[#222] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#222] flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#004731] flex items-center justify-center border border-[#006e4d]">
            <Shield size={18} className="text-[#00df8f]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">NESSUS</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Professional</p>
          </div>
        </div>
        
        <div className="flex-1 py-4 space-y-1 px-2">
          <button onClick={() => {setActiveTab("scans"); fetchScans();}} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'scans' ? 'bg-[#004731]/40 text-[#00df8f]' : 'text-gray-400 hover:bg-[#222]'}`}>
            <span className="flex items-center gap-3"><List size={16} /> My Scans</span>
            <RefreshCw size={12} className="opacity-50" />
          </button>
          <button onClick={() => setActiveTab("new")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'new' ? 'bg-[#004731]/40 text-[#00df8f]' : 'text-gray-400 hover:bg-[#222]'}`}>
            <Plus size={16} /> New Scan
          </button>
          <a href="https://127.0.0.1:8834" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer text-gray-500 hover:bg-[#222] hover:text-gray-300">
            <ExternalLink size={16} /> Open Nessus UI
          </a>
          <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'settings' ? 'bg-[#004731]/40 text-[#00df8f]' : 'text-gray-400 hover:bg-[#222]'}`}>
            <Settings size={16} /> API Settings
          </button>
        </div>
        
        <div className="p-4 border-t border-[#222] text-center flex flex-col items-center gap-2">
           <span className="text-[10px] text-gray-600 font-mono">Engine: {useSimulator ? 'Simulator' : 'REST API'}</span>
           {!useSimulator && <span className="text-[8px] px-2 py-0.5 bg-[#00df8f]/20 text-[#00df8f] border border-[#00df8f]/30 rounded uppercase tracking-widest">Connected</span>}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
        
        {/* Scans List Tab */}
        {activeTab === "scans" && (
          <div className="p-8 overflow-auto">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#222] pb-4">My Scans</h2>
            {scans.length === 0 && <p className="text-sm text-gray-500 font-mono text-center mt-10">No scans found. Create a new scan to get started.</p>}
            <div className="space-y-3">
              {scans.map(scan => (
                <div key={scan.id} onClick={() => viewReport(scan)} className="bg-[#111] border border-[#222] hover:border-[#444] rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${scan.status === 'completed' ? 'bg-[#00df8f]' : scan.status === 'running' ? 'bg-cyan-500 animate-pulse' : 'bg-gray-500'}`} />
                    <div>
                      <h3 className="font-bold text-gray-200 group-hover:text-white transition-colors">{scan.name}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-1">{scan.status.toUpperCase()} • {new Date(scan.date).toLocaleString()}</p>
                    </div>
                  </div>
                  {scan.status === "completed" && scan.vulns && (
                    <div className="flex gap-2 text-xs font-bold text-center">
                      <div className="w-10 h-10 rounded-lg bg-[#531a1a] text-[#ff4c4c] flex flex-col items-center justify-center border border-[#7a2323]"><span className="text-[10px] opacity-70">C</span>{scan.vulns.critical}</div>
                      <div className="w-10 h-10 rounded-lg bg-[#5e3215] text-[#ff8c3a] flex flex-col items-center justify-center border border-[#8a4a1f]"><span className="text-[10px] opacity-70">H</span>{scan.vulns.high}</div>
                      <div className="w-10 h-10 rounded-lg bg-[#5e4b15] text-[#ffcc3a] flex flex-col items-center justify-center border border-[#8a6e1f]"><span className="text-[10px] opacity-70">M</span>{scan.vulns.medium}</div>
                    </div>
                  )}
                  {scan.status === "running" && <span className="text-sm text-cyan-500 font-bold">Scanning...</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Scan Tab */}
        {activeTab === "new" && (
          <div className="p-8 overflow-auto max-w-3xl">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#222] pb-4">Create New Scan</h2>
            
            <div className="space-y-5 bg-[#111] border border-[#222] p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target (IP, Range, or Hostname)</label>
                <input 
                  type="text" 
                  value={target} 
                  onChange={e => setTarget(e.target.value)} 
                  placeholder="192.168.1.0/24 or example.com" 
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded p-3 text-sm text-white focus:outline-none focus:border-[#00df8f] font-mono transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Scan Name</label>
                <input 
                  type="text" 
                  value={scanName} 
                  onChange={e => setScanName(e.target.value)} 
                  placeholder="Internal Subnet Discovery" 
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded p-3 text-sm text-white focus:outline-none focus:border-[#00df8f] font-mono transition-colors" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Policy Template</label>
                <select 
                  value={policy} 
                  onChange={e => setPolicy(e.target.value)} 
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded p-3 text-sm text-white focus:outline-none focus:border-[#00df8f] font-mono cursor-pointer transition-colors"
                >
                  <option value="basic">Basic Network Scan</option>
                  <option value="discovery">Host Discovery</option>
                  <option value="web">Web Application Audit</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#222]">
                <button 
                  onClick={handleLaunchScan} 
                  disabled={!target || !scanName || isRunning}
                  className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-[#004731] hover:bg-[#005c40] border border-[#006e4d] text-[#00df8f] rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,223,143,0.1)] hover:shadow-[0_0_20px_rgba(0,223,143,0.2)]"
                >
                  <Play size={16} fill="currentColor" /> Launch Scan Engine
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="p-8 overflow-auto max-w-3xl">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#222] pb-4">API Configuration</h2>
            <div className="space-y-6">
              
              <div className="flex items-center justify-between p-4 bg-[#111] border border-[#00df8f]/30 rounded-xl">
                <div>
                  <h3 className="font-bold text-white">Use Simulated Engine</h3>
                  <p className="text-xs text-gray-500 mt-1">Run without a real Nessus daemon by wrapping internal scan tools in the Nessus UI.</p>
                </div>
                <button onClick={() => setUseSimulator(!useSimulator)} className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${useSimulator ? 'bg-[#00df8f]' : 'bg-[#333]'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${useSimulator ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {!useSimulator && (
                <div className="space-y-5 bg-[#111] border border-[#222] p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nessus Daemon URL</label>
                    <input type="text" value={nessusUrl} onChange={e => setNessusUrl(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#333] rounded p-2 text-sm text-white focus:outline-none focus:border-[#00df8f] font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Access Key</label>
                    <input type="password" value={accessKey} onChange={e => setAccessKey(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#333] rounded p-2 text-sm text-white focus:outline-none focus:border-[#00df8f] font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Secret Key</label>
                    <input type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#333] rounded p-2 text-sm text-white focus:outline-none focus:border-[#00df8f] font-mono" />
                  </div>
                  <button onClick={handleTestConnection} className="w-full px-4 py-2 bg-[#222] hover:bg-[#333] text-white border border-[#444] rounded transition-colors text-sm font-bold cursor-pointer">
                    Test Connection
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Tab */}
        {activeTab === "report" && activeScanData && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Report Header */}
            <div className="p-6 bg-[#111] border-b border-[#222] shrink-0">
               <div className="flex justify-between items-start">
                 <div>
                   <h2 className="text-2xl font-bold text-white mb-1">{activeScanData.name}</h2>
                   <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                     <span>Target: {activeScanData.target || 'Nessus Audit'}</span>
                     <span>Status: {activeScanData.status.toUpperCase()}</span>
                     <span>Started: {new Date(activeScanData.date).toLocaleString()}</span>
                   </div>
                 </div>
                 <div className="flex gap-2">
                    {isRunning && (
                      <>
                        <button onClick={handlePauseScan} className="px-4 py-1.5 bg-yellow-900/40 hover:bg-yellow-800 text-yellow-400 rounded border border-yellow-900 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer">
                          <Pause size={12} fill="currentColor" /> Pause
                        </button>
                        <button onClick={handleStop} className="px-4 py-1.5 bg-red-900/40 hover:bg-red-800 text-red-400 rounded border border-red-900 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer">
                          <Square size={12} fill="currentColor" /> Stop
                        </button>
                      </>
                    )}
                    {activeScanData.status === "paused" && (
                      <button onClick={() => handleResumeScan(activeScanId)} className="px-4 py-1.5 bg-cyan-900/40 hover:bg-cyan-800 text-cyan-400 rounded border border-cyan-900 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer">
                        <Play size={12} fill="currentColor" /> Resume
                      </button>
                    )}
                    {(activeScanData.status === "completed" || activeScanData.status === "canceled") && (
                      <>
                        <button onClick={handleExportReport} className="px-4 py-1.5 bg-[#1a2a1a] hover:bg-[#223322] text-[#00df8f]/70 rounded border border-[#004731] flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer">
                          <Download size={14} /> Export JSON
                        </button>
                        <button onClick={openAIChat} className="px-4 py-1.5 bg-[#004731] hover:bg-[#005c40] text-[#00df8f] rounded border border-[#006e4d] flex items-center gap-2 text-xs font-bold transition-colors shadow-[0_0_15px_rgba(0,223,143,0.15)] cursor-pointer">
                          <Zap size={14} fill="currentColor" /> Remediation AI
                        </button>
                      </>
                    )}
                 </div>
               </div>
            </div>

            {/* Split View: Dashboard & Logs */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left: Vuln Dashboard */}
              <div className="flex-1 overflow-auto bg-[#0a0a0a] p-6 border-r border-[#222]">
                {activeReport ? (
                  <div>
                    <h3 className="text-sm font-bold text-gray-300 mb-4 border-b border-[#222] pb-2">Vulnerabilities Discovered</h3>
                    
                    <div className="grid grid-cols-5 gap-0.5 mb-8 rounded-lg overflow-hidden border border-[#222]">
                      <div className="bg-[#531a1a] p-3 text-center border-r border-[#222]/50">
                        <div className="text-2xl font-bold text-[#ff4c4c]">{activeReport.counts.critical}</div>
                        <div className="text-[9px] uppercase tracking-widest text-[#ff4c4c]/70 mt-1">Critical</div>
                      </div>
                      <div className="bg-[#5e3215] p-3 text-center border-r border-[#222]/50">
                        <div className="text-2xl font-bold text-[#ff8c3a]">{activeReport.counts.high}</div>
                        <div className="text-[9px] uppercase tracking-widest text-[#ff8c3a]/70 mt-1">High</div>
                      </div>
                      <div className="bg-[#5e4b15] p-3 text-center border-r border-[#222]/50">
                        <div className="text-2xl font-bold text-[#ffcc3a]">{activeReport.counts.medium}</div>
                        <div className="text-[9px] uppercase tracking-widest text-[#ffcc3a]/70 mt-1">Medium</div>
                      </div>
                      <div className="bg-[#004731]/40 p-3 text-center border-r border-[#222]/50">
                        <div className="text-2xl font-bold text-[#00df8f]">{activeReport.counts.low}</div>
                        <div className="text-[9px] uppercase tracking-widest text-[#00df8f]/70 mt-1">Low</div>
                      </div>
                      <div className="bg-[#111] p-3 text-center">
                        <div className="text-2xl font-bold text-[#008cff]">{activeReport.counts.info || 0}</div>
                        <div className="text-[9px] uppercase tracking-widest text-[#008cff]/70 mt-1">Info</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {activeReport.cves.length > 0 ? activeReport.cves.map((vuln, i) => (
                        <div key={i} className="flex items-center gap-3 bg-[#111] p-3 rounded border border-[#222] hover:border-[#333] transition-colors">
                          <div className={`w-3 h-3 rounded-sm shrink-0
                            ${vuln.severity === 'critical' ? 'bg-[#ff4c4c]' : ''}
                            ${vuln.severity === 'high' ? 'bg-[#ff8c3a]' : ''}
                            ${vuln.severity === 'medium' ? 'bg-[#ffcc3a]' : ''}
                            ${vuln.severity === 'low' ? 'bg-[#00df8f]' : ''}
                            ${vuln.severity === 'info' ? 'bg-[#008cff]' : ''}
                          `} />
                          <div className="flex-1">
                            {vuln.link ? (
                              <a href={vuln.link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white hover:text-[#00df8f] transition-colors">{vuln.id}</a>
                            ) : (
                              <span className="text-sm font-bold text-white">{vuln.id}</span>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">{vuln.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {vuln.cvss > 0 && <span className="text-[10px] font-bold text-gray-500">CVSS {vuln.cvss}</span>}
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500 font-mono text-center mt-10">No vulnerabilities discovered by Nessus.</p>
                      )}
                    </div>

                  </div>
                ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-50 text-center">
                      {isRunning ? (
                         <>
                           <Activity size={48} className="text-[#00df8f] mb-4 animate-pulse" />
                           <p className="text-sm font-mono text-gray-400">Scan in progress... engine is actively probing targets.</p>
                         </>
                      ) : (
                         <>
                           <AlertTriangle size={48} className="text-gray-500 mb-4" />
                           <p className="text-sm font-mono text-gray-400">Loading report data...</p>
                         </>
                      )}
                   </div>
                )}
              </div>

              {/* Right: Live Logs */}
              <div className="w-1/3 min-w-[300px] bg-[#000] flex flex-col">
                <div className="p-3 border-b border-[#222] bg-[#0a0a0a] flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><Terminal size={12}/> API Communication Log</span>
                  {isRunning && <span className="text-[10px] text-[#00df8f] animate-pulse">Polling</span>}
                </div>
                <div className="flex-1 p-3 overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-gray-400 break-all whitespace-pre-wrap">{liveLog}</pre>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
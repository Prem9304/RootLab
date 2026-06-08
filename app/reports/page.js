"use client";

import { useState, useEffect } from "react";
import { 
  FileText, Shield, Camera, 
  Video, RefreshCw, X, Download, AlertTriangle, FileJson, FileCode2, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ReportsPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [textLoading, setTextLoading] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null);

  const deleteFile = async (file, e) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${file}?`)) return;
    
    setDeletingFile(file);
    try {
      const res = await fetch(`/api/reports/delete?file=${file}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete file");
      
      setFiles(prev => prev.filter(f => f !== file));
      if (activeFile === file) {
        closeFile();
      }
    } catch (err) {
      alert(`Error deleting file: ${err.message}`);
    } finally {
      setDeletingFile(null);
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/list");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch file list");
      setFiles(json.files || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const openFile = async (file) => {
    setActiveFile(file);
    if (file.endsWith('.txt') || file.endsWith('.json')) {
      setTextLoading(true);
      setTextContent(null);
      try {
        const res = await fetch(`/api/reports/media?file=${file}`);
        if (!res.ok) throw new Error("Failed to read file");
        const text = await res.text();
        setTextContent(text);
      } catch (err) {
        setTextContent(`Error reading file: ${err.message}`);
      } finally {
        setTextLoading(false);
      }
    }
  };

  const closeFile = () => {
    setActiveFile(null);
    setTextContent(null);
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith('.png')) return <Camera size={24} className="text-cyan-400" />;
    if (filename.endsWith('.mp4')) return <Video size={24} className="text-purple-400" />;
    if (filename.endsWith('.json')) return <FileJson size={24} className="text-yellow-400" />;
    return <FileCode2 size={24} className="text-green-400" />;
  };

  const getFileBackground = (filename, isActive) => {
    let base = "border-white/5 bg-white/5 hover:bg-white/10";
    let activeClass = "ring-1 ring-white/30 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]";
    
    if (filename.endsWith('.png')) {
      base = "border-cyan-500/10 bg-cyan-950/20 hover:bg-cyan-900/40 hover:border-cyan-500/30 text-cyan-100";
      activeClass = "border-cyan-400/50 bg-cyan-900/50 shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30 scale-[0.98]";
    } else if (filename.endsWith('.mp4')) {
      base = "border-purple-500/10 bg-purple-950/20 hover:bg-purple-900/40 hover:border-purple-500/30 text-purple-100";
      activeClass = "border-purple-400/50 bg-purple-900/50 shadow-[0_0_25px_rgba(168,85,247,0.15)] ring-1 ring-purple-400/30 scale-[0.98]";
    } else if (filename.endsWith('.json')) {
      base = "border-amber-500/10 bg-amber-950/20 hover:bg-amber-900/40 hover:border-amber-500/30 text-amber-100";
      activeClass = "border-amber-400/50 bg-amber-900/50 shadow-[0_0_25px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/30 scale-[0.98]";
    } else {
      base = "border-emerald-500/10 bg-emerald-950/20 hover:bg-emerald-900/40 hover:border-emerald-500/30 text-emerald-100";
      activeClass = "border-emerald-400/50 bg-emerald-900/50 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/30 scale-[0.98]";
    }

    return isActive ? activeClass : base;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="relative">
          <Shield size={64} className="text-[#00f0ff] opacity-20" />
          <RefreshCw size={32} className="text-[#00f0ff] animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="mt-6 text-xl font-mono font-bold text-[#00f0ff] animate-pulse uppercase tracking-widest text-glow-cyan">
          Scanning Container Storage...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-lg mx-auto">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 font-mono text-sm mb-6 bg-red-950/30 p-4 rounded-lg border border-red-500/20">
          {error}
        </p>
        <button onClick={fetchFiles} className="px-6 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/50 rounded-lg transition-all flex items-center gap-2">
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500 pb-2">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <FileText size={24} className="text-[#00f0ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide font-mono">FILE EXPLORER</h1>
            <p className="text-gray-400 text-sm hidden sm:block">Browse intelligence reports extracted from the container</p>
          </div>
        </div>
        <button onClick={fetchFiles} className="p-2.5 bg-black hover:bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-[#00f0ff] transition-all cursor-pointer">
          <RefreshCw size={18} />
        </button>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="w-24 h-24 rounded-full bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-center mb-6 scanning-pulse">
            <FileText size={40} className="text-cyan-500/50" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 font-mono">No Files Found</h2>
          <p className="text-gray-400 max-w-md">
            The intelligence container root directory is empty. Run an operation to generate files.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          
          {/* Files List / Sidebar */}
          <motion.div 
            layout
            initial={false}
            animate={{ width: activeFile ? (typeof window !== 'undefined' && window.innerWidth < 768 ? "100%" : "320px") : "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.6 }}
            className={`overflow-y-auto pr-2 custom-scrollbar shrink-0 ${activeFile ? 'hidden md:block' : 'w-full'}`}
          >
            <motion.div 
              layout 
              transition={{ type: "spring", bounce: 0, duration: 0.6 }}
              className={activeFile ? "flex flex-col gap-3" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"}
            >
              <AnimatePresence>
                {files.map((file, i) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    key={file}
                    className="relative group"
                  >
                    <button 
                      onClick={() => openFile(file)}
                      className={`flex ${activeFile ? 'flex-row p-3 items-center text-left' : 'flex-col p-6 items-center justify-center text-center'} w-full rounded-2xl border transition-all duration-300 cursor-pointer ${getFileBackground(file, activeFile === file)}`}
                    >
                      <div className={`${activeFile ? 'mr-3' : 'mb-4'} transform group-hover:scale-110 transition-transform duration-200 shrink-0`}>
                        {getFileIcon(file)}
                      </div>
                      <span className="font-mono text-xs text-gray-300 truncate w-full group-hover:text-white transition-colors">
                        {file.replace(/^\//, '')}
                      </span>
                    </button>
                    
                    {/* Delete Button */}
                    <button 
                      onClick={(e) => deleteFile(file, e)}
                      disabled={deletingFile === file}
                      className={`absolute ${activeFile ? 'top-1/2 -translate-y-1/2 right-3' : 'top-2 right-2'} p-1.5 bg-red-900/80 hover:bg-red-600 text-red-200 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:opacity-50`}
                      title="Delete File"
                    >
                      {deletingFile === file ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* File Viewer Panel */}
          <AnimatePresence>
            {activeFile && (
              <motion.div 
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="flex-1 h-full min-h-0 flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black/60 backdrop-blur-xl relative"
              >
                {/* Viewer Header */}
                <div className="w-full bg-black/80 border-b border-white/10 p-4 flex justify-between items-center shrink-0">
                  <span className="font-mono text-cyan-400 font-bold tracking-widest truncate max-w-[50%]">{activeFile}</span>
                  <div className="flex items-center gap-3">
                    <a 
                      href={`/api/reports/media?file=${activeFile}`} 
                      download 
                      className="px-3 py-1.5 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-400 border border-cyan-500/30 rounded-lg font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download size={14} /> <span className="hidden sm:inline">Download</span>
                    </a>
                    <button 
                      onClick={closeFile}
                      className="px-3 py-1.5 bg-gray-800/60 hover:bg-gray-700 border border-gray-600/50 text-gray-300 rounded-lg font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <X size={14} /> <span className="hidden sm:inline">Close</span>
                    </button>
                  </div>
                </div>

                {/* Viewer Content */}
                <div className="w-full flex-1 overflow-auto flex items-center justify-center p-4">
                  {(activeFile.endsWith('.png')) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/reports/media?file=${activeFile}`} alt="Evidence" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                  )}
                  
                  {(activeFile.endsWith('.mp4')) && (
                    <video src={`/api/reports/media?file=${activeFile}`} controls autoPlay className="max-w-full max-h-full outline-none rounded-lg shadow-2xl" />
                  )}

                  {(activeFile.endsWith('.txt') || activeFile.endsWith('.json')) && (
                    <div className="w-full h-full flex items-start justify-start overflow-auto">
                      {textLoading ? (
                        <div className="flex items-center justify-center w-full gap-3 text-cyan-500 font-mono p-8">
                          <RefreshCw className="animate-spin" size={20} /> Reading file contents...
                        </div>
                      ) : (
                        <pre className="text-gray-300 font-mono text-sm p-4 w-full break-all whitespace-pre-wrap">
                          {textContent}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}
    </div>
  );
}


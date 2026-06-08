"use client";

import { useContext, useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VMContext } from "../contexts/VMContext";
import { useWindowManager } from "../contexts/WindowManagerContext";
import { toolsConfig } from "../../public/toolsConfig";
import { Search, Info, X, Plus, Trash2, Command, Settings, Package, Loader, Terminal } from "lucide-react";
import React from "react";
import PhishingToolCard from "./PhishingToolCard";

// AppIcon component for regular tools
const AppIcon = ({ tool, onClick, onDelete, isCustom }) => {
  const [isHovered, setIsHovered] = useState(false);
  const iconBgColor = tool.iconBgColor || "#1e293b";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: tool.enabled ? 1.05 : 1 }}
      whileTap={{ scale: tool.enabled ? 0.95 : 1 }}
      transition={{ type: "spring", stiffness: 450, damping: 20 }}
      className={`relative ${!tool.enabled ? "opacity-40" : ""}`}
      onMouseEnter={() => setIsHovered(tool.enabled)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        disabled={!tool.enabled}
        className={`w-full aspect-square bg-slate-950/40 backdrop-blur-md border border-cyan-500/10 rounded-2xl flex flex-col items-center justify-center text-center p-4 relative transition-all duration-300 group ${
          tool.enabled
            ? "hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] cursor-pointer"
            : "cursor-not-allowed"
        }`}
        aria-label={`Launch ${tool.name}`}
      >
        {isCustom && tool.enabled && (
             <button 
               onClick={(e) => { e.stopPropagation(); onDelete(tool.id); }} 
               className="absolute z-20 top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-950/80 hover:bg-red-900 border border-red-500/30 rounded-lg text-red-400 hover:text-white cursor-pointer" 
               aria-label="Delete App"
             >
                 <Trash2 size={12} />
             </button>
        )}
        
        {/* Icon Display */}
        <div
          className="w-14 h-14 rounded-xl mb-3 flex items-center justify-center text-white flex-shrink-0 shadow-lg"
          style={{ backgroundColor: iconBgColor }}
          aria-hidden="true"
        >
          {tool.icon && typeof tool.icon === "string" ? (
            <span className="text-2xl">{tool.icon}</span>
          ) : tool.icon && React.isValidElement(tool.icon) ? (
             React.cloneElement(tool.icon, { size: 26 })
          ) : (
            <div className="text-xl font-bold font-mono">{tool.name.charAt(0)}</div>
          )}
        </div>

        {/* Tool Name */}
        <span className="text-xs font-semibold text-gray-200 truncate max-w-full block font-mono uppercase tracking-wide">
          {tool.name}
        </span>
      </button>

      {/* Tooltip on Hover */}
      {isHovered && tool.enabled && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute z-30 bottom-full left-1/2 transform -translate-x-1/2 mb-3.5 w-64 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-2xl p-4.5 pointer-events-none font-mono"
          role="tooltip"
          aria-label={`${tool.name} - ${tool.description || ""}`}
        >
          <div className="flex items-start mb-2.5">
             <div
                className="w-9 h-9 rounded-lg mr-3 flex-shrink-0 flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: iconBgColor }}
                aria-hidden="true"
             >
                {tool.icon && typeof tool.icon === "string" ? (
                   <span className="text-lg">{tool.icon}</span>
                ) : tool.icon && React.isValidElement(tool.icon) ? (
                   React.cloneElement(tool.icon, { size: 18 })
                ) : (
                   <span className="text-md font-bold">{tool.name.charAt(0)}</span>
                )}
             </div>
             <div>
                <h3 className="font-bold text-sm text-white tracking-wide">{tool.name}</h3>
                <p className="text-[10px] text-gray-500 uppercase">
                   {tool.groupName || "Application"}
                </p>
             </div>
          </div>
          {tool.description && (
            <p className="text-xs text-gray-400 mt-2 leading-relaxed border-t border-slate-900 pt-2">{tool.description}</p>
          )}
          {/* Tooltip arrow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-950 border-r border-b border-cyan-500/20"></div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default function Tools() {
  const { vmStatus } = useContext(VMContext);
  const { openWindow, WINDOW_TYPES } = useWindowManager();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [openPhishingToolId, setOpenPhishingToolId] = useState(null);
  
  // Custom Tools State
  const [customTools, setCustomTools] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newToolForm, setNewToolForm] = useState({ name: "", command: "", description: "" });
  
  // Simulated APT Installer States
  const [isInstalling, setIsInstalling] = useState(false);
  const [installLogs, setInstallLogs] = useState([]);
  const [installProgress, setInstallProgress] = useState(0);

  useEffect(() => {
    const loadTools = () => {
      const saved = localStorage.getItem('rootlab_custom_tools');
      if (saved) {
        try { setCustomTools(JSON.parse(saved)); } catch (e) {}
      }
    };
    loadTools();
    window.addEventListener('rootlab_tool_installed', loadTools);
    return () => window.removeEventListener('rootlab_tool_installed', loadTools);
  }, []);

  const saveCustomTools = (newTools) => {
    setCustomTools(newTools);
    localStorage.setItem('rootlab_custom_tools', JSON.stringify(newTools));
  };

  const handleAddCustomTool = (e) => {
     e.preventDefault();
     if (!newToolForm.name.trim() || !newToolForm.command.trim()) return;

     setIsInstalling(true);
     setInstallLogs([`[$] Initiating sandbox deployment protocols for ${newToolForm.name}...`]);
     setInstallProgress(10);
     
     const logSteps = [
       { time: 250, log: "[$] Pinging repository mirror lists: secure.kali.org... 200 OK", progress: 28 },
       { time: 500, log: "[$] Fetching latest software list cache...", progress: 45 },
       { time: 800, log: `[$] apt-get install -y ${newToolForm.command.split(' ')[0]}`, progress: 68 },
       { time: 1100, log: `[$] Downloading package source files... 1.8 MB [================] 100%`, progress: 85 },
       { time: 1400, log: "[$] Unpacking binaries and verifying GPG keys... SUCCESS", progress: 95 },
       { time: 1700, log: "[$] Application linked to SEC-CONSOLE terminal subsystem.", progress: 100 }
     ];
     
     logSteps.forEach((step) => {
       setTimeout(() => {
         setInstallLogs((prev) => [...prev, step.log]);
         setInstallProgress(step.progress);
       }, step.time);
     });
     
     setTimeout(() => {
       const newTool = {
           id: `custom_${Date.now()}`,
           name: newToolForm.name.trim(),
           description: newToolForm.description.trim() || 'Custom user installed application',
           iconBgColor: '#a855f7',
           icon: <Command size={24} />,
           isCustom: true,
           initialValues: { target: "" },
           buildCommand: (values) => {
               if (newToolForm.command.includes('{target}')) {
                   return newToolForm.command.replace('{target}', values.target || '');
               }
               return `${newToolForm.command} ${values.target || ''}`.trim();
           },
           config: {
               inputs: [
                   { name: "target", type: "text", label: "Target / Arguments", placeholder: "Optional arguments..." }
               ]
           },
           aiProcessing: { prompt: "Analyze output..." },
           processResult: (raw, ai) => ai || raw,
           enabled: true
       };

       saveCustomTools([...customTools, newTool]);
       setIsInstalling(false);
       setShowAddModal(false);
       setNewToolForm({ name: "", command: "", description: "" });
     }, 2000);
  };

  const deleteCustomTool = useCallback((toolId) => {
     saveCustomTools(customTools.filter(t => t.id !== toolId));
  }, [customTools]);

  const { allTools, groupedTools } = useMemo(() => {
    if (!toolsConfig || !toolsConfig.groups) {
      console.error("toolsConfig or toolsConfig.groups is undefined");
      return { allTools: [], groupedTools: [] };
    }

    const allToolsList = [];
    const groupedToolsList = Object.entries(toolsConfig.groups).map(
      ([groupId, group]) => {
        if (!group || !group.tools) {
          return { ...group, id: groupId, tools: [] };
        }

        const toolsWithStatus = Object.entries(group.tools).map(
          ([toolKey, tool]) => {
            if (!tool) return null;
            return {
              ...tool,
              id: tool.id ?? toolKey,
              enabled: vmStatus === "Started",
              groupId: groupId,
              groupName: group.name,
              iconBgColor: tool.iconBgColor || '#1e293b'
            };
          }
        ).filter(Boolean);

        allToolsList.push(...toolsWithStatus);
        return { ...group, id: groupId, tools: toolsWithStatus };
      }
    );

    if (customTools.length > 0) {
        const customToolsWithStatus = customTools.map(ct => ({
            ...ct,
            enabled: vmStatus === "Started",
            groupId: "customTools",
            groupName: "Custom Tools"
        }));
        
        allToolsList.push(...customToolsWithStatus);
        groupedToolsList.push({
            id: "customTools",
            name: "Custom Tools",
            tools: customToolsWithStatus
        });
    }

    return { allTools: allToolsList, groupedTools: groupedToolsList };
  }, [vmStatus, customTools]);

  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        tool.name.toLowerCase().includes(searchLower) ||
        (tool.description && tool.description.toLowerCase().includes(searchLower)) ||
        (tool.info?.description && tool.info.description.toLowerCase().includes(searchLower));

      const matchesGroup =
        activeGroup === "all" || tool.groupId === activeGroup;

      return matchesSearch && matchesGroup;
    });
  }, [allTools, searchTerm, activeGroup]);

  const handleToolClick = useCallback(
    (tool) => {
      if (!tool.enabled) return;
      
      if (tool.isInfoOnly) {
        setOpenPhishingToolId(openPhishingToolId === tool.id ? null : tool.id);
      } else {
        if (!tool.id) return;
        try {
          openWindow({
            type: WINDOW_TYPES.TOOL,
            toolId: tool.id,
            title: tool.name,
            initialSize: {
              width: tool.windowWidth || 800,
              height: tool.windowHeight || 600,
            },
          });
        } catch (error) {
          console.error("Error opening tool window:", error);
        }
      }
    },
    [openWindow, WINDOW_TYPES, openPhishingToolId]
  );

  const handleClosePhishingTool = useCallback(() => {
    setOpenPhishingToolId(null);
  }, []);

  return (
    <main className="flex-1 p-1 md:p-4 max-w-7xl mx-auto font-mono">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-slate-900 pb-5">
        <div>
          <span className="text-xs text-cyan-400 uppercase tracking-widest font-semibold block mb-1">CONSOLE BINARIES</span>
          <h1 className="text-3xl font-black text-white tracking-tight">
            SYSTEM_APPLICATIONS
          </h1>

        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-cyan-500/50" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="dark-input pl-9 pr-9 text-xs placeholder-slate-600 focus:border-cyan-500/40"
            placeholder=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-500 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tab List */}
      <div
        className="flex space-x-2 overflow-x-auto pb-4 mb-6 border-b border-slate-900 scrollbar-none"
        role="tablist"
      >
        <button
          onClick={() => setActiveGroup("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
            activeGroup === "all"
              ? "bg-cyan-500/10 text-[#00f0ff] border-cyan-500/30"
              : "bg-slate-900/40 border-slate-800/80 text-gray-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          ALL MODULES
        </button>
        {groupedTools.map((group) => (
          <button
            key={`group-${group.id}`}
            onClick={() => setActiveGroup(group.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
              activeGroup === group.id
                ? "bg-cyan-500/10 text-[#00f0ff] border-cyan-500/30"
                : "bg-slate-900/40 border-slate-800/80 text-gray-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            {group.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* App Grid */}
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4"
        role="grid"
      >
        {filteredTools.map((tool) => {
          if (tool.isInfoOnly && openPhishingToolId === tool.id) {
            return (
              <motion.div
                key={`tool-card-${tool.id}`}
                className="col-span-2 md:col-span-3 lg:col-span-3 row-span-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
              >
                <div className="bg-slate-950/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden h-full relative p-1">
                  <button 
                    onClick={handleClosePhishingTool}
                    className="absolute top-4 right-4 p-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-lg text-gray-400 hover:text-white transition-colors z-20 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                  <PhishingToolCard tool={tool} onClose={handleClosePhishingTool} />
                </div>
              </motion.div>
            );
          } else {
            return (
              <AppIcon
                key={`tool-${tool.id}`}
                tool={tool}
                isCustom={tool.isCustom}
                onDelete={deleteCustomTool}
                onClick={() => handleToolClick(tool)}
              />
            );
          }
        })}
      </motion.div>

      {/* Add Custom Tool Modal */}
      <AnimatePresence>
          {showAddModal && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              >
                  <motion.div 
                    initial={{ scale: 0.95, y: 15 }} 
                    animate={{ scale: 1, y: 0 }} 
                    exit={{ scale: 0.95, y: 15 }} 
                    className="bg-slate-950 border border-cyan-500/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                  >
                      {/* Scanline Overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30"></div>

                      <div className="bg-slate-900/60 px-5 py-4 border-b border-slate-900 flex items-center justify-between z-10 relative">
                          <h2 className="text-sm font-bold text-[#00f0ff] flex items-center gap-2 uppercase tracking-wide">
                            <Settings size={16}/> Package Deployment Wizard
                          </h2>
                          {!isInstalling && (
                            <button 
                              onClick={() => setShowAddModal(false)} 
                              className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                            >
                              <X size={18}/>
                            </button>
                          )}
                      </div>

                      {isInstalling ? (
                        /* Simulated Installer Logging View */
                        <div className="p-5 space-y-4">
                          <div className="bg-[#02050a] border border-cyan-500/10 p-4 rounded-xl font-mono text-[10px] text-green-400 h-56 overflow-y-auto flex flex-col justify-between shadow-inner">
                            <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-none">
                              {installLogs.map((log, index) => (
                                <div key={index} className="leading-relaxed whitespace-pre-wrap">{log}</div>
                              ))}
                              <div className="flex items-center gap-1 text-cyan-400 mt-2">
                                <Loader size={10} className="animate-spin" />
                                <span>deploying...</span>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-900/50">
                              <div className="flex justify-between mb-1 text-[9px] text-gray-500">
                                <span>RESOLVING TARGET DEPENDENCIES</span>
                                <span>{installProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 transition-all duration-300 shadow-[0_0_6px_#39ff14]" 
                                  style={{ width: `${installProgress}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-500 text-center uppercase tracking-wider">Please do not close this gateway connection...</p>
                        </div>
                      ) : (
                        /* Standard Form Input View */
                        <form onSubmit={handleAddCustomTool} className="p-5 space-y-4 z-10 relative">
                          <div>
                              <div className="text-[10px] text-amber-400 mb-4 bg-amber-950/20 p-3 rounded-lg border border-amber-500/25 leading-relaxed">
                                WARNING: Verify this binary dependency is installed inside the virtual workspace context via <code className="text-amber-200 bg-black/40 px-1 py-0.5 rounded font-bold">apt-get install</code> before binding a shortcut node.
                              </div>
                              
                              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Application Name</label>
                              <input 
                                required 
                                value={newToolForm.name} 
                                onChange={e => setNewToolForm({...newToolForm, name: e.target.value})} 
                                type="text" 
                                placeholder="e.g. Hashcat Tool" 
                                className="dark-input text-xs"
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Target Terminal Command</label>
                              <input 
                                required 
                                value={newToolForm.command} 
                                onChange={e => setNewToolForm({...newToolForm, command: e.target.value})} 
                                type="text" 
                                placeholder="e.g. hashcat -m 0" 
                                className="dark-input text-xs font-mono"
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Functional Summary</label>
                              <input 
                                value={newToolForm.description} 
                                onChange={e => setNewToolForm({...newToolForm, description: e.target.value})} 
                                type="text" 
                                placeholder="Offline graphics card GPU password recovery" 
                                className="dark-input text-xs"
                              />
                          </div>
                          
                          <div className="flex justify-end gap-2 pt-4 border-t border-slate-900">
                              <button 
                                type="button" 
                                onClick={() => setShowAddModal(false)} 
                                className="px-4 py-2 hover:bg-slate-900 text-gray-450 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                CANCEL
                              </button>
                              <button 
                                type="submit" 
                                className="px-5 py-2.5 bg-[#00f0ff] hover:bg-cyan-400 text-black font-bold rounded-lg shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/30 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                  <Terminal size={12}/> DEPLOY_PACKAGE
                              </button>
                          </div>
                        </form>
                      )}
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredTools.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-8 max-w-md"
          >
            <Info size={40} className="mx-auto mb-4 text-cyan-500/60" />
            <h3 className="text-md font-bold text-white mb-2 uppercase tracking-wide">
              No laboratory modules found
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed font-mono">
              Try adjusting the search credentials or select a different classification group.
            </p>
          </motion.div>
        </div>
      )}

      {/* VM Status Warning Banner */}
      {vmStatus !== "Started" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-16 left-1/2 transform -translate-x-1/2 w-11/12 max-w-sm z-40 bg-amber-950/90 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between"
          role="alert"
        >
          <div className="flex items-center">
            <Info size={16} className="mr-2.5 text-amber-400 shrink-0" />
            <span className="text-xs leading-normal">
              SECURE WORKSPACE WARNING: Power sandbox lab instance to run binaries.
            </span>
          </div>
        </motion.div>
      )}
    </main>
  );
}
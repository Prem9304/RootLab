"use client";

import { useState, useEffect, useContext } from "react";
import { Shield, Activity, Bot, Home, X, RefreshCw, Cpu, Database, ChevronLeft, ChevronRight, Play, Info, FileText } from "lucide-react";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { VMContext } from "../contexts/VMContext";

export default function Sidebar({ isOpen, toggleSidebar, closeSidebar }) {
  const { vmStatus, startVM, stopVM, isActionInProgress } = useContext(VMContext);
  const [user, setUser] = useState(null);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [showAuthTooltip, setShowAuthTooltip] = useState(false);
  const [simulatedUsage, setSimulatedUsage] = useState({ cpu: 0, ram: 0 });
  const pathname = usePathname();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  // Simulate subtle CPU & RAM usage updates when VM is active
  useEffect(() => {
    if (vmStatus !== "Started") {
      setSimulatedUsage({ cpu: 0, ram: 0 });
      return;
    }

    setSimulatedUsage({ cpu: 14, ram: 28 });
    const interval = setInterval(() => {
      setSimulatedUsage({
        cpu: Math.floor(Math.random() * 15) + 8, // 8% - 22%
        ram: Math.floor(Math.random() * 5) + 26,  // 26% - 30%
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [vmStatus]);

  const isLoggedIn = user && !user.isAnonymous;
  const KakLinkActive = !isLoggedIn || isActionInProgress || vmStatus === "Starting...";

  const isActive = (href) => pathname === href;

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      closeSidebar();
    }
  };

  const getStatusColorClass = () => {
    switch (vmStatus) {
      case "Started":
        return "bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]";
      case "Starting...":
      case "Stopping...":
      case "Loading...":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
      case "Stopped":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return vmStatus.startsWith("Error")
          ? "bg-red-600/20 text-red-400 border border-red-600/40"
          : "bg-gray-600/20 text-gray-400 border border-gray-600/40";
    }
  };

  const getStatusPulseClass = () => {
    switch (vmStatus) {
      case "Started":
        return "bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]";
      case "Starting...":
      case "Stopping...":
      case "Loading...":
        return "bg-amber-400 animate-spin";
      case "Stopped":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const SidebarLink = ({ href, icon: Icon, label }) => {
    const active = isActive(href);
    return (
      <li className="relative group/nav list-none">
        <Link 
          href={href} 
          onClick={handleLinkClick}
          className={`
            flex items-center rounded-xl transition-all border font-mono text-sm cursor-pointer
            ${isOpen 
              ? 'py-2.5 px-3 justify-start' 
              : 'py-3 justify-center w-11 h-11 mx-auto'
            }
            ${active 
              ? 'bg-cyan-500/15 border-cyan-500/30 text-[#00f0ff] font-semibold shadow-[0_0_12px_rgba(0,240,255,0.1)]' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/5'
            }
          `}
        >
          <Icon 
            size={isOpen ? 16 : 20} 
            className={`
              ${isOpen ? 'mr-3' : ''} 
              ${active ? 'text-[#00f0ff] drop-shadow-[0_0_6px_rgba(0,240,255,0.4)]' : 'text-gray-500'}
            `} 
          />
          {isOpen && <span>{label}</span>}
        </Link>
        
        {!isOpen && (
          <div className="absolute left-[70px] top-1/2 -translate-y-1/2 px-3 py-1 bg-black/95 border border-white/10 rounded-lg text-xs font-mono text-white pointer-events-none opacity-0 scale-90 group-hover/nav:opacity-100 group-hover/nav:scale-100 transition-all duration-150 origin-left shadow-lg z-50 whitespace-nowrap">
            {label}
          </div>
        )}
      </li>
    );
  };

  return (
    <aside 
      className={`
        fixed left-0 flex flex-col z-40
        top-[var(--header-height)]
        h-[calc(100vh-var(--header-height))]
        transition-all duration-300 ease-in-out
        bg-black/70 backdrop-blur-2xl
        shadow-[5px_0_25px_rgba(0,0,0,0.5)]
        border border-white/10
        
        md:my-4 md:ml-4
        md:top-[calc(var(--header-height)+16px)]
        md:h-[calc(100vh-var(--header-height)-32px)]
        md:rounded-2xl
        md:shadow-[0_16px_48px_rgba(0,0,0,0.85)]
        
        ${isOpen 
          ? 'w-72 translate-x-0 p-5' 
          : 'w-[76px] -translate-x-full md:translate-x-0 py-5 px-3'
        }
      `}
    >
      {/* Mobile Close Button & Desktop Title */}
      <div className={`flex items-center justify-between mb-6 md:mb-8 md:mt-2 ${isOpen ? "" : "justify-center"}`}>
        {isOpen ? (
          <div className="flex items-center">
            <Shield size={22} className="text-[#00f0ff] mr-2.5 drop-shadow-[0_0_6px_rgba(0,240,255,0.4)]" />
            <h2 className="text-lg font-bold text-white tracking-wide font-mono">SEC-CONSOLE</h2>
          </div>
        ) : (
          <div className="flex items-center justify-center" title="Security Console">
            <Shield size={24} className="text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] animate-pulse" />
          </div>
        )}
        
        {/* Mobile close button */}
        {isOpen && (
          <button 
            onClick={closeSidebar} 
            className="md:hidden p-1.5 text-gray-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-cyan-500/30 rounded-lg cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* VM Status Widget */}
      {isOpen ? (
        <div className="p-4 mb-6 bg-slate-900/40 rounded-xl border border-cyan-500/10 shadow-inner relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-full -mr-6 -mt-6 pointer-events-none"></div>
          
          <h3 className="text-cyan-400 font-bold mb-3.5 text-xs uppercase tracking-widest font-mono flex items-center justify-between">
            <span>Sandbox Labs</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50"></span>
          </h3>

          {vmStatus === "Started" ? (
            <button
              onClick={stopVM}
              disabled={isActionInProgress}
              className={`w-full mb-4 py-2.5 px-4 rounded-lg font-bold text-sm transition-all border shadow-[0_4px_10px_rgba(0,0,0,0.3)] cursor-pointer ${
                isActionInProgress
                  ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-red-950/50 hover:bg-red-900/80 border-red-700/50 hover:border-red-500 text-red-200 active:scale-[0.98]'
              }`}
            >
              <span className="mr-2 inline-block w-2.5 h-2.5 rounded-full bg-red-400"></span>
              {isActionInProgress ? 'Stopping VM...' : 'Shut Down Lab'}
            </button>
          ) : (
            <div
              className="relative"
              onMouseEnter={() => !isLoggedIn && setShowAuthTooltip(true)}
              onMouseLeave={() => setShowAuthTooltip(false)}
            >
              <button
                onClick={startVM}
                disabled={KakLinkActive}
                className={`w-full mb-4 py-2.5 px-4 rounded-lg font-bold text-sm transition-all border shadow-[0_4px_12px_rgba(0,240,255,0.1)] cursor-pointer ${
                  KakLinkActive
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-cyan-950/60 hover:bg-cyan-900 border-cyan-700/60 hover:border-cyan-400 text-cyan-200 active:scale-[0.98]'
                }`}
              >
                <span className={`mr-2 inline-block w-2.5 h-2.5 rounded-full ${isActionInProgress || vmStatus === 'Starting...' ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'}`}></span>
                {isActionInProgress || vmStatus === "Starting..." ? 'Initializing...' : 'Launch Lab Sandbox'}
              </button>
              {showAuthTooltip && !isLoggedIn && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-950 text-white text-xs rounded border border-[#00f0ff]/30 shadow-2xl z-50 w-max">
                  Login required to access lab instances
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm mb-3">
            <span className="font-medium text-gray-400 font-mono text-xs">VM STATUS</span>
            <div className="relative">
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold flex items-center gap-1.5 ${getStatusColorClass()}`}
                onMouseEnter={() => setShowStatusTooltip(true)}
                onMouseLeave={() => setShowStatusTooltip(false)}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusPulseClass()}`}></span>
                {vmStatus}
                {(vmStatus === "Starting..." || vmStatus === "Stopping..." || vmStatus === "Loading...") && (
                  <RefreshCw size={10} className="animate-spin text-amber-400" />
                )}
              </span>
              {showStatusTooltip && (
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-950 text-white text-xs rounded border border-cyan-500/20 shadow-2xl z-50 w-44 text-center">
                  <p className="text-gray-300 font-mono leading-relaxed">
                    {vmStatus === "Started" && "Interactive VM sandbox is active and running."}
                    {vmStatus === "Stopped" && "VM is offline. Start it to run security tools."}
                    {vmStatus.includes("...") && "System operations in progress..."}
                    {vmStatus.startsWith("Error") && "Lab container encounterd an error."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Live VM Simulated Statistics */}
          {vmStatus === "Started" && (
            <div className="pt-3.5 border-t border-cyan-500/10 space-y-2.5">
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                  <span className="flex items-center gap-1"><Cpu size={10} className="text-[#00f0ff]" /> CPU load</span>
                  <span>{simulatedUsage.cpu}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1">
                  <div 
                    className="bg-cyan-500 h-1 rounded-full transition-all duration-1000 shadow-[0_0_4px_#00f0ff]"
                    style={{ width: `${(simulatedUsage.cpu / 22) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                  <span className="flex items-center gap-1"><Database size={10} className="text-[#a855f7]" /> RAM allocation</span>
                  <span>{simulatedUsage.ram}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1">
                  <div 
                    className="bg-purple-500 h-1 rounded-full transition-all duration-1000 shadow-[0_0_4px_#a855f7]"
                    style={{ width: `${(simulatedUsage.ram / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Collapsed VM controller button with detailed hover card */
        <div className="relative group/vm mb-6 flex justify-center">
          <button
            onClick={vmStatus === "Started" ? stopVM : startVM}
            disabled={isActionInProgress || (!isLoggedIn && vmStatus !== "Started")}
            className={`
              w-11 h-11 rounded-xl border flex items-center justify-center cursor-pointer transition-all duration-300 relative z-30
              ${vmStatus === "Started"
                ? "bg-green-500/15 border-green-500/30 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.2)] hover:bg-red-950/40 hover:border-red-500/30 hover:text-red-400"
                : vmStatus.startsWith("Starting") || vmStatus.startsWith("Stopping") || vmStatus === "Loading..."
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-slate-900/60 border-cyan-500/10 text-gray-400 hover:border-cyan-500/40 hover:text-cyan-300"
              }
            `}
          >
            {isActionInProgress || vmStatus === "Starting..." || vmStatus === "Stopping..." || vmStatus === "Loading..." ? (
              <RefreshCw size={18} className="animate-spin text-amber-400" />
            ) : vmStatus === "Started" ? (
              <Cpu size={18} className="animate-pulse" />
            ) : (
              <Play size={16} fill="currentColor" className="translate-x-0.5" />
            )}
          </button>
          
          {/* Detailed hover card popover */}
          <div className="absolute left-[70px] top-0 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-50 pointer-events-none group-hover/vm:pointer-events-auto opacity-0 scale-95 group-hover/vm:opacity-100 group-hover/vm:scale-100 transition-all duration-200 origin-left flex flex-col gap-3">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-full pointer-events-none"></div>
            
            <h4 className="text-cyan-400 font-bold text-xs uppercase tracking-widest font-mono flex items-center justify-between">
              <span>Sandbox Labs</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50"></span>
            </h4>
            
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2 font-mono">
              <span className="text-gray-400">VM STATUS</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusColorClass()}`}>
                {vmStatus}
              </span>
            </div>
            
            {/* Action buttons inside popover */}
            {vmStatus === "Started" ? (
              <button
                onClick={(e) => { e.stopPropagation(); stopVM(); }}
                disabled={isActionInProgress}
                className="w-full py-2 px-3 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-700/50 hover:border-red-500 text-red-200 text-xs font-mono cursor-pointer font-bold transition-colors text-center"
              >
                {isActionInProgress ? 'Stopping VM...' : 'Shut Down Lab'}
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); startVM(); }}
                disabled={KakLinkActive}
                className="w-full py-2 px-3 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/60 hover:border-cyan-400 text-cyan-200 text-xs font-mono cursor-pointer font-bold transition-colors text-center"
              >
                {isActionInProgress || vmStatus === "Starting..." ? 'Initializing...' : 'Launch Lab Sandbox'}
              </button>
            )}

            {!isLoggedIn && vmStatus !== "Started" && (
              <div className="text-[10px] text-amber-400/80 border-t border-white/5 pt-2 font-mono flex items-center gap-1.5">
                <Info size={10} />
                <span>Login required to start sandbox.</span>
              </div>
            )}
            
            {/* VM load meters in popover */}
            {vmStatus === "Started" && (
              <div className="space-y-2 text-[10px] font-mono pt-1">
                <div>
                  <div className="flex justify-between text-gray-400 mb-1">
                    <span>CPU load</span>
                    <span>{simulatedUsage.cpu}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1">
                    <div className="bg-cyan-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${(simulatedUsage.cpu / 22) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-gray-400 mb-1">
                    <span>RAM allocation</span>
                    <span>{simulatedUsage.ram}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1">
                    <div className="bg-purple-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${(simulatedUsage.ram / 30) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scrollable links list */}
      <div className="relative flex-1 overflow-hidden flex flex-col group/scroll">
        {/* Top Fade Overlay */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black via-black/40 to-transparent pointer-events-none z-10 opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300" />

        <nav className="mb-6 flex-1 overflow-y-auto pr-1">
          {isOpen && (
            <h3 className="text-gray-400 font-bold mb-3 text-xs uppercase tracking-widest px-2 font-mono">
              Terminal Links
            </h3>
          )}
          <ul className="space-y-1.5 p-0 m-0">
            <SidebarLink href="/" icon={Home} label="Dashboard" />
            <SidebarLink href="/tools" icon={Activity} label="Security Tools" />
            <SidebarLink href="/reports" icon={FileText} label="Reports" />
            
            {/* Desktop Toggle Button inside navigation */}
            <li className="hidden md:block relative group/nav list-none pt-2 border-t border-white/5 mt-2">
              <button 
                onClick={toggleSidebar}
                className={`
                  flex items-center rounded-xl transition-all border font-mono text-sm cursor-pointer w-full
                  ${isOpen 
                    ? 'py-2.5 px-3 justify-start' 
                    : 'py-3 justify-center w-11 h-11 mx-auto'
                  }
                  border-transparent text-gray-500 hover:text-cyan-400 hover:bg-cyan-950/20 hover:border-cyan-500/20
                `}
              >
                {isOpen ? (
                  <>
                    <ChevronLeft size={16} className="mr-3" />
                    <span>Collapse Console</span>
                  </>
                ) : (
                  <ChevronRight size={20} />
                )}
              </button>
              
              {!isOpen && (
                <div className="absolute left-[70px] top-1/2 -translate-y-1/2 px-3 py-1 bg-black/95 border border-white/10 rounded-lg text-xs font-mono text-white pointer-events-none opacity-0 scale-90 group-hover/nav:opacity-100 group-hover/nav:scale-100 transition-all duration-150 origin-left shadow-lg z-50 whitespace-nowrap">
                  Expand Sidebar
                </div>
              )}
            </li>
          </ul>
        </nav>

        {/* Bottom Fade Overlay */}
        <div className="absolute bottom-6 left-0 right-0 h-6 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-10 opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Console details */}
      <div className="text-[10px] text-gray-500 text-center font-mono border-t border-slate-900 pt-3 flex items-center justify-center">
        {isOpen ? (
          "SECURE LINK: PORT 443 | v0.1.0"
        ) : (
          <span 
            className="cursor-help hover:text-cyan-400 transition-colors"
            title="SECURE LINK: PORT 443 | v0.1.0"
          >
            v0.1
          </span>
        )}
      </div>
    </aside>
  );
}
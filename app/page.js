'use client';

import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInAnonymously,
    signInWithCustomToken
} from 'firebase/auth';
import { Bot, ArrowRight, ShieldAlert, Cpu, ShieldCheck, Activity, Globe, Lock } from 'lucide-react';
import EthicalHackingStages from './components/EthicalHackingStages';
import Typewriter from './components/Typewriter';
import { VMContext } from './contexts/VMContext';

export const firebaseConfig = {
  apiKey: "AIzaSyAbx1md1JwRdCFJlujCiyQUXl6F0trLw8M",
  authDomain: "rootlab-6a0d3.firebaseapp.com",
  projectId: "rootlab-6a0d3",
  storageBucket: "rootlab-6a0d3.firebasestorage.app",
  messagingSenderId: "925721491531",
  appId: "1:925721491531:web:6396834acf4d4ba6ae75ce",
  measurementId: "G-0E52TRLEXK"
};

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Simple Placeholder Components ---
function SplashScreen({ onFinished }) {
    useEffect(() => {
        const timer = setTimeout(() => onFinished(), 1500);
        return () => clearTimeout(timer);
    }, [onFinished]);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#030712] text-white font-mono relative overflow-hidden crt-overlay">
        <div className="cyber-grid-bg"></div>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center z-10"
        >
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Cpu size={32} className="text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-widest mb-2">ROOT<span className="text-[#00f0ff] text-glow-cyan">LAB</span></h1>
          <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mx-auto mt-4">
            <div className="h-full bg-cyan-500 animate-pulse-horizontal rounded-full" />
          </div>
          <p className="text-xs text-gray-500 mt-3 uppercase tracking-wider">Establishing secure link...</p>
        </motion.div>
      </div>
    );
}

// --- Authentication Component ---
function AuthComponent() {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message.replace("Firebase:", ""));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#030712] font-mono px-4 relative overflow-hidden crt-overlay">
            <div className="cyber-grid-bg"></div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full max-w-md p-8 glass-panel rounded-2xl relative z-10"
            >
                <div className="flex items-center justify-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                    <ShieldAlert size={24} className="text-[#00f0ff]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-wide">
                      {isLoginMode ? 'GATEWAY ACCESS' : 'CREATE PROTOCOL'}
                    </h1>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">RootLab Auth Node</p>
                  </div>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">OPERATOR EMAIL</label>
                        <input
                            id="email" 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required
                            className="w-full bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] rounded-lg p-3 text-white text-sm outline-none transition-all"
                            placeholder="operator@rootlab.net"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ACCESS PIN / PASSWORD</label>
                        <input
                            id="password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                            className="w-full bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] rounded-lg p-3 text-white text-sm outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-xs text-red-400 text-center bg-red-950/20 border border-red-500/30 p-2.5 rounded-lg font-mono uppercase tracking-tight"
                      >
                        [ERR: {error}]
                      </motion.div>
                    )}

                    <div>
                        <button 
                          type="submit" 
                          disabled={loading} 
                          className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-bold text-black bg-[#00f0ff] hover:bg-cyan-400 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,240,255,0.25)] hover:shadow-[0_4px_25px_rgba(0,240,255,0.4)] disabled:bg-cyan-800 disabled:text-cyan-950 disabled:shadow-none"
                        >
                            {loading ? 'CONNECTING...' : (isLoginMode ? 'INITIALIZE LINK' : 'REGISTER PROFILE')}
                        </button>
                    </div>
                </form>
                
                <div className="mt-6 pt-5 border-t border-slate-900 text-center">
                  <p className="text-xs text-gray-500 font-mono">
                      {isLoginMode ? "Need authorization credentials?" : 'Already authorized for terminal access?'}
                      <button 
                        onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} 
                        className="ml-2 font-bold text-[#00f0ff] hover:underline cursor-pointer"
                      >
                          {isLoginMode ? 'Sign Up' : 'Login'}
                      </button>
                  </p>
                </div>
            </motion.div>
        </div>
    );
}

// --- Main Page Component ---
export default function HomePage() {
    const { vmStatus, startVM } = useContext(VMContext);
    const [user, setUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [showSplash, setShowSplash] = useState(false);
    const [aiIntroText, setAiIntroText] = useState("");
    const [isAiTextLoading, setIsAiTextLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [liveStats, setLiveStats] = useState({
      cpu: 0,
      mem: 0,
      rx: 0,
      tx: 0,
      status: 'offline'
    });

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const splashShown = localStorage.getItem('splashScreenShown');
            if (!splashShown) {
                setShowSplash(true);
                localStorage.setItem('splashScreenShown', 'true');
            }
        }
        
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthReady(true);
        });

        if (initialAuthToken) {
            signInWithCustomToken(auth, initialAuthToken).catch(() => signInAnonymously(auth));
        } else if (!auth.currentUser) {
            signInAnonymously(auth);
        }

        return () => unsubscribe();
    }, []);

    // Poll live system stats from docker container
    useEffect(() => {
      let interval;
      if (user && !user.isAnonymous && vmStatus === 'Started') {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/system/stats');
                if (res.ok) {
                    const data = await res.json();
                    setLiveStats({
                       cpu: data.container ? parseFloat(data.container.cpuPercent) : 0,
                       mem: data.container ? parseFloat(data.container.memPercent) : 0,
                       rx: data.container ? data.container.rxBytes : 0,
                       tx: data.container ? data.container.txBytes : 0,
                       status: data.status
                    });
                }
            } catch (e) {
               console.error("Stats polling error", e);
            }
        };
        fetchStats();
        interval = setInterval(fetchStats, 2000);
      } else {
        setLiveStats(prev => ({ ...prev, status: vmStatus === 'Started' ? 'running' : 'offline', cpu: 0, mem: 0, rx: 0, tx: 0 }));
      }
      return () => clearInterval(interval);
    }, [user, vmStatus]);

    useEffect(() => {
        if (!showSplash && authReady && user) {
            setIsAiTextLoading(true);
            const fetchAiIntro = async () => {
                try {
                    const prompt = `Generate a cool and engaging introductory paragraph (around 50-70 words) for the RootLab platform's homepage. RootLab provides a safe virtual environment with tools like Nmap and a Kali Linux terminal for cybersecurity practice and ethical hacking. Mention the focus on hands-on learning and security exploration. Use a slightly technical but exciting tone suitable for security enthusiasts. Start directly with the introduction, no greetings needed.`;
                    const res = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
                    });
                    if (!res.ok) throw new Error(`AI server responded with status ${res.status}`);
                    const data = await res.json();
                    setAiIntroText(data.content || "Welcome to RootLab - explore responsibly.");
                } catch (error) {
                    console.error("Failed to fetch AI intro, using fallback:", error);
                    setAiError(null);
                    setAiIntroText("RootLab provides a comprehensive cybersecurity learning platform with virtual labs, industry-standard tools like Nmap and Kali Linux terminals, and hands-on training environments. Master ethical hacking techniques safely while building real-world security expertise.");
                } finally {
                    setIsAiTextLoading(false);
                }
            };
            fetchAiIntro();
        }
    }, [showSplash, authReady, user]);

    if (showSplash) {
        return <SplashScreen onFinished={() => setShowSplash(false)} />;
    }

    if (!authReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#030712] text-white font-mono crt-overlay">
              <div className="cyber-grid-bg"></div>
              <div className="text-center flex gap-2 items-center">
                <div className="w-2 h-5 bg-cyan-400 animate-pulse"></div>
                <span>Syncing Auth Node...</span>
              </div>
            </div>
        );
    }
    
    // User not logged in with an email, show Auth form.
    if (!user || user.isAnonymous) {
        return <AuthComponent />;
    }

    // User is logged in, show the main homepage content.
    return (
        <motion.div
            className="w-full text-white min-h-[calc(100vh-var(--header-height)-3rem)] flex flex-col font-mono"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
        >
            <div className="cyber-grid-bg"></div>

            {/* Dashboard Header Banner */}
            <header className="mb-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-cyan-500/10 pb-4">
                  <div>
                    <span className="text-xs text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-1.5 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                      SYSTEM DIRECTORY: HOME
                    </span>
                    <motion.h1
                        className="text-3xl md:text-5xl font-black tracking-tight"
                        initial={{ y: -10, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        transition={{ duration: 0.4 }}
                    >
                        ROOT<span className="text-[#00f0ff] text-glow-cyan">LAB</span>_OPS
                    </motion.h1>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2 md:mt-0 font-mono select-none">
                    OPERATOR: {user.email}
                  </div>
                </div>
            </header>



            {/* Offline VM Hero Gate */}
            {vmStatus !== "Started" && (
              <motion.section 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-8 relative z-10 p-6 rounded-xl border border-amber-500/30 bg-amber-950/10 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.05)]"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <ShieldAlert className="text-amber-400 animate-bounce" size={24} />
                    </div>
                    <div>
                      <h3 className="text-md font-bold text-amber-200">KALI INSTANCE OFFLINE</h3>
                      <p className="text-xs text-gray-400 mt-1">Initialize the virtual lab environment in the sidebar or below to access applications and command lines.</p>
                    </div>
                  </div>
                  <button 
                    onClick={startVM}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-lg shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Power Sandbox</span> <ArrowRight size={14} />
                  </button>
                </div>
              </motion.section>
            )}

            {/* Intelligence Briefing */}
            <section className="mb-8 relative z-10 glass-panel rounded-xl p-5 md:p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500"></div>
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
                    <div className="flex-1">
                        <h2 className="text-md font-bold text-[#00f0ff] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Bot size={18} /> intelligence_briefing.log
                        </h2>
                        <div className="text-gray-300 text-sm md:text-base leading-relaxed min-h-[60px] max-w-4xl">
                            {isAiTextLoading ? (
                                <span className="flex items-center gap-2 text-cyan-500/70"><div className="w-2 h-4 bg-cyan-400 animate-pulse"></div> Generating platform intelligence...</span>
                            ) : aiError ? (
                                <span className="text-yellow-400">{aiError}</span>
                            ) : (
                                <Typewriter 
                                    text={aiIntroText} 
                                    speed={20}
                                    className="text-gray-300"
                                    startDelay={400}
                                    cursorColor="bg-[#00f0ff]"
                                />
                            )}
                        </div>
                    </div>
                    <div className="w-32 h-32 md:w-56 md:h-56 lg:w-64 lg:h-64 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity hidden sm:block -my-8 mr-4 mix-blend-screen">
                        
                    </div>
                </div>
            </section>

            {/* Hacking Lifecycle Stages */}
            <section className="mb-10 relative z-10">
                <div className="text-center mb-6 max-w-2xl mx-auto">
                  <h2 className="text-xl md:text-2xl font-bold mb-2 tracking-wide uppercase">Tactical Hacking Phase-Map</h2>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Select a core security lifecycle component to fetch threat database details and associate native laboratory application modules.
                  </p>
                </div>
                <EthicalHackingStages />
            </section>


        </motion.div>
    );
}

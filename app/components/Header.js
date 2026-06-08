"use client";

import { useState, useEffect } from "react";
import { TerminalSquare, Clock, LogOut, BookOpen, Target, Trophy, Menu } from "lucide-react";
import Link from "next/link";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../page.js";

export default function Header({ toggleSidebar }) {
  const [currentTime, setCurrentTime] = useState("");
  const [user, setUser] = useState(null);
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const updateTime = () => {
      try {
        setCurrentTime(
          new Date().toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch (e) {
        setCurrentTime(
          new Date().toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="h-[var(--header-height)] mx-4 mt-4 rounded-2xl glass-panel py-3 px-4 md:px-6 flex items-center justify-between z-30 fixed top-0 left-0 right-0 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2">
        {user && !user.isAnonymous && (
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10 cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <Link href="/" className="flex items-center space-x-3 cursor-pointer group">
          <div className="text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] group-hover:animate-pulse">
            <TerminalSquare size={26} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white font-mono">
            ROOT<span className="text-[#00f0ff] text-glow-cyan">LAB</span>
          </h1>
        </Link>
      </div>

      <div className="flex items-center space-x-3 md:space-x-6">
        {/* Navigation Links */}
       

        <div className="flex items-center gap-2 text-xs md:text-sm text-cyan-400 font-mono bg-black/40 border border-white/10 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.05)]">
          <Clock size={14} className="text-[#00f0ff]" />
          <span>{currentTime || "..."}</span>
        </div>

        {user && !user.isAnonymous && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs md:text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-3 py-1.5 rounded-md transition-all font-mono cursor-pointer"
            aria-label="Logout"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}

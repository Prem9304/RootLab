// components/SplashScreen.js
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TerminalSquare } from 'lucide-react'; // Or your preferred logo icon

export default function SplashScreen({ onFinished }) {
  const [exitAnimation, setExitAnimation] = useState(false);

  useEffect(() => {
    // Wait for a few seconds, then trigger exit animation
    const timer = setTimeout(() => {
      setExitAnimation(true);
    }, 2500); // Adjust duration as needed (e.g., 2.5 seconds)

    // After exit animation completes, call onFinished
    const finishTimer = setTimeout(() => {
        onFinished();
    }, 3300); // Should be duration + exit animation time (2500 + 800ms)

    return () => {
        clearTimeout(timer);
        clearTimeout(finishTimer);
    }; // Cleanup timers
  }, [onFinished]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#081A2C]"
      initial={{ opacity: 1 }}
      animate={exitAnimation ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 100 }}
      >
        <TerminalSquare size={80} strokeWidth={2} className="text-[#00ADEE]" />
      </motion.div>

      {/* Text */}
      <motion.h1
        className="mt-6 text-4xl font-bold text-white"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        Hack<span className="text-[#00ADEE]">Hive</span>
      </motion.h1>

      {/* Loading/Welcome Message */}
      <motion.p
        className="mt-3 text-lg text-blue-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        Initializing Security Console...
      </motion.p>

       {/* Optional: Add a subtle loading bar or pulsing effect */}
       <motion.div
          className="absolute bottom-10 left-0 right-0 h-1 w-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
       >
           <div className="h-full bg-gradient-to-r from-transparent via-[#00ADEE]/50 to-transparent animate-pulse-horizontal"></div>
       </motion.div>

       {/* Add this to your globals.css for the animation if needed */}
       {/*
           @keyframes pulse-horizontal {
               0%, 100% { transform: translateX(-100%); }
               50% { transform: translateX(100%); }
           }
           .animate-pulse-horizontal {
               animation: pulse-horizontal 2s ease-in-out infinite;
           }
       */}

    </motion.div>
  );
}
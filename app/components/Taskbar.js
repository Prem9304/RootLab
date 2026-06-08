"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useWindowManager } from "../contexts/WindowManagerContext";
import { TerminalSquare, MessageCircle, Settings2, X } from "lucide-react";

// ─── Proximity Dock Icon Component ─────────────────────────────────────────
const DockIcon = ({ mouseX, onClick, title, isActive, isMinimized, onClose, icon }) => {
  const ref = useRef(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const scaleSync = useTransform(distance, [-120, 0, 120], [1, 1.4, 1]);
  const ySync = useTransform(distance, [-120, 0, 120], [0, -12, 0]);

  const scale = useSpring(scaleSync, { mass: 0.1, stiffness: 350, damping: 25 });
  const y = useSpring(ySync, { mass: 0.1, stiffness: 350, damping: 25 });

  return (
    <motion.div
      ref={ref}
      style={{ scale, y }}
      className="relative group flex items-center justify-center shrink-0 z-10 hover:z-20"
    >
      <button
        onClick={onClick}
        title={title}
        className={`
          relative flex items-center justify-center w-11 h-11 rounded-2xl cursor-pointer border transition-colors duration-200 shadow-sm
          ${isActive
            ? "bg-cyan-500/15 border-cyan-500/40 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.15)]"
            : isMinimized
              ? "bg-black/80 border-white/15 text-gray-400 hover:text-[#00f0ff] hover:border-cyan-500/30"
              : "bg-black/60 border-white/8 text-gray-400 hover:text-gray-200 hover:border-white/20 hover:bg-white/5"
          }
        `}
      >
        {icon && React.isValidElement(icon)
          ? React.cloneElement(icon, { size: 20 })
          : <Settings2 size={20} className="text-cyan-500" />
        }

        {isMinimized && (
          <span className="absolute inset-0 rounded-2xl border border-amber-400/40 pointer-events-none" />
        )}
      </button>

      <span className={`
        absolute -bottom-2.5 w-1 h-1 rounded-full pointer-events-none transition-all duration-300
        ${isActive   ? "bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]" : ""}
        ${isMinimized  ? "bg-amber-400/70" : ""}
        ${!isActive && !isMinimized ? "opacity-0 scale-0" : "opacity-100 scale-100"}
      `} />

      {onClose && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          title={`Close ${title}`}
          className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-slate-900 border border-slate-700 text-gray-500 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer shadow-lg z-30"
        >
          <X size={10} />
        </button>
      )}
    </motion.div>
  );
};

// ─── Main Taskbar Component ──────────────────────────────────────────────────
const Taskbar = () => {
  const {
    windows, toggleMinimizeWindow, bringToFront,
    openWindow, closeWindow, WINDOW_TYPES,
  } = useWindowManager();

  const taskbarRef = useRef(null);
  const mouseX = useMotionValue(Infinity);
  const [isDockHovered, setIsDockHovered] = useState(false);

  // Determine the highest z-index to figure out which window is truly "active"
  const maxZ = windows.reduce((m, w) => Math.max(m, w.zIndex), 0);

  const handleTaskbarClick = (id, isMinimized) => {
    if (isMinimized) toggleMinimizeWindow(id);
    else bringToFront(id);
  };

  const launchApp = (type) => {
    const existing = windows.find((w) => w.type === type);
    if (existing) {
      handleTaskbarClick(existing.id, existing.minimized);
      return;
    }
    const appConfigs = {
      [WINDOW_TYPES.TERMINAL]: { width: 700, height: 450, title: "Terminal", IconComponent: <TerminalSquare /> },
      [WINDOW_TYPES.AI_CHAT]:  { width: 500, height: 650, title: "AI Chat",  IconComponent: <MessageCircle /> },
    };
    openWindow({
      type,
      title: appConfigs[type]?.title || "Window",
      IconComponent: appConfigs[type]?.IconComponent || <Settings2 />,
      initialSize: { width: appConfigs[type]?.width || 600, height: appConfigs[type]?.height || 400 },
    });
  };

  // Define pinned apps
  const quickLaunchApps = [
    { type: WINDOW_TYPES.TERMINAL, icon: <TerminalSquare />, title: "Launch Sandbox Terminal" },
    { type: WINDOW_TYPES.AI_CHAT,  icon: <MessageCircle  />, title: "Consult Security Agent"  },
  ];

  // Filter dynamic windows so pinned apps don't duplicate on the right side
  const quickLaunchTypes = quickLaunchApps.map(app => app.type);
  const dynamicWindows = windows.filter(win => !quickLaunchTypes.includes(win.type));

  return (
    <div className="fixed bottom-3 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4">
      <motion.div
        ref={taskbarRef}
        data-taskbar="true"
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => {
          mouseX.set(Infinity);
          setIsDockHovered(false);
        }}
        onMouseEnter={() => setIsDockHovered(true)}
        animate={{
          height: isDockHovered ? 68 : 56,
          borderRadius: isDockHovered ? 24 : 18,
          paddingLeft: isDockHovered ? 20 : 16,
          paddingRight: isDockHovered ? 20 : 16,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="pointer-events-auto bg-black/90 backdrop-blur-xl border border-white/10 flex items-center gap-2 shadow-[0_12px_45px_rgba(0,0,0,0.8)] w-fit max-w-[95vw] overflow-visible select-none"
      >
        {/* ── Quick-launch section (Pinned Apps) ─────────────────────────────── */}
        {quickLaunchApps.map((app) => {
          // Check if this pinned app is currently open
          const openWin = windows.find((w) => w.type === app.type);
          const isActive = openWin && !openWin.minimized && openWin.zIndex === maxZ;
          const isMinimized = openWin ? openWin.minimized : false;

          return (
            <motion.div layout key={app.type} className="shrink-0 flex items-center justify-center">
              <DockIcon
                mouseX={mouseX}
                title={openWin ? openWin.title : app.title}
                icon={app.icon}
                onClick={() => launchApp(app.type)}
                onClose={openWin ? () => closeWindow(openWin.id) : undefined}
                isActive={isActive}
                isMinimized={isMinimized}
              />
            </motion.div>
          );
        })}

        {/* ── Separator (Only shows if there are non-pinned apps open) ───────── */}
        <AnimatePresence>
          {dynamicWindows.length > 0 && (
            <motion.div
              layout
              key="dock-separator"
              initial={{ width: 0, opacity: 0, marginLeft: 0, marginRight: 0 }}
              animate={{ width: 1, opacity: 1, marginLeft: 6, marginRight: 6 }}
              exit={{ width: 0, opacity: 0, marginLeft: 0, marginRight: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="h-8 bg-white/8 shrink-0 rounded-full"
            />
          )}
        </AnimatePresence>

        {/* ── Dynamic Windows (Unpinned Apps) ────────────────────────────────── */}
        <AnimatePresence mode="popLayout">
          {dynamicWindows.map((win) => {
            const { id, title, IconComponent, minimized } = win;
            const isActive = !minimized && win.zIndex === maxZ;

            return (
              <motion.div
                layout
                key={id}
                initial={{ scale: 0.4, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                exit={{ scale: 0.4, opacity: 0, y: 10, transition: { duration: 0.15 } }}
                className="shrink-0 flex items-center justify-center"
              >
                <DockIcon
                  mouseX={mouseX}
                  title={title}
                  icon={IconComponent}
                  onClick={() => handleTaskbarClick(id, minimized)}
                  onClose={() => closeWindow(id)}
                  isActive={isActive}
                  isMinimized={minimized}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Taskbar;
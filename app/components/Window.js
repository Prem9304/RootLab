"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import { X, Minimize2 as Minimize, Square, Maximize2 } from "lucide-react";
import { useWindowManager } from "../contexts/WindowManagerContext";
import DynamicToolForm from "./DynamicTools";
import AIChatContent from "./AIChatContent";
import AppStore from "./AppStore";
import WrkTool from "./WrkTool";
import NessusTool from "./NessusTool";
import NmapTool from "./NmapTool";
import NiktoTool from "./NiktoTool";
import WhoisTool from "./WhoisTool";
import HarvesterTool from "./HarvesterTool";
import HttpxTool from "./HttpxTool";
import KatanaTool from "./KatanaTool";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const TerminalWithNoSSR = dynamic(() => import("./Terminal"), { ssr: false });

// ─── Shared UI for Ghosts ──────────────────────────────────────────────────────
const GhostContent = ({ title }) => (
  <>
    <div style={{
      height: 40,
      background: "rgba(0,0,0,0.98)",
      borderBottom: "1px solid rgba(0,240,255,0.15)",
      display: "flex", alignItems: "center", padding: "0 12px", gap: 6,
    }}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", opacity: 0.9 }} />
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", opacity: 0.9 }} />
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840", opacity: 0.9 }} />
      {title && (
        <span style={{ color: "rgba(200,210,230,0.7)", fontSize: 12, fontFamily: "monospace", marginLeft: 8, fontWeight: 600 }}>
          {title}
        </span>
      )}
    </div>
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      {[80, 60, 90, 45, 70].map((w, i) => (
        <div key={i} style={{ height: 8, width: `${w}%`, background: "rgba(0,240,255,0.08)", borderRadius: 4 }} />
      ))}
    </div>
  </>
);

// ─── Genie ghost (Minimize) ────────────────────────────────────────────────────
const GenieGhost = ({ snapshot, fromRect, toRect, onComplete }) => {
  // Calculate exact delta distances from center points
  const fromCenterX = fromRect.left + fromRect.width / 2;
  const fromCenterY = fromRect.top + fromRect.height / 2;
  const toCenterX = toRect.x + toRect.width / 2;
  const toCenterY = toRect.y + toRect.height / 2;
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  return createPortal(
    <motion.div
      style={{
        position: "fixed", left: fromRect.left, top: fromRect.top,
        width: fromRect.width, height: fromRect.height, zIndex: 9999,
        pointerEvents: "none", transformOrigin: "center center",
        background: "linear-gradient(135deg, rgba(0,0,0,0.99) 0%, rgba(5,5,5,0.98) 100%)",
        border: "1px solid rgba(0,240,255,0.3)", overflow: "hidden",
      }}
      initial={{ opacity: 1, scale: 1, x: 0, y: 0, filter: "blur(0px)", borderRadius: "8px" }}
      animate={{ opacity: 0, scale: 0.05, x: dx, y: dy, filter: "blur(4px)", borderRadius: "40px" }}
      transition={{
        // Different spring values for X and Y create the curved "Genie" sweep
        x: { type: "spring", stiffness: 180, damping: 24 },
        y: { type: "spring", stiffness: 300, damping: 28 },
        scale: { type: "spring", stiffness: 220, damping: 25 },
        opacity: { duration: 0.15, delay: 0.25 }, // Fade out at the very end
        filter: { duration: 0.4 }
      }}
      onAnimationComplete={onComplete}
    >
      <GhostContent title={snapshot.title} />
    </motion.div>,
    document.body
  );
};

// ─── Restore ghost (Unminimize) ────────────────────────────────────────────────
const RestoreGhost = ({ fromRect, toRect, onComplete }) => {
  const fromCenterX = toRect.left + toRect.width / 2;
  const fromCenterY = toRect.top + toRect.height / 2;
  const toCenterX = fromRect.x + fromRect.width / 2;
  const toCenterY = fromRect.y + fromRect.height / 2;
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  return createPortal(
    <motion.div
      style={{
        position: "fixed", left: toRect.left, top: toRect.top,
        width: toRect.width, height: toRect.height, zIndex: 9999,
        pointerEvents: "none", transformOrigin: "center center",
        background: "linear-gradient(135deg, rgba(0,0,0,0.99) 0%, rgba(5,5,5,0.98) 100%)",
        border: "1px solid rgba(0,240,255,0.3)", overflow: "hidden",
      }}
      initial={{ opacity: 0, scale: 0.05, x: dx, y: dy, filter: "blur(4px)", borderRadius: "40px" }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0, filter: "blur(0px)", borderRadius: "8px" }}
      transition={{
        // Reversing the curve on the way up
        x: { type: "spring", stiffness: 280, damping: 26 },
        y: { type: "spring", stiffness: 180, damping: 22 },
        scale: { type: "spring", stiffness: 250, damping: 24 },
        opacity: { duration: 0.15 },
        filter: { duration: 0.3 }
      }}
      onAnimationComplete={onComplete}
    >
      <GhostContent />
    </motion.div>,
    document.body
  );
};

// ─── Main Window component ─────────────────────────────────────────────────────
const Window = ({ windowData }) => {
  const {
    closeWindow, toggleMinimizeWindow, bringToFront,
    updateWindowPosition, updateWindowSize, WINDOW_TYPES, getToolConfigById,
  } = useWindowManager();

  const { id, x, y, width, height, zIndex, minimized, title, type, toolId, IconComponent } = windowData;

  const rndRef = useRef(null);
  const windowRef = useRef(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [genieState, setGenieState] = useState(null);
  const [restoreState, setRestoreState] = useState(null);
  const prevMinimized = useRef(minimized);
  const [isVisible, setIsVisible] = useState(true);

  // ── Minimize / restore trigger ─────────────────────────────────────────────
  useEffect(() => {
    if (prevMinimized.current === minimized) return;
    prevMinimized.current = minimized;

    const getDockRect = () => {
      const el = document.querySelector(`[data-window-id="${id}"]`);
      return el ? el.getBoundingClientRect() : { x: window.innerWidth / 2, y: window.innerHeight, width: 40, height: 40 };
    };

    const getWindowRect = () => {
      if (windowRef.current) return windowRef.current.getBoundingClientRect();
      return { left: x, top: y, width, height };
    };

    if (minimized) {
      const fromRect = getWindowRect();
      const dockEl = getDockRect();
      const toRect = { x: dockEl.x, y: dockEl.y, width: dockEl.width, height: dockEl.height };
      setIsVisible(false);
      setGenieState({ fromRect, toRect, title });
    } else {
      const dockEl = getDockRect();
      const fromRect = { x: dockEl.x, y: dockEl.y, width: dockEl.width, height: dockEl.height };
      const toRect = getWindowRect();
      setRestoreState({ fromRect, toRect });
    }
  }, [minimized, id, x, y, width, height, title]);

  const handleGenieComplete = useCallback(() => setGenieState(null), []);
  const handleRestoreComplete = useCallback(() => {
    setRestoreState(null);
    setIsVisible(true);
  }, []);

  // ─── Drag / resize handlers ─────────────────────────────────────────────────
  const handleDragStart = useCallback(() => bringToFront(id), [id, bringToFront]);
  const handleDragStop = useCallback((e, d) => {
    if (!e.target.closest("button")) updateWindowPosition(id, d.x, d.y);
  }, [id, updateWindowPosition]);
  const handleResizeStart = useCallback(() => bringToFront(id), [id, bringToFront]);
  const handleResizeStop = useCallback((e, dir, ref, delta, pos) => {
    updateWindowSize(id, ref.offsetWidth, ref.offsetHeight);
    updateWindowPosition(id, pos.x, pos.y);
  }, [id, updateWindowPosition, updateWindowSize]);
  const handleWindowClick = useCallback((e) => {
    if (!e.target.closest("button")) bringToFront(id);
  }, [id, bringToFront]);

  // ─── Content & Header ───────────────────────────────────────────────────────
  const renderContent = useCallback(() => {
    switch (type) {
      case WINDOW_TYPES.AI_CHAT: return <AIChatContent windowId={id} />;
      case WINDOW_TYPES.TERMINAL: return <TerminalWithNoSSR windowId={id} />;
      case WINDOW_TYPES.NESSUS: return <NessusTool windowId={id} />;
      case WINDOW_TYPES.TOOL: {
        const cfg = getToolConfigById(toolId);
        if (!cfg) return <div className="p-4 text-red-400">Error: Tool config not found</div>;
        if (cfg.customComponent === 'WrkTool') return <WrkTool />;
        if (cfg.customComponent === 'NessusTool') return <NessusTool windowId={id} />;
        if (cfg.customComponent === 'NmapTool') return <NmapTool />;
        if (cfg.customComponent === 'NiktoTool') return <NiktoTool />;
        if (cfg.customComponent === 'WhoisTool') return <WhoisTool />;
        if (cfg.customComponent === 'HarvesterTool') return <HarvesterTool />;
        if (cfg.customComponent === 'HttpxTool') return <HttpxTool />;
        if (cfg.customComponent === 'KatanaTool') return <KatanaTool />;
        return <DynamicToolForm toolConfig={cfg} windowId={id} />;
      }
      default: return <div className="p-4">Unknown window type</div>;
    }
  }, [type, id, toolId, getToolConfigById, WINDOW_TYPES]);

  const renderHeader = () => (
    <div className="window-drag-handle h-10 bg-black border-b border-cyan-500/10 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none font-mono">
      <div className="flex items-center gap-2 text-xs overflow-hidden">
        {IconComponent && (
          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-[#00f0ff]">
            {React.cloneElement(IconComponent, { size: 14 })}
          </span>
        )}
        <span className="font-semibold text-slate-200 truncate tracking-wide uppercase">{title}</span>
      </div>
      <div className="flex items-center space-x-2 z-10">
        <button onClick={(e) => { e.stopPropagation(); toggleMinimizeWindow(id); }} className="w-3.5 h-3.5 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center group cursor-pointer border border-amber-600 transition-colors" title="Minimize">
          <Minimize size={8} className="opacity-0 group-hover:opacity-100 text-amber-900" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setIsMaximized(v => !v); bringToFront(id); }} className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center group cursor-pointer border border-green-600 transition-colors" title={isMaximized ? "Restore" : "Maximize"}>
          {isMaximized ? <Maximize2 size={8} className="opacity-0 group-hover:opacity-100 text-green-900" /> : <Square size={8} className="opacity-0 group-hover:opacity-100 text-green-900" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); closeWindow(id); }} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center group cursor-pointer border border-red-600 transition-colors" title="Close">
          <X size={8} className="opacity-0 group-hover:opacity-100 text-red-900" />
        </button>
      </div>
    </div>
  );

  // ─── Shared chrome (Now handled natively by Framer Motion) ──────────────────
  const windowChrome = (
    <motion.div
      ref={windowRef}
      initial={{ opacity: 0, scale: 0.85, y: 20, filter: "blur(5px)" }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.95,
        y: isVisible ? 0 : 15,
        filter: isVisible ? "blur(0px)" : "blur(3px)"
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="h-full bg-black border border-cyan-500/15 rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] window-container flex flex-col"
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
      onMouseDownCapture={() => bringToFront(id)}
    >
      {renderHeader()}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {genieState && <GenieGhost key="genie" snapshot={{ title }} fromRect={genieState.fromRect} toRect={genieState.toRect} onComplete={handleGenieComplete} />}
      </AnimatePresence>
      <AnimatePresence>
        {restoreState && <RestoreGhost key="restore" fromRect={restoreState.fromRect} toRect={restoreState.toRect} onComplete={handleRestoreComplete} />}
      </AnimatePresence>

      {isMaximized ? (
        <motion.div
          layout
          style={{ zIndex }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed top-0 bottom-[60px] left-0 right-0 bg-black border-b border-cyan-500/15 shadow-2xl overflow-hidden crt-overlay flex flex-col"
        >
          {renderHeader()}
          <div className="flex-1 overflow-hidden">{renderContent()}</div>
        </motion.div>
      ) : (
        <div style={{ position: "absolute", width: "100%", height: "100%", zIndex, pointerEvents: "none" }}>
          <Rnd
            ref={rndRef}
            style={{ pointerEvents: minimized ? "none" : "auto" }}
            position={{ x, y }}
            size={{ width, height }}
            minWidth={400} minHeight={300}
            bounds="parent" dragHandleClassName="window-drag-handle"
            onDragStart={handleDragStart} onDragStop={handleDragStop}
            onResizeStart={handleResizeStart} onResizeStop={handleResizeStop}
            onClick={handleWindowClick}
            enableResizing={{
              top: !minimized, right: !minimized, bottom: !minimized, left: !minimized,
              topRight: !minimized, bottomRight: !minimized, bottomLeft: !minimized, topLeft: !minimized,
            }}
            disableDragging={minimized}
          >
            {windowChrome}
          </Rnd>
        </div>
      )}
    </>
  );
};

export default Window;
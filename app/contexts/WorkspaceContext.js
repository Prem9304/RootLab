// contexts/WorkspaceContext.js
"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

const WorkspaceContext = createContext(null);

/**
 * WorkspaceProvider — central store for live tool state.
 *
 * Any component can call:
 *   - reportToolResult(toolName, formValues, rawOutput)
 *   - reportTerminalOutput(lines)
 *   - reportWrkResult(params, metrics, rawOutput)
 *
 * Any component can read:
 *   - getWorkspaceSnapshot() -> formatted string for the AI system context
 *   - toolResults, terminalHistory, wrkHistory
 */
export function WorkspaceProvider({ children }) {
  // Map of toolName -> { timestamp, formValues, rawOutput }
  const [toolResults, setToolResults] = useState({});
  // Last N terminal lines
  const [terminalHistory, setTerminalHistory] = useState([]);
  // WRK benchmark runs
  const [wrkHistory, setWrkHistory] = useState([]);
  // Live input values of the currently active/focused tool form
  const [activeToolContext, setActiveToolContext] = useState(null);

  const MAX_TERMINAL_LINES = 150;
  const MAX_OUTPUT_CHARS = 3000;
  const MAX_TOOL_RUNS = 5;

  const reportToolResult = useCallback((toolName, formValues, rawOutput) => {
    setToolResults(prev => ({
      ...prev,
      [toolName]: {
        timestamp: Date.now(),
        formValues,
        rawOutput: (rawOutput || "").slice(-MAX_OUTPUT_CHARS),
      },
    }));
  }, []);

  const reportActiveToolContext = useCallback((toolName, formValues) => {
    if (!toolName) {
      setActiveToolContext(null);
    } else {
      setActiveToolContext({
        toolName,
        formValues,
        timestamp: Date.now()
      });
    }
  }, []);

  const reportTerminalOutput = useCallback((text) => {
    if (!text) return;
    const newLines = text.split("\n").filter(l => l.trim());
    setTerminalHistory(prev => {
      const combined = [...prev, ...newLines];
      return combined.slice(-MAX_TERMINAL_LINES);
    });
  }, []);

  const reportWrkResult = useCallback((params, metrics, rawOutput) => {
    setWrkHistory(prev => [{
      timestamp: Date.now(),
      params,
      metrics,
      rawOutput: (rawOutput || "").slice(-MAX_OUTPUT_CHARS),
    }, ...prev.slice(0, MAX_TOOL_RUNS - 1)]);
  }, []);

  /**
   * Build a rich context string for the AI system prompt injection.
   * Called fresh on every message send.
   */
  const getWorkspaceSnapshot = useCallback(() => {
    const sections = [];

    // Active dynamic tool inputs (live parameters)
    if (activeToolContext) {
      sections.push("=== ACTIVE DYNAMIC TOOL INTERFACE ===");
      sections.push(`Application: ${activeToolContext.toolName}`);
      if (activeToolContext.formValues && Object.keys(activeToolContext.formValues).length > 0) {
        sections.push(`Live Form Parameters (Staged inputs): ${JSON.stringify(activeToolContext.formValues)}`);
      }
    }

    // Tool outputs
    const toolEntries = Object.entries(toolResults);
    if (toolEntries.length > 0) {
      sections.push("\n=== RECENT TOOL RESULTS ===");
      toolEntries.forEach(([name, data]) => {
        const age = Math.round((Date.now() - data.timestamp) / 1000);
        sections.push(`\n[Tool: ${name}] (${age}s ago)`);
        if (data.formValues && Object.keys(data.formValues).length > 0) {
          sections.push(`Parameters: ${JSON.stringify(data.formValues)}`);
        }
        if (data.rawOutput) {
          sections.push(`Output:\n${data.rawOutput}`);
        }
      });
    }

    // WRK benchmark results
    if (wrkHistory.length > 0) {
      sections.push("\n=== WRK BENCHMARK RESULTS ===");
      wrkHistory.forEach((run, i) => {
        const age = Math.round((Date.now() - run.timestamp) / 1000);
        sections.push(`\n[Run #${i + 1}] (${age}s ago) Target: ${run.params?.url || "unknown"}`);
        if (run.params) {
          sections.push(`Config: threads=${run.params.threads}, connections=${run.params.connections}, duration=${run.params.duration}s`);
        }
        if (run.metrics) {
          const m = run.metrics;
          const parts = [];
          if (m.latencyAvg) parts.push(`avg_latency=${m.latencyAvg}`);
          if (m.latencyMax) parts.push(`max_latency=${m.latencyMax}`);
          if (m.reqPerSec) parts.push(`req/s=${m.reqPerSec}`);
          if (m.transferPerSec) parts.push(`transfer/s=${m.transferPerSec}`);
          if (m.totalRequests) parts.push(`total_requests=${m.totalRequests}`);
          if (m.errors) parts.push(`errors=${m.errors}`);
          if (parts.length > 0) sections.push(`Metrics: ${parts.join(", ")}`);
        }
        if (run.rawOutput) {
          sections.push(`Raw output:\n${run.rawOutput}`);
        }
      });
    }

    // Terminal history
    if (terminalHistory.length > 0) {
      sections.push("\n=== TERMINAL SESSION (recent) ===");
      sections.push(terminalHistory.slice(-80).join("\n"));
    }

    if (sections.length === 0) {
      return "No tool results or terminal output yet. The workspace is fresh.";
    }

    return sections.join("\n");
  }, [toolResults, wrkHistory, terminalHistory, activeToolContext]);

  return (
    <WorkspaceContext.Provider value={{
      toolResults,
      terminalHistory,
      wrkHistory,
      activeToolContext,
      reportToolResult,
      reportActiveToolContext,
      reportTerminalOutput,
      reportWrkResult,
      getWorkspaceSnapshot,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
};

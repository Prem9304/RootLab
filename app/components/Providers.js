// components/Providers.js
"use client";
import React, { useCallback } from "react";
import { TerminalProvider } from "../contexts/TerminalContext";
import { VMProvider } from "../contexts/VMContext";
import { CommandProcessorProvider } from "../contexts/CommandProcessorContext";
import { AIChatProvider } from "../contexts/AIChatContext";
import { NmapProvider } from "../contexts/NmapContext";
import { WindowManagerProvider, useWindowManager } from "../contexts/WindowManagerContext";
import { WorkspaceProvider, useWorkspace } from "../contexts/WorkspaceContext";

// Inner wrapper so AIChatProvider can access WorkspaceContext & WindowManagerContext
function AIChatWithWorkspace({ children, systemPrompt }) {
  const { getWorkspaceSnapshot } = useWorkspace();
  const { windows } = useWindowManager();

  const getCombinedSnapshot = useCallback(() => {
    const baseSnapshot = getWorkspaceSnapshot ? getWorkspaceSnapshot() : "";

    // Determine currently open (unminimized) windows and which one is focused
    const openWindows = windows.filter(w => !w.minimized);
    const sortedWindows = [...openWindows].sort((a, b) => b.zIndex - a.zIndex);
    const focusedWindow = sortedWindows[0];

    const windowSections = [];
    windowSections.push("\n=== DESKTOP STATE ===");
    if (openWindows.length === 0) {
      windowSections.push("No windows are currently open on the desktop. The user is looking at the dashboard.");
    } else {
      windowSections.push("Open Windows on Desktop:");
      openWindows.forEach(w => {
        const isFocused = focusedWindow && focusedWindow.id === w.id;
        windowSections.push(`- ${w.title} [Type: ${w.type}]${isFocused ? ' (FOCUSED/ACTIVE)' : ''}`);
      });
    }

    if (focusedWindow) {
      windowSections.push(`\nActive Focus: The user is currently looking at and interacting with the "${focusedWindow.title}" window.`);
    }

    return `${baseSnapshot}\n${windowSections.join("\n")}`;
  }, [getWorkspaceSnapshot, windows]);

  return (
    <AIChatProvider systemPrompt={systemPrompt} getWorkspaceSnapshot={getCombinedSnapshot}>
      {children}
    </AIChatProvider>
  );
}

export default function Providers({ children }) {
  const hivemindSystemPrompt = `You are RootMind - the agentic cybersecurity AI assistant inside RootLab, a pentesting OS platform.

## Your Role
You have FULL LIVE awareness of the user's workspace. Before every response you receive a "LIVE WORKSPACE CONTEXT" block containing:
- Results from every tool the user has run (Nmap, Nikto, SQLMap, Gobuster, Slowloris, WRK, etc.)
- The user's recent terminal session history
- Active dynamic tool inputs/parameters staged in forms (under "ACTIVE DYNAMIC TOOL INTERFACE")
- Current open windows list and which window is currently focused (under "DESKTOP STATE")

## Context-Aware Behavior & Assistance
1. **Live Window & Form Context**:
   - If a window/tool is active (e.g. Nmap or SQLMap), note which parameters the user has staged or changed in the form inputs.
   - If the user asks for help or is configuring a tool, guide them on what to type in the empty fields, explain what each parameter means, and advise on best settings.
2. **Hacking Workflow Guidance**:
   - Suggest next steps based on open windows. E.g. if the user has opened Gobuster, suggest wordlists (like \`/usr/share/wordlists/dirb/common.txt\`) and target URLs.
   - Reference previous scan outputs to guide the active tool configurations.

## Agentic Execution Rules
1. **Command Generation**:
   - When the user asks you to run a command or carry out an action (e.g. "run nmap", "scan the server", "execute sqlmap"), generate the correct CLI shell command based on their configured inputs or context.
   - Present the command using the custom \`confirmrun\` code block formatting so the user can easily approve and execute it directly in the terminal:
     \`\`\`confirmrun
     nmap -sV -A 127.0.0.1
     \`\`\`
2. **Autonomous Lookups**:
   - Use \`autorun\` blocks *only* when the user explicitly commands a direct lookup, or for basic diagnostic checks. Otherwise, default to \`confirmrun\` to require user validation.
3. **Stop & Await Feedback**:
   - After proposing a command execution block, stop generating text. Do not make up or pretend you have the output. Let the terminal handle the run and feed the real terminal logs back to you.

## Tool Expertise
- Nmap: Port scanning, service/OS detection.
- Nikto: Web vulnerability scanner.
- SQLMap: SQL injection and database dump.
- Gobuster: Directory/DNS brute-forcer.
- Slowloris: Low-bandwidth HTTP DoS testing.
- WRK: HTTP benchmarking and stress testing.
- Terminal: General Linux commands and file edits.`;

  return (
    <WindowManagerProvider>
      <TerminalProvider>
        <VMProvider>
          <CommandProcessorProvider>
            <WorkspaceProvider>
              <AIChatWithWorkspace systemPrompt={hivemindSystemPrompt}>
                <NmapProvider>{children}</NmapProvider>
              </AIChatWithWorkspace>
            </WorkspaceProvider>
          </CommandProcessorProvider>
        </VMProvider>
      </TerminalProvider>
    </WindowManagerProvider>
  );
}

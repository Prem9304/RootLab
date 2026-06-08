"use client";
import { createContext, useContext, useState, useCallback } from "react";

export const TerminalContext = createContext();

export function TerminalProvider({ children }) {
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [terminalOutput, setTerminalOutput] = useState([]);
  
  const addToCommandHistory = useCallback((command) => {
    if (!command || command.trim() === '') return;
    
    setCommandHistory(prev => {
      // Don't add duplicate commands consecutively
      if (prev.length > 0 && prev[prev.length - 1] === command) {
        return prev;
      }
      
      // Add command to history and limit size to 100
      const newHistory = [...prev, command];
      if (newHistory.length > 100) {
        return newHistory.slice(-100);
      }
      return newHistory;
    });
  }, []);

  const addTerminalOutput = useCallback((type, content) => {
    setTerminalOutput(prev => [...prev, { type, content }]);
  }, []);

  return (
    <TerminalContext.Provider value={{
      terminalVisible,
      setTerminalVisible,
      commandHistory,
      addToCommandHistory,
      terminalOutput,
      addTerminalOutput
    }}>
      {children}
    </TerminalContext.Provider>
  );
}

export const useTerminalContext = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error("useTerminalContext must be used within a TerminalProvider");
  }
  return context;
};
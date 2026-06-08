// contexts/CommandProcessorContext.js
import React, { createContext, useContext } from "react";
import useCommandProcessor from "../hooks/useCommandProcessor";
import { TerminalContext } from "./TerminalContext";

export const CommandProcessorContext = createContext();

export function CommandProcessorProvider({ children }) {
  const { addTerminalOutput } = useContext(TerminalContext);
  const commandProcessor = useCommandProcessor(addTerminalOutput);
  return (
    <CommandProcessorContext.Provider value={commandProcessor}>
      {children}
    </CommandProcessorContext.Provider>
  );
}

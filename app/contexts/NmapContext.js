// contexts/NmapContext.js
"use client";
import { createContext, useContext, useState } from "react";

const NmapContext = createContext();

export function NmapProvider({ children }) {
  const [nmapVisible, setNmapVisible] = useState(false);
  const [nmapOptions, setNmapOptions] = useState({
    target: "",
    scanType: "quick",
    ports: "",
    osDetection: false,
    serviceVersion: true,
  });
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  return (
    <NmapContext.Provider value={{
      nmapVisible,
      setNmapVisible,
      nmapOptions,
      setNmapOptions,
      scanResults,
      setScanResults,
      isScanning,
      setIsScanning
    }}>
      {children}
    </NmapContext.Provider>
  );
}

export const useNmap = () => useContext(NmapContext);
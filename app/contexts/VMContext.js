// contexts/VMContext.js
"use client";

// Keep imports: createContext, useState, useEffect, useCallback
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react'; // *** Add useMemo ***

export const VMContext = createContext(null);

export function VMProvider({ children }) {
    const [vmStatus, setVmStatus] = useState("Loading...");
    const [isActionInProgress, setIsActionInProgress] = useState(false);
    const [containerId, setContainerId] = useState(null);

    // Ensure these are stable with useCallback
    const checkVMStatus = useCallback(async () => {
        if (isActionInProgress) return;
        // console.log(`VMContext: Fetching status...`); // Add logging if needed
        try {
            const response = await fetch('/api/vm/status');
            if (!response.ok) { /* ... error handling ... */ }
            const data = await response.json();
            // console.log("VMContext: Received status data:", data);

            let newStatus = "Unknown";
            let newId = null;
            if (data.status === 'not_found') { newStatus = "Not Found"; }
            else if (data.running) { newStatus = "Started"; newId = data.containerId; }
            else { /* ... other states ... */ newStatus = "Stopped"; newId = data.containerId; }

            // Set state ONLY if values actually changed
            setVmStatus(currentStatus => (newStatus !== currentStatus ? newStatus : currentStatus));
            setContainerId(currentId => (newId !== currentId ? newId : currentId));

        } catch (error) {
            console.error('Failed to fetch VM status:', error);
            setVmStatus(currentStatus => ("Error: Status Check Failed" !== currentStatus ? "Error: Status Check Failed" : currentStatus));
            setContainerId(null); // Usually clear ID on error
        }
    }, [isActionInProgress]); // Dependencies for checkVMStatus

    const startVM = useCallback(async () => {
        if (isActionInProgress) return;
        setIsActionInProgress(true);
        setVmStatus("Starting...");
        try {
            const response = await fetch('/api/vm/start', { method: 'POST' });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || `HTTP error ${response.status}`); }
             console.log('Start VM response:', data); // Keep this log
            // Wait a short delay AFTER action THEN check status
            setTimeout(() => {
                 setIsActionInProgress(false); // Set false before check
                 checkVMStatus();
            }, 1500);
        } catch (error) {
            console.error('Failed to start VM:', error);
            setVmStatus(`Error: Start Failed`);
            setIsActionInProgress(false); // Ensure set false on error
            setTimeout(checkVMStatus, 1000); // Check status after error too
        }
        // Removed finally block to ensure setIsActionInProgress is set before checkVMStatus
    }, [isActionInProgress, checkVMStatus]); // Dependencies for startVM

    const stopVM = useCallback(async () => {
         if (isActionInProgress) return;
        setIsActionInProgress(true);
        setVmStatus("Stopping...");
         try {
            const response = await fetch('/api/vm/stop', { method: 'POST' });
            const data = await response.json();
             if (!response.ok) { throw new Error(data.error || `HTTP error ${response.status}`); }
             console.log('Stop VM response:', data);
             setTimeout(() => {
                  setIsActionInProgress(false);
                  checkVMStatus();
             }, 1500);
         } catch (error) {
             console.error('Failed to stop VM:', error);
             setVmStatus(`Error: Stop Failed`);
             setIsActionInProgress(false);
             setTimeout(checkVMStatus, 1000);
         }
    }, [isActionInProgress, checkVMStatus]); // Dependencies for stopVM

    // Initial status check
    useEffect(() => {
        checkVMStatus();
    }, [checkVMStatus]); // Run only when checkVMStatus identity changes (it shouldn't)

    // *** Memoize the context value object ***
    const value = useMemo(() => ({
        vmStatus,
        isActionInProgress,
        startVM,
        stopVM,
        checkVMStatus,
        containerId
    }), [vmStatus, isActionInProgress, startVM, stopVM, checkVMStatus, containerId]); // Dependencies for useMemo

    return (
        <VMContext.Provider value={value}>
            {children}
        </VMContext.Provider>
    );
}
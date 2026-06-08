// contexts/WindowManagerContext.js
"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react'; // Import useMemo
import { v4 as uuidv4 } from 'uuid';
// Assuming toolsConfig is correctly structured and located
// Adjust the import path if necessary
import { toolsConfig } from "@/public/toolsConfig";

// Define standard window types
export const WINDOW_TYPES = {
    TOOL: 'TOOL',
    AI_CHAT: 'AI_CHAT',
    TERMINAL: 'TERMINAL',
    NESSUS: 'NESSUS',
};

const getToolConfigById = (toolId) => {
    if (!toolId) return null;
    
    // First, check static tools configuration
    if (toolsConfig && toolsConfig.groups) {
        try {
            const staticTool = Object.values(toolsConfig.groups)
                .flatMap((group) => (group && group.tools ? Object.values(group.tools) : [])) 
                .find((tool) => tool && tool.id === toolId);
            if (staticTool) return staticTool;
        } catch (error) {
            console.error("Error accessing static tool configuration:", error);
        }
    }

    // Fallback to checking dynamic custom tools in LocalStorage
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('rootlab_custom_tools');
            if (saved) {
                const customTools = JSON.parse(saved);
                const customTool = customTools.find(t => t.id === toolId);
                if (customTool) {
                    // Re-hydrate execution hooks that JSON stringify stripped
                    return {
                        ...customTool,
                        buildCommand: (values) => {
                            if (customTool.commandTemplate) {
                                let cmd = customTool.commandTemplate;
                                Object.entries(values).forEach(([key, val]) => {
                                    cmd = cmd.replace(new RegExp(`\\{${key}\\}`, 'g'), val || '');
                                });
                                // Strip out any unfilled placeholders
                                cmd = cmd.replace(/\{\w+\}/g, '');
                                // Normalize whitespace
                                return cmd.trim().replace(/\s+/g, ' ');
                            }
                            // Fallback for manually added generic custom tools
                            if (customTool.command) {
                                if (customTool.command.includes('{target}')) return customTool.command.replace('{target}', values.target || '');
                                return `${customTool.command} ${values.target || ''}`.trim();
                            }
                            return "";
                        },
                        processResult: (raw, ai) => ai || raw
                    };
                }
            }
        } catch (err) {
            console.error("Error hydrating custom tool config:", err);
        }
    }

    return null;
};


const WindowManagerContext = createContext(null);

export const WindowManagerProvider = ({ children }) => {
    const [windows, setWindows] = useState([]);
    const nextZIndex = useRef(10); // Start z-index from 10
    const [commandToRun, setCommandToRun] = useState(null);
    // Helper to get next z-index (memoized)
    const getNextZIndex = useCallback(() => {
        nextZIndex.current += 1; // Increment the ref's current value
        return nextZIndex.current;
    }, []); // No dependencies, ref updates don't trigger re-renders

    // Bring window to front (memoized)
    const bringToFront = useCallback((id) => {
        setWindows(prevWindows => {
            // Check if the window is already at the front based on the ref value
            // This avoids unnecessary state updates if already topmost visible window
            const currentMaxZ = Math.max(1, ...prevWindows.filter(w => !w.minimized).map(w => w.zIndex)); // Min 1 to handle empty array
            const targetWindow = prevWindows.find(w => w.id === id);

            // Only update if not already the topmost window
            if (targetWindow && targetWindow.zIndex < currentMaxZ) {
                 const newZIndex = getNextZIndex(); // Get next z-index
                 console.log(`WindowManager: Bringing window ${id} to front with zIndex ${newZIndex}`);
                 return prevWindows.map(win =>
                    win.id === id ? { ...win, zIndex: newZIndex, minimized: false } : win // Also ensure unminimized
                 );
            } else if (targetWindow && targetWindow.minimized) {
                // If minimized, still bring to front logic applies when unminimizing
                const newZIndex = getNextZIndex();
                console.log(`WindowManager: Unminimizing window ${id} to front with zIndex ${newZIndex}`);
                return prevWindows.map(win =>
                   win.id === id ? { ...win, zIndex: newZIndex, minimized: false } : win
                );
            }
            return prevWindows; // No change needed if already topmost or not found
        });
    }, [getNextZIndex]); // Depends on stable getNextZIndex

    // Toggle minimize window (memoized)
    const toggleMinimizeWindow = useCallback((id) => {
        setWindows(prevWindows =>
            prevWindows.map(win => {
                if (win.id === id) {
                    if (!win.minimized) {
                        // Minimizing: just update minimized flag
                         console.log(`WindowManager: Minimizing window ${id}`);
                        return { ...win, minimized: true };
                    } else {
                        // Unminimizing: bring to front and unminimize
                        const newZIndex = getNextZIndex();
                         console.log(`WindowManager: Unminimizing window ${id} to front with zIndex ${newZIndex}`);
                        return { ...win, minimized: false, zIndex: newZIndex };
                    }
                }
                return win;
            })
        );
    }, [getNextZIndex]); // Depends on stable getNextZIndex

    // Update window position (memoized)
    const updateWindowPosition = useCallback((id, x, y) => {
         // console.log(`WindowManager: Updating position for window ${id} to (${x}, ${y})`); // Can be noisy
        setWindows(prevWindows =>
            prevWindows.map(win =>
                win.id === id ? { ...win, x, y } : win
            )
        );
    }, []); // No dependencies

    // Update window size (memoized)
    const updateWindowSize = useCallback((id, width, height) => {
         // console.log(`WindowManager: Updating size for window ${id} to ${width}x${height}`); // Can be noisy
        setWindows(prevWindows =>
            prevWindows.map(win =>
                win.id === id ? { ...win, width, height } : win
            )
        );
    }, []); // No dependencies

    // Close window (memoized)
    const closeWindow = useCallback((id) => {
         console.log(`WindowManager: Closing window ${id}`);
        setWindows(prevWindows => prevWindows.filter(win => win.id !== id));
    }, []); // No dependencies

    // Open a new window (memoized)
    // Note: This depends on 'windows' state, so it *will* get a new reference when windows array changes.
    // This is generally okay unless passed very deep as a dependency to effects.
    const openWindow = useCallback((windowConfig) => {
        const { type, toolId, initialPosition, initialSize } = windowConfig;
        console.log(`WindowManager: Attempting to open window - Type: ${type}, ToolID: ${toolId || 'N/A'}`);

        // Check if a non-tool window of the same type already exists
        const existingSingletonWindow = type !== WINDOW_TYPES.TOOL
            ? windows.find(win => win.type === type)
            : null;

        // Check if this specific tool window already exists
        const existingToolWindow = type === WINDOW_TYPES.TOOL
            ? windows.find(win => win.toolId === toolId)
            : null;

        const existingWindow = existingSingletonWindow || existingToolWindow;

        if (existingWindow) {
             console.log(`WindowManager: Window already exists (ID: ${existingWindow.id}). Bringing to front.`);
            // If it exists, bring it to front and unminimize it
            // Use bringToFront which handles z-index and minimized state
            bringToFront(existingWindow.id);
            return; // Stop execution
        }

        // If window doesn't exist, create a new one
        const newWindowId = uuidv4();
        const newZIndex = getNextZIndex();
        console.log(`WindowManager: Creating new window ${newWindowId} with zIndex ${newZIndex}`);

        let title = "Window";
        let defaultWidth = 600;
        let defaultHeight = 400;
        let IconComponent = null; // Assuming IconComponent comes from config or is set here

        switch (type) {
            case WINDOW_TYPES.AI_CHAT:
                title = "AI Chat";
                defaultWidth = 500; defaultHeight = 650;
                // IconComponent = ChatIcon; // Example
                break;
            case WINDOW_TYPES.TERMINAL:
                title = "Terminal";
                defaultWidth = 700; defaultHeight = 450;
                break;
            case WINDOW_TYPES.NESSUS:
                title = "Nessus Scanner";
                defaultWidth = 1000; defaultHeight = 700;
                break;
            case WINDOW_TYPES.TOOL:
                const toolConfig = getToolConfigById(toolId);
                if (!toolConfig) {
                    console.error(`WindowManager: Tool config not found for ID: ${toolId}`);
                    return; // Don't open window if config missing
                }
                title = toolConfig.name || "Tool";
                IconComponent = toolConfig.icon; // Get icon from config
                defaultWidth = toolConfig.windowWidth || 800;
                defaultHeight = toolConfig.windowHeight || 600;
                break;
            default:
                console.error("WindowManager: Unknown window type requested:", type);
                return;
        }

        // Calculate initial position with cascade effect to avoid perfect overlap
        const cascadeOffset = (windows.length % 10) * 30; // Max 10 cascades then wraps
        const basePos = {
            x: 100 + cascadeOffset,
            y: 100 + cascadeOffset
        };

        const newWindow = {
            id: newWindowId,
            type,
            toolId: type === WINDOW_TYPES.TOOL ? toolId : null,
            title,
            IconComponent, // Store the component itself or a reference/name
            x: initialPosition?.x ?? basePos.x,
            y: initialPosition?.y ?? basePos.y,
            width: initialSize?.width ?? defaultWidth,
            height: initialSize?.height ?? defaultHeight,
            zIndex: newZIndex,
            minimized: false
        };

        console.log(`WindowManager: Adding new window:`, newWindow);
        // Correct immutable update: create new array with the new window appended
        setWindows(prevWindows => [...prevWindows, newWindow]);

    }, [windows, bringToFront, getNextZIndex, toggleMinimizeWindow]); // Dependencies for openWindow

    const sendCommandToTerminal = useCallback((command, isAgent = false) => {
        console.log("WindowManagerContext: Setting commandToRun -", command.trim(), isAgent ? "[Agent Mode]" : "");
        // Set state with command, a unique timestamp, and agent flag
        setCommandToRun({ cmd: command, timestamp: Date.now(), isAgent });
    }, []); // No dependencies needed

    // *** ADDED FUNCTION TO CLEAR COMMAND ***
    const clearCommandToRun = useCallback(() => {
        console.log("WindowManagerContext: Clearing commandToRun.");
        setCommandToRun(null);
    }, []); 

    // *** Memoize the context value object ***
    // This prevents consumers from re-rendering unnecessarily if the provider
    // re-renders but these specific values haven't changed reference.
    const value = useMemo(() => ({
        windows,
        openWindow,
        closeWindow,
        toggleMinimizeWindow,
        bringToFront,
        updateWindowPosition,
        updateWindowSize,
        WINDOW_TYPES,
        getToolConfigById,
        // Add command state and functions
        commandToRun,
        sendCommandToTerminal,
        clearCommandToRun
    }), [
        windows,
        openWindow,
        closeWindow,
        toggleMinimizeWindow,
        bringToFront,
        updateWindowPosition,
        updateWindowSize,
        // Add command state and functions to dependency array
        commandToRun,
        sendCommandToTerminal,
        clearCommandToRun
        // getToolConfigById is stable, WINDOW_TYPES is constant
    ]);
    // *** End Memoization ***


    return (
        <WindowManagerContext.Provider value={value}>
            {children}
        </WindowManagerContext.Provider>
    );
};

// Custom hook to consume the context remains the same
export const useWindowManager = () => {
    const context = useContext(WindowManagerContext);
    if (!context) {
        throw new Error('useWindowManager must be used within a WindowManagerProvider');
    }
    return context;
};
"use client";
import React from 'react';
import { useWindowManager } from '../contexts/WindowManagerContext';
import Window from './Window';

const WindowManager = () => {
    const { windows } = useWindowManager();

    return (
        <div className="window-manager-area fixed inset-0 overflow-hidden pointer-events-none z-[35]">
            {windows.map(winData => (
                <Window key={winData.id} windowData={winData} />
            ))}
        </div>
    );
};

export default WindowManager;
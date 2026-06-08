// components/StartMenu.js
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useWindowManager } from '../contexts/WindowManagerContext';
import { toolsConfig } from '@/public/toolsConfig'; // Assuming path

const StartMenu = ({ closeMenu }) => {
    const { openWindow, WINDOW_TYPES } = useWindowManager();

    const handleToolClick = (tool) => {
        openWindow({
            type: WINDOW_TYPES.TOOL,
            toolId: tool.id,
            title: tool.name,
            // Pass tool icon somehow if needed in Window title bar (added icon to Window component)
        });
        closeMenu(); // Close menu after opening tool
    };

    const groupedTools = Object.values(toolsConfig.groups);

    return (
        <div className="bg-[#081A2C]/95 backdrop-blur-md border border-[#00ADEE]/20 rounded-lg shadow-2xl h-[500px] flex flex-col text-white overflow-hidden">
            <div className='p-4 border-b border-[#00ADEE]/10'>
                 <h3 className="font-semibold text-lg text-[#00ADEE]">Applications</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#00ADEE]/30 scrollbar-track-transparent">
                {groupedTools.map((group) => (
                    <div key={group.name} className="mb-4">
                        <h4 className="text-xs font-bold uppercase text-[#00ADEE]/70 px-2 mb-2 tracking-wider">{group.name}</h4>
                        <ul className="space-y-1">
                            {Object.values(group.tools).map((tool) => (
                                <li key={tool.id}>
                                    <motion.button
                                        whileHover={{ backgroundColor: "rgba(0, 173, 238, 0.1)" }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm text-gray-200 hover:text-white transition-colors"
                                        onClick={() => handleToolClick(tool)}
                                    >
                                        <span className="text-[#00ADEE] w-5 flex justify-center">
                                             {React.isValidElement(tool.icon) ? React.cloneElement(tool.icon, { size: 18 }) : null}
                                        </span>
                                        <span>{tool.name}</span>
                                    </motion.button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
             <div className="p-2 text-center text-xs text-gray-500 border-t border-[#00ADEE]/10">
                RootLab Suite
             </div>
        </div>
    );
};

export default StartMenu;
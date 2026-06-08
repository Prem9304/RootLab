// app/components/EthicalHackingStages.js
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Eye, ScanLine, KeyRound, AlertTriangle, Loader, Info, X } from 'lucide-react';
import Typewriter from './Typewriter';

const hackingStages = [
    {
        id: 'recon',
        name: 'Reconnaissance',
        icon: Eye,
        descriptionPrompt: "Generate a concise description (around 30-40 words) for the Reconnaissance (Information Gathering) stage of ethical hacking. Focus on its purpose: passively and actively collecting information about a target system or network before any active intrusion attempt. Mention examples like footprinting or OSINT. Start directly with the description.",
        fallbackDescription: "The initial phase of ethical hacking focused on gathering information about target systems, networks, and organizations. This includes passive techniques like OSINT research and active methods like DNS enumeration to build a comprehensive target profile.",
        tools: ['Nmap', 'OSINT', 'theHarvester', 'Shodan', 'Maltego'],
        color: 'border-cyan-500/30 text-cyan-400',
        hoverColor: 'group-hover:border-cyan-500/50 hover:border-cyan-500/50',
        bgColor: 'bg-cyan-950/10',
        activeGlow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)] border-cyan-500/50',
        gradient: 'from-cyan-500/10 via-transparent'
    },
    {
        id: 'scan',
        name: 'Scanning & Enumeration',
        icon: ScanLine,
        descriptionPrompt: "Generate a concise description (around 30-40 words) for the Scanning and Enumeration stage of ethical hacking. Explain its goal: actively probing the target for vulnerabilities, open ports, running services, and system details using the information gathered previously. Start directly with the description.",
        fallbackDescription: "Active probing phase where security professionals scan target systems for open ports, running services, and potential vulnerabilities. This stage builds upon reconnaissance data to identify specific attack vectors and system weaknesses.",
        tools: ['Nmap (Active)', 'Nessus', 'OpenVAS', 'Nikto', 'Enum4linux'],
        color: 'border-purple-500/30 text-purple-400',
        hoverColor: 'group-hover:border-purple-500/50 hover:border-purple-500/50',
        bgColor: 'bg-purple-950/10',
        activeGlow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)] border-purple-500/50',
        gradient: 'from-purple-500/10 via-transparent'
    },
    {
        id: 'exploit',
        name: 'Gaining Access',
        icon: KeyRound,
        descriptionPrompt: "Generate a concise description (around 30-40 words) for the Gaining Access (Exploitation) stage of ethical hacking. Describe how vulnerabilities found during scanning are exploited to gain unauthorized access to the target system or network. Mention techniques like exploiting software flaws or weak credentials. Start directly with the description.",
        fallbackDescription: "The exploitation phase where identified vulnerabilities are leveraged to gain unauthorized access to target systems. This involves using tools like Metasploit to exploit software flaws, weak passwords, or misconfigurations.",
        tools: ['Metasploit', 'Hydra', 'John the Ripper', 'Mimikatz', 'SQLMap'],
        color: 'border-red-500/30 text-red-400',
        hoverColor: 'group-hover:border-red-500/50 hover:border-red-500/50',
        bgColor: 'bg-red-950/10',
        activeGlow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)] border-red-500/50',
        gradient: 'from-red-500/10 via-transparent'
    },
];

const contentVariants = {
    collapsed: { opacity: 0, height: 0, y: 10, transition: { duration: 0.2 } },
    expanded: { opacity: 1, height: 'auto', y: 0, transition: { duration: 0.3, delay: 0.15 } }
};

const toolVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.05, duration: 0.2 }
    })
};

export default function EthicalHackingStages() {
    const [expandedStageId, setExpandedStageId] = useState(null);
    const [stageDetails, setStageDetails] = useState({});
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    useEffect(() => {
        const fetchAllDescriptions = async () => {
            setIsLoadingInitial(true);
            const initialDetails = {};
            hackingStages.forEach(stage => {
                initialDetails[stage.id] = { description: null, isLoading: true, error: null };
            });
            setStageDetails(initialDetails);

            const fetchPromises = hackingStages.map(async (stage) => {
                try {
                    const res = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ messages: [{ role: "user", content: stage.descriptionPrompt }] }),
                    });
                    if (!res.ok) throw new Error(`AI server error (${res.status})`);
                    const data = await res.json();
                    return { id: stage.id, description: data.content || stage.fallbackDescription };
                } catch (error) {
                    console.error(`Failed to fetch AI description for ${stage.name}, using fallback:`, error);
                    return { id: stage.id, description: stage.fallbackDescription };
                }
            });

            const results = await Promise.all(fetchPromises);
            setStageDetails(prevDetails => {
                const newDetails = { ...prevDetails };
                results.forEach(result => {
                    newDetails[result.id] = {
                        ...newDetails[result.id],
                        description: result.description,
                        error: null,
                        isLoading: false,
                    };
                });
                return newDetails;
            });
            setIsLoadingInitial(false);
        };
        fetchAllDescriptions();
    }, []);

    const handleCardClick = (id) => {
        setExpandedStageId(prevId => (prevId === id ? null : id));
    };

    return (
        <section className="w-full flex justify-center items-start relative min-h-[300px]">
            <LayoutGroup>
                <motion.div className="flex flex-col md:flex-row gap-4 md:gap-5 w-full max-w-5xl">
                    {hackingStages.map((stage, index) => {
                        const isExpanded = expandedStageId === stage.id;
                        const details = stageDetails[stage.id] || { isLoading: true };

                        return (
                            <motion.div
                                key={stage.id}
                                layout
                                onClick={() => handleCardClick(stage.id)}
                                className={`
                                  rounded-xl border p-5 md:p-6 cursor-pointer overflow-hidden
                                  transition-all duration-300 relative group font-mono
                                  ${stage.bgColor} ${stage.color} ${stage.hoverColor}
                                  ${isExpanded ? `${stage.activeGlow} flex-[3.5]` : 'flex-[1] bg-slate-950/20 backdrop-blur-sm'}
                                `}
                                initial={{ borderRadius: '12px' }}
                                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                            >
                                {/* Scanline retro details for expanded cards */}
                                {isExpanded && (
                                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40"></div>
                                )}

                                {/* Card Header */}
                                <motion.div layout="position" className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-center`}>
                                      <stage.icon size={20} className="stroke-[2px]" />
                                    </div>
                                    <h3 className="font-bold tracking-tight text-white text-sm md:text-md">
                                        {stage.name}
                                    </h3>
                                    
                                    {!isExpanded && (
                                      <Info size={14} className="ml-auto text-gray-600 group-hover:text-[#00f0ff] transition-colors" />
                                    )}
                                    
                                    {isExpanded && (
                                        <motion.button
                                            className="ml-auto p-1 text-gray-500 hover:text-white rounded hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all z-10 cursor-pointer"
                                            onClick={(e) => { e.stopPropagation(); handleCardClick(stage.id); }}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                            aria-label="Close"
                                        >
                                            <X size={16} />
                                        </motion.button>
                                    )}
                                </motion.div>

                                {/* Expanded Content */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            className="overflow-hidden mt-5"
                                            variants={contentVariants}
                                            initial="collapsed"
                                            animate="expanded"
                                            exit="collapsed"
                                        >
                                            {/* AI Description */}
                                            <div className="text-xs md:text-sm text-slate-300 leading-relaxed font-mono min-h-[40px] mb-5 border-l-2 border-slate-700 pl-3.5">
                                                {details.isLoading ? (
                                                    <span className="flex items-center gap-2 text-gray-400 font-sans"><Loader size={14} className="animate-spin text-cyan-400" /> Connecting intelligence node...</span>
                                                ) : details.error ? (
                                                    <span className="flex items-center gap-2 text-red-400"><AlertTriangle size={14} /> Database timeout.</span>
                                                ) : (
                                                    <Typewriter text={details.description || ''} speed={15} />
                                                )}
                                            </div>

                                            {/* Tools Section */}
                                            <div className="pt-2 border-t border-slate-900">
                                                <h4 className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-2.5">ASSOCIATED SUITE MODULES:</h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {stage.tools.map((tool, i) => (
                                                        <motion.span
                                                            key={tool}
                                                            custom={i}
                                                            variants={toolVariants}
                                                            initial="hidden"
                                                            animate="visible"
                                                            className="text-[10px] bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-gray-300 px-2 py-0.5 rounded transition-all font-mono"
                                                        >
                                                            {tool}
                                                        </motion.span>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </LayoutGroup>

            {isLoadingInitial && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm z-30 rounded-lg">
                    <div className="flex items-center gap-2 font-mono text-cyan-400 text-sm">
                      <Loader size={16} className="animate-spin" />
                      <span>Loading Threat Models...</span>
                    </div>
                </div>
            )}
        </section>
    );
}
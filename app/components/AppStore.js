import React, { useState } from 'react';
import { Download, Search, Package, CheckCircle, Loader } from 'lucide-react';
import { Command } from 'lucide-react';

const STORE_PACKAGES = [
    { 
        id: 'rustscan', name: 'RustScan', icon: '⚡', desc: 'Fast Port Scanner',
        commandTemplate: 'rustscan -a {target} {ports} -- {nmapArgs}',
        inputs: [
            { name: "target", type: "text", label: "Target IP / Domain", placeholder: "127.0.0.1" },
            { name: "ports", type: "text", label: "RustScan Ports (-p)", placeholder: "-p 22,80,443" },
            { name: "nmapArgs", type: "text", label: "NMAP Arguments", placeholder: "-sV" }
        ]
    },
    { 
        id: 'john', name: 'John the Ripper', icon: '🔑', desc: 'Password Cracker',
        commandTemplate: 'john {wordlist} {format} "{hashfile}"',
        inputs: [
            { name: "hashfile", type: "text", label: "Path to Hash File", placeholder: "hash.txt" },
            { name: "wordlist", type: "text", label: "Wordlist (--wordlist=)", placeholder: "--wordlist=/usr/share/wordlists/rockyou.txt" },
            { name: "format", type: "text", label: "Format (--format=)", placeholder: "--format=raw-md5" }
        ]
    },
    { 
        id: 'sqlmap', name: 'SQLMap', icon: '💉', desc: 'Automatic SQL Injection',
        commandTemplate: 'sqlmap -u "{url}" {args}',
        inputs: [
            { name: "url", type: "text", label: "Target URL", placeholder: "http://test.com/vuln?id=1" },
            { name: "args", type: "text", label: "Arguments", placeholder: "--dbs --batch" }
        ]
    },
    { 
        id: 'aircrack-ng', name: 'Aircrack-ng', icon: '📡', desc: 'WiFi Security Suite',
        commandTemplate: 'aircrack-ng {wordlist} "{capfile}"',
        inputs: [
            { name: "capfile", type: "text", label: "Path to .cap File", placeholder: "capture.cap" },
            { name: "wordlist", type: "text", label: "Wordlist (-w)", placeholder: "-w /usr/share/wordlists/rockyou.txt" }
        ]
    },
    { 
        id: 'metasploit-framework', name: 'Metasploit', icon: '🎯', desc: 'Exploitation Framework',
        commandTemplate: 'msfconsole -q {args}',
        inputs: [
            { name: "args", type: "text", label: "Args (-x command)", placeholder: "-x 'use exploit/...' " }
        ]
    },
    { 
        id: 'hydra', name: 'Hydra', icon: '🐉', desc: 'Network Logon Cracker',
        commandTemplate: 'hydra -l {username} -P {wordlist} {target} {protocol}',
        inputs: [
            { name: "target", type: "text", label: "Target IP", placeholder: "192.168.1.100" },
            { name: "protocol", type: "text", label: "Protocol", placeholder: "ssh, ftp, http-post-form" },
            { name: "username", type: "text", label: "Username", placeholder: "admin" },
            { name: "wordlist", type: "text", label: "Wordlist", placeholder: "/usr/share/wordlists/rockyou.txt" }
        ]
    },
    { 
        id: 'gobuster', name: 'Gobuster', icon: '👻', desc: 'Directory/DNS Scanner',
        commandTemplate: 'gobuster {mode} -u {target} -w {wordlist} {args}',
        inputs: [
            { name: "mode", type: "select", label: "Mode", options: [{value: "dir", label: "Directory"}, {value: "dns", label: "DNS"}] },
            { name: "target", type: "text", label: "Target URL/Domain", placeholder: "http://example.com" },
            { name: "wordlist", type: "text", label: "Wordlist", placeholder: "/usr/share/wordlists/dirb/common.txt" },
            { name: "args", type: "text", label: "Extra Args", placeholder: "-t 50" }
        ]
    },
    { 
        id: 'sherlock', name: 'Sherlock', icon: '🔎', desc: 'Social Media Search',
        commandTemplate: 'sherlock {username} {args}',
        inputs: [
            { name: "username", type: "text", label: "Target Username", placeholder: "johndoe" },
            { name: "args", type: "text", label: "Arguments", placeholder: "--timeout 5" }
        ]
    },
    { 
        id: 'neo4j', name: 'Neo4j & Bloodhound', icon: '🩸', desc: 'AD Graph Analysis',
        commandTemplate: 'neo4j {command}',
        inputs: [
            { name: "command", type: "select", label: "Action", options: [{value: "start", label: "Start Service"}, {value: "stop", label: "Stop Service"}, {value: "status", label: "Status"}] }
        ]
    }
];

export default function AppStore() {
    const [searchTerm, setSearchTerm] = useState('');
    const [installingStatus, setInstallingStatus] = useState({});

    // Read installed items to show Checkmarks
    const getInstalledIds = () => {
        try {
            const arr = JSON.parse(localStorage.getItem('rootlab_custom_tools') || '[]');
            return arr.map(t => t.id);
        } catch { return []; }
    };
    const installedIds = getInstalledIds();

    const filtered = STORE_PACKAGES.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleInstallRequest = async (pkg) => {
        if (installedIds.includes(pkg.id)) return;
        
        setInstallingStatus(prev => ({...prev, [pkg.id]: 'installing'}));

        try {
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    command: `bash -c "wget -q -O /etc/apt/trusted.gpg.d/kali-archive-keyring.asc https://archive.kali.org/archive-key.asc && apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y ${pkg.id}"` 
                })
            });

            const data = await response.json();
            
            if (data.error) {
                console.error("Install Error", data.output || data.error);
                setInstallingStatus(prev => ({...prev, [pkg.id]: 'error'}));
                return;
            }

            // Register in Custom Tools
            const customTools = JSON.parse(localStorage.getItem('rootlab_custom_tools') || '[]');
            if (!customTools.find(t => t.id === pkg.id)) {
                // Dynamically build empty initial values from the defined inputs
                const initVals = pkg.inputs.reduce((acc, curr) => ({...acc, [curr.name]: curr.type === 'select' && curr.options?.length > 0 ? curr.options[0].value : ''}), {});
                
                customTools.push({
                    id: pkg.id,
                    name: pkg.name,
                    description: pkg.desc,
                    iconBgColor: '#00ADEE',
                    isCustom: true,
                    initialValues: initVals,
                    commandTemplate: pkg.commandTemplate, 
                    config: { inputs: pkg.inputs },
                    aiProcessing: { prompt: "Analyze output..." },
                    processResult: (raw, ai) => ai || raw,
                    enabled: true
                });
                localStorage.setItem('rootlab_custom_tools', JSON.stringify(customTools));
                window.dispatchEvent(new Event('rootlab_tool_installed'));
            }

            setInstallingStatus(prev => ({...prev, [pkg.id]: 'done'}));
        } catch (err) {
            console.error("Fetch Exception", err);
            setInstallingStatus(prev => ({...prev, [pkg.id]: 'error'}));
        }
    };

    const handleRemoveRequest = async (pkg) => {
        setInstallingStatus(prev => ({...prev, [pkg.id]: 'removing'}));
        
        try {
            await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    command: `bash -c "DEBIAN_FRONTEND=noninteractive apt-get remove -y ${pkg.id}"` 
                })
            });

            const customTools = JSON.parse(localStorage.getItem('rootlab_custom_tools') || '[]');
            const updatedTools = customTools.filter(t => t.id !== pkg.id);
            localStorage.setItem('rootlab_custom_tools', JSON.stringify(updatedTools));
            window.dispatchEvent(new Event('rootlab_tool_installed'));

            setInstallingStatus(prev => {
                const copy = {...prev};
                delete copy[pkg.id];
                return copy;
            });
        } catch (err) {
            console.error("Remove Error", err);
            setInstallingStatus(prev => ({...prev, [pkg.id]: 'error'}));
        }
    };

    return (
        <div className="flex w-full h-full bg-transparent text-white overflow-hidden font-mono">
            {/* Left Panel: App Store List */}
            <div className="flex-1 flex flex-col h-full">
                {/* Header */}
                <div className="px-6 py-4 bg-slate-950/40 border-b border-cyan-500/15 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-500/10 p-2.5 rounded-xl text-[#00f0ff] border border-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                            <Package size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wider text-glow-cyan uppercase">Kali App Marketplace</h2>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Discover and deploy cybersecurity tools dynamically.</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-cyan-500/10 bg-slate-950/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-500/40" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search repositories..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="dark-input pl-9 pr-4 text-xs placeholder-slate-600 focus:border-cyan-500/40"
                        />
                    </div>
                </div>

                {/* Package Grid */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-cyan-500/20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filtered.map(pkg => {
                            const isDone = installedIds.includes(pkg.id);
                            const isInstalling = installingStatus[pkg.id] === 'installing';
                            const isRemoving = installingStatus[pkg.id] === 'removing';
                            const isError = installingStatus[pkg.id] === 'error';
                            
                            return (
                                <div key={pkg.id} className="glass-panel rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:border-cyan-500/30 group relative overflow-hidden bg-slate-900/40 border border-cyan-500/15">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="text-3xl mt-1.5 p-2.5 bg-slate-950/40 rounded-xl border border-cyan-500/10 flex-shrink-0">
                                            {pkg.icon}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-slate-100 group-hover:text-[#00f0ff] font-mono transition-colors text-sm uppercase tracking-wide truncate">{pkg.name}</h3>
                                            <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">{pkg.desc}</p>
                                            <code className="text-[9px] text-cyan-400 bg-[#02050a]/90 px-2 py-0.5 rounded mt-3 inline-block font-mono border border-cyan-500/10">apt install {pkg.id}</code>
                                        </div>
                                    </div>

                                    {isDone ? (
                                        <div className="flex gap-2 mt-2">
                                            <button 
                                                disabled
                                                className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 cursor-default"
                                            >
                                                <CheckCircle size={12} /> Installed
                                            </button>
                                            <button 
                                                onClick={() => handleRemoveRequest(pkg)}
                                                disabled={isRemoving}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center border font-mono ${
                                                    isRemoving 
                                                      ? 'bg-red-500/20 border-red-500/30 text-red-400 cursor-wait animate-pulse' 
                                                      : 'bg-red-500/10 hover:bg-red-500 border-red-500/25 hover:border-red-500 text-red-400 hover:text-black shadow-[0_0_10px_rgba(239,68,68,0.05)] hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer'
                                                }`}
                                            >
                                                {isRemoving ? <Loader className="animate-spin" size={12} /> : 'Delete'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleInstallRequest(pkg)}
                                            disabled={isInstalling}
                                            className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 font-mono cursor-pointer mt-2 ${
                                                isError ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black shadow-lg shadow-red-500/5 hover:shadow-red-500/20' :
                                                isInstalling ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 cursor-wait animate-pulse' :
                                                'bg-cyan-500/10 hover:bg-[#00f0ff] border border-cyan-500/25 hover:border-[#00f0ff] text-[#00f0ff] hover:text-black shadow-[0_0_10px_rgba(0,240,255,0.05)] hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                                            }`}
                                        >
                                            {isError ? <><Download size={12} /> Retry Install</> :
                                             isInstalling ? <><Loader className="animate-spin" size={12} /> Installing...</> : 
                                             <><Download size={12} /> Download & Install</>}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-500 text-xs uppercase tracking-wider">
                                No packages found matching '{searchTerm}'.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

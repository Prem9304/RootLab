'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, 
    Pause, 
    SkipForward, 
    RotateCcw, 
    CheckCircle, 
    AlertCircle,
    BookOpen,
    Terminal,
    Eye,
    Target,
    Code,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const tutorials = {
    'nmap-basics': {
        id: 'nmap-basics',
        title: 'Nmap Port Scanning Basics',
        description: 'Learn the fundamentals of network scanning with Nmap',
        difficulty: 'Beginner',
        estimatedTime: '15 min',
        xpReward: 75,
        category: 'Network Analysis',
        steps: [
            {
                id: 1,
                title: 'Introduction to Nmap',
                type: 'explanation',
                content: `Nmap (Network Mapper) is a powerful open-source tool used for network discovery and security auditing. It's essential for ethical hackers and security professionals.

**Key Features:**
• Host discovery
• Port scanning  
• Service detection
• OS fingerprinting
• Vulnerability detection

In this tutorial, you'll learn the basic commands and techniques for effective network reconnaissance.`,
                duration: 60
            },
            {
                id: 2,
                title: 'Basic Host Discovery',
                type: 'interactive',
                content: `Let's start with a simple ping scan to discover live hosts on a network.

**Command:** \`nmap -sn 192.168.1.0/24\`

**Explanation:**
• \`-sn\`: Ping scan (no port scan)
• \`192.168.1.0/24\`: Target network range

This command will show you which hosts are online without scanning their ports.`,
                command: 'nmap -sn 192.168.1.0/24',
                expectedOutput: 'Host is up',
                duration: 90
            },
            {
                id: 3,
                title: 'Port Scanning Basics',
                type: 'interactive',
                content: `Now let's scan for open ports on a specific target.

**Command:** \`nmap 192.168.1.1\`

**What happens:**
• Scans the 1000 most common ports
• Shows open, closed, and filtered ports
• Identifies running services

Try this command on your target system.`,
                command: 'nmap 192.168.1.1',
                expectedOutput: 'open',
                duration: 120
            },
            {
                id: 4,
                title: 'Service Version Detection',
                type: 'interactive',
                content: `Let's identify the versions of services running on open ports.

**Command:** \`nmap -sV 192.168.1.1\`

**The \`-sV\` flag:**
• Probes open ports to determine service versions
• Helps identify potential vulnerabilities
• Provides more detailed information

This is crucial for vulnerability assessment.`,
                command: 'nmap -sV 192.168.1.1',
                expectedOutput: 'version',
                duration: 150
            },
            {
                id: 5,
                title: 'Stealth Scanning',
                type: 'interactive',
                content: `Learn about stealth scanning techniques to avoid detection.

**Command:** \`nmap -sS 192.168.1.1\`

**SYN Scan (\`-sS\`):**
• Half-open scan (doesn't complete TCP handshake)
• Faster and more stealthy
• Default scan type for privileged users
• Harder to detect in logs

This is the preferred method for reconnaissance.`,
                command: 'nmap -sS 192.168.1.1',
                expectedOutput: 'open',
                duration: 120
            },
            {
                id: 6,
                title: 'Comprehensive Scan',
                type: 'interactive',
                content: `Let's combine multiple techniques for a thorough scan.

**Command:** \`nmap -sS -sV -O 192.168.1.1\`

**Combined flags:**
• \`-sS\`: SYN scan
• \`-sV\`: Version detection  
• \`-O\`: OS detection

This gives you a complete picture of the target system.`,
                command: 'nmap -sS -sV -O 192.168.1.1',
                expectedOutput: 'OS details',
                duration: 180
            },
            {
                id: 7,
                title: 'Tutorial Complete',
                type: 'completion',
                content: `Congratulations! You've completed the Nmap basics tutorial.

**What you learned:**
✓ Host discovery techniques
✓ Basic port scanning
✓ Service version detection
✓ Stealth scanning methods
✓ OS fingerprinting

**Next Steps:**
• Practice on your lab environment
• Try advanced Nmap scripts
• Learn about Nmap Scripting Engine (NSE)
• Explore other scanning tools

Keep practicing to master network reconnaissance!`,
                duration: 60
            }
        ]
    },
    'web-vuln-basics': {
        id: 'web-vuln-basics',
        title: 'Web Vulnerability Assessment',
        description: 'Learn to identify common web application vulnerabilities',
        difficulty: 'Beginner',
        estimatedTime: '20 min',
        xpReward: 100,
        category: 'Web Security',
        steps: [
            {
                id: 1,
                title: 'Introduction to Web Vulnerabilities',
                type: 'explanation',
                content: `Web applications are common targets for attackers. Understanding vulnerabilities is crucial for both offense and defense.

**Common Web Vulnerabilities:**
• SQL Injection
• Cross-Site Scripting (XSS)
• Cross-Site Request Forgery (CSRF)
• Insecure Direct Object References
• Security Misconfigurations

We'll explore how to identify these using automated tools.`,
                duration: 90
            },
            {
                id: 2,
                title: 'Using Nikto for Web Scanning',
                type: 'interactive',
                content: `Nikto is a web vulnerability scanner that tests for thousands of potential issues.

**Command:** \`nikto -h http://target.com\`

**What Nikto checks:**
• Outdated software versions
• Dangerous files and programs
• Server misconfigurations
• Default files and programs

Let's scan a web application.`,
                command: 'nikto -h http://testphp.vulnweb.com',
                expectedOutput: 'vulnerabilities found',
                duration: 180
            }
        ]
    }
};

export default function InteractiveTutorial({ tutorialId, onClose, onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [stepCompleted, setStepCompleted] = useState(false);
    const [tutorialProgress, setTutorialProgress] = useState([]);

    const tutorial = tutorials[tutorialId];

    useEffect(() => {
        if (tutorial) {
            setTimeLeft(tutorial.steps[0].duration);
            setTutorialProgress(new Array(tutorial.steps.length).fill(false));
        }
    }, [tutorial]);

    useEffect(() => {
        let interval = null;
        if (isPlaying && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0 && isPlaying) {
            setIsPlaying(false);
            if (tutorial.steps[currentStep].type !== 'interactive') {
                handleStepComplete();
            }
        }
        return () => clearInterval(interval);
    }, [isPlaying, timeLeft, currentStep]);

    const handlePlay = () => {
        setIsPlaying(true);
    };

    const handlePause = () => {
        setIsPlaying(false);
    };

    const handleStepComplete = () => {
        const newProgress = [...tutorialProgress];
        newProgress[currentStep] = true;
        setTutorialProgress(newProgress);
        setStepCompleted(true);
        
        if (currentStep === tutorial.steps.length - 1) {
            // Tutorial completed
            onComplete && onComplete(tutorial);
        }
    };

    const handleNextStep = () => {
        if (currentStep < tutorial.steps.length - 1) {
            setCurrentStep(currentStep + 1);
            setTimeLeft(tutorial.steps[currentStep + 1].duration);
            setStepCompleted(false);
            setUserInput('');
            setIsPlaying(false);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setTimeLeft(tutorial.steps[currentStep - 1].duration);
            setStepCompleted(tutorialProgress[currentStep - 1]);
            setUserInput('');
            setIsPlaying(false);
        }
    };

    const handleCommandSubmit = () => {
        const step = tutorial.steps[currentStep];
        if (step.type === 'interactive') {
            // Simple validation - in a real implementation, this would be more sophisticated
            if (userInput.toLowerCase().includes(step.command.toLowerCase()) || 
                userInput.toLowerCase().includes(step.expectedOutput.toLowerCase())) {
                handleStepComplete();
            }
        }
    };

    const handleRestart = () => {
        setCurrentStep(0);
        setTimeLeft(tutorial.steps[0].duration);
        setTutorialProgress(new Array(tutorial.steps.length).fill(false));
        setStepCompleted(false);
        setUserInput('');
        setIsPlaying(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStepIcon = (step) => {
        switch (step.type) {
            case 'explanation': return BookOpen;
            case 'interactive': return Terminal;
            case 'completion': return CheckCircle;
            default: return BookOpen;
        }
    };

    if (!tutorial) {
        return (
            <div className="text-center p-8">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
                <p className="text-gray-400">Tutorial not found</p>
            </div>
        );
    }

    const currentStepData = tutorial.steps[currentStep];
    const StepIcon = getStepIcon(currentStepData);

    return (
        <div className="max-w-4xl mx-auto bg-[#081A2C] border border-[#00ADEE]/30 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#00ADEE] to-blue-600 p-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{tutorial.title}</h2>
                        <p className="text-blue-100 mb-4">{tutorial.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="bg-white/20 px-2 py-1 rounded">{tutorial.difficulty}</span>
                            <span className="flex items-center gap-1">
                                <Eye size={16} />
                                {tutorial.estimatedTime}
                            </span>
                            <span className="flex items-center gap-1">
                                <Target size={16} />
                                {tutorial.xpReward} XP
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Progress</span>
                        <span className="text-sm">{currentStep + 1} / {tutorial.steps.length}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / tutorial.steps.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Step Navigation */}
            <div className="bg-gray-800/50 p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <StepIcon size={20} className="text-[#00ADEE]" />
                        <div>
                            <h3 className="font-semibold text-white">{currentStepData.title}</h3>
                            <p className="text-sm text-gray-400">Step {currentStep + 1}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                            {formatTime(timeLeft)}
                        </span>
                        {currentStepData.type !== 'completion' && (
                            <>
                                {!isPlaying ? (
                                    <button
                                        onClick={handlePlay}
                                        className="p-2 bg-[#00ADEE] hover:bg-blue-600 rounded-lg transition-colors"
                                    >
                                        <Play size={16} className="text-white" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePause}
                                        className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                                    >
                                        <Pause size={16} className="text-white" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="min-h-[300px]"
                    >
                        <div className="prose prose-invert max-w-none">
                            <div className="whitespace-pre-line text-gray-300 leading-relaxed">
                                {currentStepData.content}
                            </div>
                        </div>

                        {/* Interactive Elements */}
                        {currentStepData.type === 'interactive' && (
                            <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                                <h4 className="text-sm font-semibold text-[#00ADEE] mb-3">Try it yourself:</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder="Enter the command or expected output..."
                                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#00ADEE]"
                                        onKeyPress={(e) => e.key === 'Enter' && handleCommandSubmit()}
                                    />
                                    <button
                                        onClick={handleCommandSubmit}
                                        className="bg-[#00ADEE] hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Submit
                                    </button>
                                </div>
                                {stepCompleted && (
                                    <div className="mt-3 flex items-center gap-2 text-green-400">
                                        <CheckCircle size={16} />
                                        <span className="text-sm">Great job! Step completed.</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Completion Message */}
                        {currentStepData.type === 'completion' && (
                            <div className="mt-6 p-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg border border-green-500/30">
                                <div className="text-center">
                                    <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
                                    <h3 className="text-xl font-bold text-green-400 mb-2">Tutorial Completed!</h3>
                                    <p className="text-gray-300 mb-4">You've earned {tutorial.xpReward} XP</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="bg-gray-800/50 p-4 border-t border-gray-700">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button
                            onClick={handleRestart}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            <RotateCcw size={16} />
                            Restart
                        </button>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrevStep}
                            disabled={currentStep === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>
                        
                        {currentStep < tutorial.steps.length - 1 ? (
                            <button
                                onClick={handleNextStep}
                                disabled={currentStepData.type === 'interactive' && !stepCompleted}
                                className="flex items-center gap-2 px-4 py-2 bg-[#00ADEE] hover:bg-blue-600 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg transition-colors"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={() => onComplete && onComplete(tutorial)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                <CheckCircle size={16} />
                                Complete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, 
    CheckCircle, 
    ChevronRight, 
    ChevronLeft,
    Play,
    Pause,
    RotateCcw,
    Award,
    Clock,
    Target,
    X
} from 'lucide-react';

const lessonLibrary = {
    'nmap-basics': {
        id: 'nmap-basics',
        title: 'Nmap Port Scanning Basics',
        description: 'Master the fundamentals of network reconnaissance with Nmap',
        difficulty: 'Beginner',
        estimatedTime: '15 min',
        xpReward: 75,
        category: 'Network Analysis',
        content: [
            {
                type: 'text',
                content: `# Introduction to Nmap

Nmap (Network Mapper) is one of the most essential tools in a security professional's toolkit. It's used for network discovery, security auditing, and vulnerability assessment.

## What you'll learn:
- Basic Nmap commands and syntax
- Different types of scans and when to use them
- How to interpret Nmap results
- Best practices for ethical scanning`
            },
            {
                type: 'code',
                title: 'Basic Host Discovery',
                content: `# Ping scan to discover live hosts
nmap -sn 192.168.1.0/24

# This command will:
# - Send ICMP echo requests
# - Perform TCP SYN to port 443
# - Perform TCP ACK to port 80
# - Send ICMP timestamp request`,
                explanation: 'The -sn flag performs a ping scan without port scanning. This is useful for quickly discovering which hosts are online in a network range.'
            },
            {
                type: 'interactive',
                title: 'Try it yourself',
                task: 'Run a basic port scan on a target',
                command: 'nmap 192.168.1.1',
                expectedKeywords: ['open', 'port', 'tcp'],
                hint: 'Look for open ports in the output'
            },
            {
                type: 'text',
                content: `## Understanding Nmap Output

When Nmap scans a target, it categorizes ports into several states:

- **Open**: A service is actively accepting connections
- **Closed**: Port is accessible but no service is listening
- **Filtered**: Firewall or filter is blocking access
- **Unfiltered**: Port is accessible but state cannot be determined
- **Open|Filtered**: Cannot determine if port is open or filtered
- **Closed|Filtered**: Cannot determine if port is closed or filtered`
            },
            {
                type: 'quiz',
                question: 'What does the -sV flag do in Nmap?',
                options: [
                    'Performs a vulnerability scan',
                    'Enables service version detection',
                    'Scans for viruses',
                    'Validates scan results'
                ],
                correct: 1,
                explanation: 'The -sV flag enables service version detection, which probes open ports to determine what services and versions are running.'
            }
        ]
    },
    'web-vuln-basics': {
        id: 'web-vuln-basics',
        title: 'Web Vulnerability Assessment',
        description: 'Learn to identify and assess common web application vulnerabilities',
        difficulty: 'Intermediate',
        estimatedTime: '25 min',
        xpReward: 100,
        category: 'Web Security',
        content: [
            {
                type: 'text',
                content: `# Web Application Security Fundamentals

Web applications are prime targets for attackers due to their accessibility and the valuable data they often contain. Understanding common vulnerabilities is crucial for both offensive and defensive security.

## OWASP Top 10 Overview:
1. Injection (SQL, NoSQL, OS, LDAP)
2. Broken Authentication
3. Sensitive Data Exposure
4. XML External Entities (XXE)
5. Broken Access Control
6. Security Misconfigurations
7. Cross-Site Scripting (XSS)
8. Insecure Deserialization
9. Using Components with Known Vulnerabilities
10. Insufficient Logging & Monitoring`
            },
            {
                type: 'code',
                title: 'Using Nikto for Web Scanning',
                content: `# Basic Nikto scan
nikto -h http://target.com

# Scan with specific port
nikto -h http://target.com -p 8080

# Save results to file
nikto -h http://target.com -o results.txt

# Scan with specific tuning
nikto -h http://target.com -Tuning 1,2,3`,
                explanation: 'Nikto is a web vulnerability scanner that tests for thousands of potentially dangerous files, outdated software versions, and server misconfigurations.'
            }
        ]
    }
};

export default function LessonContent({ lessonId, onComplete, onClose }) {
    const [currentSection, setCurrentSection] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [interactiveResults, setInteractiveResults] = useState({});
    const [lessonProgress, setLessonProgress] = useState([]);

    const lesson = lessonLibrary[lessonId];

    useEffect(() => {
        if (lesson) {
            setLessonProgress(new Array(lesson.content.length).fill(false));
        }
    }, [lesson]);

    const handleQuizAnswer = (sectionIndex, answerIndex) => {
        setUserAnswers({
            ...userAnswers,
            [sectionIndex]: answerIndex
        });
    };

    const handleInteractiveSubmit = (sectionIndex, userInput) => {
        const section = lesson.content[sectionIndex];
        const isCorrect = section.expectedKeywords.some(keyword => 
            userInput.toLowerCase().includes(keyword.toLowerCase())
        );
        
        setInteractiveResults({
            ...interactiveResults,
            [sectionIndex]: { input: userInput, correct: isCorrect }
        });

        if (isCorrect) {
            markSectionComplete(sectionIndex);
        }
    };

    const markSectionComplete = (sectionIndex) => {
        const newProgress = [...lessonProgress];
        newProgress[sectionIndex] = true;
        setLessonProgress(newProgress);
    };

    const handleNext = () => {
        const currentSectionData = lesson.content[currentSection];
        
        // Auto-complete text sections
        if (currentSectionData.type === 'text' || currentSectionData.type === 'code') {
            markSectionComplete(currentSection);
        }

        if (currentSection < lesson.content.length - 1) {
            setCurrentSection(currentSection + 1);
        } else {
            // Lesson completed
            const completedSections = lessonProgress.filter(Boolean).length;
            const totalSections = lesson.content.length;
            const completionPercentage = (completedSections / totalSections) * 100;
            
            onComplete && onComplete({
                lessonId: lesson.id,
                xpEarned: Math.round((completionPercentage / 100) * lesson.xpReward),
                completionPercentage
            });
        }
    };

    const handlePrevious = () => {
        if (currentSection > 0) {
            setCurrentSection(currentSection - 1);
        }
    };

    if (!lesson) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-400">Lesson not found</p>
            </div>
        );
    }

    const currentSectionData = lesson.content[currentSection];
    const completedSections = lessonProgress.filter(Boolean).length;
    const progressPercentage = (completedSections / lesson.content.length) * 100;

    return (
        <div className="max-w-4xl mx-auto bg-[#081A2C] border border-[#00ADEE]/30 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#00ADEE] to-blue-600 p-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{lesson.title}</h2>
                        <p className="text-blue-100 mb-4">{lesson.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="bg-white/20 px-2 py-1 rounded">{lesson.difficulty}</span>
                            <span className="flex items-center gap-1">
                                <Clock size={16} />
                                {lesson.estimatedTime}
                            </span>
                            <span className="flex items-center gap-1">
                                <Award size={16} />
                                {lesson.xpReward} XP
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
                        <span className="text-sm">{currentSection + 1} / {lesson.content.length}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSection}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Text Content */}
                        {currentSectionData.type === 'text' && (
                            <div className="prose prose-invert max-w-none">
                                <div 
                                    className="text-gray-300 leading-relaxed"
                                    dangerouslySetInnerHTML={{ 
                                        __html: currentSectionData.content.replace(/\n/g, '<br>').replace(/#{1,6} /g, '<h3 class="text-xl font-semibold text-[#00ADEE] mb-4 mt-6">').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') 
                                    }}
                                />
                            </div>
                        )}

                        {/* Code Content */}
                        {currentSectionData.type === 'code' && (
                            <div>
                                <h3 className="text-xl font-semibold text-[#00ADEE] mb-4">{currentSectionData.title}</h3>
                                <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
                                    <pre className="text-green-400 font-mono text-sm overflow-x-auto">
                                        <code>{currentSectionData.content}</code>
                                    </pre>
                                </div>
                                {currentSectionData.explanation && (
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                        <p className="text-blue-300 text-sm">{currentSectionData.explanation}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Interactive Content */}
                        {currentSectionData.type === 'interactive' && (
                            <div>
                                <h3 className="text-xl font-semibold text-[#00ADEE] mb-4">{currentSectionData.title}</h3>
                                <p className="text-gray-300 mb-4">{currentSectionData.task}</p>
                                
                                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Enter your command or result..."
                                            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#00ADEE]"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleInteractiveSubmit(currentSection, e.target.value);
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={(e) => {
                                                const input = e.target.parentElement.querySelector('input');
                                                handleInteractiveSubmit(currentSection, input.value);
                                            }}
                                            className="bg-[#00ADEE] hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                    
                                    {interactiveResults[currentSection] && (
                                        <div className={`p-3 rounded-lg ${
                                            interactiveResults[currentSection].correct 
                                                ? 'bg-green-900/30 border border-green-500/50' 
                                                : 'bg-red-900/30 border border-red-500/50'
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                {interactiveResults[currentSection].correct ? (
                                                    <CheckCircle size={16} className="text-green-400" />
                                                ) : (
                                                    <X size={16} className="text-red-400" />
                                                )}
                                                <span className={`text-sm ${
                                                    interactiveResults[currentSection].correct 
                                                        ? 'text-green-400' 
                                                        : 'text-red-400'
                                                }`}>
                                                    {interactiveResults[currentSection].correct 
                                                        ? 'Correct! Well done.' 
                                                        : `Try again. Hint: ${currentSectionData.hint}`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quiz Content */}
                        {currentSectionData.type === 'quiz' && (
                            <div>
                                <h3 className="text-xl font-semibold text-[#00ADEE] mb-4">Knowledge Check</h3>
                                <p className="text-gray-300 mb-6">{currentSectionData.question}</p>
                                
                                <div className="space-y-3 mb-6">
                                    {currentSectionData.options.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleQuizAnswer(currentSection, index)}
                                            className={`w-full text-left p-4 rounded-lg border transition-all ${
                                                userAnswers[currentSection] === index
                                                    ? 'border-[#00ADEE] bg-[#00ADEE]/10'
                                                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border-2 ${
                                                    userAnswers[currentSection] === index
                                                        ? 'border-[#00ADEE] bg-[#00ADEE]'
                                                        : 'border-gray-500'
                                                }`}>
                                                    {userAnswers[currentSection] === index && (
                                                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                                                    )}
                                                </div>
                                                <span>{option}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {userAnswers[currentSection] !== undefined && (
                                    <div className={`p-4 rounded-lg ${
                                        userAnswers[currentSection] === currentSectionData.correct
                                            ? 'bg-green-900/30 border border-green-500/50'
                                            : 'bg-red-900/30 border border-red-500/50'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {userAnswers[currentSection] === currentSectionData.correct ? (
                                                <CheckCircle size={16} className="text-green-400" />
                                            ) : (
                                                <X size={16} className="text-red-400" />
                                            )}
                                            <span className={`font-medium ${
                                                userAnswers[currentSection] === currentSectionData.correct
                                                    ? 'text-green-400'
                                                    : 'text-red-400'
                                            }`}>
                                                {userAnswers[currentSection] === currentSectionData.correct
                                                    ? 'Correct!'
                                                    : 'Incorrect'
                                                }
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300">{currentSectionData.explanation}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="bg-gray-800/50 p-4 border-t border-gray-700">
                <div className="flex justify-between items-center">
                    <button
                        onClick={handlePrevious}
                        disabled={currentSection === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>
                    
                    <div className="text-sm text-gray-400">
                        Section {currentSection + 1} of {lesson.content.length}
                    </div>
                    
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00ADEE] hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                        {currentSection === lesson.content.length - 1 ? 'Complete' : 'Next'}
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
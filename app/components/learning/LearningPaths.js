'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Target, 
    Lock, 
    CheckCircle, 
    Clock, 
    Award, 
    Users, 
    ChevronRight,
    Play,
    BookOpen,
    Shield,
    Globe,
    Search
} from 'lucide-react';

const learningPaths = [
    {
        id: 'beginner-ethical-hacking',
        title: 'Ethical Hacking Fundamentals',
        description: 'Start your cybersecurity journey with the basics of ethical hacking and penetration testing',
        difficulty: 'Beginner',
        estimatedTime: '4-6 weeks',
        totalLessons: 12,
        totalXP: 1200,
        enrolledUsers: 2847,
        icon: Shield,
        color: 'bg-green-500/10 text-green-400 border-green-500/20',
        activeGlow: 'shadow-[0_0_15px_rgba(74,222,128,0.15)] border-green-500/50',
        barColor: 'bg-green-500 shadow-[0_0_8px_#22c55e]',
        lessons: [
            { id: 1, title: 'Introduction to Ethical Hacking', duration: '30 min', xp: 50, completed: true },
            { id: 2, title: 'Setting Up Your Lab Environment', duration: '45 min', xp: 75, completed: true },
            { id: 3, title: 'Network Fundamentals', duration: '60 min', xp: 100, completed: false },
            { id: 4, title: 'Information Gathering Techniques', duration: '45 min', xp: 75, completed: false },
            { id: 5, title: 'Port Scanning with Nmap', duration: '50 min', xp: 100, completed: false },
            { id: 6, title: 'Vulnerability Assessment', duration: '55 min', xp: 110, completed: false }
        ]
    },
    {
        id: 'web-application-security',
        title: 'Web Application Security',
        description: 'Master web application vulnerabilities and learn to secure modern web applications',
        difficulty: 'Intermediate',
        estimatedTime: '6-8 weeks',
        totalLessons: 16,
        totalXP: 1800,
        enrolledUsers: 1923,
        icon: Globe,
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        activeGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)] border-blue-500/50',
        barColor: 'bg-blue-500 shadow-[0_0_8px_#3b82f6]',
        lessons: [
            { id: 1, title: 'Web Application Architecture', duration: '40 min', xp: 80, completed: false },
            { id: 2, title: 'OWASP Top 10 Overview', duration: '50 min', xp: 100, completed: false },
            { id: 3, title: 'SQL Injection Attacks', duration: '60 min', xp: 120, completed: false },
            { id: 4, title: 'Cross-Site Scripting (XSS)', duration: '55 min', xp: 110, completed: false },
            { id: 5, title: 'Authentication Bypass', duration: '45 min', xp: 90, completed: false },
            { id: 6, title: 'Session Management Flaws', duration: '50 min', xp: 100, completed: false }
        ]
    },
    {
        id: 'network-penetration-testing',
        title: 'Network Penetration Testing',
        description: 'Advanced network security testing techniques and methodologies',
        difficulty: 'Advanced',
        estimatedTime: '8-10 weeks',
        totalLessons: 20,
        totalXP: 2500,
        enrolledUsers: 856,
        icon: Target,
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
        activeGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)] border-red-500/50',
        barColor: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
        lessons: [
            { id: 1, title: 'Network Reconnaissance', duration: '60 min', xp: 120, completed: false },
            { id: 2, title: 'Advanced Scanning Techniques', duration: '70 min', xp: 140, completed: false },
            { id: 3, title: 'Exploitation Frameworks', duration: '80 min', xp: 160, completed: false },
            { id: 4, title: 'Post-Exploitation Techniques', duration: '75 min', xp: 150, completed: false },
            { id: 5, title: 'Privilege Escalation', duration: '65 min', xp: 130, completed: false },
            { id: 6, title: 'Lateral Movement', duration: '70 min', xp: 140, completed: false }
        ]
    },
    {
        id: 'digital-forensics',
        title: 'Digital Forensics & Incident Response',
        description: 'Learn to investigate security incidents and perform digital forensics analysis',
        difficulty: 'Intermediate',
        estimatedTime: '5-7 weeks',
        totalLessons: 14,
        totalXP: 1600,
        enrolledUsers: 1245,
        icon: Search,
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        activeGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)] border-purple-500/50',
        barColor: 'bg-purple-500 shadow-[0_0_8px_#a855f7]',
        lessons: [
            { id: 1, title: 'Forensics Fundamentals', duration: '45 min', xp: 90, completed: false },
            { id: 2, title: 'Evidence Collection', duration: '55 min', xp: 110, completed: false },
            { id: 3, title: 'Memory Analysis', duration: '65 min', xp: 130, completed: false },
            { id: 4, title: 'Network Forensics', duration: '60 min', xp: 120, completed: false },
            { id: 5, title: 'Malware Analysis Basics', duration: '70 min', xp: 140, completed: false },
            { id: 6, title: 'Incident Response Process', duration: '50 min', xp: 100, completed: false }
        ]
    }
];

export default function LearningPaths({ userProgress, setUserProgress }) {
    const [selectedPath, setSelectedPath] = useState(null);
    const [enrolledPaths, setEnrolledPaths] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('rootLab_enrolledPaths');
        if (saved) {
            setEnrolledPaths(JSON.parse(saved));
        }
    }, []);

    const calculatePathProgress = (path) => {
        const completedLessons = path.lessons.filter(lesson => lesson.completed).length;
        return (completedLessons / path.lessons.length) * 100;
    };

    const isPathEnrolled = (pathId) => {
        return enrolledPaths.includes(pathId);
    };

    const enrollInPath = (pathId) => {
        if (!isPathEnrolled(pathId)) {
            const newEnrolled = [...enrolledPaths, pathId];
            setEnrolledPaths(newEnrolled);
            localStorage.setItem('rootLab_enrolledPaths', JSON.stringify(newEnrolled));
        }
    };

    const startLesson = (pathId, lessonId) => {
        console.log(`Starting lesson ${lessonId} in path ${pathId}`);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Beginner': return 'text-green-400 bg-green-950/20 border-green-900/30';
            case 'Intermediate': return 'text-amber-400 bg-amber-950/20 border-amber-900/30';
            case 'Advanced': return 'text-red-400 bg-red-950/20 border-red-900/30';
            default: return 'text-gray-400 bg-gray-900/20 border-gray-800';
        }
    };

    return (
        <div className="space-y-6 font-mono">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
            >
                <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Available Operations</h2>
            </motion.div>

            {/* Learning Paths Grid */}
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                {learningPaths.map((path, index) => {
                    const isSelected = selectedPath === path.id;
                    const enrolled = isPathEnrolled(path.id);
                    return (
                        <motion.div
                            key={path.id}
                            className={`
                              rounded-2xl p-5 md:p-6 border transition-all duration-300 relative group cursor-pointer
                              ${path.color}
                              ${isSelected ? path.activeGlow : 'bg-slate-950/20 hover:border-slate-800'}
                            `}
                            onClick={() => setSelectedPath(selectedPath === path.id ? null : path.id)}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.08 }}
                            whileHover={{ y: -2 }}
                        >
                            {/* Path Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-900 flex items-center justify-center text-white">
                                        <path.icon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white tracking-wide uppercase">{path.title}</h3>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border inline-block mt-1 uppercase ${getDifficultyColor(path.difficulty)}`}>
                                            {path.difficulty}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight 
                                    size={16} 
                                    className={`text-gray-500 group-hover:text-white transition-transform ${isSelected ? 'rotate-90' : ''}`}
                                />
                            </div>

                            {/* Path Info */}
                            <p className="text-xs text-gray-400 mb-4.5 leading-relaxed">{path.description}</p>

                            {/* Path Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-5 border-t border-slate-900/50 pt-4 text-[10px] text-gray-500 uppercase font-semibold">
                                <div className="flex items-center gap-2">
                                    <Clock size={12} className="text-[#00f0ff]" />
                                    {path.estimatedTime}
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen size={12} className="text-purple-400" />
                                    {path.totalLessons} MODULES
                                </div>
                                <div className="flex items-center gap-2">
                                    <Award size={12} className="text-amber-400" />
                                    {path.totalXP} XP VALUE
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={12} className="text-cyan-500" />
                                    {path.enrolledUsers.toLocaleString()} OPERATORS
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {enrolled && (
                                <div className="mb-5 bg-slate-950/40 p-3 rounded-xl border border-slate-900/65">
                                    <div className="flex justify-between items-center mb-1.5 text-[10px]">
                                        <span className="text-gray-500">TASK COMPLETION RATE</span>
                                        <span className="text-white font-bold">{Math.round(calculatePathProgress(path))}%</span>
                                    </div>
                                    <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${path.barColor}`}
                                            style={{ width: `${calculatePathProgress(path)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!enrolled) {
                                        enrollInPath(path.id);
                                    }
                                }}
                                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer uppercase ${
                                    enrolled
                                        ? `bg-cyan-500/10 text-[#00f0ff] border-cyan-500/25 hover:bg-cyan-500/20`
                                        : 'bg-slate-900 hover:bg-slate-800 text-gray-400 hover:text-white border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                {enrolled ? 'CONTINUE OPERATION' : 'INITIALIZE MODULE'}
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mt-6 pt-5 border-t border-slate-900 overflow-hidden"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <h4 className="font-bold text-xs uppercase text-gray-400 mb-3.5 tracking-wider">Module Manifest</h4>
                                        <div className="space-y-2">
                                            {path.lessons.slice(0, 6).map((lesson) => (
                                                <div
                                                    key={lesson.id}
                                                    className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-900/60 rounded-xl hover:border-cyan-500/15 transition-all"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {lesson.completed ? (
                                                            <CheckCircle size={14} className="text-green-400 shrink-0" />
                                                        ) : enrolled ? (
                                                            <Play size={12} className="text-[#00f0ff] shrink-0" />
                                                        ) : (
                                                            <Lock size={12} className="text-gray-650 shrink-0" />
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-gray-250 truncate uppercase">{lesson.title}</p>
                                                            <p className="text-[10px] text-gray-500 mt-0.5">{lesson.duration}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3.5 shrink-0">
                                                        <span className="text-[10px] text-green-400 font-bold font-mono">+{lesson.xp} XP</span>
                                                        {enrolled && !lesson.completed && (
                                                            <button
                                                                onClick={() => startLesson(path.id, lesson.id)}
                                                                className="text-[#00f0ff] hover:text-cyan-300 text-[10px] font-bold border border-cyan-500/20 hover:border-cyan-500/50 bg-cyan-500/5 px-2 py-0.5 rounded cursor-pointer transition-all"
                                                            >
                                                                START
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {path.lessons.length > 6 && (
                                                <p className="text-center text-[10px] text-gray-550 py-2 border-t border-slate-900/30">
                                                    +{path.lessons.length - 6} ADDITIONAL PROTOCOLS STAGED
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* My Learning Paths Active */}
            {enrolledPaths.length > 0 && (
                <motion.div
                    className="glass-panel p-5 rounded-2xl"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <h3 className="text-xs font-bold mb-4 flex items-center gap-2 text-cyan-400 uppercase tracking-widest border-b border-slate-900 pb-3">
                        ACTIVE SYNC PATHWAYS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {learningPaths
                            .filter(path => enrolledPaths.includes(path.id))
                            .map((path) => (
                                <div key={path.id} className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl relative group">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[#00f0ff]">
                                          <path.icon size={16} />
                                        </div>
                                        <h4 className="font-bold text-xs text-white uppercase truncate">{path.title}</h4>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1 text-[9px]">
                                            <span className="text-gray-550">COMPLETED</span>
                                            <span className="text-white font-bold">{Math.round(calculatePathProgress(path))}%</span>
                                        </div>
                                        <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${path.barColor}`}
                                                style={{ width: `${calculatePathProgress(path)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <button 
                                      onClick={() => setSelectedPath(path.id)}
                                      className="w-full py-2 px-3 bg-cyan-500 hover:bg-cyan-450 border border-cyan-500/20 text-black font-bold text-xs rounded-lg uppercase tracking-wider cursor-pointer active:scale-[0.98] transition-all"
                                    >
                                        ENTER MODULE
                                    </button>
                                </div>
                            ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
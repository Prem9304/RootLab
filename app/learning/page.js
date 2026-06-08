'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, Target, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import LearningDashboard from '../components/learning/LearningDashboard';
import LearningPaths from '../components/learning/LearningPaths';
import SkillAssessment from '../components/learning/SkillAssessment';
import Achievements from '../components/learning/Achievements';

export default function LearningPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [userProgress, setUserProgress] = useState(null);

    useEffect(() => {
        const savedProgress = localStorage.getItem('rootLab_learningProgress');
        if (savedProgress) {
            setUserProgress(JSON.parse(savedProgress));
        } else {
            const defaultProgress = {
                totalXP: 0,
                level: 1,
                completedLessons: [],
                skillLevels: {
                    reconnaissance: 0,
                    scanning: 0,
                    exploitation: 0,
                    postExploitation: 0,
                    webSecurity: 0,
                    networkSecurity: 0
                },
                achievements: [],
                currentStreak: 0,
                lastActivity: null
            };
            setUserProgress(defaultProgress);
            localStorage.setItem('rootLab_learningProgress', JSON.stringify(defaultProgress));
        }
    }, []);

    const tabs = [
        { id: 'dashboard', name: 'DASHBOARD', icon: TrendingUp },
        { id: 'paths', name: 'LEARNING PATHS', icon: Target },
        { id: 'assessment', name: 'SKILL EVALS', icon: CheckCircle },
        { id: 'achievements', name: 'ACHIEVEMENTS', icon: Trophy }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <LearningDashboard userProgress={userProgress} setUserProgress={setUserProgress} />;
            case 'paths':
                return <LearningPaths userProgress={userProgress} setUserProgress={setUserProgress} />;
            case 'assessment':
                return <SkillAssessment userProgress={userProgress} setUserProgress={setUserProgress} />;
            case 'achievements':
                return <Achievements userProgress={userProgress} />;
            default:
                return <LearningDashboard userProgress={userProgress} setUserProgress={setUserProgress} />;
        }
    };

    if (!userProgress) {
        return (
            <div className="flex items-center justify-center min-h-[70vh] bg-transparent font-mono text-cyan-400">
                <div className="text-center">
                    <BookOpen size={40} className="mx-auto mb-4 text-[#00f0ff] animate-pulse" />
                    <p className="text-xs uppercase tracking-widest">establishing academy sync link...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full text-white min-h-[calc(100vh-var(--header-height)-3rem)] font-mono relative">
            <div className="cyber-grid-bg"></div>
            
            {/* Page Header */}
            <motion.div
                className="mb-8 border-b border-slate-900 pb-4 relative z-10"
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <span className="text-xs text-cyan-400 uppercase tracking-widest font-semibold block mb-1">TRAINING_FACILITY</span>
                <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                    ACADEMY_CENTER
                </h1>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    Access courses, validate core technical profiles, track operation parameters, and unlock milestone credentials.
                </p>
            </motion.div>

            {/* Quick Stats Grid */}
            <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider">SECURE LEVEL</p>
                        <p className="text-xl font-bold text-white mt-0.5">{userProgress.level}</p>
                    </div>
                    <Trophy className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" size={20} />
                </div>
                <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider">TOTAL SCORE</p>
                        <p className="text-xl font-bold text-green-400 mt-0.5">{userProgress.totalXP} XP</p>
                    </div>
                    <Target className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]" size={20} />
                </div>
                <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider">NODES ENROLLED</p>
                        <p className="text-xl font-bold text-purple-400 mt-0.5">{userProgress.completedLessons.length}</p>
                    </div>
                    <CheckCircle className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]" size={20} />
                </div>
                <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider">STREAK VELOCITY</p>
                        <p className="text-xl font-bold text-orange-400 mt-0.5">{userProgress.currentStreak} Days</p>
                    </div>
                    <Clock className="text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" size={20} />
                </div>
            </motion.div>

            {/* Navigation Tabs */}
            <motion.div
                className="flex flex-wrap gap-1 mb-8 border-b border-slate-900 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all text-xs font-bold border-b-2 cursor-pointer ${
                            activeTab === tab.id
                                ? 'bg-cyan-500/5 text-[#00f0ff] border-[#00f0ff]'
                                : 'text-gray-500 hover:text-gray-300 border-transparent hover:bg-slate-900/30'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.name}
                    </button>
                ))}
            </motion.div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
            >
                {renderTabContent()}
            </motion.div>
        </div>
    );
}
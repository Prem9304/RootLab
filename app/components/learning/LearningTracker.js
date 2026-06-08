'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, 
    Award, 
    Target, 
    Clock, 
    CheckCircle,
    BookOpen,
    Zap
} from 'lucide-react';

export default function LearningTracker() {
    const [learningData, setLearningData] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Load learning progress
        const savedProgress = localStorage.getItem('rootLab_learningProgress');
        if (savedProgress) {
            setLearningData(JSON.parse(savedProgress));
        }

        // Check if user has used tools recently to show learning suggestions
        const toolUsage = localStorage.getItem('rootLab_toolUsage');
        if (toolUsage) {
            const usage = JSON.parse(toolUsage);
            const recentUsage = Object.values(usage).some(lastUsed => 
                Date.now() - lastUsed < 24 * 60 * 60 * 1000 // Within 24 hours
            );
            setIsVisible(recentUsage);
        }
    }, []);

    const trackToolUsage = (toolName) => {
        // Track when tools are used for learning analytics
        const toolUsage = JSON.parse(localStorage.getItem('rootLab_toolUsage') || '{}');
        toolUsage[toolName] = Date.now();
        localStorage.setItem('rootLab_toolUsage', JSON.stringify(toolUsage));

        // Award XP for tool usage
        if (learningData) {
            const newProgress = { ...learningData };
            newProgress.totalXP += 10; // Small XP reward for tool usage
            
            // Update skill levels based on tool category
            const toolSkillMap = {
                'nmap': 'reconnaissance',
                'nikto': 'webSecurity',
                'traceroute': 'networkSecurity',
                'whois': 'reconnaissance',
                'theHarvester': 'reconnaissance'
            };

            const skill = toolSkillMap[toolName.toLowerCase()];
            if (skill && newProgress.skillLevels[skill] !== undefined) {
                newProgress.skillLevels[skill] = Math.min(100, newProgress.skillLevels[skill] + 2);
            }

            // Update activity streak
            const today = new Date().toDateString();
            const lastActivity = newProgress.lastActivity;
            if (lastActivity !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastActivity === yesterday.toDateString()) {
                    newProgress.currentStreak += 1;
                } else {
                    newProgress.currentStreak = 1;
                }
                newProgress.lastActivity = today;
            }

            setLearningData(newProgress);
            localStorage.setItem('rootLab_learningProgress', JSON.stringify(newProgress));
        }
    };

    const suggestLearning = (toolName) => {
        const suggestions = {
            'nmap': {
                title: 'Master Nmap Scanning',
                description: 'Learn advanced Nmap techniques and scripting',
                lessonId: 'nmap-advanced',
                xp: 150
            },
            'nikto': {
                title: 'Web Vulnerability Assessment',
                description: 'Comprehensive web security testing methods',
                lessonId: 'web-vuln-assessment',
                xp: 200
            },
            'default': {
                title: 'Security Tool Mastery',
                description: 'Learn to use security tools effectively',
                lessonId: 'tool-mastery',
                xp: 100
            }
        };

        return suggestions[toolName.toLowerCase()] || suggestions.default;
    };

    // Expose tracking function globally for tools to use
    useEffect(() => {
        window.trackToolUsage = trackToolUsage;
        return () => {
            delete window.trackToolUsage;
        };
    }, [learningData]);

    if (!learningData || !isVisible) {
        return null;
    }

    return (
        <motion.div
            className="fixed bottom-4 right-4 bg-[#081A2C] border border-[#00ADEE]/30 rounded-lg p-4 shadow-lg z-50 max-w-sm"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#00ADEE] rounded-lg">
                    <TrendingUp size={16} className="text-white" />
                </div>
                <div>
                    <h4 className="font-semibold text-white text-sm">Learning Progress</h4>
                    <p className="text-xs text-gray-400">Level {learningData.level}</p>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">XP Progress</span>
                    <span className="text-[#00ADEE]">{learningData.totalXP % 100}/100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                        className="bg-[#00ADEE] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${(learningData.totalXP % 100)}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                <div>
                    <div className="text-green-400 font-semibold">{learningData.currentStreak}</div>
                    <div className="text-gray-400">Streak</div>
                </div>
                <div>
                    <div className="text-purple-400 font-semibold">{learningData.completedLessons.length}</div>
                    <div className="text-gray-400">Lessons</div>
                </div>
                <div>
                    <div className="text-yellow-400 font-semibold">{learningData.achievements.length}</div>
                    <div className="text-gray-400">Awards</div>
                </div>
            </div>

            <button
                onClick={() => window.location.href = '/learning'}
                className="w-full bg-[#00ADEE] hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
                <BookOpen size={14} />
                Continue Learning
            </button>

            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            >
                ×
            </button>
        </motion.div>
    );
}
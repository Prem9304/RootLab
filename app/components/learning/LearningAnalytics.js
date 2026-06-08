'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    BarChart3, 
    TrendingUp, 
    Calendar, 
    Clock, 
    Target,
    Award,
    Zap,
    BookOpen
} from 'lucide-react';

export default function LearningAnalytics({ userProgress }) {
    const [weeklyData, setWeeklyData] = useState([]);
    const [skillTrends, setSkillTrends] = useState([]);
    const [learningStats, setLearningStats] = useState({});

    useEffect(() => {
        if (userProgress) {
            generateAnalytics();
        }
    }, [userProgress]);

    const generateAnalytics = () => {
        // Generate weekly learning data (mock data for demonstration)
        const weekData = [];
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        for (let i = 0; i < 7; i++) {
            weekData.push({
                day: days[i],
                xp: Math.floor(Math.random() * 100) + 20,
                lessons: Math.floor(Math.random() * 3) + 1,
                timeSpent: Math.floor(Math.random() * 120) + 30 // minutes
            });
        }
        setWeeklyData(weekData);

        // Generate skill trend data
        const skills = Object.keys(userProgress.skillLevels);
        const trends = skills.map(skill => ({
            name: skill.replace(/([A-Z])/g, ' $1').trim(),
            current: userProgress.skillLevels[skill],
            previous: Math.max(0, userProgress.skillLevels[skill] - Math.floor(Math.random() * 20)),
            change: Math.floor(Math.random() * 15) + 5
        }));
        setSkillTrends(trends);

        // Calculate learning statistics
        const totalXP = userProgress.totalXP;
        const avgXPPerDay = Math.floor(totalXP / Math.max(1, userProgress.currentStreak || 1));
        const completionRate = Math.floor((userProgress.completedLessons.length / 50) * 100); // Assuming 50 total lessons
        
        setLearningStats({
            totalXP,
            avgXPPerDay,
            completionRate,
            strongestSkill: skills.reduce((a, b) => 
                userProgress.skillLevels[a] > userProgress.skillLevels[b] ? a : b
            ),
            weeklyXP: weekData.reduce((sum, day) => sum + day.xp, 0),
            totalTimeSpent: weekData.reduce((sum, day) => sum + day.timeSpent, 0)
        });
    };

    const getSkillColor = (level) => {
        if (level >= 80) return 'bg-green-500';
        if (level >= 60) return 'bg-yellow-500';
        if (level >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Weekly XP</p>
                            <p className="text-2xl font-bold text-[#00ADEE]">{learningStats.weeklyXP}</p>
                        </div>
                        <Zap className="text-[#00ADEE]" size={24} />
                    </div>
                    <p className="text-xs text-green-400 mt-1">+12% from last week</p>
                </div>

                <div className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Avg XP/Day</p>
                            <p className="text-2xl font-bold text-green-400">{learningStats.avgXPPerDay}</p>
                        </div>
                        <TrendingUp className="text-green-400" size={24} />
                    </div>
                    <p className="text-xs text-green-400 mt-1">Above average</p>
                </div>

                <div className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Time Spent</p>
                            <p className="text-2xl font-bold text-purple-400">{formatTime(learningStats.totalTimeSpent)}</p>
                        </div>
                        <Clock className="text-purple-400" size={24} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">This week</p>
                </div>

                <div className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Completion</p>
                            <p className="text-2xl font-bold text-yellow-400">{learningStats.completionRate}%</p>
                        </div>
                        <Target className="text-yellow-400" size={24} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Overall progress</p>
                </div>
            </motion.div>

            {/* Weekly Activity Chart */}
            <motion.div
                className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="text-[#00ADEE]" size={24} />
                    Weekly Learning Activity
                </h3>
                
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {weeklyData.map((day, index) => (
                        <div key={day.day} className="text-center">
                            <div className="text-xs text-gray-400 mb-2">{day.day}</div>
                            <div 
                                className="bg-[#00ADEE] rounded-lg mx-auto transition-all duration-500 hover:bg-blue-400"
                                style={{ 
                                    height: `${Math.max(20, (day.xp / 120) * 100)}px`,
                                    width: '24px'
                                }}
                                title={`${day.xp} XP, ${day.lessons} lessons, ${day.timeSpent}min`}
                            />
                            <div className="text-xs text-gray-300 mt-1">{day.xp}</div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>XP earned per day</span>
                    <span>Total: {weeklyData.reduce((sum, day) => sum + day.xp, 0)} XP</span>
                </div>
            </motion.div>

            {/* Skill Progress */}
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {/* Skill Levels */}
                <div className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Target className="text-[#00ADEE]" size={24} />
                        Skill Progress
                    </h3>
                    
                    <div className="space-y-4">
                        {skillTrends.map((skill, index) => (
                            <div key={skill.name}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium capitalize">{skill.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-green-400">+{skill.change}%</span>
                                        <span className="text-sm text-gray-400">{skill.current}%</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <motion.div
                                        className={`h-2 rounded-full ${getSkillColor(skill.current)}`}
                                        initial={{ width: `${skill.previous}%` }}
                                        animate={{ width: `${skill.current}%` }}
                                        transition={{ duration: 1, delay: index * 0.1 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Learning Insights */}
                <div className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Award className="text-[#00ADEE]" size={24} />
                        Learning Insights
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={16} className="text-green-400" />
                                <span className="text-sm font-medium text-green-400">Strongest Skill</span>
                            </div>
                            <p className="text-sm text-gray-300 capitalize">
                                {learningStats.strongestSkill?.replace(/([A-Z])/g, ' $1').trim()} 
                                ({userProgress.skillLevels[learningStats.strongestSkill]}%)
                            </p>
                        </div>

                        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={16} className="text-blue-400" />
                                <span className="text-sm font-medium text-blue-400">Learning Streak</span>
                            </div>
                            <p className="text-sm text-gray-300">
                                {userProgress.currentStreak} days of consistent learning
                            </p>
                        </div>

                        <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen size={16} className="text-purple-400" />
                                <span className="text-sm font-medium text-purple-400">Next Milestone</span>
                            </div>
                            <p className="text-sm text-gray-300">
                                {100 - (userProgress.totalXP % 100)} XP to level {userProgress.level + 1}
                            </p>
                        </div>

                        <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={16} className="text-yellow-400" />
                                <span className="text-sm font-medium text-yellow-400">Recommendation</span>
                            </div>
                            <p className="text-sm text-gray-300">
                                Focus on Web Security to balance your skill set
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
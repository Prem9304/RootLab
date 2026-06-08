'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Trophy, 
    Award, 
    Target, 
    Shield, 
    Zap, 
    Star,
    Lock,
    CheckCircle,
    Clock,
    TrendingUp,
    Users,
    Flame
} from 'lucide-react';

const achievementCategories = [
    {
        id: 'learning',
        name: 'Learning Milestones',
        icon: Trophy,
        color: 'from-yellow-500 to-orange-500'
    },
    {
        id: 'skills',
        name: 'Skill Mastery',
        icon: Target,
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'tools',
        name: 'Tool Expertise',
        icon: Shield,
        color: 'from-green-500 to-emerald-500'
    },
    {
        id: 'special',
        name: 'Special Achievements',
        icon: Star,
        color: 'from-purple-500 to-pink-500'
    }
];

const achievements = [
    // Learning Milestones
    {
        id: 'first-lesson',
        category: 'learning',
        title: 'First Steps',
        description: 'Complete your first lesson',
        icon: Trophy,
        rarity: 'common',
        xpReward: 25,
        requirement: 'Complete 1 lesson',
        unlocked: true,
        progress: 100,
        unlockedDate: new Date('2024-01-15')
    },
    {
        id: 'lesson-streak-7',
        category: 'learning',
        title: 'Week Warrior',
        description: 'Complete lessons for 7 consecutive days',
        icon: Flame,
        rarity: 'uncommon',
        xpReward: 100,
        requirement: '7-day learning streak',
        unlocked: false,
        progress: 42,
        unlockedDate: null
    },
    {
        id: 'lesson-master',
        category: 'learning',
        title: 'Lesson Master',
        description: 'Complete 50 lessons',
        icon: Award,
        rarity: 'rare',
        xpReward: 250,
        requirement: 'Complete 50 lessons',
        unlocked: false,
        progress: 24,
        unlockedDate: null
    },

    // Skill Mastery
    {
        id: 'recon-expert',
        category: 'skills',
        title: 'Reconnaissance Expert',
        description: 'Achieve 90% skill level in Reconnaissance',
        icon: Target,
        rarity: 'rare',
        xpReward: 200,
        requirement: '90% skill level in Reconnaissance',
        unlocked: false,
        progress: 67,
        unlockedDate: null
    },
    {
        id: 'web-security-master',
        category: 'skills',
        title: 'Web Security Master',
        description: 'Achieve 95% skill level in Web Security',
        icon: Shield,
        rarity: 'epic',
        xpReward: 300,
        requirement: '95% skill level in Web Security',
        unlocked: false,
        progress: 23,
        unlockedDate: null
    },
    {
        id: 'all-skills-70',
        category: 'skills',
        title: 'Well Rounded',
        description: 'Achieve 70% in all skill categories',
        icon: TrendingUp,
        rarity: 'epic',
        xpReward: 400,
        requirement: '70% in all skills',
        unlocked: false,
        progress: 33,
        unlockedDate: null
    },

    // Tool Expertise
    {
        id: 'nmap-novice',
        category: 'tools',
        title: 'Nmap Novice',
        description: 'Use Nmap 10 times',
        icon: Target,
        rarity: 'common',
        xpReward: 50,
        requirement: 'Use Nmap 10 times',
        unlocked: true,
        progress: 100,
        unlockedDate: new Date('2024-01-20')
    },
    {
        id: 'tool-collector',
        category: 'tools',
        title: 'Tool Collector',
        description: 'Use 15 different security tools',
        icon: Shield,
        rarity: 'uncommon',
        xpReward: 150,
        requirement: 'Use 15 different tools',
        unlocked: false,
        progress: 60,
        unlockedDate: null
    },
    {
        id: 'metasploit-master',
        category: 'tools',
        title: 'Metasploit Master',
        description: 'Successfully exploit 25 vulnerabilities',
        icon: Zap,
        rarity: 'rare',
        xpReward: 300,
        requirement: 'Exploit 25 vulnerabilities',
        unlocked: false,
        progress: 12,
        unlockedDate: null
    },

    // Special Achievements
    {
        id: 'early-adopter',
        category: 'special',
        title: 'Early Adopter',
        description: 'Join RootLab in its first month',
        icon: Star,
        rarity: 'legendary',
        xpReward: 500,
        requirement: 'Join in first month',
        unlocked: true,
        progress: 100,
        unlockedDate: new Date('2024-01-10')
    },
    {
        id: 'night-owl',
        category: 'special',
        title: 'Night Owl',
        description: 'Complete 10 lessons between 10 PM and 6 AM',
        icon: Clock,
        rarity: 'uncommon',
        xpReward: 100,
        requirement: 'Complete 10 lessons at night',
        unlocked: false,
        progress: 30,
        unlockedDate: null
    },
    {
        id: 'community-helper',
        category: 'special',
        title: 'Community Helper',
        description: 'Help 5 other users in the community',
        icon: Users,
        rarity: 'rare',
        xpReward: 200,
        requirement: 'Help 5 community members',
        unlocked: false,
        progress: 0,
        unlockedDate: null
    }
];

export default function Achievements({ userProgress }) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredAchievements, setFilteredAchievements] = useState(achievements);

    useEffect(() => {
        if (selectedCategory === 'all') {
            setFilteredAchievements(achievements);
        } else {
            setFilteredAchievements(achievements.filter(achievement => achievement.category === selectedCategory));
        }
    }, [selectedCategory]);

    const getRarityColor = (rarity) => {
        switch (rarity) {
            case 'common': return 'border-gray-500 bg-gray-900/30';
            case 'uncommon': return 'border-green-500 bg-green-900/30';
            case 'rare': return 'border-blue-500 bg-blue-900/30';
            case 'epic': return 'border-purple-500 bg-purple-900/30';
            case 'legendary': return 'border-yellow-500 bg-yellow-900/30';
            default: return 'border-gray-500 bg-gray-900/30';
        }
    };

    const getRarityTextColor = (rarity) => {
        switch (rarity) {
            case 'common': return 'text-gray-400';
            case 'uncommon': return 'text-green-400';
            case 'rare': return 'text-blue-400';
            case 'epic': return 'text-purple-400';
            case 'legendary': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const formatDate = (date) => {
        return date ? date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        }) : '';
    };

    const unlockedAchievements = achievements.filter(a => a.unlocked);
    const totalAchievements = achievements.length;
    const completionPercentage = Math.round((unlockedAchievements.length / totalAchievements) * 100);

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <motion.div
                className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-[#00ADEE] mb-1">
                            {unlockedAchievements.length}
                        </div>
                        <div className="text-sm text-gray-400">Unlocked</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-400 mb-1">
                            {totalAchievements}
                        </div>
                        <div className="text-sm text-gray-400">Total</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-400 mb-1">
                            {completionPercentage}%
                        </div>
                        <div className="text-sm text-gray-400">Complete</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-400 mb-1">
                            {unlockedAchievements.reduce((sum, a) => sum + a.xpReward, 0)}
                        </div>
                        <div className="text-sm text-gray-400">XP Earned</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Overall Progress</span>
                        <span className="text-sm font-medium">{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-[#00ADEE] to-blue-400 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Category Filter */}
            <motion.div
                className="flex flex-wrap gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedCategory === 'all'
                            ? 'bg-[#00ADEE] text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                >
                    All Achievements
                </button>
                {achievementCategories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                            selectedCategory === category.id
                                ? 'bg-[#00ADEE] text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                        <category.icon size={16} />
                        {category.name}
                    </button>
                ))}
            </motion.div>

            {/* Achievements Grid */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {filteredAchievements.map((achievement, index) => (
                    <motion.div
                        key={achievement.id}
                        className={`relative rounded-lg border p-6 transition-all duration-300 ${
                            achievement.unlocked 
                                ? `${getRarityColor(achievement.rarity)} hover:shadow-lg` 
                                : 'border-gray-700 bg-gray-900/30 opacity-75'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        whileHover={achievement.unlocked ? { scale: 1.02 } : {}}
                    >
                        {/* Rarity Indicator */}
                        <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full capitalize ${getRarityColor(achievement.rarity)} ${getRarityTextColor(achievement.rarity)}`}>
                            {achievement.rarity}
                        </div>

                        {/* Achievement Icon */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-lg ${achievement.unlocked ? 'bg-[#00ADEE]' : 'bg-gray-700'}`}>
                                {achievement.unlocked ? (
                                    <achievement.icon size={24} className="text-white" />
                                ) : (
                                    <Lock size={24} className="text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-semibold ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
                                    {achievement.title}
                                </h3>
                                <p className={`text-sm ${achievement.unlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {achievement.description}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar (for unlocked achievements) */}
                        {!achievement.unlocked && (
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-500">Progress</span>
                                    <span className="text-xs text-gray-500">{achievement.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div
                                        className="bg-gray-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${achievement.progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Achievement Details */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className={achievement.unlocked ? 'text-gray-400' : 'text-gray-600'}>
                                    Requirement:
                                </span>
                                <span className={achievement.unlocked ? 'text-gray-300' : 'text-gray-500'}>
                                    {achievement.requirement}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className={achievement.unlocked ? 'text-gray-400' : 'text-gray-600'}>
                                    Reward:
                                </span>
                                <span className="text-green-400 font-medium">
                                    +{achievement.xpReward} XP
                                </span>
                            </div>
                            {achievement.unlocked && achievement.unlockedDate && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Unlocked:</span>
                                    <span className="text-[#00ADEE]">
                                        {formatDate(achievement.unlockedDate)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Unlocked Badge */}
                        {achievement.unlocked && (
                            <div className="absolute -top-2 -left-2">
                                <CheckCircle size={20} className="text-green-400 bg-[#081A2C] rounded-full" />
                            </div>
                        )}
                    </motion.div>
                ))}
            </motion.div>

            {/* Recent Achievements */}
            {unlockedAchievements.length > 0 && (
                <motion.div
                    className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={24} />
                        Recent Achievements
                    </h3>
                    <div className="space-y-3">
                        {unlockedAchievements
                            .sort((a, b) => new Date(b.unlockedDate) - new Date(a.unlockedDate))
                            .slice(0, 3)
                            .map((achievement) => (
                                <div key={achievement.id} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                                    <achievement.icon size={20} className={getRarityTextColor(achievement.rarity)} />
                                    <div className="flex-1">
                                        <p className="font-medium">{achievement.title}</p>
                                        <p className="text-sm text-gray-400">{achievement.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-green-400 font-medium">+{achievement.xpReward} XP</p>
                                        <p className="text-xs text-gray-500">{formatDate(achievement.unlockedDate)}</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
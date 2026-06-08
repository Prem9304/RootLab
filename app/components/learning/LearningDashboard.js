'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, 
    BookOpen, 
    Target, 
    Clock, 
    Award,
    ChevronRight,
    Play,
    CheckCircle,
    BarChart3
} from 'lucide-react';
import LearningAnalytics from './LearningAnalytics';

const SkillGauge = ({ skillName, percentage }) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getGlowColor = (pct) => {
    if (pct >= 85) return 'stroke-green-400';
    if (pct >= 60) return 'stroke-amber-400';
    if (pct >= 40) return 'stroke-orange-400';
    return 'stroke-red-400';
  };

  const getTextColor = (pct) => {
    if (pct >= 85) return 'text-green-400';
    if (pct >= 60) return 'text-amber-400';
    if (pct >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="flex flex-col items-center justify-center p-3.5 bg-slate-950/30 border border-slate-900 rounded-xl">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Background track circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            className="stroke-slate-800/80"
            strokeWidth="3.5"
            fill="transparent"
          />
          {/* Animated active arc */}
          <motion.circle
            cx="32"
            cy="32"
            r={radius}
            className={`${getGlowColor(percentage)}`}
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <span className={`absolute text-xs font-bold font-mono ${getTextColor(percentage)}`}>
          {percentage}%
        </span>
      </div>
      <span className="text-[9px] text-gray-500 font-bold font-mono tracking-widest mt-2 uppercase text-center block max-w-full truncate">
        {skillName.replace(/([A-Z])/g, ' $1').trim()}
      </span>
    </div>
  );
};

export default function LearningDashboard({ userProgress, setUserProgress }) {
    const [recentActivity, setRecentActivity] = useState([]);
    const [recommendedLessons, setRecommendedLessons] = useState([]);

    useEffect(() => {
        loadRecentActivity();
        loadRecommendations();
    }, [userProgress]);

    const loadRecentActivity = () => {
        const activities = [
            {
                id: 1,
                type: 'lesson_completed',
                title: 'Nmap Port Scanning Basics',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                xp: 50,
                icon: CheckCircle,
                color: 'text-green-400 bg-green-500/10'
            },
            {
                id: 2,
                type: 'tool_used',
                title: 'Used Nikto Web Scanner',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
                xp: 25,
                icon: Target,
                color: 'text-cyan-400 bg-cyan-500/10'
            },
            {
                id: 3,
                type: 'achievement_unlocked',
                title: 'First Vulnerability Found',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                xp: 100,
                icon: Award,
                color: 'text-amber-400 bg-amber-500/10'
            }
        ];
        setRecentActivity(activities);
    };

    const loadRecommendations = () => {
        const lessons = [
            {
                id: 'web-vuln-basics',
                title: 'Web Vulnerability Assessment',
                description: 'Learn to identify common web vulnerabilities using automated tools',
                difficulty: 'Beginner',
                estimatedTime: '30 min',
                xpReward: 75,
                category: 'Web Security',
                prerequisites: ['nmap-basics'],
                isRecommended: true
            },
            {
                id: 'sql-injection-intro',
                title: 'SQL Injection Fundamentals',
                description: 'Understanding and exploiting SQL injection vulnerabilities',
                difficulty: 'Intermediate',
                estimatedTime: '45 min',
                xpReward: 100,
                category: 'Web Security',
                prerequisites: ['web-vuln-basics'],
                isRecommended: true
            },
            {
                id: 'network-pivoting',
                title: 'Network Pivoting Techniques',
                description: 'Advanced techniques for lateral movement in networks',
                difficulty: 'Advanced',
                estimatedTime: '60 min',
                xpReward: 150,
                category: 'Network Security',
                prerequisites: ['nmap-basics', 'metasploit-intro'],
                isRecommended: false
            }
        ];
        setRecommendedLessons(lessons);
    };

    const calculateLevelProgress = () => {
        const xpForNextLevel = userProgress.level * 100;
        const currentLevelXP = userProgress.totalXP % 100;
        return (currentLevelXP / xpForNextLevel) * 100;
    };

    const startLesson = (lessonId) => {
        console.log('Starting lesson:', lessonId);
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return 'Just now';
    };

    return (
        <div className="space-y-6 font-mono">
            {/* Progress Overview */}
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Level Progress */}
                <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-[#00f0ff] uppercase tracking-wide">
                        <TrendingUp size={16} />
                        LEVEL METRICS
                    </h3>
                    <div className="space-y-4 pt-1">
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-white">LEVEL {userProgress.level}</span>
                            <span className="text-xs text-gray-500 font-bold">
                              {userProgress.totalXP % 100} / 100 XP
                            </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                            <motion.div
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${calculateLevelProgress()}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest text-right">
                            {100 - (userProgress.totalXP % 100)} XP until next promotion
                        </p>
                    </div>
                </div>

                {/* Skill Circular Gauges */}
                <div className="glass-panel p-5 rounded-2xl">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-purple-400 uppercase tracking-wide">
                        <Target size={16} />
                        DIAGNOSTIC RADAR
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {Object.entries(userProgress.skillLevels).map(([skill, level]) => (
                            <SkillGauge key={skill} skillName={skill} percentage={level} />
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Recent Activity & Recommendations */}
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                {/* Recent Activity */}
                <div className="glass-panel p-5 rounded-2xl">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-cyan-400 uppercase tracking-wide">
                        <Clock size={16} />
                        CONSOLE_LOGS.TXT
                    </h3>
                    <div className="space-y-3">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-3.5 p-3 bg-slate-950/40 border border-slate-900/60 rounded-xl">
                                <div className={`p-2 rounded-lg ${activity.color}`}>
                                    <activity.icon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-250 truncate uppercase tracking-tight">{activity.title}</p>
                                    <p className="text-[10px] text-gray-550 mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                                </div>
                                <span className="text-xs text-green-400 font-bold shrink-0">+{activity.xp} XP</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommended Lessons */}
                <div className="glass-panel p-5 rounded-2xl">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-amber-400 uppercase tracking-wide">
                        <BookOpen size={16} />
                        PROPOSED MODULE TARGETS
                    </h3>
                    <div className="space-y-3">
                        {recommendedLessons.filter(lesson => lesson.isRecommended).map((lesson) => (
                            <div key={lesson.id} className="p-3.5 bg-slate-950/40 border border-slate-900 hover:border-cyan-500/25 rounded-xl transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-xs text-gray-250 uppercase group-hover:text-[#00f0ff] transition-colors">{lesson.title}</h4>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                                        lesson.difficulty === 'Beginner' ? 'text-green-400 bg-green-950/20 border border-green-900/20' :
                                        lesson.difficulty === 'Intermediate' ? 'text-amber-400 bg-amber-950/20 border border-amber-900/20' :
                                        'text-red-400 bg-red-950/20 border border-red-900/20'
                                    }`}>
                                        {lesson.difficulty}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{lesson.description}</p>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-900/50">
                                    <div className="flex items-center gap-3 text-[10px] text-gray-550">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} className="text-[#00f0ff]" />
                                            {lesson.estimatedTime}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Award size={12} className="text-purple-400" />
                                            {lesson.xpReward} XP
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => startLesson(lesson.id)}
                                        className="flex items-center gap-1 text-[#00f0ff] hover:text-cyan-300 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        <Play size={12} />
                                        LAUNCH
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                className="glass-panel p-5 rounded-2xl"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            >
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-200">QUICK OPERATION LINKS</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center gap-3 p-3.5 bg-slate-950/50 hover:bg-cyan-500/5 border border-slate-800 hover:border-cyan-500/30 rounded-xl transition-all cursor-pointer group text-left">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-all">
                          <Play size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-xs text-white uppercase">RESUME SESSION</p>
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">Resume your last lesson module</p>
                        </div>
                        <ChevronRight size={14} className="ml-auto text-gray-600 group-hover:text-[#00f0ff] transition-colors" />
                    </button>
                    <button className="flex items-center gap-3 p-3.5 bg-slate-950/50 hover:bg-green-500/5 border border-slate-800 hover:border-green-500/30 rounded-xl transition-all cursor-pointer group text-left">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-105 transition-all">
                          <Target size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-xs text-white uppercase">ASSESS METRICS</p>
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">Initiate skill validation quizzes</p>
                        </div>
                        <ChevronRight size={14} className="ml-auto text-gray-600 group-hover:text-green-400 transition-colors" />
                    </button>
                    <button className="flex items-center gap-3 p-3.5 bg-slate-950/50 hover:bg-purple-500/5 border border-slate-800 hover:border-purple-500/30 rounded-xl transition-all cursor-pointer group text-left">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-all">
                          <BookOpen size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-xs text-white uppercase">ACADEMY MAP</p>
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">Explore structured learning paths</p>
                        </div>
                        <ChevronRight size={14} className="ml-auto text-gray-600 group-hover:text-purple-400 transition-colors" />
                    </button>
                </div>
            </motion.div>

            {/* Learning Analytics */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="space-y-4"
            >
                <div className="pt-2">
                    <h3 className="text-sm font-bold mb-1 flex items-center gap-2 text-[#00f0ff] uppercase tracking-wide">
                        <BarChart3 size={16} />
                        ANALYTICS ENGINE
                    </h3>
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Real-time performance evaluation datasets</p>
                </div>
                <div className="glass-panel p-2.5 rounded-2xl">
                  <LearningAnalytics userProgress={userProgress} />
                </div>
            </motion.div>
        </div>
    );
}
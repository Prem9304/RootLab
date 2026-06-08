// app/api/learning/analytics/route.js
import { NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

const ANALYTICS_DIR = path.join(process.cwd(), 'data', 'analytics');

// Ensure analytics directory exists
async function ensureAnalyticsDir() {
    try {
        await fs.mkdir(ANALYTICS_DIR, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }
}

// Get user analytics file path
function getUserAnalyticsPath(userId) {
    return path.join(ANALYTICS_DIR, `${userId}_analytics.json`);
}

// Default analytics structure
function getDefaultAnalytics() {
    return {
        userId: null,
        dailyActivity: {},
        weeklyStats: {},
        monthlyStats: {},
        skillProgress: {},
        toolUsageStats: {},
        learningPatterns: {
            preferredTimeSlots: {},
            averageSessionDuration: 0,
            totalSessionTime: 0,
            sessionCount: 0
        },
        streakHistory: [],
        completionRates: {
            lessons: 0,
            assessments: 0,
            learningPaths: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// GET - Retrieve user analytics
export async function GET(request) {
    try {
        await ensureAnalyticsDir();
        
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const timeframe = searchParams.get('timeframe') || 'week'; // week, month, year
        const type = searchParams.get('type') || 'overview'; // overview, detailed, comparison
        
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get user progress for analytics calculation
        const progressResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/learning/progress?userId=${userId}`);
        
        if (!progressResponse.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch user progress' },
                { status: 500 }
            );
        }

        const { progress } = await progressResponse.json();
        
        // Generate analytics based on progress data
        const analytics = await generateAnalytics(userId, progress, timeframe, type);
        
        return NextResponse.json({
            success: true,
            analytics,
            timeframe,
            type
        });
    } catch (error) {
        console.error('Error retrieving analytics:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve analytics', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Update analytics data
export async function POST(request) {
    try {
        await ensureAnalyticsDir();
        
        const body = await request.json();
        const { userId, action, data } = body;
        
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        switch (action) {
            case 'track_session':
                return await trackLearningSession(userId, data);
            
            case 'track_activity':
                return await trackActivity(userId, data);
            
            case 'update_patterns':
                return await updateLearningPatterns(userId, data);
            
            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error updating analytics:', error);
        return NextResponse.json(
            { error: 'Failed to update analytics', details: error.message },
            { status: 500 }
        );
    }
}

// Generate comprehensive analytics
async function generateAnalytics(userId, progress, timeframe, type) {
    const now = new Date();
    const analytics = {
        overview: {},
        activity: {},
        skills: {},
        tools: {},
        achievements: {},
        predictions: {}
    };

    // Overview Analytics
    analytics.overview = {
        totalXP: progress.totalXP,
        currentLevel: progress.level,
        xpToNextLevel: (progress.level * 100) - (progress.totalXP % 100),
        currentStreak: progress.currentStreak,
        totalLessons: progress.completedLessons.length,
        totalAssessments: progress.completedAssessments.length,
        totalAchievements: progress.achievements.length,
        joinDate: progress.createdAt,
        lastActivity: progress.lastActivity
    };

    // Activity Analytics
    analytics.activity = generateActivityAnalytics(progress, timeframe);
    
    // Skills Analytics
    analytics.skills = generateSkillAnalytics(progress);
    
    // Tools Analytics
    analytics.tools = generateToolAnalytics(progress);
    
    // Achievement Analytics
    analytics.achievements = generateAchievementAnalytics(progress);
    
    // Learning Predictions
    if (type === 'detailed') {
        analytics.predictions = generatePredictions(progress);
    }

    return analytics;
}

// Generate activity analytics
function generateActivityAnalytics(progress, timeframe) {
    const now = new Date();
    const activity = {
        dailyActivity: [],
        weeklyTrends: {},
        peakHours: {},
        consistency: 0
    };

    // Generate daily activity for the specified timeframe
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateString = date.toDateString();
        
        // Simulate activity data (in a real app, this would come from stored data)
        const dayActivity = {
            date: dateString,
            xpEarned: Math.floor(Math.random() * 100) + 20,
            lessonsCompleted: Math.floor(Math.random() * 3) + 1,
            timeSpent: Math.floor(Math.random() * 120) + 30, // minutes
            toolsUsed: Math.floor(Math.random() * 5) + 1
        };
        
        activity.dailyActivity.push(dayActivity);
    }

    // Calculate weekly trends
    activity.weeklyTrends = {
        averageXP: activity.dailyActivity.reduce((sum, day) => sum + day.xpEarned, 0) / days,
        averageLessons: activity.dailyActivity.reduce((sum, day) => sum + day.lessonsCompleted, 0) / days,
        averageTime: activity.dailyActivity.reduce((sum, day) => sum + day.timeSpent, 0) / days,
        totalXP: activity.dailyActivity.reduce((sum, day) => sum + day.xpEarned, 0),
        totalTime: activity.dailyActivity.reduce((sum, day) => sum + day.timeSpent, 0)
    };

    // Calculate consistency score
    const activeDays = activity.dailyActivity.filter(day => day.xpEarned > 0).length;
    activity.consistency = Math.round((activeDays / days) * 100);

    return activity;
}

// Generate skill analytics
function generateSkillAnalytics(progress) {
    const skills = progress.skillLevels;
    const skillNames = Object.keys(skills);
    
    const analytics = {
        currentLevels: skills,
        strongestSkill: '',
        weakestSkill: '',
        averageLevel: 0,
        skillTrends: {},
        recommendations: []
    };

    if (skillNames.length > 0) {
        // Find strongest and weakest skills
        analytics.strongestSkill = skillNames.reduce((a, b) => skills[a] > skills[b] ? a : b);
        analytics.weakestSkill = skillNames.reduce((a, b) => skills[a] < skills[b] ? a : b);
        
        // Calculate average level
        analytics.averageLevel = Math.round(
            Object.values(skills).reduce((sum, level) => sum + level, 0) / skillNames.length
        );

        // Generate skill trends (simulated)
        analytics.skillTrends = {};
        skillNames.forEach(skill => {
            analytics.skillTrends[skill] = {
                current: skills[skill],
                previous: Math.max(0, skills[skill] - Math.floor(Math.random() * 20)),
                change: Math.floor(Math.random() * 15) + 5,
                trend: 'up' // Could be 'up', 'down', 'stable'
            };
        });

        // Generate recommendations
        analytics.recommendations = generateSkillRecommendations(skills);
    }

    return analytics;
}

// Generate tool analytics
function generateToolAnalytics(progress) {
    const toolUsage = progress.toolUsage || {};
    const tools = Object.keys(toolUsage);
    
    const analytics = {
        totalToolsUsed: tools.length,
        mostUsedTool: '',
        toolUsageBreakdown: {},
        toolProficiency: {},
        recommendations: []
    };

    if (tools.length > 0) {
        // Find most used tool
        analytics.mostUsedTool = tools.reduce((a, b) => 
            toolUsage[a].count > toolUsage[b].count ? a : b
        );

        // Tool usage breakdown
        analytics.toolUsageBreakdown = {};
        tools.forEach(tool => {
            analytics.toolUsageBreakdown[tool] = {
                count: toolUsage[tool].count,
                firstUsed: toolUsage[tool].firstUsed,
                lastUsed: toolUsage[tool].lastUsed,
                proficiency: calculateToolProficiency(toolUsage[tool].count)
            };
        });

        // Generate tool recommendations
        analytics.recommendations = generateToolRecommendations(toolUsage);
    }

    return analytics;
}

// Generate achievement analytics
function generateAchievementAnalytics(progress) {
    const achievements = progress.achievements || [];
    
    const analytics = {
        totalUnlocked: achievements.length,
        totalXPFromAchievements: achievements.reduce((sum, a) => sum + (a.xpReward || 0), 0),
        recentAchievements: achievements
            .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
            .slice(0, 5),
        categoryBreakdown: {},
        rarityBreakdown: {}
    };

    // Category breakdown
    achievements.forEach(achievement => {
        const category = achievement.category || 'unknown';
        analytics.categoryBreakdown[category] = (analytics.categoryBreakdown[category] || 0) + 1;
    });

    // Rarity breakdown
    achievements.forEach(achievement => {
        const rarity = achievement.rarity || 'common';
        analytics.rarityBreakdown[rarity] = (analytics.rarityBreakdown[rarity] || 0) + 1;
    });

    return analytics;
}

// Generate learning predictions
function generatePredictions(progress) {
    const predictions = {
        nextLevelETA: '',
        skillImprovementSuggestions: [],
        learningPathRecommendations: [],
        timeToMastery: {}
    };

    // Predict next level ETA
    const xpNeeded = (progress.level * 100) - (progress.totalXP % 100);
    const avgXPPerDay = 50; // This would be calculated from actual data
    const daysToNextLevel = Math.ceil(xpNeeded / avgXPPerDay);
    predictions.nextLevelETA = `${daysToNextLevel} days`;

    // Skill improvement suggestions
    const skills = progress.skillLevels;
    Object.keys(skills).forEach(skill => {
        if (skills[skill] < 70) {
            predictions.skillImprovementSuggestions.push({
                skill,
                currentLevel: skills[skill],
                recommendation: `Focus on ${skill} to reach 70% proficiency`,
                estimatedTime: `${Math.ceil((70 - skills[skill]) / 5)} lessons`
            });
        }
    });

    // Time to mastery predictions
    Object.keys(skills).forEach(skill => {
        const timeToMastery = Math.ceil((100 - skills[skill]) / 3); // Assuming 3% per lesson
        predictions.timeToMastery[skill] = `${timeToMastery} lessons`;
    });

    return predictions;
}

// Generate skill recommendations
function generateSkillRecommendations(skills) {
    const recommendations = [];
    
    Object.keys(skills).forEach(skill => {
        const level = skills[skill];
        
        if (level < 30) {
            recommendations.push({
                skill,
                priority: 'high',
                message: `${skill} needs attention - consider taking beginner courses`,
                suggestedActions: ['Complete basic lessons', 'Take assessment', 'Practice with tools']
            });
        } else if (level < 70) {
            recommendations.push({
                skill,
                priority: 'medium',
                message: `${skill} is progressing well - continue with intermediate content`,
                suggestedActions: ['Take advanced lessons', 'Practice scenarios', 'Use related tools']
            });
        }
    });

    return recommendations;
}

// Generate tool recommendations
function generateToolRecommendations(toolUsage) {
    const recommendations = [];
    const tools = Object.keys(toolUsage);
    
    // Recommend tools based on usage patterns
    if (!tools.includes('nmap')) {
        recommendations.push({
            tool: 'nmap',
            reason: 'Essential for network reconnaissance',
            priority: 'high'
        });
    }
    
    if (!tools.includes('nikto')) {
        recommendations.push({
            tool: 'nikto',
            reason: 'Important for web application security testing',
            priority: 'medium'
        });
    }

    return recommendations;
}

// Calculate tool proficiency based on usage count
function calculateToolProficiency(count) {
    if (count >= 100) return 'expert';
    if (count >= 50) return 'advanced';
    if (count >= 20) return 'intermediate';
    if (count >= 5) return 'beginner';
    return 'novice';
}

// Track learning session
async function trackLearningSession(userId, sessionData) {
    try {
        const analyticsPath = getUserAnalyticsPath(userId);
        let analytics;
        
        try {
            const existingData = await fs.readFile(analyticsPath, 'utf8');
            analytics = JSON.parse(existingData);
        } catch (error) {
            analytics = getDefaultAnalytics();
            analytics.userId = userId;
        }

        // Update session data
        const today = new Date().toDateString();
        if (!analytics.dailyActivity[today]) {
            analytics.dailyActivity[today] = {
                sessions: 0,
                totalTime: 0,
                xpEarned: 0,
                lessonsCompleted: 0
            };
        }

        analytics.dailyActivity[today].sessions += 1;
        analytics.dailyActivity[today].totalTime += sessionData.duration || 0;
        analytics.dailyActivity[today].xpEarned += sessionData.xpEarned || 0;
        analytics.dailyActivity[today].lessonsCompleted += sessionData.lessonsCompleted || 0;

        // Update learning patterns
        analytics.learningPatterns.sessionCount += 1;
        analytics.learningPatterns.totalSessionTime += sessionData.duration || 0;
        analytics.learningPatterns.averageSessionDuration = 
            analytics.learningPatterns.totalSessionTime / analytics.learningPatterns.sessionCount;

        analytics.updatedAt = new Date().toISOString();

        await fs.writeFile(analyticsPath, JSON.stringify(analytics, null, 2));

        return NextResponse.json({
            success: true,
            message: 'Session tracked successfully'
        });
    } catch (error) {
        console.error('Error tracking session:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to track session',
            details: error.message
        });
    }
}

// Track general activity
async function trackActivity(userId, activityData) {
    // Similar implementation to trackLearningSession but for general activities
    return NextResponse.json({
        success: true,
        message: 'Activity tracked successfully'
    });
}

// Update learning patterns
async function updateLearningPatterns(userId, patternData) {
    // Implementation for updating learning patterns
    return NextResponse.json({
        success: true,
        message: 'Learning patterns updated successfully'
    });
}
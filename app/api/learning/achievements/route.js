// app/api/learning/achievements/route.js
import { NextResponse } from "next/server";

// Achievement definitions with proper tracking logic
const achievementDefinitions = {
    // Learning Milestones
    'first-lesson': {
        id: 'first-lesson',
        category: 'learning',
        title: 'First Steps',
        description: 'Complete your first lesson',
        icon: 'Trophy',
        rarity: 'common',
        xpReward: 25,
        requirement: 'Complete 1 lesson',
        checkCondition: (progress) => progress.completedLessons.length >= 1
    },
    'lesson-streak-7': {
        id: 'lesson-streak-7',
        category: 'learning',
        title: 'Week Warrior',
        description: 'Complete lessons for 7 consecutive days',
        icon: 'Flame',
        rarity: 'uncommon',
        xpReward: 100,
        requirement: '7-day learning streak',
        checkCondition: (progress) => progress.currentStreak >= 7
    },
    'lesson-streak-30': {
        id: 'lesson-streak-30',
        category: 'learning',
        title: 'Dedication Master',
        description: 'Complete lessons for 30 consecutive days',
        icon: 'Award',
        rarity: 'rare',
        xpReward: 300,
        requirement: '30-day learning streak',
        checkCondition: (progress) => progress.currentStreak >= 30
    },
    'lesson-master': {
        id: 'lesson-master',
        category: 'learning',
        title: 'Lesson Master',
        description: 'Complete 50 lessons',
        icon: 'Award',
        rarity: 'rare',
        xpReward: 250,
        requirement: 'Complete 50 lessons',
        checkCondition: (progress) => progress.completedLessons.length >= 50
    },
    'speed-learner': {
        id: 'speed-learner',
        category: 'learning',
        title: 'Speed Learner',
        description: 'Complete 5 lessons in one day',
        icon: 'Zap',
        rarity: 'uncommon',
        xpReward: 75,
        requirement: 'Complete 5 lessons in one day',
        checkCondition: (progress) => {
            const today = new Date().toDateString();
            return progress.dailyLessonCount && progress.dailyLessonCount[today] >= 5;
        }
    },

    // Skill Mastery
    'recon-expert': {
        id: 'recon-expert',
        category: 'skills',
        title: 'Reconnaissance Expert',
        description: 'Achieve 90% skill level in Reconnaissance',
        icon: 'Target',
        rarity: 'rare',
        xpReward: 200,
        requirement: '90% skill level in Reconnaissance',
        checkCondition: (progress) => progress.skillLevels.reconnaissance >= 90
    },
    'web-security-master': {
        id: 'web-security-master',
        category: 'skills',
        title: 'Web Security Master',
        description: 'Achieve 95% skill level in Web Security',
        icon: 'Shield',
        rarity: 'epic',
        xpReward: 300,
        requirement: '95% skill level in Web Security',
        checkCondition: (progress) => progress.skillLevels.webSecurity >= 95
    },
    'exploitation-expert': {
        id: 'exploitation-expert',
        category: 'skills',
        title: 'Exploitation Expert',
        description: 'Achieve 90% skill level in Exploitation',
        icon: 'Zap',
        rarity: 'rare',
        xpReward: 250,
        requirement: '90% skill level in Exploitation',
        checkCondition: (progress) => progress.skillLevels.exploitation >= 90
    },
    'all-skills-70': {
        id: 'all-skills-70',
        category: 'skills',
        title: 'Well Rounded',
        description: 'Achieve 70% in all skill categories',
        icon: 'TrendingUp',
        rarity: 'epic',
        xpReward: 400,
        requirement: '70% in all skills',
        checkCondition: (progress) => {
            const skills = Object.values(progress.skillLevels);
            return skills.length > 0 && skills.every(level => level >= 70);
        }
    },
    'perfectionist': {
        id: 'perfectionist',
        category: 'skills',
        title: 'Perfectionist',
        description: 'Achieve 100% in any skill category',
        icon: 'Star',
        rarity: 'legendary',
        xpReward: 500,
        requirement: '100% in any skill',
        checkCondition: (progress) => {
            return Object.values(progress.skillLevels).some(level => level >= 100);
        }
    },

    // Tool Expertise
    'nmap-novice': {
        id: 'nmap-novice',
        category: 'tools',
        title: 'Nmap Novice',
        description: 'Use Nmap 10 times',
        icon: 'Target',
        rarity: 'common',
        xpReward: 50,
        requirement: 'Use Nmap 10 times',
        checkCondition: (progress) => {
            return progress.toolUsage.nmap && progress.toolUsage.nmap.count >= 10;
        }
    },
    'nmap-expert': {
        id: 'nmap-expert',
        category: 'tools',
        title: 'Nmap Expert',
        description: 'Use Nmap 100 times',
        icon: 'Award',
        rarity: 'rare',
        xpReward: 200,
        requirement: 'Use Nmap 100 times',
        checkCondition: (progress) => {
            return progress.toolUsage.nmap && progress.toolUsage.nmap.count >= 100;
        }
    },
    'tool-collector': {
        id: 'tool-collector',
        category: 'tools',
        title: 'Tool Collector',
        description: 'Use 15 different security tools',
        icon: 'Shield',
        rarity: 'uncommon',
        xpReward: 150,
        requirement: 'Use 15 different tools',
        checkCondition: (progress) => {
            return Object.keys(progress.toolUsage || {}).length >= 15;
        }
    },
    'tool-master': {
        id: 'tool-master',
        category: 'tools',
        title: 'Tool Master',
        description: 'Use 25 different security tools',
        icon: 'Crown',
        rarity: 'epic',
        xpReward: 300,
        requirement: 'Use 25 different tools',
        checkCondition: (progress) => {
            return Object.keys(progress.toolUsage || {}).length >= 25;
        }
    },
    'metasploit-master': {
        id: 'metasploit-master',
        category: 'tools',
        title: 'Metasploit Master',
        description: 'Successfully use Metasploit 25 times',
        icon: 'Zap',
        rarity: 'rare',
        xpReward: 300,
        requirement: 'Use Metasploit 25 times',
        checkCondition: (progress) => {
            return progress.toolUsage.metasploit && progress.toolUsage.metasploit.count >= 25;
        }
    },

    // Assessment Achievements
    'assessment-ace': {
        id: 'assessment-ace',
        category: 'assessments',
        title: 'Assessment Ace',
        description: 'Score 100% on any assessment',
        icon: 'Trophy',
        rarity: 'rare',
        xpReward: 200,
        requirement: 'Score 100% on assessment',
        checkCondition: (progress) => {
            return progress.assessmentHistory && 
                   progress.assessmentHistory.some(assessment => assessment.score >= 100);
        }
    },
    'assessment-master': {
        id: 'assessment-master',
        category: 'assessments',
        title: 'Assessment Master',
        description: 'Pass 10 assessments',
        icon: 'Award',
        rarity: 'uncommon',
        xpReward: 150,
        requirement: 'Pass 10 assessments',
        checkCondition: (progress) => {
            return progress.assessmentHistory && 
                   progress.assessmentHistory.filter(a => a.score >= 70).length >= 10;
        }
    },

    // Special Achievements
    'early-adopter': {
        id: 'early-adopter',
        category: 'special',
        title: 'Early Adopter',
        description: 'Join RootLab in its first month',
        icon: 'Star',
        rarity: 'legendary',
        xpReward: 500,
        requirement: 'Join in first month',
        checkCondition: (progress) => {
            const joinDate = new Date(progress.createdAt);
            const launchDate = new Date('2024-01-01'); // Adjust based on actual launch
            const oneMonthLater = new Date(launchDate);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            return joinDate <= oneMonthLater;
        }
    },
    'night-owl': {
        id: 'night-owl',
        category: 'special',
        title: 'Night Owl',
        description: 'Complete 10 lessons between 10 PM and 6 AM',
        icon: 'Clock',
        rarity: 'uncommon',
        xpReward: 100,
        requirement: 'Complete 10 lessons at night',
        checkCondition: (progress) => {
            return progress.nightLessons >= 10;
        }
    },
    'weekend-warrior': {
        id: 'weekend-warrior',
        category: 'special',
        title: 'Weekend Warrior',
        description: 'Complete 20 lessons on weekends',
        icon: 'Calendar',
        rarity: 'uncommon',
        xpReward: 125,
        requirement: 'Complete 20 weekend lessons',
        checkCondition: (progress) => {
            return progress.weekendLessons >= 20;
        }
    },
    'level-10': {
        id: 'level-10',
        category: 'special',
        title: 'Rising Star',
        description: 'Reach level 10',
        icon: 'Star',
        rarity: 'uncommon',
        xpReward: 150,
        requirement: 'Reach level 10',
        checkCondition: (progress) => progress.level >= 10
    },
    'level-25': {
        id: 'level-25',
        category: 'special',
        title: 'Expert Practitioner',
        description: 'Reach level 25',
        icon: 'Award',
        rarity: 'rare',
        xpReward: 300,
        requirement: 'Reach level 25',
        checkCondition: (progress) => progress.level >= 25
    },
    'level-50': {
        id: 'level-50',
        category: 'special',
        title: 'Master Hacker',
        description: 'Reach level 50',
        icon: 'Crown',
        rarity: 'legendary',
        xpReward: 1000,
        requirement: 'Reach level 50',
        checkCondition: (progress) => progress.level >= 50
    }
};

// GET - Retrieve achievements or check for new achievements
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const userId = searchParams.get('userId');

        if (action === 'list') {
            // Return all achievement definitions
            const achievements = Object.values(achievementDefinitions).map(achievement => ({
                id: achievement.id,
                category: achievement.category,
                title: achievement.title,
                description: achievement.description,
                icon: achievement.icon,
                rarity: achievement.rarity,
                xpReward: achievement.xpReward,
                requirement: achievement.requirement
            }));

            return NextResponse.json({
                success: true,
                achievements
            });
        }

        if (action === 'check' && userId) {
            // Check for new achievements for a specific user
            return await checkUserAchievements(userId);
        }

        return NextResponse.json(
            { error: 'Invalid action or missing parameters' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error retrieving achievements:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve achievements', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Manually trigger achievement check or award achievement
export async function POST(request) {
    try {
        const body = await request.json();
        const { action, userId, achievementId } = body;

        switch (action) {
            case 'check_achievements':
                return await checkUserAchievements(userId);
            
            case 'award_achievement':
                return await awardAchievement(userId, achievementId);
            
            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error processing achievement request:', error);
        return NextResponse.json(
            { error: 'Failed to process request', details: error.message },
            { status: 500 }
        );
    }
}

// Check user achievements and award new ones
async function checkUserAchievements(userId) {
    try {
        // Get user progress
        const progressResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/learning/progress?userId=${userId}`);
        
        if (!progressResponse.ok) {
            throw new Error('Failed to fetch user progress');
        }

        const { progress } = await progressResponse.json();
        const currentAchievements = progress.achievements || [];
        const currentAchievementIds = currentAchievements.map(a => a.id);
        
        const newAchievements = [];
        let totalXPAwarded = 0;

        // Check each achievement definition
        for (const achievement of Object.values(achievementDefinitions)) {
            // Skip if already unlocked
            if (currentAchievementIds.includes(achievement.id)) {
                continue;
            }

            // Check if conditions are met
            if (achievement.checkCondition(progress)) {
                const newAchievement = {
                    id: achievement.id,
                    title: achievement.title,
                    description: achievement.description,
                    category: achievement.category,
                    rarity: achievement.rarity,
                    xpReward: achievement.xpReward,
                    unlockedAt: new Date().toISOString()
                };

                newAchievements.push(newAchievement);
                totalXPAwarded += achievement.xpReward;

                // Update user progress with new achievement
                await updateProgressWithAchievement(userId, newAchievement);
            }
        }

        return NextResponse.json({
            success: true,
            newAchievements,
            totalXPAwarded,
            message: newAchievements.length > 0 
                ? `Congratulations! You unlocked ${newAchievements.length} new achievement(s)!`
                : 'No new achievements at this time.'
        });

    } catch (error) {
        console.error('Error checking achievements:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to check achievements',
            details: error.message
        });
    }
}

// Award a specific achievement
async function awardAchievement(userId, achievementId) {
    try {
        const achievement = achievementDefinitions[achievementId];
        if (!achievement) {
            return NextResponse.json(
                { error: 'Achievement not found' },
                { status: 404 }
            );
        }

        const newAchievement = {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            category: achievement.category,
            rarity: achievement.rarity,
            xpReward: achievement.xpReward,
            unlockedAt: new Date().toISOString()
        };

        await updateProgressWithAchievement(userId, newAchievement);

        return NextResponse.json({
            success: true,
            achievement: newAchievement,
            message: `Achievement "${achievement.title}" awarded successfully!`
        });

    } catch (error) {
        console.error('Error awarding achievement:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to award achievement',
            details: error.message
        });
    }
}

// Update user progress with new achievement
async function updateProgressWithAchievement(userId, achievement) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/learning/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                progress: {
                    achievementId: achievement.id,
                    xpReward: achievement.xpReward
                },
                action: 'achievement_unlocked'
            })
        });

        if (!response.ok) {
            console.error('Failed to update progress with achievement');
        }
    } catch (error) {
        console.error('Error updating progress with achievement:', error);
    }
}

// Utility function to get achievement progress for display
export async function getAchievementProgress(userId) {
    try {
        const progressResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/learning/progress?userId=${userId}`);
        
        if (!progressResponse.ok) {
            throw new Error('Failed to fetch user progress');
        }

        const { progress } = await progressResponse.json();
        const achievementProgress = [];

        for (const achievement of Object.values(achievementDefinitions)) {
            const isUnlocked = progress.achievements.some(a => a.id === achievement.id);
            let progressPercentage = 0;

            if (!isUnlocked) {
                // Calculate progress towards achievement
                progressPercentage = calculateAchievementProgress(achievement, progress);
            } else {
                progressPercentage = 100;
            }

            achievementProgress.push({
                ...achievement,
                unlocked: isUnlocked,
                progress: progressPercentage,
                unlockedDate: isUnlocked 
                    ? progress.achievements.find(a => a.id === achievement.id).unlockedAt 
                    : null
            });
        }

        return achievementProgress;
    } catch (error) {
        console.error('Error getting achievement progress:', error);
        return [];
    }
}

// Calculate progress percentage towards an achievement
function calculateAchievementProgress(achievement, progress) {
    switch (achievement.id) {
        case 'lesson-streak-7':
            return Math.min(100, (progress.currentStreak / 7) * 100);
        case 'lesson-streak-30':
            return Math.min(100, (progress.currentStreak / 30) * 100);
        case 'lesson-master':
            return Math.min(100, (progress.completedLessons.length / 50) * 100);
        case 'recon-expert':
            return Math.min(100, (progress.skillLevels.reconnaissance / 90) * 100);
        case 'web-security-master':
            return Math.min(100, (progress.skillLevels.webSecurity / 95) * 100);
        case 'nmap-novice':
            const nmapCount = progress.toolUsage.nmap ? progress.toolUsage.nmap.count : 0;
            return Math.min(100, (nmapCount / 10) * 100);
        case 'tool-collector':
            return Math.min(100, (Object.keys(progress.toolUsage || {}).length / 15) * 100);
        default:
            return 0;
    }
}
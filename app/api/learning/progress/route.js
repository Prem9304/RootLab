// app/api/learning/progress/route.js
import { NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

// In a production environment, you'd use a proper database
// For now, we'll use file-based storage for user progress
const PROGRESS_DIR = path.join(process.cwd(), 'data', 'learning');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(PROGRESS_DIR, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }
}

// Get user progress file path
function getUserProgressPath(userId) {
    return path.join(PROGRESS_DIR, `${userId}_progress.json`);
}

// Default progress structure
function getDefaultProgress() {
    return {
        userId: null,
        totalXP: 0,
        level: 1,
        completedLessons: [],
        completedAssessments: [],
        skillLevels: {
            reconnaissance: 0,
            scanning: 0,
            exploitation: 0,
            postExploitation: 0,
            webSecurity: 0,
            networkSecurity: 0,
            digitalForensics: 0
        },
        achievements: [],
        currentStreak: 0,
        lastActivity: null,
        toolUsage: {},
        learningPaths: {
            enrolled: [],
            completed: []
        },
        assessmentHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// GET - Retrieve user progress
export async function GET(request) {
    try {
        await ensureDataDir();
        
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const progressPath = getUserProgressPath(userId);
        
        try {
            const progressData = await fs.readFile(progressPath, 'utf8');
            const progress = JSON.parse(progressData);
            
            return NextResponse.json({
                success: true,
                progress
            });
        } catch (error) {
            // File doesn't exist, return default progress
            const defaultProgress = getDefaultProgress();
            defaultProgress.userId = userId;
            
            return NextResponse.json({
                success: true,
                progress: defaultProgress,
                isNew: true
            });
        }
    } catch (error) {
        console.error('Error retrieving progress:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve progress', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Update user progress
export async function POST(request) {
    try {
        await ensureDataDir();
        
        const body = await request.json();
        const { userId, progress, action } = body;
        
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const progressPath = getUserProgressPath(userId);
        let currentProgress;
        
        // Load existing progress or create new
        try {
            const existingData = await fs.readFile(progressPath, 'utf8');
            currentProgress = JSON.parse(existingData);
        } catch (error) {
            currentProgress = getDefaultProgress();
            currentProgress.userId = userId;
        }

        // Handle different types of progress updates
        switch (action) {
            case 'lesson_completed':
                await handleLessonCompletion(currentProgress, progress);
                break;
            case 'assessment_completed':
                await handleAssessmentCompletion(currentProgress, progress);
                break;
            case 'tool_used':
                await handleToolUsage(currentProgress, progress);
                break;
            case 'achievement_unlocked':
                await handleAchievementUnlock(currentProgress, progress);
                break;
            case 'full_update':
                // Full progress update
                currentProgress = { ...currentProgress, ...progress };
                break;
            default:
                // Partial update
                currentProgress = { ...currentProgress, ...progress };
        }

        // Update timestamps and level
        currentProgress.updatedAt = new Date().toISOString();
        currentProgress.level = Math.floor(currentProgress.totalXP / 100) + 1;
        
        // Update activity streak
        updateActivityStreak(currentProgress);

        // Save updated progress
        await fs.writeFile(progressPath, JSON.stringify(currentProgress, null, 2));
        
        return NextResponse.json({
            success: true,
            progress: currentProgress,
            message: 'Progress updated successfully'
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        return NextResponse.json(
            { error: 'Failed to update progress', details: error.message },
            { status: 500 }
        );
    }
}

// Handle lesson completion
async function handleLessonCompletion(progress, data) {
    const { lessonId, xpEarned, skillCategory } = data;
    
    // Add to completed lessons if not already completed
    if (!progress.completedLessons.includes(lessonId)) {
        progress.completedLessons.push(lessonId);
        progress.totalXP += xpEarned || 50;
        
        // Update skill level
        if (skillCategory && progress.skillLevels[skillCategory] !== undefined) {
            progress.skillLevels[skillCategory] = Math.min(100, 
                progress.skillLevels[skillCategory] + 5
            );
        }
    }
}

// Handle assessment completion
async function handleAssessmentCompletion(progress, data) {
    const { assessmentId, score, xpEarned, skillCategory } = data;
    
    // Add to assessment history
    progress.assessmentHistory.push({
        assessmentId,
        score,
        completedAt: new Date().toISOString(),
        xpEarned
    });
    
    // Update completed assessments
    if (!progress.completedAssessments.includes(assessmentId)) {
        progress.completedAssessments.push(assessmentId);
    }
    
    // Award XP and update skill level
    progress.totalXP += xpEarned || 0;
    
    if (skillCategory && progress.skillLevels[skillCategory] !== undefined) {
        // Update skill level based on assessment score
        progress.skillLevels[skillCategory] = Math.max(
            progress.skillLevels[skillCategory],
            score
        );
    }
}

// Handle tool usage
async function handleToolUsage(progress, data) {
    const { toolName, skillCategory } = data;
    
    // Track tool usage
    if (!progress.toolUsage[toolName]) {
        progress.toolUsage[toolName] = {
            count: 0,
            firstUsed: new Date().toISOString(),
            lastUsed: null
        };
    }
    
    progress.toolUsage[toolName].count += 1;
    progress.toolUsage[toolName].lastUsed = new Date().toISOString();
    
    // Award small XP for tool usage
    progress.totalXP += 10;
    
    // Slightly increase relevant skill
    if (skillCategory && progress.skillLevels[skillCategory] !== undefined) {
        progress.skillLevels[skillCategory] = Math.min(100,
            progress.skillLevels[skillCategory] + 1
        );
    }
}

// Handle achievement unlock
async function handleAchievementUnlock(progress, data) {
    const { achievementId, xpReward } = data;
    
    // Add achievement if not already unlocked
    if (!progress.achievements.find(a => a.id === achievementId)) {
        progress.achievements.push({
            id: achievementId,
            unlockedAt: new Date().toISOString(),
            xpReward
        });
        
        progress.totalXP += xpReward || 0;
    }
}

// Update activity streak
function updateActivityStreak(progress) {
    const today = new Date().toDateString();
    const lastActivity = progress.lastActivity;
    
    if (lastActivity !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActivity === yesterday.toDateString()) {
            progress.currentStreak += 1;
        } else if (lastActivity !== today) {
            progress.currentStreak = 1;
        }
        
        progress.lastActivity = today;
    }
}

// DELETE - Reset user progress (for testing)
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const progressPath = getUserProgressPath(userId);
        
        try {
            await fs.unlink(progressPath);
            return NextResponse.json({
                success: true,
                message: 'Progress reset successfully'
            });
        } catch (error) {
            return NextResponse.json({
                success: true,
                message: 'No progress file to delete'
            });
        }
    } catch (error) {
        console.error('Error resetting progress:', error);
        return NextResponse.json(
            { error: 'Failed to reset progress', details: error.message },
            { status: 500 }
        );
    }
}
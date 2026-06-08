// app/lib/learningService.js
class LearningService {
    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        this.userId = null;
    }

    // Set user ID for all subsequent requests
    setUserId(userId) {
        this.userId = userId;
    }

    // Get current user ID
    getUserId() {
        if (!this.userId) {
            // Try to get from localStorage or Firebase auth
            if (typeof window !== 'undefined') {
                this.userId = localStorage.getItem('rootLab_userId') || 'anonymous';
            }
        }
        return this.userId;
    }

    // Progress Management
    async getProgress(userId = null) {
        const id = userId || this.getUserId();
        try {
            const response = await fetch(`${this.baseURL}/api/learning/progress?userId=${id}`);
            if (!response.ok) throw new Error('Failed to fetch progress');
            return await response.json();
        } catch (error) {
            console.error('Error fetching progress:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProgress(progressData, action = 'full_update', userId = null) {
        const id = userId || this.getUserId();
        try {
            const response = await fetch(`${this.baseURL}/api/learning/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: id,
                    progress: progressData,
                    action
                })
            });
            if (!response.ok) throw new Error('Failed to update progress');
            return await response.json();
        } catch (error) {
            console.error('Error updating progress:', error);
            return { success: false, error: error.message };
        }
    }

    async trackToolUsage(toolName, skillCategory = null, userId = null) {
        const id = userId || this.getUserId();
        return await this.updateProgress({
            toolName,
            skillCategory
        }, 'tool_used', id);
    }

    async completeLesson(lessonId, xpEarned, skillCategory, userId = null) {
        const id = userId || this.getUserId();
        return await this.updateProgress({
            lessonId,
            xpEarned,
            skillCategory
        }, 'lesson_completed', id);
    }

    async completeAssessment(assessmentData, userId = null) {
        const id = userId || this.getUserId();
        return await this.updateProgress(assessmentData, 'assessment_completed', id);
    }

    // Lesson Management
    async getLessons() {
        try {
            const response = await fetch(`${this.baseURL}/api/learning/lessons?action=list`);
            if (!response.ok) throw new Error('Failed to fetch lessons');
            return await response.json();
        } catch (error) {
            console.error('Error fetching lessons:', error);
            return { success: false, error: error.message };
        }
    }

    async getLesson(lessonId) {
        try {
            const response = await fetch(`${this.baseURL}/api/learning/lessons?lessonId=${lessonId}`);
            if (!response.ok) throw new Error('Failed to fetch lesson');
            return await response.json();
        } catch (error) {
            console.error('Error fetching lesson:', error);
            return { success: false, error: error.message };
        }
    }

    async executeVMCommand(lessonId, stepId, userCommand, userId = null) {
        const id = userId || this.getUserId();
        try {
            const response = await fetch(`${this.baseURL}/api/learning/lessons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    stepId,
                    action: 'execute_command',
                    userCommand,
                    userId: id
                })
            });
            if (!response.ok) throw new Error('Failed to execute command');
            return await response.json();
        } catch (error) {
            console.error('Error executing VM command:', error);
            return { success: false, error: error.message };
        }
    }

    // Assessment Management
    async getAssessments() {
        try {
            const response = await fetch(`${this.baseURL}/api/learning/assessments?action=list`);
            if (!response.ok) throw new Error('Failed to fetch assessments');
            return await response.json();
        } catch (error) {
            console.error('Error fetching assessments:', error);
            return { success: false, error: error.message };
        }
    }

    async getAssessment(assessmentId) {
        try {
            const response = await fetch(`${this.baseURL}/api/learning/assessments?assessmentId=${assessmentId}`);
            if (!response.ok) throw new Error('Failed to fetch assessment');
            return await response.json();
        } catch (error) {
            console.error('Error fetching assessment:', error);
            return { success: false, error: error.message };
        }
    }

    async submitAssessment(assessmentId, answers, timeSpent, userId = null) {
        const id = userId || this.getUserId();
        try {
            const response = await fetch(`${this.baseURL}/api/learning/assessments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId,
                    action: 'submit',
                    userId: id,
                    answers,
                    timeSpent
                })
            });
            if (!response.ok) throw new Error('Failed to submit assessment');
            return await response.json();
        } catch (error) {
            console.error('Error submitting assessment:', error);
            return { success: false, error: error.message };
        }
    }

    async validatePracticalQuestion(assessmentId, questionId, userCommand, executionResult) {
        try {
            const response = await fetch(`${this.baseURL}/api/learning/assessments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId,
                    action: 'validate_practical',
                    questionId,
                    userCommand,
                    executionResult
                })
            });
            if (!response.ok) throw new Error('Failed to validate practical question');
            return await response.json();
        } catch (error) {
            console.error('Error validating practical question:', error);
            return { success: false, error: error.message };
        }
    }

    // Achievement Management
    async getAchievements() {
        try {
            const response = await fetch(`${this.baseURL}/api/learning/achievements?action=list`);
            if (!response.ok) throw new Error('Failed to fetch achievements');
            return await response.json();
        } catch (error) {
            console.error('Error fetching achievements:', error);
            return { success: false, error: error.message };
        }
    }

    async checkAchievements(userId = null) {
        const id = userId || this.getUserId();
        try {
            const response = await fetch(`${this.baseURL}/api/learning/achievements?action=check&userId=${id}`);
            if (!response.ok) throw new Error('Failed to check achievements');
            return await response.json();
        } catch (error) {
            console.error('Error checking achievements:', error);
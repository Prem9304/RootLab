'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    Clock,
    Award,
    Target,
    AlertCircle,
    ChevronRight,
    RotateCcw,
    TrendingUp,
    BookOpen,
    Play
} from 'lucide-react';

const assessmentCategories = [
    {
        id: 'reconnaissance',
        name: 'Reconnaissance',
        description: 'Information gathering and target analysis',
        questions: 15,
        timeLimit: 20,
        difficulty: 'Beginner',
        xpReward: 100
    },
    {
        id: 'scanning',
        name: 'Scanning & Enumeration',
        description: 'Network and service discovery techniques',
        questions: 20,
        timeLimit: 25,
        difficulty: 'Intermediate',
        xpReward: 150
    },
    {
        id: 'exploitation',
        name: 'Exploitation',
        description: 'Vulnerability exploitation and payload delivery',
        questions: 25,
        timeLimit: 35,
        difficulty: 'Advanced',
        xpReward: 200
    },
    {
        id: 'webSecurity',
        name: 'Web Application Security',
        description: 'Web vulnerabilities and attack vectors',
        questions: 18,
        timeLimit: 30,
        difficulty: 'Intermediate',
        xpReward: 175
    }
];

const sampleQuestions = {
    reconnaissance: [
        {
            id: 1,
            question: "Which of the following is considered passive reconnaissance?",
            options: [
                "Port scanning with Nmap",
                "DNS enumeration using dig",
                "Searching public databases and social media",
                "Banner grabbing"
            ],
            correct: 2,
            explanation: "Passive reconnaissance involves gathering information without directly interacting with the target system. Searching public databases and social media falls into this category."
        },
        {
            id: 2,
            question: "What does OSINT stand for?",
            options: [
                "Open Source Intelligence",
                "Operating System Intelligence",
                "Online Security Intelligence",
                "Operational Security Intelligence"
            ],
            correct: 0,
            explanation: "OSINT stands for Open Source Intelligence, which refers to intelligence collected from publicly available sources."
        }
    ],
    scanning: [
        {
            id: 1,
            question: "Which Nmap scan type is considered the most stealthy?",
            options: [
                "TCP Connect scan (-sT)",
                "SYN scan (-sS)",
                "FIN scan (-sF)",
                "UDP scan (-sU)"
            ],
            correct: 2,
            explanation: "FIN scan is considered more stealthy as it doesn't complete the TCP handshake and may bypass some firewalls and IDS systems."
        }
    ]
};

export default function SkillAssessment({ userProgress, setUserProgress }) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [currentAssessment, setCurrentAssessment] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [assessmentResults, setAssessmentResults] = useState(null);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            finishAssessment();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const startAssessment = (category) => {
        setSelectedCategory(category);
        setCurrentAssessment(category);
        setCurrentQuestion(0);
        setAnswers([]);
        setTimeLeft(category.timeLimit * 60); // Convert minutes to seconds
        setIsActive(true);
        setShowResults(false);
    };

    const selectAnswer = (answerIndex) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = answerIndex;
        setAnswers(newAnswers);
    };

    const nextQuestion = () => {
        const questions = sampleQuestions[currentAssessment.id] || [];
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            finishAssessment();
        }
    };

    const finishAssessment = () => {
        setIsActive(false);
        calculateResults();
        setShowResults(true);
    };

    const calculateResults = () => {
        const questions = sampleQuestions[currentAssessment.id] || [];
        let correctAnswers = 0;

        answers.forEach((answer, index) => {
            if (questions[index] && answer === questions[index].correct) {
                correctAnswers++;
            }
        });

        const percentage = Math.round((correctAnswers / questions.length) * 100);
        const xpEarned = Math.round((percentage / 100) * currentAssessment.xpReward);

        const results = {
            category: currentAssessment.name,
            totalQuestions: questions.length,
            correctAnswers,
            percentage,
            xpEarned,
            timeSpent: (currentAssessment.timeLimit * 60) - timeLeft,
            passed: percentage >= 70
        };

        setAssessmentResults(results);

        // Update user progress
        if (results.passed) {
            const newProgress = { ...userProgress };
            newProgress.totalXP += xpEarned;
            newProgress.skillLevels[currentAssessment.id] = Math.max(
                newProgress.skillLevels[currentAssessment.id] || 0,
                percentage
            );

            // Level up logic
            const newLevel = Math.floor(newProgress.totalXP / 100) + 1;
            if (newLevel > newProgress.level) {
                newProgress.level = newLevel;
            }

            setUserProgress(newProgress);
            localStorage.setItem('rootLab_learningProgress', JSON.stringify(newProgress));
        }
    };

    const resetAssessment = () => {
        setCurrentAssessment(null);
        setSelectedCategory(null);
        setCurrentQuestion(0);
        setAnswers([]);
        setTimeLeft(0);
        setIsActive(false);
        setShowResults(false);
        setAssessmentResults(null);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Beginner': return 'text-green-400 bg-green-900/30';
            case 'Intermediate': return 'text-yellow-400 bg-yellow-900/30';
            case 'Advanced': return 'text-red-400 bg-red-900/30';
            default: return 'text-gray-400 bg-gray-900/30';
        }
    };

    const getScoreColor = (percentage) => {
        if (percentage >= 90) return 'text-green-400';
        if (percentage >= 80) return 'text-blue-400';
        if (percentage >= 70) return 'text-yellow-400';
        return 'text-red-400';
    };

    // Assessment Selection View
    if (!currentAssessment) {
        return (
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl font-bold mb-2">Skill Assessment</h2>
                    <p className="text-gray-400">
                        Test your cybersecurity knowledge and identify areas for improvement
                    </p>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {assessmentCategories.map((category, index) => (
                        <motion.div
                            key={category.id}
                            className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-6 hover:border-[#00ADEE]/60 transition-all cursor-pointer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => startAssessment(category)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(category.difficulty)}`}>
                                        {category.difficulty}
                                    </span>
                                </div>
                                <Target className="text-[#00ADEE]" size={24} />
                            </div>

                            <p className="text-gray-400 text-sm mb-4">{category.description}</p>

                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={16} />
                                    {category.questions} questions
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    {category.timeLimit} minutes
                                </div>
                                <div className="flex items-center gap-2">
                                    <Award size={16} />
                                    Up to {category.xpReward} XP
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} />
                                    Current: {userProgress?.skillLevels?.[category.id] || 0}%
                                </div>
                            </div>

                            <button className="w-full bg-[#00ADEE] hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                <Play size={16} />
                                Start Assessment
                            </button>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        );
    }

    // Results View
    if (showResults && assessmentResults) {
        return (
            <motion.div
                className="max-w-2xl mx-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-8 text-center">
                    <div className="mb-6">
                        {assessmentResults.passed ? (
                            <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
                        ) : (
                            <AlertCircle size={64} className="text-red-400 mx-auto mb-4" />
                        )}
                        <h2 className="text-2xl font-bold mb-2">Assessment Complete!</h2>
                        <p className="text-gray-400">{assessmentResults.category}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                            <p className="text-3xl font-bold mb-1" style={{ color: getScoreColor(assessmentResults.percentage) }}>
                                {assessmentResults.percentage}%
                            </p>
                            <p className="text-sm text-gray-400">Score</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-[#00ADEE] mb-1">
                                {assessmentResults.correctAnswers}/{assessmentResults.totalQuestions}
                            </p>
                            <p className="text-sm text-gray-400">Correct</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-green-400 mb-1">
                                +{assessmentResults.xpEarned}
                            </p>
                            <p className="text-sm text-gray-400">XP Earned</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-purple-400 mb-1">
                                {formatTime(assessmentResults.timeSpent)}
                            </p>
                            <p className="text-sm text-gray-400">Time Spent</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        {assessmentResults.passed ? (
                            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                                <p className="text-green-400 font-medium">Congratulations! You passed the assessment.</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Your skill level has been updated to {assessmentResults.percentage}%
                                </p>
                            </div>
                        ) : (
                            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                                <p className="text-red-400 font-medium">You need 70% or higher to pass.</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Review the learning materials and try again.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={resetAssessment}
                            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <RotateCcw size={16} />
                            Try Another
                        </button>
                        {!assessmentResults.passed && (
                            <button
                                onClick={() => startAssessment(currentAssessment)}
                                className="bg-[#00ADEE] hover:bg-blue-600 text-white py-2 px-6 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <RotateCcw size={16} />
                                Retake
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    // Assessment in Progress View
    const questions = sampleQuestions[currentAssessment.id] || [];
    const currentQ = questions[currentQuestion];

    if (!currentQ) {
        return (
            <div className="text-center">
                <p className="text-gray-400">No questions available for this assessment.</p>
                <button
                    onClick={resetAssessment}
                    className="mt-4 bg-[#00ADEE] hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                >
                    Back to Selection
                </button>
            </div>
        );
    }

    return (
        <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Assessment Header */}
            <div className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold">{currentAssessment.name}</h2>
                        <p className="text-sm text-gray-400">
                            Question {currentQuestion + 1} of {questions.length}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-[#00ADEE]'}`}>
                            {formatTime(timeLeft)}
                        </div>
                        <p className="text-sm text-gray-400">Time Remaining</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-[#00ADEE] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <motion.div
                key={currentQuestion}
                className="bg-[#081A2C]/50 border border-[#00ADEE]/30 rounded-lg p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h3 className="text-lg font-medium mb-6">{currentQ.question}</h3>

                <div className="space-y-3 mb-6">
                    {currentQ.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => selectAnswer(index)}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${answers[currentQuestion] === index
                                ? 'border-[#00ADEE] bg-[#00ADEE]/10'
                                : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 ${answers[currentQuestion] === index
                                    ? 'border-[#00ADEE] bg-[#00ADEE]'
                                    : 'border-gray-500'
                                    }`}>
                                    {answers[currentQuestion] === index && (
                                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                                    )}
                                </div>
                                <span>{option}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex justify-between">
                    <button
                        onClick={resetAssessment}
                        className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                        Exit Assessment
                    </button>
                    <button
                        onClick={nextQuestion}
                        disabled={answers[currentQuestion] === undefined}
                        className="bg-[#00ADEE] hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                    >
                        {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
                        <ChevronRight size={16} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
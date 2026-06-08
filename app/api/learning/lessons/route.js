// app/api/learning/lessons/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import containerName from "../../../lib/containerName";

const execPromise = promisify(exec);

// Lesson definitions with VM integration
const lessons = {
    'nmap-basics': {
        id: 'nmap-basics',
        title: 'Nmap Port Scanning Basics',
        description: 'Master network reconnaissance with Nmap',
        difficulty: 'Beginner',
        estimatedTime: '20 min',
        xpReward: 100,
        category: 'reconnaissance',
        prerequisites: [],
        steps: [
            {
                id: 'intro',
                type: 'explanation',
                title: 'Introduction to Nmap',
                content: `Nmap (Network Mapper) is the most essential tool for network discovery and security auditing. In this lesson, you'll learn to use Nmap effectively in our virtual environment.`,
                duration: 60
            },
            {
                id: 'host-discovery',
                type: 'vm-interactive',
                title: 'Host Discovery',
                content: `Let's start by discovering live hosts on the network. We'll use a ping scan to identify active systems.`,
                command: 'nmap -sn 192.168.1.0/24',
                expectedPatterns: ['Host is up', 'Nmap scan report'],
                hints: ['Look for "Host is up" messages', 'Check the scan report summary'],
                validation: {
                    type: 'output_contains',
                    patterns: ['Host is up', 'Nmap done']
                }
            },
            {
                id: 'port-scanning',
                type: 'vm-interactive',
                title: 'Basic Port Scanning',
                content: `Now let's scan for open ports on a specific target. This will show us what services are running.`,
                command: 'nmap scanme.nmap.org',
                expectedPatterns: ['open', 'tcp', 'PORT'],
                hints: ['Look for open ports in the output', 'Note the service names'],
                validation: {
                    type: 'output_contains',
                    patterns: ['PORT', 'STATE', 'SERVICE']
                }
            },
            {
                id: 'service-detection',
                type: 'vm-interactive',
                title: 'Service Version Detection',
                content: `Use the -sV flag to detect service versions. This provides more detailed information about running services.`,
                command: 'nmap -sV scanme.nmap.org',
                expectedPatterns: ['version', 'open'],
                hints: ['Look for version information in the output'],
                validation: {
                    type: 'output_contains',
                    patterns: ['VERSION', 'open']
                }
            }
        ]
    },
    'nikto-web-scan': {
        id: 'nikto-web-scan',
        title: 'Web Vulnerability Scanning with Nikto',
        description: 'Learn to identify web application vulnerabilities',
        difficulty: 'Beginner',
        estimatedTime: '25 min',
        xpReward: 125,
        category: 'webSecurity',
        prerequisites: ['nmap-basics'],
        steps: [
            {
                id: 'intro',
                type: 'explanation',
                title: 'Introduction to Nikto',
                content: `Nikto is a web vulnerability scanner that tests for thousands of potentially dangerous files, outdated software versions, and server misconfigurations.`,
                duration: 90
            },
            {
                id: 'basic-scan',
                type: 'vm-interactive',
                title: 'Basic Web Scan',
                content: `Let's perform a basic Nikto scan on a test web application to identify potential vulnerabilities.`,
                command: 'nikto -h http://testphp.vulnweb.com',
                expectedPatterns: ['vulnerabilities', 'Server:', 'OSVDB'],
                hints: ['Look for vulnerability findings', 'Check server information'],
                validation: {
                    type: 'output_contains',
                    patterns: ['Server:', 'Target IP:', 'Start Time:']
                }
            }
        ]
    },
    'metasploit-basics': {
        id: 'metasploit-basics',
        title: 'Metasploit Framework Introduction',
        description: 'Learn the basics of the Metasploit exploitation framework',
        difficulty: 'Intermediate',
        estimatedTime: '30 min',
        xpReward: 150,
        category: 'exploitation',
        prerequisites: ['nmap-basics', 'nikto-web-scan'],
        steps: [
            {
                id: 'intro',
                type: 'explanation',
                title: 'Introduction to Metasploit',
                content: `Metasploit is the world's most used penetration testing framework. It provides a platform for developing, testing, and executing exploit code.`,
                duration: 120
            },
            {
                id: 'msfconsole',
                type: 'vm-interactive',
                title: 'Starting Metasploit Console',
                content: `Let's start the Metasploit console and explore its basic commands.`,
                command: 'msfconsole -q',
                expectedPatterns: ['msf6', 'exploit', 'auxiliary'],
                hints: ['Wait for the msf6 prompt to appear', 'The -q flag starts quietly'],
                validation: {
                    type: 'output_contains',
                    patterns: ['msf6', 'exploit']
                }
            }
        ]
    }
};

// Assessment questions for each lesson
const assessmentQuestions = {
    'nmap-basics': [
        {
            question: "What does the -sn flag do in Nmap?",
            options: [
                "Performs a stealth scan",
                "Performs a ping scan without port scanning",
                "Scans for services and versions",
                "Performs a UDP scan"
            ],
            correct: 1,
            explanation: "The -sn flag performs a ping scan (host discovery) without scanning ports."
        },
        {
            question: "Which Nmap flag enables service version detection?",
            options: ["-sV", "-sS", "-sU", "-sT"],
            correct: 0,
            explanation: "The -sV flag enables service version detection."
        }
    ],
    'nikto-web-scan': [
        {
            question: "What type of vulnerabilities does Nikto primarily scan for?",
            options: [
                "Network vulnerabilities",
                "Web application vulnerabilities",
                "Operating system vulnerabilities",
                "Database vulnerabilities"
            ],
            correct: 1,
            explanation: "Nikto is specifically designed to scan for web application vulnerabilities."
        }
    ]
};

// GET - Retrieve lesson content
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const lessonId = searchParams.get('lessonId');
        const action = searchParams.get('action');

        if (action === 'list') {
            // Return list of all lessons
            const lessonList = Object.values(lessons).map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                difficulty: lesson.difficulty,
                estimatedTime: lesson.estimatedTime,
                xpReward: lesson.xpReward,
                category: lesson.category,
                prerequisites: lesson.prerequisites
            }));

            return NextResponse.json({
                success: true,
                lessons: lessonList
            });
        }

        if (!lessonId) {
            return NextResponse.json(
                { error: 'Lesson ID is required' },
                { status: 400 }
            );
        }

        const lesson = lessons[lessonId];
        if (!lesson) {
            return NextResponse.json(
                { error: 'Lesson not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            lesson
        });
    } catch (error) {
        console.error('Error retrieving lesson:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve lesson', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Execute lesson step or validate completion
export async function POST(request) {
    try {
        const body = await request.json();
        const { lessonId, stepId, action, userCommand, userId } = body;

        if (!lessonId || !stepId) {
            return NextResponse.json(
                { error: 'Lesson ID and Step ID are required' },
                { status: 400 }
            );
        }

        const lesson = lessons[lessonId];
        if (!lesson) {
            return NextResponse.json(
                { error: 'Lesson not found' },
                { status: 404 }
            );
        }

        const step = lesson.steps.find(s => s.id === stepId);
        if (!step) {
            return NextResponse.json(
                { error: 'Step not found' },
                { status: 404 }
            );
        }

        switch (action) {
            case 'execute_command':
                return await executeVMCommand(step, userCommand, userId);
            
            case 'validate_step':
                return await validateStepCompletion(lesson, step, body);
            
            case 'get_assessment':
                return getAssessmentQuestions(lessonId);
            
            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error processing lesson request:', error);
        return NextResponse.json(
            { error: 'Failed to process request', details: error.message },
            { status: 500 }
        );
    }
}

// Execute command in VM and validate
async function executeVMCommand(step, userCommand, userId) {
    try {
        // Check if VM is running
        const { stdout: runningContainers } = await execPromise(
            `docker ps -q -f name=${containerName}`
        );
        
        if (!runningContainers.trim()) {
            return NextResponse.json({
                success: false,
                error: 'VM is not running. Please start the VM first.',
                requiresVM: true
            });
        }

        // Execute the command in the container
        const dockerCommand = `docker exec ${containerName} ${userCommand}`;
        console.log(`Executing lesson command for user ${userId}:`, dockerCommand);

        try {
            const { stdout, stderr } = await execPromise(dockerCommand, {
                timeout: 30000, // 30 second timeout for lesson commands
                maxBuffer: 1024 * 1024 * 2 // 2MB buffer
            });

            const output = stdout || stderr || "Command executed";
            
            // Validate the output against expected patterns
            const isValid = validateCommandOutput(step, output);
            
            // Award XP for successful command execution
            let xpAwarded = 0;
            if (isValid) {
                xpAwarded = 25; // Base XP for completing a step
                
                // Update user progress
                await updateLearningProgress(userId, {
                    action: 'step_completed',
                    lessonId: step.lessonId || 'unknown',
                    stepId: step.id,
                    xpEarned: xpAwarded,
                    skillCategory: step.category
                });
            }

            return NextResponse.json({
                success: true,
                output,
                isValid,
                xpAwarded,
                feedback: isValid ? 'Great job! Step completed successfully.' : 'Try again. Check the hints for guidance.'
            });

        } catch (execError) {
            const errorOutput = execError.stderr || execError.message || "Command execution failed";
            
            return NextResponse.json({
                success: true, // Still return success to show the error output
                output: errorOutput,
                isValid: false,
                isError: true,
                feedback: 'Command execution failed. Check your syntax and try again.'
            });
        }

    } catch (error) {
        console.error('VM command execution error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to execute command in VM',
            details: error.message
        });
    }
}

// Validate command output against expected patterns
function validateCommandOutput(step, output) {
    if (!step.validation || !step.expectedPatterns) {
        return true; // No validation required
    }

    const { type, patterns } = step.validation;
    const outputLower = output.toLowerCase();

    switch (type) {
        case 'output_contains':
            return patterns.some(pattern => 
                outputLower.includes(pattern.toLowerCase())
            );
        
        case 'output_matches':
            return patterns.some(pattern => {
                const regex = new RegExp(pattern, 'i');
                return regex.test(output);
            });
        
        default:
            return step.expectedPatterns.some(pattern =>
                outputLower.includes(pattern.toLowerCase())
            );
    }
}

// Validate step completion
async function validateStepCompletion(lesson, step, data) {
    const { userId, userAnswer, executionResult } = data;
    
    let isValid = false;
    let feedback = '';
    let xpAwarded = 0;

    switch (step.type) {
        case 'vm-interactive':
            isValid = executionResult && executionResult.isValid;
            feedback = executionResult ? executionResult.feedback : 'No execution result provided';
            xpAwarded = isValid ? 25 : 0;
            break;
        
        case 'quiz':
            // Handle quiz validation (would need quiz data in step)
            isValid = userAnswer === step.correctAnswer;
            feedback = isValid ? 'Correct!' : 'Incorrect. Try again.';
            xpAwarded = isValid ? 15 : 0;
            break;
        
        case 'explanation':
            // Explanations are automatically completed
            isValid = true;
            feedback = 'Section completed';
            xpAwarded = 10;
            break;
        
        default:
            isValid = true;
            xpAwarded = 10;
    }

    // Update progress if step is completed
    if (isValid && userId) {
        await updateLearningProgress(userId, {
            action: 'step_completed',
            lessonId: lesson.id,
            stepId: step.id,
            xpEarned: xpAwarded,
            skillCategory: lesson.category
        });
    }

    return NextResponse.json({
        success: true,
        isValid,
        feedback,
        xpAwarded
    });
}

// Get assessment questions for a lesson
function getAssessmentQuestions(lessonId) {
    const questions = assessmentQuestions[lessonId] || [];
    
    return NextResponse.json({
        success: true,
        questions
    });
}

// Update learning progress (helper function)
async function updateLearningProgress(userId, progressData) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/learning/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                progress: progressData,
                action: progressData.action
            })
        });
        
        if (!response.ok) {
            console.error('Failed to update learning progress');
        }
    } catch (error) {
        console.error('Error updating learning progress:', error);
    }
}
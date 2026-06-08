// app/api/learning/assessments/route.js
import { NextResponse } from "next/server";

// Assessment definitions with VM-based practical questions
const assessments = {
    reconnaissance: {
        id: 'reconnaissance',
        name: 'Reconnaissance & Information Gathering',
        description: 'Test your knowledge of reconnaissance techniques and tools',
        difficulty: 'Beginner',
        timeLimit: 20, // minutes
        passingScore: 70,
        xpReward: 100,
        questions: [
            {
                id: 'recon-1',
                type: 'multiple-choice',
                question: 'Which of the following is considered passive reconnaissance?',
                options: [
                    'Port scanning with Nmap',
                    'DNS enumeration using dig',
                    'Searching public databases and social media',
                    'Banner grabbing from services'
                ],
                correct: 2,
                explanation: 'Passive reconnaissance involves gathering information without directly interacting with the target system. Searching public databases and social media falls into this category.',
                points: 10
            },
            {
                id: 'recon-2',
                type: 'multiple-choice',
                question: 'What does OSINT stand for?',
                options: [
                    'Open Source Intelligence',
                    'Operating System Intelligence',
                    'Online Security Intelligence',
                    'Operational Security Intelligence'
                ],
                correct: 0,
                explanation: 'OSINT stands for Open Source Intelligence, which refers to intelligence collected from publicly available sources.',
                points: 10
            },
            {
                id: 'recon-3',
                type: 'vm-practical',
                question: 'Use Nmap to perform a ping scan on the network range 192.168.1.0/24. What command would you use?',
                expectedCommand: 'nmap -sn 192.168.1.0/24',
                acceptableVariations: [
                    'nmap -sn 192.168.1.0/24',
                    'nmap -sP 192.168.1.0/24'
                ],
                explanation: 'The -sn flag performs a ping scan without port scanning, useful for host discovery.',
                points: 15,
                vmRequired: true
            },
            {
                id: 'recon-4',
                type: 'multiple-choice',
                question: 'Which tool is commonly used for DNS enumeration?',
                options: ['Nmap', 'Nikto', 'dig', 'Metasploit'],
                correct: 2,
                explanation: 'dig is a DNS lookup tool commonly used for DNS enumeration and information gathering.',
                points: 10
            },
            {
                id: 'recon-5',
                type: 'vm-practical',
                question: 'Perform a whois lookup on the domain "example.com". What command would you use?',
                expectedCommand: 'whois example.com',
                acceptableVariations: ['whois example.com'],
                explanation: 'The whois command retrieves registration information for domains and IP addresses.',
                points: 15,
                vmRequired: true
            }
        ]
    },
    scanning: {
        id: 'scanning',
        name: 'Scanning & Enumeration',
        description: 'Test your knowledge of network scanning and service enumeration',
        difficulty: 'Intermediate',
        timeLimit: 25,
        passingScore: 70,
        xpReward: 150,
        questions: [
            {
                id: 'scan-1',
                type: 'multiple-choice',
                question: 'Which Nmap scan type is considered the most stealthy?',
                options: [
                    'TCP Connect scan (-sT)',
                    'SYN scan (-sS)',
                    'FIN scan (-sF)',
                    'UDP scan (-sU)'
                ],
                correct: 2,
                explanation: 'FIN scan is considered more stealthy as it doesn\'t complete the TCP handshake and may bypass some firewalls.',
                points: 10
            },
            {
                id: 'scan-2',
                type: 'vm-practical',
                question: 'Use Nmap to perform a service version detection scan on scanme.nmap.org. What command would you use?',
                expectedCommand: 'nmap -sV scanme.nmap.org',
                acceptableVariations: [
                    'nmap -sV scanme.nmap.org',
                    'nmap -sV -T4 scanme.nmap.org'
                ],
                explanation: 'The -sV flag enables service version detection to identify running services and their versions.',
                points: 15,
                vmRequired: true
            },
            {
                id: 'scan-3',
                type: 'multiple-choice',
                question: 'What does a "filtered" port state indicate in Nmap results?',
                options: [
                    'The port is open and accepting connections',
                    'The port is closed',
                    'A firewall or filter is blocking access to the port',
                    'The port state cannot be determined'
                ],
                correct: 2,
                explanation: 'A filtered port indicates that a firewall, filter, or other network obstacle is blocking access to the port.',
                points: 10
            },
            {
                id: 'scan-4',
                type: 'vm-practical',
                question: 'Scan the top 100 most common ports on scanme.nmap.org using Nmap. What command would you use?',
                expectedCommand: 'nmap -F scanme.nmap.org',
                acceptableVariations: [
                    'nmap -F scanme.nmap.org',
                    'nmap --top-ports 100 scanme.nmap.org'
                ],
                explanation: 'The -F flag scans the top 100 most common ports, while --top-ports allows you to specify the number.',
                points: 15,
                vmRequired: true
            }
        ]
    },
    webSecurity: {
        id: 'webSecurity',
        name: 'Web Application Security',
        description: 'Test your knowledge of web application vulnerabilities and testing techniques',
        difficulty: 'Intermediate',
        timeLimit: 30,
        passingScore: 70,
        xpReward: 175,
        questions: [
            {
                id: 'web-1',
                type: 'multiple-choice',
                question: 'Which of the following is NOT part of the OWASP Top 10?',
                options: [
                    'SQL Injection',
                    'Cross-Site Scripting (XSS)',
                    'Buffer Overflow',
                    'Broken Authentication'
                ],
                correct: 2,
                explanation: 'Buffer Overflow is not part of the current OWASP Top 10, which focuses on web application vulnerabilities.',
                points: 10
            },
            {
                id: 'web-2',
                type: 'vm-practical',
                question: 'Use Nikto to scan the web application at http://testphp.vulnweb.com. What command would you use?',
                expectedCommand: 'nikto -h http://testphp.vulnweb.com',
                acceptableVariations: [
                    'nikto -h http://testphp.vulnweb.com',
                    'nikto -host http://testphp.vulnweb.com'
                ],
                explanation: 'Nikto uses the -h flag to specify the target host for web vulnerability scanning.',
                points: 15,
                vmRequired: true
            },
            {
                id: 'web-3',
                type: 'multiple-choice',
                question: 'What type of attack involves injecting malicious scripts into web pages viewed by other users?',
                options: [
                    'SQL Injection',
                    'Cross-Site Scripting (XSS)',
                    'Cross-Site Request Forgery (CSRF)',
                    'Directory Traversal'
                ],
                correct: 1,
                explanation: 'Cross-Site Scripting (XSS) involves injecting malicious scripts into web pages that are then executed by other users\' browsers.',
                points: 10
            },
            {
                id: 'web-4',
                type: 'multiple-choice',
                question: 'Which HTTP method is typically used for SQL injection attacks?',
                options: ['GET', 'POST', 'Both GET and POST', 'PUT'],
                correct: 2,
                explanation: 'SQL injection can occur through both GET and POST requests, depending on how the application processes user input.',
                points: 10
            }
        ]
    },
    exploitation: {
        id: 'exploitation',
        name: 'Exploitation Techniques',
        description: 'Test your knowledge of vulnerability exploitation and payload delivery',
        difficulty: 'Advanced',
        timeLimit: 35,
        passingScore: 70,
        xpReward: 200,
        questions: [
            {
                id: 'exploit-1',
                type: 'multiple-choice',
                question: 'What is the primary purpose of the Metasploit Framework?',
                options: [
                    'Network scanning',
                    'Vulnerability assessment',
                    'Exploit development and execution',
                    'Log analysis'
                ],
                correct: 2,
                explanation: 'Metasploit is primarily designed for exploit development, testing, and execution in penetration testing.',
                points: 10
            },
            {
                id: 'exploit-2',
                type: 'multiple-choice',
                question: 'What does NOP sled stand for in exploit development?',
                options: [
                    'Network Operation Protocol sled',
                    'No Operation sled',
                    'New Overflow Protection sled',
                    'Network Overflow Prevention sled'
                ],
                correct: 1,
                explanation: 'NOP sled stands for No Operation sled, used in buffer overflow exploits to increase the chances of successful exploitation.',
                points: 15
            },
            {
                id: 'exploit-3',
                type: 'multiple-choice',
                question: 'Which of the following is a common technique for bypassing ASLR (Address Space Layout Randomization)?',
                options: [
                    'Return-to-libc',
                    'ROP (Return-Oriented Programming)',
                    'JIT spraying',
                    'All of the above'
                ],
                correct: 3,
                explanation: 'All mentioned techniques can be used to bypass ASLR in different scenarios and exploit contexts.',
                points: 15
            }
        ]
    }
};

// GET - Retrieve assessment or list assessments
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const assessmentId = searchParams.get('assessmentId');
        const action = searchParams.get('action');

        if (action === 'list') {
            // Return list of all assessments
            const assessmentList = Object.values(assessments).map(assessment => ({
                id: assessment.id,
                name: assessment.name,
                description: assessment.description,
                difficulty: assessment.difficulty,
                timeLimit: assessment.timeLimit,
                passingScore: assessment.passingScore,
                xpReward: assessment.xpReward,
                questionCount: assessment.questions.length
            }));

            return NextResponse.json({
                success: true,
                assessments: assessmentList
            });
        }

        if (!assessmentId) {
            return NextResponse.json(
                { error: 'Assessment ID is required' },
                { status: 400 }
            );
        }

        const assessment = assessments[assessmentId];
        if (!assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Return assessment without correct answers (for security)
        const safeAssessment = {
            ...assessment,
            questions: assessment.questions.map(q => ({
                id: q.id,
                type: q.type,
                question: q.question,
                options: q.options,
                points: q.points,
                vmRequired: q.vmRequired
            }))
        };

        return NextResponse.json({
            success: true,
            assessment: safeAssessment
        });
    } catch (error) {
        console.error('Error retrieving assessment:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve assessment', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Submit assessment or validate practical question
export async function POST(request) {
    try {
        const body = await request.json();
        const { assessmentId, action, userId } = body;

        if (!assessmentId) {
            return NextResponse.json(
                { error: 'Assessment ID is required' },
                { status: 400 }
            );
        }

        const assessment = assessments[assessmentId];
        if (!assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        switch (action) {
            case 'submit':
                return await submitAssessment(assessment, body);
            
            case 'validate_practical':
                return await validatePracticalQuestion(assessment, body);
            
            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error processing assessment:', error);
        return NextResponse.json(
            { error: 'Failed to process assessment', details: error.message },
            { status: 500 }
        );
    }
}

// Submit complete assessment
async function submitAssessment(assessment, data) {
    const { userId, answers, timeSpent } = data;
    
    if (!answers || typeof answers !== 'object') {
        return NextResponse.json(
            { error: 'Answers are required' },
            { status: 400 }
        );
    }

    let totalScore = 0;
    let maxScore = 0;
    const results = [];

    // Grade each question
    for (const question of assessment.questions) {
        maxScore += question.points;
        const userAnswer = answers[question.id];
        
        let isCorrect = false;
        let earnedPoints = 0;

        if (question.type === 'multiple-choice') {
            isCorrect = userAnswer === question.correct;
            earnedPoints = isCorrect ? question.points : 0;
        } else if (question.type === 'vm-practical') {
            // For practical questions, assume they were validated separately
            isCorrect = userAnswer && userAnswer.isCorrect;
            earnedPoints = isCorrect ? question.points : 0;
        }

        totalScore += earnedPoints;
        
        results.push({
            questionId: question.id,
            isCorrect,
            earnedPoints,
            maxPoints: question.points,
            explanation: question.explanation
        });
    }

    const percentage = Math.round((totalScore / maxScore) * 100);
    const passed = percentage >= assessment.passingScore;
    const xpEarned = passed ? Math.round((percentage / 100) * assessment.xpReward) : 0;

    // Update user progress
    if (userId) {
        await updateAssessmentProgress(userId, {
            assessmentId: assessment.id,
            score: percentage,
            passed,
            xpEarned,
            timeSpent,
            skillCategory: assessment.id
        });
    }

    return NextResponse.json({
        success: true,
        results: {
            assessmentId: assessment.id,
            totalScore,
            maxScore,
            percentage,
            passed,
            xpEarned,
            timeSpent,
            questionResults: results,
            passingScore: assessment.passingScore
        }
    });
}

// Validate practical question (VM-based)
async function validatePracticalQuestion(assessment, data) {
    const { questionId, userCommand, executionResult } = data;
    
    const question = assessment.questions.find(q => q.id === questionId);
    if (!question || question.type !== 'vm-practical') {
        return NextResponse.json(
            { error: 'Invalid practical question' },
            { status: 400 }
        );
    }

    let isCorrect = false;
    let feedback = '';

    // Check if the command matches expected variations
    if (question.acceptableVariations) {
        isCorrect = question.acceptableVariations.some(variation => 
            userCommand.trim().toLowerCase() === variation.toLowerCase()
        );
    } else {
        isCorrect = userCommand.trim().toLowerCase() === question.expectedCommand.toLowerCase();
    }

    // Additional validation based on execution result if available
    if (executionResult && executionResult.output) {
        // Could add more sophisticated validation based on command output
        // For now, just check if command executed successfully
        if (!executionResult.isError && isCorrect) {
            feedback = 'Excellent! Command executed correctly.';
        } else if (isCorrect) {
            feedback = 'Command syntax is correct.';
        } else {
            feedback = 'Command syntax is incorrect. Check the expected format.';
        }
    } else {
        feedback = isCorrect ? 'Command syntax is correct.' : 'Command syntax is incorrect.';
    }

    return NextResponse.json({
        success: true,
        isCorrect,
        feedback,
        explanation: question.explanation,
        expectedCommand: question.expectedCommand
    });
}

// Update assessment progress
async function updateAssessmentProgress(userId, assessmentData) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/learning/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                progress: assessmentData,
                action: 'assessment_completed'
            })
        });
        
        if (!response.ok) {
            console.error('Failed to update assessment progress');
        }
    } catch (error) {
        console.error('Error updating assessment progress:', error);
    }
}
// app/api/learning/vm-integration/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import containerName from "../../../lib/containerName";

const execPromise = promisify(exec);

// Tool mapping for learning integration
const toolLearningMap = {
    'nmap': {
        skillCategory: 'reconnaissance',
        xpReward: 15,
        achievements: ['nmap-novice', 'nmap-expert'],
        learningObjectives: [
            'Network discovery',
            'Port scanning',
            'Service enumeration',
            'OS fingerprinting'
        ]
    },
    'nikto': {
        skillCategory: 'webSecurity',
        xpReward: 20,
        achievements: ['web-scanner-novice'],
        learningObjectives: [
            'Web vulnerability scanning',
            'Server misconfiguration detection',
            'Outdated software identification'
        ]
    },
    'metasploit': {
        skillCategory: 'exploitation',
        xpReward: 25,
        achievements: ['metasploit-master'],
        learningObjectives: [
            'Exploit development',
            'Payload generation',
            'Post-exploitation'
        ]
    },
    'sqlmap': {
        skillCategory: 'webSecurity',
        xpReward: 20,
        achievements: ['sql-injection-expert'],
        learningObjectives: [
            'SQL injection detection',
            'Database enumeration',
            'Data extraction'
        ]
    },
    'gobuster': {
        skillCategory: 'webSecurity',
        xpReward: 15,
        achievements: ['directory-buster'],
        learningObjectives: [
            'Directory enumeration',
            'Hidden file discovery',
            'Web content discovery'
        ]
    },
    'hydra': {
        skillCategory: 'exploitation',
        xpReward: 20,
        achievements: ['brute-force-master'],
        learningObjectives: [
            'Password attacks',
            'Brute force techniques',
            'Credential testing'
        ]
    },
    'john': {
        skillCategory: 'exploitation',
        xpReward: 20,
        achievements: ['password-cracker'],
        learningObjectives: [
            'Password cracking',
            'Hash analysis',
            'Dictionary attacks'
        ]
    },
    'wireshark': {
        skillCategory: 'networkSecurity',
        xpReward: 18,
        achievements: ['packet-analyst'],
        learningObjectives: [
            'Network traffic analysis',
            'Protocol analysis',
            'Network forensics'
        ]
    },
    'burpsuite': {
        skillCategory: 'webSecurity',
        xpReward: 25,
        achievements: ['web-app-tester'],
        learningObjectives: [
            'Web application testing',
            'Proxy interception',
            'Vulnerability assessment'
        ]
    }
};

// Command patterns for tool detection
const toolPatterns = {
    'nmap': /^nmap\s+/i,
    'nikto': /^nikto\s+/i,
    'metasploit': /^(msfconsole|msfvenom|meterpreter)/i,
    'sqlmap': /^sqlmap\s+/i,
    'gobuster': /^gobuster\s+/i,
    'hydra': /^hydra\s+/i,
    'john': /^(john|johnny)\s+/i,
    'wireshark': /^(wireshark|tshark)\s+/i,
    'burpsuite': /^burp/i,
    'dig': /^dig\s+/i,
    'whois': /^whois\s+/i,
    'traceroute': /^traceroute\s+/i,
    'ping': /^ping\s+/i
};

// Learning context detection patterns
const learningContextPatterns = {
    'reconnaissance': [
        /nmap.*-sn/i,  // Host discovery
        /nmap.*-sV/i,  // Service version detection
        /dig\s+/i,     // DNS queries
        /whois\s+/i,   // Domain information
        /traceroute/i  // Network path tracing
    ],
    'webSecurity': [
        /nikto.*-h/i,           // Web vulnerability scanning
        /sqlmap.*-u/i,          // SQL injection testing
        /gobuster.*dir/i,       // Directory enumeration
        /burp/i                 // Web app testing
    ],
    'exploitation': [
        /msfconsole/i,          // Metasploit console
        /msfvenom/i,            // Payload generation
        /hydra.*-l/i,           // Brute force attacks
        /john.*--wordlist/i     // Password cracking
    ],
    'networkSecurity': [
        /wireshark/i,           // Network analysis
        /tshark/i,              // Command-line Wireshark
        /nmap.*-sS/i,           // Stealth scanning
        /nmap.*-O/i             // OS detection
    ]
};

// POST - Execute command with learning integration
export async function POST(request) {
    try {
        const body = await request.json();
        const { command, userId, lessonId, stepId } = body;

        if (!command || typeof command !== "string") {
            return NextResponse.json(
                { error: "Invalid command" },
                { status: 400 }
            );
        }

        // Security check - use existing restrictions from execute route
        const restrictedPatterns = [
            /\brm\s+-rf\b/,
            /\bshutdown\b/,
            /\breboot\b/,
            /\binit\b/,
            />/,
            />>/,
            /\bchmod\s+777\b/,
            /\bdd\b/,
        ];

        if (restrictedPatterns.some((pattern) => pattern.test(command))) {
            return NextResponse.json(
                { error: "This command is restricted for security reasons" },
                { status: 403 }
            );
        }

        // Check VM status and start if needed
        const vmReady = await ensureVMReady();
        if (!vmReady.success) {
            return NextResponse.json(vmReady, { status: 500 });
        }

        // Execute command
        const executionResult = await executeCommand(command);
        
        // Analyze command for learning integration
        const learningAnalysis = analyzeCommandForLearning(command, executionResult);
        
        // Update user progress if userId provided
        if (userId && learningAnalysis.toolDetected) {
            await updateLearningProgress(userId, command, learningAnalysis, lessonId, stepId);
        }

        // Check for achievements
        if (userId && learningAnalysis.toolDetected) {
            await checkAndAwardAchievements(userId, learningAnalysis);
        }

        return NextResponse.json({
            success: true,
            output: executionResult.output,
            isError: executionResult.isError,
            learningData: {
                toolDetected: learningAnalysis.toolDetected,
                skillCategory: learningAnalysis.skillCategory,
                xpAwarded: learningAnalysis.xpAwarded,
                learningObjectives: learningAnalysis.learningObjectives,
                feedback: learningAnalysis.feedback,
                suggestions: learningAnalysis.suggestions
            }
        });

    } catch (error) {
        console.error('VM integration error:', error);
        return NextResponse.json(
            { error: 'Failed to execute command', details: error.message },
            { status: 500 }
        );
    }
}

// Ensure VM is ready for execution
async function ensureVMReady() {
    try {
        // Check if container is running
        const { stdout: runningContainers } = await execPromise(
            `docker ps -q -f name=${containerName}`
        );
        
        if (!runningContainers.trim()) {
            // Try to start the container
            try {
                await execPromise(`docker start ${containerName}`);
                
                // Wait a moment for container to fully start
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Verify it's running
                const { stdout: checkRunning } = await execPromise(
                    `docker ps -q -f name=${containerName}`
                );
                
                if (!checkRunning.trim()) {
                    return {
                        success: false,
                        error: 'VM could not be started. Please check your Docker setup.'
                    };
                }
            } catch (startError) {
                return {
                    success: false,
                    error: `Failed to start VM: ${startError.message}`
                };
            }
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: `VM check failed: ${error.message}`
        };
    }
}

// Execute command in VM
async function executeCommand(command) {
    try {
        const dockerCommand = `docker exec ${containerName} ${command}`;
        console.log('Executing learning-integrated command:', dockerCommand);

        const { stdout, stderr } = await execPromise(dockerCommand, {
            timeout: 60000,  // 60 second timeout
            maxBuffer: 1024 * 1024 * 5  // 5MB buffer
        });

        return {
            output: stdout || stderr || "Command executed successfully",
            isError: false
        };
    } catch (execError) {
        return {
            output: execError.stderr || execError.message || "Command execution failed",
            isError: true
        };
    }
}

// Analyze command for learning integration
function analyzeCommandForLearning(command, executionResult) {
    const analysis = {
        toolDetected: null,
        skillCategory: null,
        xpAwarded: 0,
        learningObjectives: [],
        feedback: '',
        suggestions: [],
        commandComplexity: 'basic'
    };

    // Detect which tool was used
    for (const [tool, pattern] of Object.entries(toolPatterns)) {
        if (pattern.test(command)) {
            analysis.toolDetected = tool;
            
            const toolInfo = toolLearningMap[tool];
            if (toolInfo) {
                analysis.skillCategory = toolInfo.skillCategory;
                analysis.xpAwarded = toolInfo.xpReward;
                analysis.learningObjectives = toolInfo.learningObjectives;
            }
            break;
        }
    }

    // Analyze command complexity
    analysis.commandComplexity = analyzeCommandComplexity(command);
    
    // Adjust XP based on complexity
    if (analysis.commandComplexity === 'intermediate') {
        analysis.xpAwarded = Math.floor(analysis.xpAwarded * 1.5);
    } else if (analysis.commandComplexity === 'advanced') {
        analysis.xpAwarded = Math.floor(analysis.xpAwarded * 2);
    }

    // Generate feedback and suggestions
    analysis.feedback = generateLearningFeedback(command, analysis, executionResult);
    analysis.suggestions = generateLearningSuggestions(command, analysis);

    return analysis;
}

// Analyze command complexity
function analyzeCommandComplexity(command) {
    const flags = (command.match(/-\w+/g) || []).length;
    const pipes = (command.match(/\|/g) || []).length;
    const redirects = (command.match(/[><]/g) || []).length;
    
    const complexityScore = flags + (pipes * 2) + (redirects * 2);
    
    if (complexityScore >= 8) return 'advanced';
    if (complexityScore >= 4) return 'intermediate';
    return 'basic';
}

// Generate learning feedback
function generateLearningFeedback(command, analysis, executionResult) {
    if (!analysis.toolDetected) {
        return 'Command executed. Try using security tools like nmap, nikto, or metasploit to earn learning XP!';
    }

    let feedback = `Great! You used ${analysis.toolDetected}. `;
    
    if (!executionResult.isError) {
        feedback += `Command executed successfully. You earned ${analysis.xpAwarded} XP! `;
        
        // Tool-specific feedback
        switch (analysis.toolDetected) {
            case 'nmap':
                if (command.includes('-sV')) {
                    feedback += 'Excellent use of service version detection!';
                } else if (command.includes('-sn')) {
                    feedback += 'Good host discovery technique!';
                } else if (command.includes('-sS')) {
                    feedback += 'Nice stealth scanning approach!';
                }
                break;
            case 'nikto':
                feedback += 'Web vulnerability scanning is essential for web app security!';
                break;
            case 'metasploit':
                feedback += 'Metasploit is a powerful exploitation framework. Use it responsibly!';
                break;
        }
    } else {
        feedback += 'Command had an error, but you still get partial XP for trying! Check the syntax and try again.';
        analysis.xpAwarded = Math.floor(analysis.xpAwarded * 0.3); // Reduced XP for errors
    }

    return feedback;
}

// Generate learning suggestions
function generateLearningSuggestions(command, analysis) {
    const suggestions = [];

    if (!analysis.toolDetected) {
        suggestions.push('Try using security tools to enhance your learning experience');
        suggestions.push('Start with basic nmap scans: nmap -sn <target>');
        return suggestions;
    }

    // Tool-specific suggestions
    switch (analysis.toolDetected) {
        case 'nmap':
            if (!command.includes('-sV')) {
                suggestions.push('Try adding -sV for service version detection');
            }
            if (!command.includes('-O')) {
                suggestions.push('Add -O for OS detection (requires root privileges)');
            }
            if (!command.includes('--script')) {
                suggestions.push('Explore NSE scripts with --script option');
            }
            break;
        
        case 'nikto':
            if (!command.includes('-Tuning')) {
                suggestions.push('Use -Tuning to focus on specific vulnerability types');
            }
            suggestions.push('Try scanning different ports with -p option');
            break;
        
        case 'metasploit':
            suggestions.push('Explore different modules with search command');
            suggestions.push('Practice payload generation with msfvenom');
            break;
    }

    // General suggestions based on skill category
    if (analysis.skillCategory === 'reconnaissance') {
        suggestions.push('Combine multiple reconnaissance tools for comprehensive information gathering');
    } else if (analysis.skillCategory === 'webSecurity') {
        suggestions.push('Always test on authorized targets only');
    }

    return suggestions;
}

// Update learning progress
async function updateLearningProgress(userId, command, analysis, lessonId, stepId) {
    try {
        const progressData = {
            action: 'tool_used',
            toolName: analysis.toolDetected,
            skillCategory: analysis.skillCategory,
            xpEarned: analysis.xpAwarded,
            command: command,
            complexity: analysis.commandComplexity,
            timestamp: new Date().toISOString()
        };

        // Add lesson context if provided
        if (lessonId) {
            progressData.lessonId = lessonId;
        }
        if (stepId) {
            progressData.stepId = stepId;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/learning/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                progress: progressData,
                action: 'tool_used'
            })
        });

        if (!response.ok) {
            console.error('Failed to update learning progress');
        }
    } catch (error) {
        console.error('Error updating learning progress:', error);
    }
}

// Check and award achievements
async function checkAndAwardAchievements(userId, analysis) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/learning/achievements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'check_achievements',
                userId
            })
        });

        if (!response.ok) {
            console.error('Failed to check achievements');
        }
    } catch (error) {
        console.error('Error checking achievements:', error);
    }
}

// GET - Get learning context for current session
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const action = searchParams.get('action');

        switch (action) {
            case 'vm_status':
                const vmStatus = await ensureVMReady();
                return NextResponse.json({
                    success: true,
                    vmReady: vmStatus.success,
                    message: vmStatus.error || 'VM is ready'
                });

            case 'learning_context':
                if (!userId) {
                    return NextResponse.json(
                        { error: 'User ID required for learning context' },
                        { status: 400 }
                    );
                }
                
                const context = await getLearningContext(userId);
                return NextResponse.json({
                    success: true,
                    context
                });

            case 'tool_suggestions':
                const suggestions = getToolSuggestions();
                return NextResponse.json({
                    success: true,
                    suggestions
                });

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in VM integration GET:', error);
        return NextResponse.json(
            { error: 'Failed to process request', details: error.message },
            { status: 500 }
        );
    }
}

// Get learning context for user
async function getLearningContext(userId) {
    try {
        const progressResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/learning/progress?userId=${userId}`);
        
        if (!progressResponse.ok) {
            return { error: 'Failed to fetch user progress' };
        }

        const { progress } = await progressResponse.json();
        
        return {
            currentLevel: progress.level,
            totalXP: progress.totalXP,
            skillLevels: progress.skillLevels,
            recentTools: Object.keys(progress.toolUsage || {}).slice(-5),
            suggestedTools: getSuggestedTools(progress),
            activeLesson: progress.activeLesson || null
        };
    } catch (error) {
        return { error: 'Failed to get learning context' };
    }
}

// Get suggested tools based on progress
function getSuggestedTools(progress) {
    const suggestions = [];
    const toolUsage = progress.toolUsage || {};
    const skillLevels = progress.skillLevels || {};

    // Suggest tools based on skill levels
    if (skillLevels.reconnaissance < 50 && !toolUsage.nmap) {
        suggestions.push({
            tool: 'nmap',
            reason: 'Essential for network reconnaissance',
            command: 'nmap -sn 192.168.1.0/24'
        });
    }

    if (skillLevels.webSecurity < 50 && !toolUsage.nikto) {
        suggestions.push({
            tool: 'nikto',
            reason: 'Important for web vulnerability scanning',
            command: 'nikto -h http://testphp.vulnweb.com'
        });
    }

    return suggestions;
}

// Get general tool suggestions
function getToolSuggestions() {
    return [
        {
            category: 'reconnaissance',
            tools: [
                { name: 'nmap', description: 'Network discovery and port scanning', example: 'nmap -sV scanme.nmap.org' },
                { name: 'dig', description: 'DNS lookup utility', example: 'dig google.com' },
                { name: 'whois', description: 'Domain registration information', example: 'whois google.com' }
            ]
        },
        {
            category: 'webSecurity',
            tools: [
                { name: 'nikto', description: 'Web vulnerability scanner', example: 'nikto -h http://testphp.vulnweb.com' },
                { name: 'sqlmap', description: 'SQL injection testing tool', example: 'sqlmap -u "http://testphp.vulnweb.com/listproducts.php?cat=1"' },
                { name: 'gobuster', description: 'Directory and file enumeration', example: 'gobuster dir -u http://example.com -w /usr/share/wordlists/dirb/common.txt' }
            ]
        },
        {
            category: 'exploitation',
            tools: [
                { name: 'metasploit', description: 'Exploitation framework', example: 'msfconsole' },
                { name: 'hydra', description: 'Password brute-forcing tool', example: 'hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.1' }
            ]
        }
    ];
}
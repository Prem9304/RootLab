// public/challengesConfig.js

import { Target, Lock, FileText, WifiOff } from 'lucide-react'; // Example icons

export const challengesConfig = {
  levels: [
    {
      id: 'level-1-web-basics',
      name: 'Web Server Recon',
      difficulty: 'Easy',
      icon: <Target size={20} />,
      description: 'Identify open ports and running services on a basic web server.',
      objectives: [
        'Find the open HTTP port.',
        'Identify the web server software and version.',
        'Discover any hidden directories.',
      ],
      victimImage: 'vulnerable/web-basics:latest', // Example Docker image name
      tags: ['Web', 'Recon', 'Nmap'],
      completionFlagFormat: 'FLAG{...}', // Optional: hint for flag format
    },
    {
      id: 'level-2-login-brute',
      name: 'Simple Login Bypass',
      difficulty: 'Easy',
      icon: <Lock size={20} />,
      description: 'Gain access to a web application with weak credentials.',
      objectives: [
        'Find the login page.',
        'Identify potential usernames.',
        'Brute-force the password for a known user.',
        'Retrieve the flag after successful login.',
      ],
      victimImage: 'vulnerable/login-app:latest',
      tags: ['Web', 'Brute-force', 'Hydra'],
      completionFlagFormat: 'FLAG{...}',
    },
    {
      id: 'level-3-log-poison',
      name: 'Log File Analysis',
      difficulty: 'Medium',
      icon: <FileText size={20} />,
      description: 'Analyze log files to find clues or exploit a log poisoning vulnerability.',
      objectives: [
        'Locate the relevant application log files.',
        'Identify suspicious entries or error messages.',
        'Potentially inject malicious data if vulnerable.',
        'Find the hidden flag within the logs or system.',
      ],
      victimImage: 'vulnerable/log-analyzer:latest',
      tags: ['Web', 'Logs', 'LFI', 'RCE'],
      completionFlagFormat: 'FLAG{...}',
    },
    // --- Add more levels here ---
    {
      id: 'level-4-network-pivot',
      name: 'Network Segmentation Bypass',
      difficulty: 'Hard',
      icon: <WifiOff size={20} />,
      description: 'Compromise one machine and use it to pivot into a restricted network segment.',
      objectives: [
          'Gain initial access to the first machine.',
          'Identify internal network interfaces and routes.',
          'Scan the internal network from the compromised host.',
          'Exploit a service on the internal target.',
          'Retrieve the final flag from the internal server.'
      ],
      victimImage: 'vulnerable/network-pivot-setup:latest', // This might need a more complex setup (e.g., docker-compose)
      tags: ['Networking', 'Pivoting', 'Metasploit', 'Proxychains'],
      completionFlagFormat: 'FLAG{...}',
    },
  ],
};

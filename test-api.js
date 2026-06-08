// Simple test script to verify the Groq API is working
// Run with: node test-api.js

const fetch = require('node-fetch');

async function testGroqAPI() {
    try {
        console.log('Testing Groq API...');
        
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: 'Generate a brief description of reconnaissance in cybersecurity.'
                    }
                ]
            })
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return;
        }

        const data = await response.json();
        console.log('API Response:', data);
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testGroqAPI();
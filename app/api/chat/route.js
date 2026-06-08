// app/api/chat/route.js
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// Initialize Groq client with better error handling
let groq;
try {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (error) {
  console.error("Failed to initialize Groq client:", error);
  // We'll handle this when the route is called
}

export async function POST(request) {
  try {
    // Check if Groq client was initialized properly
    if (!groq) {
      return NextResponse.json(
        { error: "AI service is not properly configured", details: "API key may be missing or invalid" },
        { status: 500 }
      );
    }

    // Safely parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request format", details: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    // Validate messages array
    const { messages } = body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate each message has required fields
    const invalidMessage = messages.find(
      (msg) => !msg.role || !msg.content || typeof msg.content !== "string"
    );
    if (invalidMessage) {
      return NextResponse.json(
        { error: "Each message must have 'role' and 'content' fields" },
        { status: 400 }
      );
    }

    // Set request timeout duration (30 seconds)
    const REQUEST_TIMEOUT = 30000;

    try {
      // Make API request with timeout
      const chatCompletion = await Promise.race([
        groq.chat.completions.create({
          messages,
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0.7,  // Add temperature parameter for more control
          max_tokens: 1024,  // Add token limit to prevent overly long responses
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI request timed out after 30 seconds")), REQUEST_TIMEOUT)
        ),
      ]);

      // Validate response
      if (!chatCompletion || !chatCompletion.choices || !chatCompletion.choices[0]) {
        throw new Error("Invalid response from AI service");
      }

      // Return successful response with content and usage info
      return NextResponse.json({
        content: chatCompletion.choices[0]?.message?.content || "",
        usage: chatCompletion.usage || {},
        model: chatCompletion.model || "llama3-70b-8192"
      });
    } catch (groqError) {
      console.error("Groq API error:", groqError);

      // More detailed error handling
      let statusCode = 500;
      let errorMessage = `AI service error: ${groqError.message}`;

      // Handle rate limiting specifically
      if (groqError.message?.includes("rate limit") || groqError.statusCode === 429) {
        statusCode = 429;
        errorMessage = "Rate limit exceeded. Please try again later.";
      }

      // Handle authentication issues
      if (groqError.statusCode === 401 || groqError.statusCode === 403) {
        statusCode = 401;
        errorMessage = "Authentication failed with AI service. Please check your API key.";
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error("Unhandled error in chat route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Handle OPTIONS preflight requests correctly 
export async function OPTIONS() {
  // This must match the case of the HTTP method exactly
  return new NextResponse(null, {
    status: 204, // No content
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400" // 24 hours cache for preflight requests
    }
  });
}
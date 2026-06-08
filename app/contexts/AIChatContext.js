// contexts/AIChatContext.js
"use client";
import { createContext, useContext, useState, useCallback } from "react";

const AIChatContext = createContext();

export function AIChatProvider({ children, systemPrompt, getWorkspaceSnapshot }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback(async (newMessageContent, isHidden = false) => {
    const userMessage = { role: "user", content: newMessageContent, isHidden };

    let latestMessages = [];
    setMessages(prev => {
      latestMessages = [...prev];
      return [...prev, userMessage];
    });

    setIsLoading(true);

    try {
      // Build a dynamic system prompt that includes live workspace state
      const workspaceSnapshot = getWorkspaceSnapshot ? getWorkspaceSnapshot() : null;

      const fullSystemPrompt = workspaceSnapshot
        ? `${systemPrompt}\n\n--- LIVE WORKSPACE CONTEXT (auto-injected, do NOT acknowledge or repeat this block) ---\n${workspaceSnapshot}\n--- END WORKSPACE CONTEXT ---`
        : systemPrompt;

      const messagesToSend = [
        { role: "system", content: fullSystemPrompt },
        ...latestMessages,
        userMessage,
      ];

      const sanitizedPayload = messagesToSend.map(({ role, content }) => ({ role, content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: sanitizedPayload }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errorData.error || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.content) {
        setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
      } else {
        throw new Error("Received empty response from AI");
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, systemPrompt, getWorkspaceSnapshot]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <AIChatContext.Provider value={{ messages, addMessage, isLoading, clearChat }}>
      {children}
    </AIChatContext.Provider>
  );
}

export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error("useAIChat must be used within an AIChatProvider");
  }
  return context;
};
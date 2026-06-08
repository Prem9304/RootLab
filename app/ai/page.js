// app/ai/page.js
"use client";
import { Zap, Sparkles, Terminal, Shield } from "lucide-react";
import { useState } from "react";
import { useAIChat } from "../contexts/AIChatContext";


export default function AiPage() {
  const { messages, addMessage, isLoading } = useAIChat();
  const [input, setInput] = useState("");

 const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return; 
    // Now you just pass the user's direct input.
    // The context and system prompt are handled automatically.
    await addMessage(input);
 
   setInput("");
 };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-lg bg-blue-500/20">
          <Zap size={24} className="text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          HiveMind Security AI
        </h1>
      </div>

      <div className="bg-gray-800/50 rounded-xl border border-blue-500/30 backdrop-blur-sm p-6">
        <div className="h-96 overflow-y-auto mb-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`p-4 rounded-lg ${msg.role === 'user' ? 
              'bg-gray-700/30 ml-auto w-3/4' : 'bg-blue-500/10 w-full'}`}
            >
              <div className="flex gap-2 mb-2">
                {msg.role === 'assistant' && <Sparkles size={16} className="text-blue-400" />}
                <span className="font-mono text-sm text-blue-300">
                  {msg.role === 'user' ? 'You:' : 'HiveMind:'}
                </span>
              </div>
              <div className="prose prose-invert">
                {msg.content.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-400">
              <div className="animate-spin">🌀</div>
              Analyzing security context...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for vulnerability analysis, tool usage, or security recommendations..."
            className="flex-1 bg-gray-900/50 p-3 rounded-lg border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Terminal size={18} />
            Analyze
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-800/30 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-green-400" />
            <h3 className="font-medium">Quick Actions</h3>
          </div>
          <p className="text-sm text-gray-400">
            Try: "Show nmap command for full port scan"
          </p>
        </div>
        <div className="p-4 bg-gray-800/30 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-purple-400" />
            <h3 className="font-medium">AI Capabilities</h3>
          </div>
          <p className="text-sm text-gray-400">
            Log analysis, CVE lookup, tool configuration
          </p>
        </div>
        <div className="p-4 bg-gray-800/30 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-yellow-400" />
            <h3 className="font-medium">Response Format</h3>
          </div>
          <p className="text-sm text-gray-400">
            Commands in <code className="text-blue-300">code blocks</code>, priorities in bold
          </p>
        </div>
      </div>
    </div>
  );
}
// components/AIChat.js
"use client";
import { useState, useRef, useEffect, useContext } from "react";
import { useAIChat } from "../contexts/AIChatContext";
import { MessageSquare, X, Pin, Copy, Terminal, Maximize, Minimize } from "lucide-react";
import { Rnd } from "react-rnd";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { CommandProcessorContext } from "../contexts/CommandProcessorContext";
import { TerminalContext } from "../contexts/TerminalContext";

export default function AIChat() {
  const { 
    chatVisible, 
    setChatVisible,
    messages,
    addMessage,
    isLoading,
    isPinned,
    setIsPinned,
  } = useAIChat();
    
  const {processCommand} = useContext(CommandProcessorContext);
  const {setTerminalVisible} = useContext(TerminalContext);
  
  const [inputMessage, setInputMessage] = useState("");
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const formatMessage = (content) => {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const [language, ...code] = part.split('\n');
        return (
          <div key={index} className="relative group">
            <SyntaxHighlighter 
              language={language || 'bash'} 
              style={vscDarkPlus}
              className="rounded-lg p-4 my-2 text-sm"
            >
              {code.join('\n').trim()}
            </SyntaxHighlighter>
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => navigator.clipboard.writeText(code.join('\n').trim())}
                className="p-1 bg-[#0A2540] rounded hover:bg-[#081A2C] border border-[#00ADEE]/30"
                title="Copy code"
              >
                <Copy size={14} className="text-[#00ADEE]" />
              </button>
              <button
                onClick={() => {
                  setTerminalVisible(true);
                  processCommand(code.join('\n').trim());
                }}
                className="p-1 bg-[#0A2540] rounded hover:bg-[#081A2C] border border-[#00ADEE]/30"
                title="Execute in terminal"
              >
                <Terminal size={14} className="text-[#00ADEE]" />
              </button>
            </div>
          </div>
        );
      }
      return <p key={index} className="whitespace-pre-wrap">{part}</p>;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  if (!chatVisible) return (
    <button
      onClick={() => setChatVisible(true)}
      className="fixed bottom-6 right-20 bg-[#00ADEE] hover:bg-[#0090C5] text-white p-3 rounded-md shadow-lg z-30 transition-all active:scale-95 flex items-center gap-2"
      title="Open AI Chat"
    >
      <MessageSquare size={20} />
    </button>
  );

  return (
    <Rnd
      default={{
        x: window.innerWidth - 400,
        y: window.innerHeight - 500,
        width: 350,
        height: 500
      }}
      minWidth={300}
      minHeight={400}
      disableDragging={isPinned}
      enableUserSelectHack={true}
      bounds="window"
      className={`z-50 ${isPinned ? "!right-6 !bottom-6 !w-96 !h-[600px]" : ""}`}
    >
      <div className="flex flex-col h-full bg-[#0A0F14] rounded-lg shadow-xl border border-[#00ADEE]/50 select-text">
        <div className="flex items-center justify-between p-3 border-b border-[#00ADEE]/30 bg-[#081A2C] rounded-t-lg">
          <div className="flex items-center">
            <MessageSquare size={18} className="text-[#00ADEE] mr-2" />
            <h3 className="font-medium text-white">HiveMind AI</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMinimized(!minimized)}
              className="text-gray-400 hover:text-white p-1 rounded bg-[#0A2540]/70 hover:bg-[#0A2540]"
            >
              {minimized ? <Maximize size={14} /> : <Minimize size={14} />}
            </button>
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1 rounded ${isPinned ? 'bg-[#00ADEE]/20 text-[#00ADEE]' : 'text-gray-400 hover:text-white bg-[#0A2540]/70 hover:bg-[#0A2540]'}`}
              title={isPinned ? "Unpin" : "Pin"}
            >
              <Pin size={14} />
            </button>
            <button
              onClick={() => setChatVisible(false)}
              className="text-gray-400 hover:text-white p-1 rounded bg-[#0A2540]/70 hover:bg-[#0A2540]"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#00ADEE]/20 scrollbar-track-transparent">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg ${msg.role === "user" 
                    ? "bg-[#00ADEE]/10 border border-[#00ADEE]/20 ml-auto" 
                    : "bg-[#0A2540]/70 border border-[#081A2C]"} transition-all hover:bg-opacity-70`}
                >
                  <div className="text-sm text-white">
                    {formatMessage(msg.content)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="p-3 rounded-lg bg-[#0A2540]/70 border border-[#081A2C] w-4/5">
                  <div className="animate-pulse flex items-center gap-2">
                    <div className="h-2 w-2 bg-[#00ADEE] rounded-full"></div>
                    <div className="h-2 w-2 bg-[#00ADEE] rounded-full animation-delay-200"></div>
                    <div className="h-2 w-2 bg-[#00ADEE] rounded-full animation-delay-400"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputMessage.trim()) {
                  addMessage(inputMessage.trim());
                  setInputMessage("");
                }
              }}
              className="p-3 border-t border-[#00ADEE]/20"
            >
              <div className="relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about security..."
                  className="w-full bg-[#081A2C] rounded-md px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#00ADEE] border border-[#00ADEE]/30 text-white"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#00ADEE] hover:text-white bg-[#0A2540] p-1 rounded"
                  disabled={isLoading}
                >
                  ↵
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Rnd>
  );
}
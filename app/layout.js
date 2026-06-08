"use client";

import { useState, useEffect } from "react";
import "./globals.css";
import Providers from "./components/Providers";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import WindowManager from "./components/WindowManager"; 
import Taskbar from "./components/Taskbar"; 

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // If desktop (width >= 768px), default to open
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-gray-900 text-white relative">
            <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            
            <Sidebar 
              isOpen={sidebarOpen} 
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              closeSidebar={() => setSidebarOpen(false)} 
            />
            
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            {/* Main content — shifts right by sidebar width on desktop */}
            <main 
              className={`
                overflow-y-auto relative z-10
                pt-[calc(var(--header-height)+1.5rem)] md:pt-[calc(var(--header-height)+2rem)] pb-28
                p-4 md:p-8
                transition-all duration-300 ease-in-out
                min-h-screen
                ${sidebarOpen 
                  ? 'md:pl-[calc(288px+2.5rem)] md:pr-8' 
                  : 'md:pl-[calc(76px+2rem)] md:pr-8'
                }
              `}
            >
              {children}
            </main>
            
            <WindowManager />
            <Taskbar /> 
          </div>
        </Providers>
      </body>
    </html>
  );
}
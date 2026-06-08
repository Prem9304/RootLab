// app/components/ClientTerminalLoader.js
"use client"; // IMPORTANT: Mark this as a Client Component

import dynamic from 'next/dynamic';

// Do the dynamic import with ssr: false INSIDE this Client Component
const DynamicTerminal = dynamic(
  () => import('./Terminal').then(mod => mod.default), // Adjust path to Terminal.js if needed
  { 
    ssr: false, // This is allowed now because we are in a Client Component
    loading: () => ( // Optional loading state
        <div className="fixed inset-x-0 bottom-0 h-12 flex items-center justify-center bg-gray-800 text-gray-400 z-50 font-mono text-sm">
            Initializing Terminal... 
        </div>
    ) 
  }
);

// This component simply renders the dynamically loaded Terminal
export default function ClientTerminalLoader() {
  // Since TerminalProvider wraps this in layout.js, context will be available
  return <DynamicTerminal />;
}
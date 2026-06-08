// components/Typewriter.js
"use client";

import { useState, useEffect } from 'react';

export default function Typewriter({ 
  text = "", 
  speed = 50, 
  className = "",
  showCursor = true,
  cursorColor = "bg-[#00ADEE]",
  startDelay = 0
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setDisplayedText(''); // Reset when text changes
    setCurrentIndex(0);
    setIsTyping(false);
  }, [text]);

  useEffect(() => {
    if (!text) return;

    // Start delay before typing begins
    const startTimer = setTimeout(() => {
      setIsTyping(true);
    }, startDelay);

    return () => clearTimeout(startTimer);
  }, [text, startDelay]);

  useEffect(() => {
    if (!isTyping || !text || currentIndex >= text.length) {
      return; // Stop typing if not started, text is empty, or fully displayed
    }

    const timer = setTimeout(() => {
      setDisplayedText((prev) => prev + text[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer); // Cleanup timer
  }, [text, currentIndex, speed, isTyping]);

  // Check if typing is complete
  const isComplete = currentIndex >= text.length && text.length > 0;

  // Render with optional blinking cursor effect
  return (
    <span className={`${className}`}>
      {displayedText}
      {showCursor && (
        <span 
          className={`inline-block w-0.5 h-5 ml-1 ${cursorColor} ${
            isComplete ? 'animate-pulse' : 'animate-pulse'
          }`}
        />
      )}
    </span>
  );
}
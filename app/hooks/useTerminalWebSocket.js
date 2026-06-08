// hooks/useTerminalWebSocket.js
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export const ReadyState = {
  UNINSTANTIATED: -1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

export function useTerminalWebSocket(url, enabled = true) {
  const [readyState, setReadyState] = useState(ReadyState.CLOSED);
  const [lastMessage, setLastMessage] = useState(null); // Store last message event
  const [error, setError] = useState(null);
  const wsInstance = useRef(null);
  const messageQueue = useRef([]); // Queue messages if sent before connection is open

  // Memoize message handler callback if passed (optional)
  // const onMessageRef = useRef(onMessage);
  // useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  // Main effect for connection management
  useEffect(() => {
    // Don't connect if not enabled or URL is missing
    if (!enabled || !url) {
      // Ensure closed if previously open
      if (wsInstance.current && wsInstance.current.readyState !== ReadyState.CLOSED) {
        console.log(`useWS Hook: Closing WS because enabled=${enabled} or url=${url}`);
        wsInstance.current.close(1000, 'Connection disabled');
      }
      wsInstance.current = null; // Clear ref
      setReadyState(ReadyState.CLOSED);
      return; // Exit effect
    }

    // Prevent multiple connections
    if (wsInstance.current && wsInstance.current.url === url) {
         console.log(`useWS Hook: Already connected/connecting to ${url}`);
         // Update readyState just in case it wasn't correctly set
         setReadyState(wsInstance.current.readyState);
         return;
    }

    // --- Establish Connection ---
    console.log(`useWS Hook: Initializing WebSocket connection to ${url}...`);
    setReadyState(ReadyState.CONNECTING);
    setError(null); // Clear previous errors
    messageQueue.current = []; // Clear queue

    const ws = new WebSocket(url);
    wsInstance.current = ws; // Store instance immediately

    ws.onopen = () => {
      console.log(`useWS Hook: WebSocket OPEN for ${url}`);
      // Check if this is still the active instance before updating state
      if (wsInstance.current === ws) {
          setReadyState(ReadyState.OPEN);
          setError(null);
          // Send queued messages
          messageQueue.current.forEach(msg => ws.send(msg));
          messageQueue.current = [];
      } else {
           console.log("useWS Hook: onopen received for stale WS instance.");
           ws.close(1000, "Stale connection"); // Close stale connection
      }
    };

    ws.onclose = (event) => {
      console.log(`useWS Hook: WebSocket CLOSED for ${url}. Code: ${event.code}, Clean: ${event.wasClean}`);
       // Check if this is still the active instance before updating state
       if (wsInstance.current === ws) {
          setReadyState(ReadyState.CLOSED);
          wsInstance.current = null; // Clear ref on close
          // Optionally set error based on close code
          if (!event.wasClean) {
              setError(new Error(`WebSocket closed abnormally (Code: ${event.code})`));
          }
      } else {
            console.log("useWS Hook: onclose received for stale WS instance.");
      }
    };

    ws.onerror = (event) => {
      console.error(`useWS Hook: WebSocket ERROR for ${url}:`, event);
      // Check if this is still the active instance before updating state
      if (wsInstance.current === ws) {
          setError(new Error('WebSocket error occurred. Check console.'));
          // onclose usually follows, which will set state to CLOSED
      } else {
           console.log("useWS Hook: onerror received for stale WS instance.");
      }
    };

    ws.onmessage = (event) => {
      // console.log(`useWS Hook: Message received for ${url}`); // Noisy
      // Check if this is still the active instance before updating state
      if (wsInstance.current === ws) {
          setLastMessage(event); // Update state with the latest message event
          // If a callback ref was used: onMessageRef.current?.(event);
      } else {
           console.log("useWS Hook: onmessage received for stale WS instance.");
      }
    };

    // --- Cleanup Function ---
    return () => {
      console.log(`useWS Hook: Cleanup effect for ${url}. Current state: ${ws?.readyState}`);
      // Close the specific WebSocket instance created in *this* effect run
      if (ws && ws.readyState !== ReadyState.CLOSED && ws.readyState !== ReadyState.CLOSING) {
          console.log(`useWS Hook: Closing WebSocket instance from cleanup.`);
          ws.close(1000, 'Effect cleanup');
      }
       // Clear ref *only if* it still points to the instance created by this effect run
       if (wsInstance.current === ws) {
            console.log("useWS Hook: Nullifying wsInstance ref in cleanup.");
            wsInstance.current = null;
        }
    };
  }, [url, enabled]); // Effect dependencies

  // Function to send messages
  const sendMessage = useCallback((message) => {
    if (wsInstance.current && wsInstance.current.readyState === ReadyState.OPEN) {
      // console.log('useWS Hook: Sending message:', message); // Noisy
      wsInstance.current.send(message);
    } else {
      console.warn('useWS Hook: WebSocket not open, queueing message.');
      // Optionally queue or drop message
      messageQueue.current.push(message);
      // You might want to limit the queue size
    }
  }, []); // No dependencies, relies on wsInstance ref

  return { readyState, lastMessage, error, sendMessage };
}
"use client";

import React from 'react';
import Terminal from './Terminal';

const TerminalContent = ({ windowId }) => {
  return (
    <div className="h-full w-full">
      <Terminal isVisible={true} onClose={() => {}} />
    </div>
  );
};

export default TerminalContent;
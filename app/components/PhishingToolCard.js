'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, BookOpen, ExternalLink } from 'lucide-react';

const PhishingToolCard = ({ tool, onClose }) => {
  if (!tool || !tool.info) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">Tool information not available</p>
      </div>
    );
  }

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'text-red-400 bg-red-900/30 border-red-500/50';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50';
      case 'low':
        return 'text-green-400 bg-green-900/30 border-green-500/50';
      default:
        return 'text-gray-400 bg-gray-900/30 border-gray-500/50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start mb-4">
        <div className="w-12 h-12 rounded-lg bg-red-900/50 flex items-center justify-center mr-4 flex-shrink-0">
          {tool.icon && React.isValidElement(tool.icon) ? (
            React.cloneElement(tool.icon, { size: 24, className: "text-red-400" })
          ) : (
            <AlertTriangle size={24} className="text-red-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-1 truncate">
            {tool.name}
          </h3>
          <p className="text-sm text-gray-400">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Risk Level */}
      {tool.info.risk && (
        <div className="mb-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(tool.info.risk)}`}>
            <Shield size={12} className="mr-1" />
            Risk Level: {tool.info.risk}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-4 flex-1">
        <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
          <BookOpen size={14} className="mr-2" />
          Description
        </h4>
        <p className="text-sm text-gray-400 leading-relaxed">
          {tool.info.description}
        </p>
      </div>

      {/* Tags */}
      {tool.info.tags && tool.info.tags.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {tool.info.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-slate-700/50 text-xs text-gray-300 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      {tool.info.usage && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Usage Instructions</h4>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
              {tool.info.usage}
            </pre>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="mt-auto">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-start">
            <AlertTriangle size={16} className="text-red-400 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-1">
                Educational Use Only
              </h4>
              <p className="text-xs text-red-300/80">
                This tool is provided for educational and authorized testing purposes only. 
                Unauthorized use against systems you don't own is illegal and unethical. 
                Always obtain proper authorization before testing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PhishingToolCard;
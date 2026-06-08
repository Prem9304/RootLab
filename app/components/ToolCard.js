import React from 'react';
import { motion } from 'framer-motion';

const ToolCard = ({ tool, onClick }) => {
    const { name, description, icon, enabled } = tool;
    
    // Default icon background if none specified
    const iconBgColor = tool.iconBgColor || "#1e293b";

    return (
        <motion.div
            whileHover={{ scale: enabled ? 1.03 : 1 }}
            whileTap={{ scale: enabled ? 0.97 : 1 }}
            className={`bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden h-full
                ${enabled ? 'hover:bg-[#00ADEE]/10 hover:border-[#00ADEE]/30 hover:shadow-lg hover:shadow-[#00ADEE]/10' : 'cursor-not-allowed'}`}
            onClick={onClick}
        >
            <div className="p-5 flex flex-col h-full">
                {/* Tool Icon */}
                <div 
                    className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center text-white"
                    style={{ backgroundColor: iconBgColor }}
                >
                    {icon && typeof icon === "string" ? (
                        <span className="text-xl">{icon}</span>
                    ) : icon ? (
                        icon
                    ) : (
                        <span className="text-xl font-bold">{name.charAt(0)}</span>
                    )}
                </div>
                
                {/* Tool Details */}
                <h3 className="text-lg font-semibold text-white mb-2">{name}</h3>
                {description && (
                    <p className="text-sm text-gray-300 flex-grow">{description}</p>
                )}
                
                {/* Status Indicator */}
                <div className="mt-4 pt-3 border-t border-gray-700/50">
                    <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${enabled ? 'bg-green-400' : 'bg-yellow-500'}`}></div>
                        <span className="text-xs text-gray-400">
                            {enabled ? 'Ready to launch' : 'VM not running'}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ToolCard;
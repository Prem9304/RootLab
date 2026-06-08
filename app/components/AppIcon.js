import { useState } from "react";
import { motion } from "framer-motion";

// Assume 'tool' and 'onClick' are passed as props correctly.

const AppIcon = ({ tool, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Determine icon color based on group or default
    const iconBgColor = tool.iconBgColor || "#1e293b"; // Example default color

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`relative ${!tool.enabled ? "opacity-60" : ""}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                onClick={onClick}
                disabled={!tool.enabled}
                className={`w-full aspect-square bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden flex flex-col items-center justify-center text-center p-4 relative transition-all duration-200 ${
                    tool.enabled ? "hover:bg-[#00ADEE]/10 hover:border-[#00ADEE]/30 hover:shadow-lg hover:shadow-[#00ADEE]/10" : "cursor-not-allowed"
                }`}
            >
                {/* App Icon Container - THIS is the centering container */}
                <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg mb-3 flex items-center justify-center text-white overflow-hidden`} // Added overflow-hidden just in case
                    style={{ backgroundColor: iconBgColor }}
                >
                    {/* Conditional Icon Rendering */}
                    {tool.icon && typeof tool.icon === "string" ? (
                        // String icon (like emoji) - should center fine
                        <span className="text-2xl">{tool.icon}</span>
                    ) : tool.icon ? (
                        // Component icon - Render directly inside the centering container
                        // REMOVED the wrapping div: <div className="w-10 h-10">{tool.icon}</div>
                        tool.icon
                    ) : (
                        // Fallback character - should center fine
                        <div className="text-3xl font-bold">{tool.name.charAt(0)}</div>
                    )}
                </div>

                {/* App Name */}
                <span className="text-sm font-medium text-white truncate max-w-full">
                    {tool.name}
                </span>
            </button>

            {/* Tooltip on hover */}
            {isHovered && tool.enabled && (
                 <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-black/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl p-3"
                 >
                     <div className="flex items-start mb-2">
                         <div
                             className="w-10 h-10 rounded-lg mr-3 flex-shrink-0 flex items-center justify-center" // Centering works here too
                             style={{ backgroundColor: iconBgColor }}
                         >
                             {/* Consistent icon rendering logic for tooltip */}
                             {tool.icon && typeof tool.icon === "string" ? (
                                 <span className="text-xl">{tool.icon}</span> // Adjusted size for tooltip
                             ) : tool.icon ? (
                                 tool.icon // Direct rendering
                             ) : (
                                 <span className="text-xl font-bold">{tool.name.charAt(0)}</span>
                             )}
                         </div>
                         <div>
                             <h3 className="font-semibold text-white">{tool.name}</h3>
                             <p className="text-xs text-gray-400">{tool.groupName || "Application"}</p>
                         </div>
                     </div>
                     {tool.description && (
                         <p className="text-xs text-gray-300 mt-1">{tool.description}</p>
                     )}
                     <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-black/90 border-r border-b border-gray-700"></div>
                 </motion.div>
             )}
        </motion.div>
    );
};

// Make sure to export AppIcon if it's in a separate file
// export default AppIcon; // Or include it within the main Tools component file as you had it.
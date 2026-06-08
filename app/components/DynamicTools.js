// app/components/DynamicTools.js
"use client";

import React, { useState, useEffect } from "react";
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Bot, Loader2, Copy, X as CloseIcon, Terminal, Settings } from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";

export default function DynamicTools({ toolConfig, onClose, windowId }) {
    console.log(`Rendering DynamicTools component for: ${toolConfig?.name || 'Unknown Tool'}`);
    
    const { reportToolResult, reportActiveToolContext } = useWorkspace();

    const [formValues, setFormValues] = useState(() => {
        const initialState = {};
        toolConfig?.config?.inputs?.forEach(input => {
            initialState[input.name] = toolConfig.initialValues?.[input.name] ?? input.defaultValue ?? '';
            if (input.type === 'checkbox') {
                initialState[input.name] = toolConfig.initialValues?.[input.name] ?? input.defaultValue ?? false;
            }
        });
        return initialState;
    });

    useEffect(() => {
        if (toolConfig?.name && reportActiveToolContext) {
            reportActiveToolContext(toolConfig.name, formValues);
        }
        return () => {
            if (reportActiveToolContext) {
                reportActiveToolContext(null, null);
            }
        };
    }, [toolConfig?.name, formValues, reportActiveToolContext]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [results, setResults] = useState(null);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [copyStatus, setCopyStatus] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                DOMPurify.setConfig({ USE_PROFILES: { html: true } });
                marked.setOptions({ gfm: true, breaks: true, sanitize: false });
            } catch (configError) {
                console.error("DynamicTools: Error configuring DOMPurify/Marked:", configError);
            }
        }
    }, []);

    const handleChange = (e, input) => {
        if (!input || !input.name) return;
        const value = input.type === "checkbox" ? e.target.checked : e.target.value;
        setFormValues((prev) => ({ ...prev, [input.name]: value }));
    };

    const renderInput = (input) => {
        if (!input || !input.name) return null;

        if (input.visibleWhen) {
            const controllingFieldValue = formValues[input.visibleWhen.field];
            let isHidden = false;
            if (input.visibleWhen.value !== undefined && controllingFieldValue !== input.visibleWhen.value) isHidden = true;
            else if (input.visibleWhen.isChecked !== undefined && !!controllingFieldValue !== input.visibleWhen.isChecked) isHidden = true;
            else if (input.visibleWhen.isSet !== undefined && input.visibleWhen.isSet && !controllingFieldValue) isHidden = true;
            else if (input.visibleWhen.isNotSet !== undefined && input.visibleWhen.isNotSet && !!controllingFieldValue) isHidden = true;
            if (isHidden) return null;
        }

        const labelEl = (
          <label htmlFor={input.name} className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              {input.label} {input.required && <span className="text-red-400 font-semibold">*</span>}
          </label>
        );

        switch (input.type) {
            case "text":
            case "number":
            case "password":
                return (
                    <div key={input.name} className="mb-4 font-mono">
                      {labelEl}
                      <input
                          id={input.name}
                          name={input.name}
                          type={input.type}
                          placeholder={input.placeholder || `Enter ${input.label?.toLowerCase()}...`}
                          value={formValues[input.name] || ""}
                          onChange={(e) => handleChange(e, input)}
                          required={input.required}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-[#00f0ff]/50 rounded-lg py-2 px-3 text-xs outline-none text-gray-200 placeholder-slate-700 transition-all"
                          min={input.min}
                          max={input.max}
                      />
                    </div>
                );
            case "select":
                return (
                    <div key={input.name} className="mb-4 font-mono">
                        {labelEl}
                        <select
                            id={input.name}
                            name={input.name}
                            value={formValues[input.name] || ""}
                            onChange={(e) => handleChange(e, input)}
                            required={input.required}
                            className="w-full bg-slate-950 border border-slate-900 focus:border-[#00f0ff]/50 rounded-lg py-2 px-3 text-xs outline-none text-gray-200 appearance-none transition-all"
                            style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="%2300f0ff" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em' }}
                        >
                            <option value="" disabled={!input.required} className="text-slate-700">
                                {input.placeholder || `Select Option...`}
                            </option>
                            {input.options?.map((opt, i) => (
                                <option key={i} value={opt.value} className="bg-slate-950 text-gray-200">
                                  {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            case "checkbox":
                return (
                    <div key={input.name} className="flex items-center gap-2.5 mt-3 mb-3.5 font-mono">
                        <input
                            type="checkbox"
                            id={input.name}
                            name={input.name}
                            checked={!!formValues[input.name]}
                            onChange={(e) => handleChange(e, input)}
                            className="w-3.5 h-3.5 border border-slate-900 rounded bg-slate-950 accent-[#00f0ff] cursor-pointer"
                        />
                        <label htmlFor={input.name} className="text-xs cursor-pointer select-none text-gray-400 font-semibold uppercase tracking-wider">{input.label}</label>
                    </div>
                );
            case "textarea":
                return (
                    <div key={input.name} className="mb-4 font-mono">
                        {labelEl}
                        <textarea
                            id={input.name}
                            name={input.name}
                            rows={input.rows || 4}
                            placeholder={input.placeholder || `Enter payload inputs...`}
                            value={formValues[input.name] || ""}
                            onChange={(e) => handleChange(e, input)}
                            required={input.required}
                            className="w-full bg-slate-950 border border-slate-900 focus:border-[#00f0ff]/50 rounded-lg py-2 px-3 text-xs outline-none text-gray-200 placeholder-slate-700 transition-all scrollbar-none"
                        />
                    </div>
                );
            case "info":
                return (
                    <div key={input.name} className="mb-4 mt-1 p-3 bg-cyan-950/20 border border-cyan-800/20 rounded-xl font-mono">
                        <p className="text-[10px] text-cyan-400 font-bold leading-normal">{input.label}</p>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleExecute = async () => {
        setIsExecuting(true);
        setIsProcessingAI(false);
        setResults(null);

        const command = toolConfig.buildCommand ? toolConfig.buildCommand(formValues) : "";

        if (!command || command.startsWith("echo 'Error:")) {
            const errorMsg = command || "Error: Command could not be generated.";
            const displayError = errorMsg.replace("echo 'Error: ", "").replace("'", "");
            setResults({
                raw: displayError,
                processedMarkdown: displayError,
                styledHtml: `<p class="text-red-400 font-semibold">Configuration Error:</p><pre class="text-red-350">${displayError}</pre>`
            });
            setIsExecuting(false);
            return;
        }

        let rawOutput = '';
        let executionError = null;

        try {
            const executeRes = await fetch("/api/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command }),
            });
            if (!executeRes.ok) {
                let errorMsg = `Execution failed with status ${executeRes.status}`;
                let errorOutputContent = '';
                try {
                    const errorData = await executeRes.json();
                    errorMsg = errorData.error || errorMsg;
                    errorOutputContent = errorData.output || '';
                } catch (e) {}
                executionError = `Error: ${errorMsg}\n${errorOutputContent ? `Output:\n${errorOutputContent}` : ''}`;
                rawOutput = executionError;
            } else {
                 try {
                    const data = await executeRes.json();
                    rawOutput = data.output !== undefined ? String(data.output) : "No output received.";
                 } catch(jsonError) {
                    try {
                         rawOutput = await executeRes.text();
                         if (!rawOutput) rawOutput = "No output received (empty text response)."
                    } catch (textError) {
                         rawOutput = "Failed to read execution response.";
                         executionError = "Failed to read execution response.";
                    }
                 }
            }
        } catch (error) {
            executionError = `Network or processing error: ${error.message}`;
            rawOutput = executionError;
        }

        setIsExecuting(false);

        let processedMarkdown = rawOutput;
        let styledHtml = '';

        if (!executionError && toolConfig.aiProcessing?.prompt && rawOutput) {
            setIsProcessingAI(true);
            try {
                const promptContent = toolConfig.aiProcessing.prompt.replace('{output}', rawOutput);
                const aiRes = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: [{ role: 'user', content: promptContent }] }),
                });

                if (!aiRes.ok) {
                    let aiErrorMsg = `AI processing failed via /api/chat with status ${aiRes.status}`;
                    try {
                        const errorData = await aiRes.json();
                        aiErrorMsg = errorData.error || errorData.message || aiErrorMsg;
                    } catch (e) {}
                    processedMarkdown = `${rawOutput}\n\n---\n*AI processing failed: ${aiErrorMsg}*`;
                } else {
                    const aiData = await aiRes.json();
                    processedMarkdown = aiData.content || rawOutput;
                }
            } catch (aiError) {
                processedMarkdown = `${rawOutput}\n\n---\n*Error connecting to AI processing service: ${aiError.message}*`;
            } finally {
                setIsProcessingAI(false);
            }
        }

        try {
            let htmlFromMarkdown = '';
            if (typeof marked === 'function') {
                htmlFromMarkdown = marked.parse(processedMarkdown || '');
            } else {
                htmlFromMarkdown = `<pre>${processedMarkdown || ''}</pre>`;
            }

            if (typeof window !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
               styledHtml = DOMPurify.sanitize(htmlFromMarkdown);
            } else {
               styledHtml = htmlFromMarkdown;
            }

            if (executionError) {
                styledHtml = `<p class="text-red-400 font-semibold font-mono">Execution Failed:</p><pre class="text-red-300 font-mono text-xs whitespace-pre-wrap break-words border border-red-950 p-3 rounded-lg bg-red-950/10 mt-2">${executionError}</pre>`;
            } else if (!processedMarkdown?.trim()) {
                styledHtml = `<p class="text-gray-500 italic">Execution completed. Empty logs response.</p>`;
            }
        } catch (renderError) {
            styledHtml = `<p class="text-orange-400">Error rendering results:</p><pre class="whitespace-pre-wrap break-words">${processedMarkdown || ''}</pre>`;
        }

        setResults({ raw: rawOutput, processedMarkdown, styledHtml });

        // Report to workspace so AI chat has full context
        if (toolConfig?.name) {
            reportToolResult(toolConfig.name, formValues, rawOutput);
        }
    };

    const copyToClipboard = (text, type) => {
        if (!navigator.clipboard) {
            setCopyStatus('Copy not supported');
            setTimeout(() => setCopyStatus(''), 1500);
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            setCopyStatus(`Copied ${type}!`);
            setTimeout(() => setCopyStatus(''), 1500);
        }, (err) => {
            setCopyStatus(`Failed to copy ${type}`);
            setTimeout(() => setCopyStatus(''), 1500);
        });
    };

    const isAnyRequiredFieldEmpty = toolConfig?.config?.inputs
        ?.filter(input => {
            if (!input.required) return false;
            if (input.visibleWhen) {
                const controllingFieldValue = formValues[input.visibleWhen.field];
                let isHidden = false;
                if (input.visibleWhen.value !== undefined && controllingFieldValue !== input.visibleWhen.value) isHidden = true;
                else if (input.visibleWhen.isChecked !== undefined && !!controllingFieldValue !== input.visibleWhen.isChecked) isHidden = true;
                else if (input.visibleWhen.isSet !== undefined && input.visibleWhen.isSet && !controllingFieldValue) isHidden = true;
                else if (input.visibleWhen.isNotSet !== undefined && input.visibleWhen.isNotSet && !!controllingFieldValue) isHidden = true;
                if (isHidden) return false;
            }
            const value = formValues[input.name];
             return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
        })
        .some(input => true);

    return (
        <div className="h-full flex flex-col bg-black text-white overflow-hidden font-mono">
            {/* Header Section */}
            <div className="flex justify-between items-center p-3.5 border-b border-slate-900 flex-shrink-0">
                 <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-[#00f0ff] shadow-inner">
                      <Settings size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h3 className="text-xs font-black text-white leading-tight uppercase tracking-wider truncate">
                            {toolConfig.name || "App Module"}
                        </h3>
                        {toolConfig.description && (
                            <p className="text-[10px] text-gray-500 leading-tight truncate uppercase mt-0.5">
                                {toolConfig.description}
                            </p>
                        )}
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-500 hover:text-white rounded hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors ml-2 flex-shrink-0 cursor-pointer"
                        aria-label="Close"
                    >
                        <CloseIcon size={16} />
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full items-start">
                    {/* Left Column – Dynamic Form */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold mb-4 text-gray-400 uppercase tracking-widest border-b border-slate-900 pb-2.5">PARAMETERS_CONFIG</h4>
                        {toolConfig?.config?.inputs?.length > 0 ? (
                            toolConfig.config.inputs.map((input, index) => renderInput(input) || <React.Fragment key={`empty-${input?.name || index}`}></React.Fragment> )
                        ) : (
                            <p className="text-xs text-gray-550 italic mt-2">No options staged for this application binary.</p>
                        )}
                    </div>

                    {/* Right Column – Results */}
                    <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col min-h-[320px] max-h-[62vh] relative">
                        <h4 className="text-xs font-bold mb-3 text-gray-400 uppercase tracking-widest flex-shrink-0">OUTPUT_TERMINAL.TXT</h4>
                        {isExecuting || isProcessingAI ? (
                            <div className="flex-1 flex items-center justify-center text-cyan-400">
                                <div className="text-center">
                                    <Loader2 size={24} className={`animate-spin ${isProcessingAI ? 'text-purple-400' : 'text-[#00f0ff]'} mb-3 mx-auto`} />
                                    <p className="text-xs uppercase font-bold tracking-widest">{isProcessingAI ? 'Processing AI Models...' : 'Running Binary shell...'}</p>
                                </div>
                            </div>
                        ) : results ? (
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex gap-2 mb-3.5 flex-shrink-0 items-center justify-between border-b border-slate-900 pb-2">
                                     <div className="flex gap-1.5 flex-wrap">
                                        <button
                                            onClick={() => copyToClipboard(results.raw, 'Raw Output')}
                                            className="px-2.5 py-1 bg-slate-900 border border-slate-850 hover:border-slate-800 rounded text-[10px] font-bold text-gray-300 hover:text-white transition-all cursor-pointer uppercase"
                                        >
                                            Copy Raw
                                        </button>
                                        {results.processedMarkdown && results.processedMarkdown !== results.raw && (
                                             <button
                                                onClick={() => copyToClipboard(results.processedMarkdown, 'AI Summary')}
                                                className="px-2.5 py-1 bg-purple-950/30 border border-purple-800/30 hover:border-purple-500 rounded text-[10px] font-bold text-purple-400 hover:text-white transition-all cursor-pointer uppercase"
                                            >
                                                Copy Summary
                                            </button>
                                        )}
                                     </div>
                                    {copyStatus && <span className="text-[10px] text-green-400 flex items-center shrink-0 uppercase">{copyStatus}</span>}
                                </div>

                                {/* Styled HTML Output Area */}
                                <div className="flex-1 overflow-y-auto bg-[#02050a] p-3.5 rounded-xl border border-slate-900 text-gray-300 scrollbar-none text-xs leading-relaxed font-mono">
                                    <div
                                        className="prose prose-sm prose-invert max-w-none
                                                   prose-headings:text-cyan-400 prose-headings:font-bold prose-headings:text-xs prose-headings:border-b prose-headings:border-slate-900 prose-headings:pb-1
                                                   prose-a:text-cyan-400 hover:prose-a:text-cyan-300
                                                   prose-strong:text-[#00f0ff]
                                                   prose-code:text-amber-400 prose-code:bg-slate-950 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[10px] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                                                   prose-pre:bg-slate-950 prose-pre:p-3 prose-pre:rounded-xl prose-pre:text-[11px]
                                                   prose-blockquote:border-l-cyan-600 prose-blockquote:text-cyan-200/90 prose-blockquote:italic
                                                   prose-ul:list-disc prose-ul:ml-4
                                                   prose-ol:list-decimal prose-ol:ml-4"
                                        dangerouslySetInnerHTML={{ __html: results.styledHtml }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-600 bg-slate-950/40 rounded-xl border border-dashed border-slate-900 p-4">
                                <div className="text-center font-mono">
                                    <Bot size={30} className="text-gray-700 mb-2 mx-auto" />
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">System idle</p>
                                    <p className="text-[9px] text-gray-600 mt-1 uppercase tracking-widest">Verify inputs and trigger binary launch</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Controls */}
            <div className="px-4 py-3 border-t border-slate-900 flex-shrink-0 bg-slate-950/60">
                <button
                    onClick={handleExecute}
                    disabled={isExecuting || isProcessingAI || isAnyRequiredFieldEmpty}
                    className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                        (isExecuting || isProcessingAI)
                            ? "bg-slate-900 border border-slate-800 text-gray-600 cursor-wait shadow-none"
                            : isAnyRequiredFieldEmpty
                            ? "bg-slate-950 border border-slate-900 text-slate-700 cursor-not-allowed shadow-none"
                            : "bg-[#00f0ff] hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 active:scale-[0.99]"
                    }`}
                >
                    {(isExecuting || isProcessingAI) ? (
                        <>
                            <Loader2 className="animate-spin text-cyan-400" size={14} />
                            {isProcessingAI ? 'AI PROCESSING...' : 'LAUNCHING OPERATION...'}
                        </>
                    ) : (
                        <>LAUNCH BINARY MODULE</>
                    )}
                </button>
            </div>
        </div>
    );
}
import React, { useRef, useEffect, useState } from 'react';
import { Send, User, Sparkles, Plus, BarChart3, TableProperties, FileSpreadsheet, ArrowRight, Mic, StopCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import Markdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  input: string;
  setInput: (s: string) => void;
  onSend: () => void;
  isThinking: boolean;
  hasSelectedFile: boolean;
  onSelectSheet: () => void;
  onCreateSheet: () => void;
  onViewData: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  input, 
  setInput, 
  onSend, 
  isThinking,
  hasSelectedFile,
  onSelectSheet,
  onCreateSheet,
  onViewData
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Resize textarea automatically
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
    if (inputRef.current) {
        inputRef.current.focus();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      window.speechSynthesis.cancel();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(input + (input ? ' ' : '') + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const standardSuggestions = [
    { icon: <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />, text: "Analyze the data trends", label: "Analyze Data", action: null },
    { icon: <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, text: "Add a new row with dummy data", label: "Add Row", action: null },
    { icon: <TableProperties className="w-4 h-4 text-blue-600 dark:text-blue-400" />, text: "Summarize columns A and B", label: "Summarize", action: null },
  ];

  const emptyStateSuggestions = [
    { icon: <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />, text: "", label: "Open Spreadsheet", action: onSelectSheet },
    { icon: <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />, text: "", label: "Create New Sheet", action: onCreateSheet },
  ];

  const activeSuggestions = hasSelectedFile ? standardSuggestions : emptyStateSuggestions;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors duration-200">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto w-full scrollbar-hide">
        <div className="max-w-3xl mx-auto px-4 pb-40 pt-8">
          
          {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center mt-20 animate-in fade-in duration-500">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-center mb-6 transition-colors">
                       <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-3xl font-serif text-gray-900 dark:text-white mb-3 tracking-tight">
                      {hasSelectedFile ? "Good afternoon" : "Welcome to SheetMind"}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-base mb-10 max-w-md leading-relaxed">
                      {hasSelectedFile 
                          ? "I'm ready to help you analyze, edit, and organize your data. What would you like to do?"
                          : "Connect a Google Sheet to start analyzing your data with AI."}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                      {activeSuggestions.map((s, i) => (
                          <button 
                              key={i}
                              onClick={() => s.action ? s.action() : handleSuggestion(s.text)}
                              className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 hover:scale-[1.02] rounded-xl transition-all text-left border border-gray-200 dark:border-slate-700 shadow-sm group"
                          >
                              <div className="p-2 bg-gray-50 dark:bg-slate-700 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-600 transition-colors">
                                  {s.icon}
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1">{s.label}</span>
                              {s.action && <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-500 ml-auto group-hover:text-gray-500 dark:group-hover:text-gray-300" />}
                          </button>
                      ))}
                  </div>
              </div>
          ) : (
              <div className="space-y-8">
                  {messages.map((msg) => (
                  <div
                      key={msg.id}
                      className={`group flex items-start space-x-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
                  >
                      {/* AI Icon (Left) */}
                      {msg.role !== 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                      )}

                      {/* Message Content */}
                      <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                          {msg.role === 'user' ? (
                               <div className="px-5 py-3.5 bg-gray-100/80 dark:bg-slate-800/80 text-gray-800 dark:text-gray-100 rounded-2xl text-[15px] leading-relaxed backdrop-blur-sm">
                                  {msg.text}
                               </div>
                          ) : (
                               <div className="flex flex-col items-start space-y-3">
                                  <div className="text-gray-800 dark:text-gray-200 text-[16px] leading-7 prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-serif prose-headings:font-normal">
                                      <Markdown>{msg.text}</Markdown>
                                  </div>
                                  {msg.action === 'view_sheet' && (
                                      <button 
                                          onClick={onViewData}
                                          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium transition-colors border border-gray-200 dark:border-slate-700 shadow-sm"
                                      >
                                          <FileSpreadsheet className="w-4 h-4" />
                                          <span>View updated sheet</span>
                                      </button>
                                  )}
                               </div>
                          )}
                      </div>

                      {/* User Icon (Right) */}
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1 order-2">
                           <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                  </div>
                  ))}

                  {isThinking && (
                    <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center space-x-1.5 py-3">
                            <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></span>
                            <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse delay-150"></span>
                            <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse delay-300"></span>
                        </div>
                    </div>
                  )}
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:pb-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950 dark:to-transparent pointer-events-none transition-colors duration-200">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="relative bg-white dark:bg-slate-800 shadow-xl shadow-gray-200/50 dark:shadow-black/20 rounded-2xl border border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 focus-within:border-indigo-400 dark:focus-within:border-indigo-600 transition-all overflow-hidden">
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasSelectedFile ? "Ask a question about your data..." : "Select a file to start..."}
              disabled={!hasSelectedFile}
              className="w-full pl-4 pr-14 py-4 bg-transparent text-[16px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none max-h-48"
              rows={1}
            />
            
            <div className="flex items-center justify-between px-3 pb-3">
               <div className="flex items-center space-x-1">
                  <button
                    onClick={toggleListening}
                    disabled={!hasSelectedFile}
                    className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                      isListening 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-500 animate-pulse' 
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                    title="Voice Input"
                  >
                    {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
               </div>

               <button
                  onClick={onSend}
                  disabled={!input.trim() || isThinking || !hasSelectedFile}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    input.trim() 
                      ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
            </div>
          </div>
          
          <div className="text-center mt-3">
             <p className="text-xs text-gray-400 dark:text-gray-600">
               AI can make mistakes. Please verify important data.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
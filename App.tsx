import React, { useState, useEffect, useRef } from 'react';
import { 
  initializeGsi, 
  triggerGoogleLogin, 
  ensureGapiClient,
  listSpreadsheets, 
  getSheetData,
  appendRow,
  appendMultipleRows,
  updateCell,
  deleteRow,
  createSpreadsheet,
  getSheetMetadata,
  restoreSession,
  clearSession
} from './services/sheetsService';
import { sendMessageToGemini } from './services/geminiService';
import { SheetFile, SheetData, ChatMessage, ConnectionStatus } from './types';
import Login from './components/Login';
import DataGrid from './components/DataGrid';
import ChatInterface from './components/ChatInterface';
import WelcomeScreen from './components/WelcomeScreen';
import { LayoutGrid, Table, X } from 'lucide-react';
import { GOOGLE_CLIENT_ID } from './constants';

const CHAT_HISTORY_KEY = 'sheetmind_chat_history';
const DARK_MODE_KEY = 'sheetmind_dark_mode';

const App: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [token, setToken] = useState<string | null>(null);
  const [files, setFiles] = useState<SheetFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<SheetFile | null>(null);
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  
  // Sheet Metadata State for Tool Calls
  const [currentSheetName, setCurrentSheetName] = useState<string>('');
  const [currentSheetId, setCurrentSheetId] = useState<number>(0);

  const [loadingData, setLoadingData] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  
  // Initialize chat messages from local storage if available
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  // UI States for Mobile Overlays
  const [isSheetSelectorOpen, setIsSheetSelectorOpen] = useState(false);
  const [showMobileData, setShowMobileData] = useState(false);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    // Check system preference if no saved preference
    if (saved === null) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return saved === 'true';
  });

  // Dark Mode Effect
  useEffect(() => {
    localStorage.setItem(DARK_MODE_KEY, String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    if (GOOGLE_CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
      console.error("Configuration Error: GOOGLE_CLIENT_ID is not set in constants.ts");
    } else {
      const timer = setTimeout(() => initializeGsi(), 500);
      const savedToken = restoreSession();
      if (savedToken) {
        setStatus(ConnectionStatus.INITIALIZING);
        setToken(savedToken);
        ensureGapiClient(savedToken)
          .then(async () => {
            setStatus(ConnectionStatus.CONNECTED);
            setLoadingFiles(true);
            try {
               const files = await listSpreadsheets();
               setFiles(files);
            } catch (err) {
               console.warn("Restored session valid, but failed to list files", err);
            } finally {
               setLoadingFiles(false);
            }
          })
          .catch((err) => {
            console.warn("Failed to restore session", err);
            clearSession();
            setStatus(ConnectionStatus.DISCONNECTED);
          });
      }
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLogin = async () => {
    if (GOOGLE_CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
      alert("⚠️ Developer Setup Required\n\nYou must set a valid 'GOOGLE_CLIENT_ID' in the 'constants.ts' file for Google Sign-In to work.");
      return;
    }

    try {
      const accessToken = await triggerGoogleLogin();
      setStatus(ConnectionStatus.INITIALIZING);
      setToken(accessToken);

      try {
        await ensureGapiClient(accessToken);
        setStatus(ConnectionStatus.CONNECTED);
        fetchFiles();
      } catch (gapiError: any) {
        console.error("GAPI Init Error", gapiError);
        alert(`Failed to initialize Google API: ${gapiError.message}`);
        setStatus(ConnectionStatus.DISCONNECTED);
        clearSession();
      }
      
    } catch (error: any) {
      console.error("Login failed", error);
      setStatus(ConnectionStatus.ERROR);
      if (error?.type !== 'popup_closed') {
        alert(`Failed to sign in. Details: ${error.message || 'Unknown error'}`);
        setStatus(ConnectionStatus.DISCONNECTED);
      } else {
        setStatus(ConnectionStatus.DISCONNECTED);
      }
    }
  };

  const handleSignOut = () => {
    clearSession();
    localStorage.removeItem(CHAT_HISTORY_KEY);
    window.location.reload();
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      setChatMessages([]);
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  };

  const handleUpdateApiKey = () => {
    const currentKey = localStorage.getItem('gemini_api_key') || '';
    const newKey = prompt("Enter your Gemini API Key:", currentKey);
    if (newKey !== null) {
      localStorage.setItem('gemini_api_key', newKey.trim());
      alert("API Key updated.");
    }
  };

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const files = await listSpreadsheets();
      setFiles(files);
    } catch (error: any) {
      console.error("Failed to list files", error);
      if (status === ConnectionStatus.CONNECTED) {
        alert(`Failed to load files: ${error.message}.`);
      }
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadSheet = async (file: SheetFile) => {
    setSelectedFile(file);
    setLoadingData(true);
    try {
      const meta = await getSheetMetadata(file.id);
      let range = 'Sheet1!A1:Z100';
      
      if (meta.sheets && meta.sheets.length > 0) {
        const firstSheet = meta.sheets[0].properties;
        const title = firstSheet.title;
        range = `'${title}'!A1:Z100`;
        
        setCurrentSheetName(title);
        setCurrentSheetId(firstSheet.sheetId);
      } else {
        setCurrentSheetName('Sheet1');
        setCurrentSheetId(0);
      }

      const data = await getSheetData(file.id, range);
      setSheetData(data);
    } catch (error) {
      console.error("Failed to load sheet data", error);
      setSheetData(null);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateSheet = async () => {
    const title = prompt("Enter a name for the new spreadsheet:", "New Spreadsheet");
    if (!title) return;

    setLoadingFiles(true);
    try {
      const newFile = await createSpreadsheet(title);
      await fetchFiles();
      await loadSheet(newFile);
      setShowMobileData(true);
    } catch (error) {
      console.error("Failed to create sheet", error);
      alert("Failed to create spreadsheet.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      alert("Gemini API Key is missing. Please update it in Settings.");
      // We no longer have ShowMobileSettings, so prompt via UserMenu if possible or just alert
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsThinking(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await sendMessageToGemini(userMsg.text, sheetData, history, apiKey);
      
      const functionCalls = response.functionCalls;
      let aiResponseText = response.text || ""; 
      let hasAction = false;

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          const args = call.args;
          
          if (call.name === 'addRow' && selectedFile) {
            await appendRow(selectedFile.id, args.values, `'${currentSheetName}'!A1`);
            if (!aiResponseText.includes('Added row')) aiResponseText += `\n*Added row to ${currentSheetName}*`;
            hasAction = true;
          } 
          else if (call.name === 'addMultipleRows' && selectedFile) {
            await appendMultipleRows(selectedFile.id, args.rows, `'${currentSheetName}'!A1`);
            if (!aiResponseText.includes('Added')) aiResponseText += `\n*Added ${args.rows.length} rows to ${currentSheetName}*`;
            hasAction = true;
          }
          else if (call.name === 'updateCell' && selectedFile) {
            await updateCell(selectedFile.id, `'${currentSheetName}'!${args.cell}`, args.value);
            if (!aiResponseText.includes('Updated cell')) aiResponseText += `\n*Updated cell ${args.cell}*`;
            hasAction = true;
          } else if (call.name === 'deleteRow' && selectedFile) {
            await deleteRow(selectedFile.id, currentSheetId, args.rowIndex);
            if (!aiResponseText.includes('Deleted row')) aiResponseText += `\n*Deleted row ${args.rowIndex}*`;
            hasAction = true;
          } else if (call.name === 'createSheet') {
            // New logic: pass headers and initialRows if present
            const newFile = await createSpreadsheet(args.title, args.headers, args.initialRows);
            aiResponseText += `\n*Created ${args.title} with data*`;
            await fetchFiles();
            await loadSheet(newFile);
            hasAction = true;
          }
        }
        if (selectedFile) {
          await loadSheet(selectedFile);
        }
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponseText || "Done.",
        timestamp: new Date(),
        action: hasAction ? 'view_sheet' : undefined
      };
      
      setChatMessages(prev => [...prev, botMsg]);

    } catch (error: any) {
      console.error("Error processing message", error);
      
      let displayError = error.message || 'Unknown error';
      // Attempt to clean up JSON error messages from the API
      if (typeof displayError === 'string' && displayError.includes('{"error":')) {
        try {
            // Find the start of the JSON object
            const jsonStart = displayError.indexOf('{');
            const jsonString = displayError.substring(jsonStart);
            const parsed = JSON.parse(jsonString);
            if (parsed.error && parsed.error.message) {
                displayError = parsed.error.message;
            }
        } catch (e) {
            // Parsing failed, keep original message
        }
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `I encountered an issue: ${displayError}. Please try again.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  if (status !== ConnectionStatus.CONNECTED) {
    return <Login 
      onLogin={handleLogin} 
      isLoading={status === ConnectionStatus.INITIALIZING} 
    />;
  }

  const showWelcome = !loadingFiles && files.length === 0;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 overflow-hidden">
      
      {/* Header (Simplified) */}
      <header className="h-14 md:h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-3 md:px-4 shadow-sm z-20 flex-shrink-0 relative">
        
        {/* Mobile Left: Data Toggle */}
        <div className="md:hidden">
           <button 
            onClick={() => setShowMobileData(true)}
            disabled={!selectedFile}
            className={`p-2 -ml-2 rounded-lg transition-colors ${selectedFile ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'text-gray-300 dark:text-slate-700'}`}
          >
            <Table className="w-6 h-6" />
          </button>
        </div>

        {/* Brand */}
        <div className="flex items-center">
           <div className="bg-indigo-600 p-1.5 rounded-lg mr-3 shadow-sm">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-gray-800 dark:text-white text-lg tracking-tight">SheetMind AI</h1>
        </div>

        {/* Right Side Spacer (Controls moved to input box) */}
        <div className="w-8"></div>
        
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-slate-50 dark:bg-slate-950">
        
        {/* Chat View - Main Focus */}
        <div className="w-full h-full md:w-1/3 md:min-w-[500px] flex flex-col z-0 relative">
           <ChatInterface 
             messages={chatMessages}
             input={chatInput}
             setInput={setChatInput}
             onSend={handleSendMessage}
             isThinking={isThinking}
             hasSelectedFile={!!selectedFile}
             onSelectSheet={() => setIsSheetSelectorOpen(true)}
             onCreateSheet={handleCreateSheet}
             onViewData={() => setShowMobileData(true)}
             
             // Sheet Selector Props
             files={files}
             selectedFile={selectedFile}
             onFileSelect={loadSheet}
             onRefreshFiles={fetchFiles}
             filesLoading={loadingFiles}
             isSheetSelectorOpen={isSheetSelectorOpen}
             setSheetSelectorOpen={setIsSheetSelectorOpen}

             // User Menu Props
             darkMode={darkMode}
             toggleDarkMode={toggleDarkMode}
             onUpdateApiKey={handleUpdateApiKey}
             onSignOut={handleSignOut}
             onClearHistory={handleClearHistory}
           />
        </div>

        {/* Desktop Data View (Side by Side) */}
        <div className="hidden md:flex flex-1 h-full border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
           {showWelcome ? (
             <WelcomeScreen onCreate={handleCreateSheet} />
           ) : (
             <div className="w-full h-full p-2 bg-gray-50 dark:bg-slate-950">
                 <DataGrid data={sheetData} loading={loadingData} />
             </div>
           )}
        </div>

        {/* MOBILE OVERLAY: Data View */}
        <div className={`md:hidden fixed inset-0 z-30 bg-white dark:bg-slate-900 transition-transform duration-300 ease-in-out flex flex-col ${showMobileData ? 'translate-y-0' : 'translate-y-full'}`}>
           <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {selectedFile?.name || 'Spreadsheet'}
              </h2>
              <button 
                onClick={() => setShowMobileData(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
           </div>
           <div className="flex-1 overflow-hidden p-2 bg-slate-50 dark:bg-slate-950">
             {showWelcome ? (
               <WelcomeScreen onCreate={handleCreateSheet} />
             ) : (
               <DataGrid data={sheetData} loading={loadingData} />
             )}
           </div>
        </div>

      </main>
    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Table, ShieldCheck, Key } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleLoginClick = () => {
    if (!apiKey.trim()) {
      alert("Please enter your Gemini API Key to continue.");
      return;
    }
    localStorage.setItem('gemini_api_key', apiKey.trim());
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side - Hero (Hidden on Mobile) */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-indigo-600 p-12 text-white">
          <div>
            <div className="flex items-center space-x-2 mb-8">
              <LayoutGrid className="w-8 h-8" />
              <span className="text-2xl font-bold tracking-tight">SheetMind AI</span>
            </div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Talk to your spreadsheets.
            </h1>
            <p className="text-indigo-100 text-lg opacity-90">
              Manage your Excel files and Google Sheets with natural language. 
              Powered by Google Gemini.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 opacity-80">
              <Table className="w-5 h-5" />
              <span>Read & Write Access</span>
            </div>
            <div className="flex items-center space-x-3 opacity-80">
              <ShieldCheck className="w-5 h-5" />
              <span>Secure Google Login</span>
            </div>
          </div>
        </div>

        {/* Right Side - Action */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center items-center">
          
          {/* Mobile Header Logo */}
          <div className="md:hidden flex items-center space-x-2 mb-8 text-indigo-600">
            <LayoutGrid className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">SheetMind AI</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500">Sign in to access your sheets</p>
          </div>

          <div className="w-full space-y-4 mb-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Gemini API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API Key"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 text-center">
                Your key is stored locally in your browser.
              </p>
            </div>
          </div>

          <button
            onClick={handleLoginClick}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              <span className="flex items-center">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-2 bg-white rounded-full p-0.5" alt="G" />
                Sign in with Google
              </span>
            )}
          </button>

          <div className="mt-6 text-xs text-gray-400 text-center max-w-xs">
            <p>By continuing, you agree to grant access to your Google Drive and Sheets files for the AI assistant.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
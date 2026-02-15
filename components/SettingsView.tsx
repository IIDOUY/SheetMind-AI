import React from 'react';
import { Key, LogOut, User, ShieldCheck, Trash2 } from 'lucide-react';

interface SettingsViewProps {
  onUpdateApiKey: () => void;
  onSignOut: () => void;
  onClearHistory?: () => void;
  isMobile?: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onUpdateApiKey, onSignOut, onClearHistory, isMobile }) => {
  return (
    <div className={`flex-1 bg-white dark:bg-slate-900 ${!isMobile ? 'md:rounded-lg md:border md:border-gray-200 dark:md:border-slate-800' : ''} p-6 flex flex-col items-center h-full transition-colors`}>
      <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 mt-8 md:mt-0">
        <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Account Settings</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Manage your preferences</p>

      <div className="w-full max-w-sm space-y-3">
        <button 
          onClick={onUpdateApiKey}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-gray-100 dark:border-slate-700 group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
               <Key className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Gemini API Key</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Update your connection key</p>
            </div>
          </div>
        </button>

        <div className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 opacity-75">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
               <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Google Connected</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Access granted to Sheets</p>
            </div>
          </div>
        </div>
        
        {onClearHistory && (
          <button 
            onClick={onClearHistory}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-100 dark:hover:border-red-900 rounded-xl transition-colors border border-gray-100 dark:border-slate-700 group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-200 dark:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/40 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                 <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-red-700 dark:group-hover:text-red-400 text-sm transition-colors">Clear Chat History</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-red-400 dark:group-hover:text-red-300 transition-colors">Remove local messages</p>
              </div>
            </div>
          </button>
        )}

        <button 
          onClick={onSignOut}
          className="w-full flex items-center justify-center space-x-2 p-4 mt-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium text-sm border border-red-50 dark:border-red-900/30 hover:border-red-100 dark:hover:border-red-900/50"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
      
      <div className="mt-auto pt-8 pb-8 text-xs text-gray-300 dark:text-gray-600">
        SheetMind AI v1.0.0
      </div>
    </div>
  );
};

export default SettingsView;
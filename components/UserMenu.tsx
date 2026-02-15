import React, { useState, useRef, useEffect } from 'react';
import { User, Key, Moon, Sun, LogOut, ChevronDown, Check, Trash2, ShieldCheck } from 'lucide-react';

interface UserMenuProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  onUpdateApiKey: () => void;
  onSignOut: () => void;
  onClearHistory: () => void;
  align?: 'left' | 'right';
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  darkMode, 
  toggleDarkMode, 
  onUpdateApiKey, 
  onSignOut,
  onClearHistory,
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <User className="w-5 h-5" />
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
        <div className="fixed inset-0 z-40 bg-black/5 md:hidden" onClick={() => setIsOpen(false)} />
        <div className={`absolute top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}>
          
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Account</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">Google User</p>
            <div className="flex items-center space-x-1 mt-1 text-xs text-green-600 dark:text-green-400">
              <ShieldCheck className="w-3 h-3" />
              <span>Connected to Sheets</span>
            </div>
          </div>

          <div className="p-2 space-y-1">
            <button 
              onClick={() => {
                onUpdateApiKey();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Key className="w-4 h-4 text-gray-400" />
              <span>API Key</span>
            </button>

            <button 
              onClick={() => {
                toggleDarkMode();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-orange-400" />}
                <span>Dark Mode</span>
              </div>
              {darkMode && <Check className="w-3 h-3 text-indigo-500" />}
            </button>
            
            <button 
              onClick={() => {
                onClearHistory();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors group"
            >
              <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
              <span className="group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Clear History</span>
            </button>
          </div>

          <div className="p-2 border-t border-gray-100 dark:border-slate-700">
            <button 
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;

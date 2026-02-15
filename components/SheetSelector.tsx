import React from 'react';
import { FileSpreadsheet, ChevronDown, RefreshCw, Plus, Check } from 'lucide-react';
import { SheetFile } from '../types';

interface SheetSelectorProps {
  files: SheetFile[];
  selectedFile: SheetFile | null;
  onSelect: (file: SheetFile) => void;
  onRefresh: () => void;
  onCreate: () => void;
  loading: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const SheetSelector: React.FC<SheetSelectorProps> = ({ 
  files, 
  selectedFile, 
  onSelect, 
  onRefresh, 
  onCreate, 
  loading,
  isOpen,
  setIsOpen
}) => {

  return (
    <div className="relative flex-1 md:flex-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center space-x-2 text-gray-800 dark:text-gray-200 px-2 py-1.5 rounded-lg transition-colors w-full md:w-auto hover:bg-gray-100 dark:hover:bg-slate-800"
      >
        <span className="font-semibold text-base truncate max-w-[200px]">
          {selectedFile ? selectedFile.name : 'Select Sheet'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
        <div className="fixed inset-0 z-40 bg-black/10 md:bg-transparent" onClick={() => setIsOpen(false)} />
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-0 w-[90vw] md:w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
          <div className="p-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 rounded-t-xl">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Sheets</span>
            <button onClick={onRefresh} disabled={loading} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
            {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400 space-y-2">
                    <p className="text-sm">No sheets found</p>
                </div>
            ) : (
                files.map((file) => (
                <button
                    key={file.id}
                    onClick={() => {
                        onSelect(file);
                        setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition-colors ${
                        selectedFile?.id === file.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                >
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <FileSpreadsheet className={`w-4 h-4 flex-shrink-0 ${selectedFile?.id === file.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400'}`} />
                        <span className="truncate">{file.name}</span>
                    </div>
                    {selectedFile?.id === file.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
                ))
            )}
          </div>
          <div className="p-2 border-t border-gray-100 dark:border-slate-700">
            <button
                onClick={() => {
                    onCreate();
                    setIsOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-gray-900 dark:bg-indigo-600 hover:bg-gray-800 dark:hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
            >
                <Plus className="w-4 h-4" />
                <span>Create New Sheet</span>
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default SheetSelector;
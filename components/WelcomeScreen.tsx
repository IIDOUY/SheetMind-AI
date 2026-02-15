import React from 'react';
import { FileSpreadsheet, Plus } from 'lucide-react';

interface WelcomeScreenProps {
  onCreate: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreate }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg h-full p-8 text-center">
      <div className="bg-indigo-50 p-6 rounded-full mb-6">
        <FileSpreadsheet className="w-16 h-16 text-indigo-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">No Spreadsheets Found</h2>
      <p className="text-gray-500 max-w-md mb-8">
        We couldn't find any Google Sheets in your account, or you haven't granted access to them yet. Create a new one to get started!
      </p>
      
      <button
        onClick={onCreate}
        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
      >
        <Plus className="w-5 h-5" />
        <span>Create New Spreadsheet</span>
      </button>
    </div>
  );
};

export default WelcomeScreen;
import React from 'react';
import { SheetData } from '../types';

interface DataGridProps {
  data: SheetData | null;
  loading: boolean;
}

const DataGrid: React.FC<DataGridProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg h-full transition-colors">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading spreadsheet...</p>
        </div>
      </div>
    );
  }

  // Case: No sheet loaded at all
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg h-full transition-colors">
        <div className="text-center text-gray-400 dark:text-gray-600">
            <p>No data selected.</p>
            <p className="text-xs mt-1">Select a sheet to preview.</p>
        </div>
      </div>
    );
  }

  // Case: Sheet loaded but empty
  if (!data.values || data.values.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg h-full transition-colors">
        <div className="text-center text-gray-400 dark:text-gray-600">
            <p className="font-medium text-gray-500 dark:text-gray-400">Empty Sheet</p>
            <p className="text-xs mt-1">Ask the assistant to add some data.</p>
        </div>
      </div>
    );
  }

  const headers = data.values[0];
  const rows = data.values.slice(1);

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg overflow-auto relative h-full transition-colors">
      <table className="min-w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="w-12 px-3 py-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-400 font-medium text-xs text-center border-r dark:border-slate-700">
              #
            </th>
            {headers.map((header, i) => (
              <th key={i} className="px-4 py-2 border-b border-gray-200 dark:border-slate-700 border-r border-gray-100 dark:border-slate-800 font-semibold text-gray-700 dark:text-gray-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-colors">
              <td className="px-3 py-2 border-r border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 text-gray-400 text-xs text-center font-mono">
                {idx + 1}
              </td>
              {headers.map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-2 border-r border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-300">
                  {row[colIdx] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataGrid;
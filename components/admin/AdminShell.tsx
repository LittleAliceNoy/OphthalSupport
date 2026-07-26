import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AdminShellProps {
  isOffline: boolean;
  activeTab: 'prices' | 'logic';
  onTabChange: (tab: 'prices' | 'logic') => void;
  canNavigate: boolean;
  children: React.ReactNode;
}

export default function AdminShell({
  isOffline,
  activeTab,
  onTabChange,
  canNavigate,
  children,
}: AdminShellProps) {
  const changeTab = (tab: 'prices' | 'logic') => {
    if (!canNavigate) return;
    onTabChange(tab);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {isOffline && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl shadow-sm text-xs font-semibold leading-relaxed">
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <div>
            <span className="font-bold text-amber-800 dark:text-amber-300">Offline Fallback Mode:</span> You are currently viewing local configuration data. Saving new tools, deleting items, or editing prices and rules is disabled.
          </div>
        </div>
      )}

      <div className="flex bg-gray-100 dark:bg-slate-800/60 p-1 rounded-xl max-w-md">
        <button onClick={() => changeTab('prices')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'prices' ? 'bg-white dark:bg-[#151f32] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
          Manage Tool Prices
        </button>
        <button onClick={() => changeTab('logic')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'logic' ? 'bg-white dark:bg-[#151f32] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
          Manage Surgery Logic
        </button>
      </div>

      {children}
    </div>
  );
}

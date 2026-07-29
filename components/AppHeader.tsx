import React from 'react';
import { Eye, Moon, Settings, Sun, WifiOff } from 'lucide-react';

export type AppView = 'checklist' | 'prices' | 'admin';

interface AppHeaderProps {
    currentView: AppView;
    isDarkMode: boolean;
    isOffline: boolean;
    onViewChange: (view: AppView) => void;
    onToggleTheme: () => void;
}

export default function AppHeader({ currentView, isDarkMode, isOffline, onViewChange, onToggleTheme }: AppHeaderProps) {
    const navClass = (view: AppView) => `px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
        currentView === view
            ? 'bg-[#fcb7f0] text-slate-800 shadow-sm'
            : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'
    }`;

    return (
        <header className="bg-white dark:bg-[#151f32] border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Eye size={24} className="text-[#8e5a7d] dark:text-pink-200" />
                        <h1 className="font-headline font-bold text-xl sm:text-2xl text-[#101421] dark:text-white leading-tight">OphthalSupport</h1>
                    </div>
                    <nav className="flex items-center gap-1 flex-wrap">
                        <button onClick={() => onViewChange('checklist')} className={navClass('checklist')}>Checklist</button>
                        <button onClick={() => onViewChange('prices')} className={navClass('prices')}>Tools &amp; Prices</button>
                        <button onClick={() => onViewChange('admin')} className={`${navClass('admin')} flex items-center gap-1`}>
                            <Settings size={13} /> Admin
                        </button>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    {isOffline && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 shadow-sm">
                            <WifiOff size={10} className="stroke-[2.5]" /> Offline
                        </span>
                    )}
                    <button onClick={onToggleTheme} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 ${isDarkMode ? 'bg-brand-primary dark:bg-brand-primary-dark' : 'bg-gray-200 dark:bg-slate-700'}`} aria-label="Toggle theme">
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center shadow-sm`}>
                            {isDarkMode ? <Moon size={10} className="text-brand-primary dark:text-brand-primary-dark" /> : <Sun size={10} className="text-gray-400" />}
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}

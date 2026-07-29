import React from 'react';
import { Eye, LogOut, Moon, Settings, Sun, WifiOff } from 'lucide-react';

export type AppView = 'checklist' | 'prices' | 'admin';

interface AppHeaderProps {
    currentView: AppView;
    isDarkMode: boolean;
    isOffline: boolean;
    isAdminAuthenticated: boolean;
    onViewChange: (view: AppView) => void;
    onToggleTheme: () => void;
    onSignOut: () => Promise<void>;
}

export default function AppHeader({ currentView, isDarkMode, isOffline, isAdminAuthenticated, onViewChange, onToggleTheme, onSignOut }: AppHeaderProps) {
    const isAdminView = currentView === 'admin' && isAdminAuthenticated;
    const navClass = (view: AppView) => `shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
        currentView === view
            ? 'bg-[#fcb7f0] text-slate-800 shadow-sm'
            : isAdminView
                ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'
    }`;

    return (
        <header className={`${isAdminView ? 'bg-slate-900 border-slate-700' : 'bg-white dark:bg-[#151f32] border-gray-100 dark:border-slate-800'} border-b sticky top-0 z-40 transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-2 sm:flex sm:justify-start sm:gap-6 sm:py-3">
                <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
                    <Eye size={24} className={isAdminView ? 'text-sky-300' : 'text-[#8e5a7d] dark:text-pink-200'} />
                    <h1 className={`font-headline font-bold text-xl sm:text-2xl leading-tight ${isAdminView ? 'text-white' : 'text-[#101421] dark:text-white'}`}>{isAdminView ? 'Admin' : 'OphthalSupport'}</h1>
                </div>
                <nav className="col-span-2 row-start-2 flex min-w-0 w-full flex-nowrap items-center gap-1 overflow-x-auto no-scrollbar sm:col-auto sm:row-auto sm:w-auto sm:overflow-visible" aria-label="Primary navigation">
                    <button onClick={() => onViewChange('checklist')} className={navClass('checklist')}>Checklist</button>
                    <button onClick={() => onViewChange('prices')} className={navClass('prices')}>Tools &amp; Prices</button>
                    <button onClick={() => onViewChange('admin')} className={`${navClass('admin')} flex items-center gap-1`}>
                        <Settings size={13} /> Admin
                    </button>
                </nav>
                <div className="col-start-2 row-start-1 ml-auto flex items-center gap-3 sm:col-auto sm:row-auto sm:ml-auto">
                    {isOffline && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 shadow-sm">
                            <WifiOff size={10} className="stroke-[2.5]" /> Offline
                        </span>
                    )}
                    {currentView === 'admin' && isAdminAuthenticated ? (
                        <button
                            onClick={onSignOut}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                            type="button"
                        >
                            <LogOut size={14} /> Sign out
                        </button>
                    ) : (
                        <button onClick={onToggleTheme} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 ${isDarkMode ? 'bg-brand-primary dark:bg-brand-primary-dark' : 'bg-gray-200 dark:bg-slate-700'}`} aria-label="Toggle theme">
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center shadow-sm`}>
                                {isDarkMode ? <Moon size={10} className="text-brand-primary dark:text-brand-primary-dark" /> : <Sun size={10} className="text-gray-400" />}
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

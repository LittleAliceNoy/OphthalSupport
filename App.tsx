import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import {
    Activity,
    Asterisk,
    Calculator,
    CheckCircle,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    Eye,
    FileText,
    Settings,
    User,
    Plus,
    Trash2,
    RefreshCw,
    Moon,
    Sun,
    Syringe,
    WifiOff
} from 'lucide-react';

import {
    ANESTHESIA_TYPES,
    COVERAGE_TYPES,
    SURGEON_GROUPS,
    MP_TYPES,
    GDI_TYPES,
    PPV_TYPES,
    NEW_REUSED_OPTIONS,
    ChecklistItemData,
} from './constants';
import { fetchConfig, DBTool, DBAction, DBOperation, DBRule, DBPrice } from './configService';
import { calculateCostAndBreakdown } from './domain/pricing';
import ChecklistSection from './components/ChecklistSection';
import { formatPpvProcedureDisplay } from './domain/ppvSelection';
import { useChecklistSession } from './hooks/useChecklistSession';
import { useProcedureSelection } from './hooks/useProcedureSelection';
import { getOperationCategory, OPERATION_CATEGORY_ORDER } from './toolCatalog';

const AdminPage = lazy(() => import('./AdminPage'));
const PriceListPage = lazy(() => import('./components/prices/PriceListPage'));

// --- Utility Functions ---
function getSurgeonGroup(name: string) {
    if (!name) return '';
    for (const [group, names] of Object.entries(SURGEON_GROUPS)) {
        if (names.some(n => name.includes(n))) return group;
    }
    return '';
}

function getSurgeonGroupColorClass(group: string) {
    const g = (group || '').toUpperCase();
    if (g === 'A') return 'bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-900 border-emerald-600 dark:border-emerald-500 shadow-sm';
    if (g === 'B') return 'bg-pink-500 dark:bg-pink-400 text-white dark:text-slate-900 border-pink-600 dark:border-pink-500 shadow-sm';
    if (g === 'C') return 'bg-brand-secondary dark:bg-brand-secondary-dark text-white dark:text-brand-neutral-dark border-brand-secondary dark:border-brand-secondary-dark shadow-sm';
    if (g === 'D') return 'bg-cyan-600 dark:bg-brand-tertiary-dark text-white dark:text-brand-neutral-dark border-cyan-600 dark:border-brand-tertiary-dark shadow-sm';
    return 'bg-gray-500 dark:bg-slate-400 text-white dark:text-slate-900 border-gray-600 dark:border-slate-500 shadow-sm';
}


export default function App() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [config, setConfig] = useState<{tools: DBTool[], actions: DBAction[], operations: DBOperation[], rules: DBRule[], prices: DBPrice[]} | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    useEffect(() => {
        fetchConfig().then(data => { setConfig(data); setIsOffline(data.isFallback); });
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const allSurgeonNames = useMemo(() => Object.values(SURGEON_GROUPS).flat().sort(), []);
    
    const groupedOperations = useMemo(() => {
        if (!config) return {} as Record<string, DBOperation[]>;
        const groups: Record<string, DBOperation[]> = Object.fromEntries(OPERATION_CATEGORY_ORDER.map(category => [category, []]));
        config.operations.forEach(op => {
            const category = getOperationCategory(op.category, op.name);
            groups[category].push(op);
        });
        Object.values(groups).forEach(operations => {
            operations.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
        });
        return Object.fromEntries(Object.entries(groups).filter(([, operations]) => operations.length > 0));
    }, [config]);
    
    const { session, setSession, updateSession, updateChecklist, resetCaseBasics, resetProcedure, setPpvUserDismissed } = useChecklistSession(config);
    const { toggleProcedureKeyword, toggleDiagnosisKeyword, isMpSelected, isGdiSelected, isPpvSelected } = useProcedureSelection({ session, setSession, setPpvUserDismissed });
    const [currentView, setCurrentView] = useState<'checklist' | 'prices' | 'admin'>('checklist');
    const [isAdminEditing, setIsAdminEditing] = useState(false);

    const handleViewChange = (view: 'checklist' | 'prices' | 'admin') => {
        if (currentView === 'admin' && isAdminEditing) {
            alert('You have unsaved changes in the Admin panel. Please save or cancel your edits first.');
            return;
        }
        setCurrentView(view);
    };

    const { total, breakdown } = useMemo(() => {
        if (!config) return { total: 0, breakdown: [] };
        return calculateCostAndBreakdown(session.tools, session.healthCoverage, session, config.prices);
    }, [session.tools, session.healthCoverage, session.diagnosis, config]);

    const activeSurgeonGroup = getSurgeonGroup(session.surgeonName);
    const isMissingRequired = session.operationInput.trim() === '';

    if (!config) return <div className="min-h-screen flex items-center justify-center dark:bg-brand-neutral-dark text-slate-500">Loading Configuration...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-rose-50 to-cyan-50 dark:bg-brand-neutral-dark dark:bg-none text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
            <header className="bg-white dark:bg-[#151f32] border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Eye size={24} className="text-[#8e5a7d] dark:text-pink-200" />
                            <h1 className="font-headline font-bold text-xl sm:text-2xl text-[#101421] dark:text-white leading-tight">OphthalSupport</h1>
                        </div>
                        <nav className="flex items-center gap-1 flex-wrap">
                            <button 
                                onClick={() => handleViewChange('checklist')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${currentView === 'checklist' ? 'bg-[#fcb7f0] text-slate-800 shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                            >
                                Checklist
                            </button>
                            <button 
                                onClick={() => handleViewChange('prices')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${currentView === 'prices' ? 'bg-[#fcb7f0] text-slate-800 shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                            >
                                Tools & Prices
                            </button>
                            <button 
                                onClick={() => handleViewChange('admin')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${currentView === 'admin' ? 'bg-[#fcb7f0] text-slate-800 shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                            >
                                <Settings size={13} /> Admin
                            </button>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        {isOffline && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 shadow-sm">
                                <WifiOff size={10} className="stroke-[2.5]" />
                                Offline
                            </span>
                        )}
                        <button 
                            onClick={toggleTheme} 
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 ${isDarkMode ? 'bg-brand-primary dark:bg-brand-primary-dark' : 'bg-gray-200 dark:bg-slate-700'}`}
                            aria-label="Toggle theme"
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                                } flex items-center justify-center shadow-sm`}
                            >
                                {isDarkMode ? <Moon size={10} className="text-brand-primary dark:text-brand-primary-dark" /> : <Sun size={10} className="text-gray-400" />}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-3 py-3 sm:px-4 sm:py-6">
                {currentView === 'prices' ? (
                    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading price list…</div>}>
                        <PriceListPage tools={config.tools} prices={config.prices} />
                    </Suspense>
                ) : currentView === 'admin' ? (
                    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading admin tools…</div>}>
                        <AdminPage
                            config={config}
                            isOffline={isOffline}
                            onEditingChange={setIsAdminEditing}
                            onRefresh={async () => {
                                const data = await fetchConfig();
                                setConfig(data);
                                setIsOffline(data.isFallback);
                            }}
                        />
                    </Suspense>
                ) : (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="space-y-4 sm:space-y-6">
                            <section className="bg-white dark:bg-[#151f32] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-3 sm:p-4 transition-colors duration-300">
                                <div className="flex justify-between items-center mb-2 sm:mb-3 border-b border-gray-50 dark:border-slate-800 pb-1.5 sm:pb-2">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-[#8e5a7d] dark:text-brand-secondary-dark sm:w-[16px] sm:h-[16px]" />
                                        <h2 className="text-[11px] sm:text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide">Case Basics</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {activeSurgeonGroup && (
                                            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-black border uppercase ${getSurgeonGroupColorClass(activeSurgeonGroup)}`}>
                                                {activeSurgeonGroup}
                                            </span>
                                        )}
                                        <button onClick={resetCaseBasics} className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 flex-shrink-0 rounded transition-colors" title="Reset Case Basics">
                                            <RefreshCw size={10} className="sm:w-[12px] sm:h-[12px]" /> Reset
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Surgeon</label>
                                        <div className="relative">
                                            <select 
                                                value={session.surgeonName} 
                                                onChange={e => updateSession('surgeonName', e.target.value)}
                                                className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                            >
                                                <option value="">- Select -</option>
                                                {allSurgeonNames.map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Anes.</label>
                                        <div className="relative">
                                            <select 
                                                value={session.anesthesiaType} 
                                                onChange={e => updateSession('anesthesiaType', e.target.value)}
                                                className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                            >
                                                {Object.values(ANESTHESIA_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Coverage</label>
                                        <div className="relative">
                                            <select 
                                                value={session.healthCoverage} 
                                                onChange={e => updateSession('healthCoverage', e.target.value)}
                                                className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                            >
                                                {Object.values(COVERAGE_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-5 transition-colors duration-300">
                                <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-50 dark:border-slate-800 pb-2 sm:pb-3">
                                    <div className="flex items-center gap-2">
                                        <CheckSquare size={16} className="text-[#8e5a7d] dark:text-brand-tertiary-dark sm:w-[18px] sm:h-[18px]" />
                                        <h2 className="text-xs sm:text-sm font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide">Procedure</h2>
                                    </div>
                                    <button onClick={() => {
                                        resetProcedure();
                                    }} className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 flex-shrink-0 rounded transition-colors">
                                        <RefreshCw size={10} className="sm:w-[12px] sm:h-[12px]" /> Reset
                                    </button>
                                </div>

                                <div className="space-y-3 sm:space-y-5">
                                    <div>
                                        {Object.entries(groupedOperations).map(([category, ops]) => {
                                            const renderOpBtn = (op: DBOperation) => {
                                                const normalizedInput = session.operationInput.toLowerCase();
                                                const normalizedOpName = op.name.toLowerCase();
                                                const escapedName = normalizedOpName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                                const regex = new RegExp('(^|\\+)\\s*' + escapedName + '\\s*($|\\+)', 'i');
                                                const isSelected = regex.test(normalizedInput);
                                                return (
                                                    <button
                                                        key={op.name}
                                                        onClick={() => toggleProcedureKeyword(op.name)}
                                                        className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all border shrink-0 ${
                                                            isSelected 
                                                            ? 'bg-[#fcb7f0] dark:bg-[#fcb7f0] text-slate-800 dark:text-slate-800 border-[#fcb7f0] dark:border-[#fcb7f0] shadow-md scale-[1.02]' 
                                                            : 'bg-white dark:bg-[#151f32] text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-[#fcb7f0]/50 dark:hover:border-[#fcb7f0]/50 hover:bg-[#fcb7f0]/5 dark:hover:bg-[#fcb7f0]/5'
                                                        }`}
                                                    >
                                                        {isSelected ? <CheckCircle size={14} className="inline mr-1" /> : <Plus size={14} className="inline mr-1 opacity-50" />}
                                                        {op.name}
                                                    </button>
                                                );
                                            };

                                            return (
                                            <div key={category} className="mb-3 sm:mb-4 last:mb-0">
                                                <label className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1.5 sm:mb-2">{category}</label>
                                                <div className="space-y-2.5">
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                                                        {(ops as DBOperation[]).map(renderOpBtn)}
                                                    </div>
                                                    
                                                    {category === 'Retinal Surgery' && (isPpvSelected || isMpSelected) && (
                                                        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center pt-1 animate-fadeIn">
                                                            {isPpvSelected && (
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <div className="w-2 h-[2px] bg-pink-400/40 rounded-full"></div>
                                                                    {PPV_TYPES.map(p => {
                                                                        const diags = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
                                                                        const isPpvSelectedDiag = diags.includes(p);
                                                                        return (
                                                                            <button
                                                                                key={p}
                                                                                onClick={() => toggleDiagnosisKeyword(p, PPV_TYPES)}
                                                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                                                                                    isPpvSelectedDiag 
                                                                                    ? 'bg-pink-500 dark:bg-pink-400 text-white dark:text-slate-900 border-pink-600 dark:border-pink-500 shadow-sm' 
                                                                                    : 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-500/30 hover:bg-pink-100 dark:hover:bg-pink-500/20'
                                                                                }`}
                                                                            >
                                                                                {p}
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                            {isMpSelected && (
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <div className="w-2 h-[2px] bg-brand-secondary/40 rounded-full"></div>
                                                                    {MP_TYPES.map(mp => {
                                                                        const diags = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
                                                                        const isMpSelectedDiag = diags.includes(mp);
                                                                        return (
                                                                            <button
                                                                                key={mp}
                                                                                onClick={() => toggleDiagnosisKeyword(mp)}
                                                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                                                                                    isMpSelectedDiag 
                                                                                    ? 'bg-brand-secondary dark:bg-brand-secondary-dark text-white dark:text-brand-neutral-dark border-brand-secondary dark:border-brand-secondary-dark shadow-sm' 
                                                                                    : 'bg-brand-secondary/5 dark:bg-brand-secondary-dark/10 text-brand-secondary dark:text-brand-secondary-dark border-brand-secondary/30 dark:border-brand-secondary-dark/30 hover:bg-brand-secondary/20 dark:hover:bg-brand-secondary-dark/20'
                                                                                }`}
                                                                            >
                                                                                {mp}
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {category === 'Glaucoma' && isGdiSelected && (
                                                        <div className="flex items-center gap-1.5 pt-1 animate-fadeIn shrink-0">
                                                            <div className="w-2 h-[2px] bg-cyan-600/40 dark:bg-brand-tertiary-dark/40 rounded-full"></div>
                                                            {GDI_TYPES.map(gdi => {
                                                                const diags = session.diagnosis.split(',').map(s => s.trim()).filter(Boolean);
                                                                const isGdiSelectedDiag = diags.includes(gdi);
                                                                return (
                                                                    <button
                                                                        key={gdi}
                                                                        onClick={() => toggleDiagnosisKeyword(gdi, GDI_TYPES)}
                                                                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                                                                            isGdiSelectedDiag 
                                                                            ? 'bg-cyan-600 dark:bg-brand-tertiary-dark text-white dark:text-brand-neutral-dark border-cyan-600 dark:border-brand-tertiary-dark shadow-sm' 
                                                                            : 'bg-cyan-600/5 dark:bg-brand-tertiary-dark/10 text-cyan-700 dark:text-brand-tertiary-dark border-cyan-600/30 dark:border-brand-tertiary-dark/30 hover:bg-cyan-600/20 dark:hover:bg-brand-tertiary-dark/20'
                                                                        }`}
                                                                    >
                                                                        {gdi}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })}
                                        <input 
                                            type="text" 
                                            value={formatPpvProcedureDisplay(session.operationInput, session.diagnosis)}
                                            onChange={e => updateSession('operationInput', e.target.value)}
                                            placeholder="Or type custom procedure..."
                                            className="mt-2 sm:mt-3 w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm font-medium outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                        />
                                        {isMissingRequired && (
                                            <p className="text-xs font-bold text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 animate-pulse"></span>
                                                Please select at least one procedure
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {!isMissingRequired && (
                                <div className="bg-brand-neutral-dark dark:bg-gradient-to-r dark:from-[#FCAAED] dark:to-[#F1B197] rounded-2xl shadow-xl dark:shadow-[0_0_40px_rgba(252,170,237,0.2)] p-6 text-white dark:text-brand-neutral-dark overflow-hidden relative animate-fadeIn transition-colors duration-300">
                                    <Calculator className="absolute -right-4 -top-4 w-24 h-24 opacity-10 dark:opacity-20" />
                                    <h3 className="text-xs font-headline font-black uppercase tracking-widest text-slate-300 dark:text-slate-900/60 mb-2">Estimated Tooling Cost</h3>
                                    <div className="text-4xl font-headline font-black mb-1 leading-none text-white dark:text-slate-900">{total.toLocaleString()}</div>
                                    <div className="text-xs font-bold text-slate-400 dark:text-slate-900/60 mb-6 uppercase">Total THB ({session.healthCoverage})</div>
                                    <div className="pt-4 border-t border-slate-700 dark:border-slate-900/10">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-900/80 mb-3">Itemized Breakdown</h4>
                                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {breakdown.length > 0 ? (
                                                breakdown.map((item, i) => {
                                                    const tool = session.tools.find(t => t.id === item.id);
                                                    const isReusable = tool?.options?.some(o => o.value === NEW_REUSED_OPTIONS.NEW || o.value === NEW_REUSED_OPTIONS.REUSED);
                                                    return (
                                                        <div key={i} className="flex justify-between items-start text-sm group">
                                                            <div className="flex flex-col flex-1 mr-3">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-semibold text-white dark:text-slate-900 truncate">{item.name}</span>
                                                                    {isReusable && (
                                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                                            {tool?.disabled ? (
                                                                                <span className="inline-flex items-center justify-center h-[20px] w-[60px] rounded-full text-[7px] font-black bg-brand-secondary dark:bg-slate-200 text-white dark:text-slate-900 leading-none uppercase shrink-0">New Only</span>
                                                                            ) : (
                                                                                <button 
                                                                                    onClick={() => updateChecklist('tools', item.id, 'selectedValue', item.isReused ? NEW_REUSED_OPTIONS.NEW : NEW_REUSED_OPTIONS.REUSED)}
                                                                                    className={`relative inline-flex h-[20px] w-[60px] items-center rounded-full transition-all focus:outline-none ${!item.isReused ? 'bg-brand-secondary dark:bg-slate-200' : 'bg-white/30 dark:bg-slate-800/50'}`}
                                                                                >
                                                                                    <span className={`absolute text-[8px] font-black uppercase tracking-wider transition-all ${!item.isReused ? 'right-2.5 text-white dark:text-slate-900' : 'left-2.5 text-slate-900 dark:text-white'}`}>{item.isReused ? 'Reuse' : 'New'}</span>
                                                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-sm ${!item.isReused ? 'translate-x-1' : 'translate-x-[40px]'}`} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="font-mono text-white dark:text-slate-900 tracking-tight shrink-0 mt-0.5 font-bold">{item.isReused ? '฿0' : `฿${item.price.toLocaleString()}`}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : <div className="text-xs text-slate-400 dark:text-slate-800 italic pt-2 font-medium">No tools selected yet</div>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isMissingRequired && (
                                <section className="space-y-4 animate-fadeIn mb-8">
                                    <ChecklistSection title="Pre-Operative Checklist" items={session.actions} onItemChange={(id, k, v) => updateChecklist('actions', id, k, v)} colorClass="text-slate-100" showAllText="Show All Actions" />
                                    <ChecklistSection title="Surgical Tools Checklist" items={session.tools} onItemChange={(id, k, v) => updateChecklist('tools', id, k, v)} colorClass="text-slate-100" showAllText="Add Tools" icon={Syringe} />
                                </section>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.3); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.5); }
            `}</style>
        </div>
    );
}

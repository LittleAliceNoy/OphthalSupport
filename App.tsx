import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react';

import { getSurgeonGroups } from './constants';
import { fetchConfig, DBTool, DBAction, DBOperation, DBRule, DBPrice } from './configService';
import { calculateCostAndBreakdown } from './domain/pricing';
import ChecklistView from './components/ChecklistView';
import { useChecklistSession } from './hooks/useChecklistSession';
import { useProcedureSelection } from './hooks/useProcedureSelection';
import { getOperationCategory, OPERATION_CATEGORY_ORDER } from './toolCatalog';
import AppHeader from './components/AppHeader';
import type { AppView } from './components/AppHeader';
import CaseBasicsPanel from './components/CaseBasicsPanel';
import ProcedurePicker from './components/ProcedurePicker';

const AdminPage = lazy(() => import('./AdminPage'));
const PriceListPage = lazy(() => import('./components/prices/PriceListPage'));

export default function App() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [config, setConfig] = useState<{tools: DBTool[], actions: DBAction[], operations: DBOperation[], rules: DBRule[], prices: DBPrice[]} | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [surgeonGroups, setSurgeonGroupsState] = useState(getSurgeonGroups);

    useEffect(() => {
        fetchConfig().then(data => { setConfig(data); setIsOffline(data.isFallback); });
    }, []);

    useEffect(() => {
        const handleUpdate = () => setSurgeonGroupsState(getSurgeonGroups());
        window.addEventListener('surgeonGroupsUpdated', handleUpdate);
        window.addEventListener('storage', handleUpdate);
        return () => {
            window.removeEventListener('surgeonGroupsUpdated', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const allSurgeonNames = useMemo(() => Object.values(surgeonGroups).flat().sort(), [surgeonGroups]);
    
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
    const [currentView, setCurrentView] = useState<AppView>('checklist');
    const [isAdminEditing, setIsAdminEditing] = useState(false);

    const handleViewChange = (view: AppView) => {
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

    const isMissingRequired = session.operationInput.trim() === '';

    if (!config) return <div className="min-h-screen flex items-center justify-center dark:bg-brand-neutral-dark text-slate-500">Loading Configuration...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-rose-50 to-cyan-50 dark:bg-brand-neutral-dark dark:bg-none text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
            <AppHeader currentView={currentView} isDarkMode={isDarkMode} isOffline={isOffline} onViewChange={handleViewChange} onToggleTheme={toggleTheme} />

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
                            <CaseBasicsPanel
                                session={session}
                                surgeonNames={allSurgeonNames}
                                surgeonGroups={surgeonGroups}
                                onUpdate={(field, value) => updateSession(field, value)}
                                onReset={resetCaseBasics}
                            />

                            <ProcedurePicker
                                session={session}
                                groupedOperations={groupedOperations}
                                isPpvSelected={isPpvSelected}
                                isMpSelected={isMpSelected}
                                isGdiSelected={isGdiSelected}
                                isMissingRequired={isMissingRequired}
                                onProcedureToggle={toggleProcedureKeyword}
                                onDiagnosisToggle={toggleDiagnosisKeyword}
                                onOperationInputChange={value => updateSession('operationInput', value)}
                                onReset={resetProcedure}
                            />

                            <ChecklistView
                                session={session}
                                isMissingRequired={isMissingRequired}
                                total={total}
                                breakdown={breakdown}
                                onToolChange={(itemId, value) => updateChecklist('tools', itemId, 'selectedValue', value)}
                                onItemChange={(type, id, key, value) => updateChecklist(type, id, key, value)}
                            />
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

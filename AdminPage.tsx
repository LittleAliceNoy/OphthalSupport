import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { DBAction, DBOperation, DBPrice, DBRule, DBTool } from './configService';
import AdminShell from './components/admin/AdminShell';
import AdminPricesPage from './components/admin/AdminPricesPage';
import AdminOperationsPage from './components/admin/AdminOperationsPage';
import { useAdminPrices } from './components/admin/hooks/useAdminPrices';
import { useAdminOperations } from './components/admin/hooks/useAdminOperations';

interface AdminPageProps {
    config: { tools: DBTool[]; actions: DBAction[]; operations: DBOperation[]; rules: DBRule[]; prices: DBPrice[] };
    onRefresh: () => Promise<void>;
    isOffline: boolean;
    onEditingChange: (isEditing: boolean) => void;
}

export default function AdminPage({ config, onRefresh, isOffline, onEditingChange }: AdminPageProps) {
    const [adminTab, setAdminTab] = useState<'prices' | 'logic'>('prices');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState<string | null>(null);
    const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); };

    const prices = useAdminPrices({ config, onRefresh, showToast, setLoading });
    const operations = useAdminOperations({ config, onRefresh, showToast, setLoading });
    const hasUnsavedChanges = () => prices.hasUnsavedChanges() || operations.hasUnsavedChanges();

    useEffect(() => { onEditingChange(hasUnsavedChanges()); }, [onEditingChange, prices.state.editingCategory, prices.state.editingPriceId, prices.state.editPricesData, operations.state.editOpId, operations.state.editOpName, operations.state.editOpCategory, operations.state.editOpKeywords, operations.state.editOpRules]);
    useEffect(() => () => onEditingChange(false), [onEditingChange]);

    return (
        <AdminShell
            isOffline={isOffline}
            activeTab={adminTab}
            canNavigate={!hasUnsavedChanges()}
            onTabChange={tab => { prices.actions.setEditingCategory(null); prices.actions.setEditingPriceId(null); operations.actions.setEditingPriceId(null); setAdminTab(tab); }}
        >
            {adminTab === 'prices' && <AdminPricesPage config={{ tools: config.tools, prices: config.prices }} categorizedPrices={prices.categorizedPrices} isOffline={isOffline} loading={loading} state={prices.state} actions={prices.actions} />}
            {adminTab === 'logic' && <AdminOperationsPage config={{ tools: config.tools, actions: config.actions, operations: config.operations, rules: config.rules }} categories={operations.categories} groupedOperations={operations.groupedOperations} toolRuleOptions={operations.toolRuleOptions} actionRuleOptions={operations.actionRuleOptions} isOffline={isOffline} state={operations.state} actions={operations.actions} />}
            {loading && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fadeIn"><div className="bg-white dark:bg-[#151f32] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col items-center gap-3"><RefreshCw size={24} className="text-[#8e5a7d] dark:text-[#fcb7f0] animate-spin" /><span className="text-xs font-bold text-gray-700 dark:text-slate-350">{loading}</span></div></div>}
            {toast && <div className="fixed bottom-4 right-4 z-50 animate-slideUp"><div className={`p-4 rounded-xl shadow-lg border flex items-center gap-2 max-w-sm ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/30 border-red-500/30 text-red-855 dark:text-red-300'}`}>{toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}<span className="text-xs font-bold">{toast.message}</span></div></div>}
        </AdminShell>
    );
}

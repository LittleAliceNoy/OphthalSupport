import React from 'react';
import { ChevronDown, Plus, Save, Trash2, X } from 'lucide-react';
import { DBAction, DBOperation, DBRule, DBTool } from '../../configService';
import AdminFeatureToolbar from './AdminFeatureToolbar';
import { CATEGORY_ORDER } from './adminCatalog';
import OperationHeader from './OperationHeader';
import OperationRuleEditor, { EditableOperationRule } from './OperationRuleEditor';
import OperationRuleSummary from './OperationRuleSummary';
import OperationSummary from './OperationSummary';

type Config = { tools: DBTool[]; actions: DBAction[]; operations: DBOperation[]; rules: DBRule[] };
type Setter<T> = React.Dispatch<React.SetStateAction<T>>;
type ToolRuleOption = { id: string; name: string; category: string; options?: Array<{ value: string; label: string }> };
type ActionRuleOption = { id: string; name: string };

export interface LogicViewState {
    logicSearch: string;
    selectedLogicCategory: string;
    selectedCategory: string;
    editingPriceId: string | null;
    showAddOpForm: boolean;
    newOpName: string;
    newOpCategory: string;
    newOpKeywords: string[];
    newOpKeywordInput: string;
    isAddingNewOpKeyword: boolean;
    expandedOpId: string | null;
    editOpId: string | null;
    editOpName: string;
    editOpCategory: string;
    editOpKeywords: string[];
    editOpKeywordInput: string;
    isAddingEditOpKeyword: boolean;
    editOpRules: EditableOperationRule[];
    draggedOperationId: string | null;
    draggedOperationCategory: string | null;
    dragOverOperationId: string | null;
}

export interface LogicViewActions {
    setLogicSearch: Setter<string>;
    setSelectedLogicCategory: Setter<string>;
    setEditingPriceId: Setter<string | null>;
    setShowAddOpForm: Setter<boolean>;
    setNewOpName: Setter<string>;
    setNewOpCategory: Setter<string>;
    setNewOpKeywords: Setter<string[]>;
    setNewOpKeywordInput: Setter<string>;
    setIsAddingNewOpKeyword: Setter<boolean>;
    setEditOpId: Setter<string | null>;
    setEditOpName: Setter<string>;
    setEditOpCategory: Setter<string>;
    setEditOpKeywords: Setter<string[]>;
    setEditOpKeywordInput: Setter<string>;
    setIsAddingEditOpKeyword: Setter<boolean>;
    setEditOpRules: Setter<EditableOperationRule[]>;
    setDraggedOperationId: Setter<string | null>;
    setDraggedOperationCategory: Setter<string | null>;
    setDragOverOperationId: Setter<string | null>;
    handleCloseAddOpForm: () => void;
    handleAddKeywordToNewOp: (keyword: string) => boolean;
    handleRemoveKeywordFromNewOp: (index: number) => void;
    handleCreateOperation: (event: React.FormEvent) => Promise<void>;
    handleAddKeywordToEditOp: (keyword: string, operationId: string) => boolean;
    handleRemoveKeywordFromEditOp: (index: number) => void;
    handleStartEditOp: (operation: DBOperation) => void;
    handleSaveOperationDetails: (operationId: string) => Promise<void>;
    handleDeleteOperation: (operationId: string) => Promise<void>;
    handleOpClick: (operationId: string) => void;
    handleMoveOperation: (draggedId: string, targetId: string, sourceCategory: string, targetCategory: string) => Promise<void>;
    hasOpEditChanges: (operationId: string) => boolean;
    hasPriceRowChanges: (priceId: string) => boolean;
}

interface AdminOperationsPageProps {
    config: Config;
    categories: string[];
    groupedOperations: Record<string, DBOperation[]>;
    toolRuleOptions: ToolRuleOption[];
    actionRuleOptions: ActionRuleOption[];
    isOffline: boolean;
    state: LogicViewState;
    actions: LogicViewActions;
}

export default function AdminOperationsPage({ config, categories, groupedOperations, toolRuleOptions, actionRuleOptions, isOffline, state, actions }: AdminOperationsPageProps) {
    const {
        logicSearch, selectedLogicCategory, selectedCategory, editingPriceId, showAddOpForm, newOpName,
        newOpCategory, newOpKeywords, newOpKeywordInput, isAddingNewOpKeyword, expandedOpId, editOpId,
        editOpName, editOpCategory, editOpKeywords, editOpKeywordInput, isAddingEditOpKeyword, editOpRules,
        draggedOperationId, draggedOperationCategory, dragOverOperationId,
    } = state;
    const {
        setLogicSearch, setSelectedLogicCategory, setEditingPriceId, setShowAddOpForm, setNewOpName,
        setNewOpCategory, setNewOpKeywords, setNewOpKeywordInput, setIsAddingNewOpKeyword, setEditOpId,
        setEditOpName, setEditOpCategory, setEditOpKeywords, setEditOpKeywordInput, setIsAddingEditOpKeyword,
        setEditOpRules, setDraggedOperationId, setDraggedOperationCategory, setDragOverOperationId, handleCloseAddOpForm, handleAddKeywordToNewOp, handleRemoveKeywordFromNewOp,
        handleCreateOperation, handleAddKeywordToEditOp, handleRemoveKeywordFromEditOp, handleStartEditOp,
        handleSaveOperationDetails, handleDeleteOperation, handleOpClick, handleMoveOperation, hasOpEditChanges, hasPriceRowChanges,
    } = actions;

    return (
        <div className="space-y-4">
                            <AdminFeatureToolbar
                                categories={['All', ...categories]}
                                selectedCategory={selectedLogicCategory}
                                onCategoryChange={category => {
                                    if (editingPriceId !== null && hasPriceRowChanges(editingPriceId)) {
                                        alert('You have unsaved changes. Please save or cancel your edits first.');
                                        return;
                                    }
                                    setEditingPriceId(null);
                                    setSelectedLogicCategory(category);
                                }}
                                search={logicSearch}
                                onSearchChange={setLogicSearch}
                                searchPlaceholder="Search operations, keys..."
                                addLabel="Add"
                                addOpen={showAddOpForm}
                                disabled={isOffline}
                                onAddToggle={() => {
                                    if (editingPriceId !== null && hasPriceRowChanges(editingPriceId)) {
                                        alert('You have unsaved changes. Please save or cancel your edits first.');
                                        return;
                                    }
                                    setEditingPriceId(null);
                                    if (showAddOpForm) handleCloseAddOpForm();
                                    else setShowAddOpForm(true);
                                }}
                            />
                                       {/* Add Operation Form Modal */}
                            {showAddOpForm && (
                                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
                                    <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-xl border border-gray-150 dark:border-slate-800 p-5 sm:p-6 w-full max-w-xl animate-scaleUp overflow-y-auto max-h-[90vh]">
                                        <div className="flex justify-between items-center mb-4 border-b border-gray-50 dark:border-slate-800 pb-2">
                                            <h3 className="text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                                <Plus size={16} className="text-[#8e5a7d] dark:text-brand-primary-dark" />
                                                Add Surgery Operation
                                            </h3>
                                            <button 
                                                type="button"
                                                onClick={handleCloseAddOpForm}
                                                className="text-gray-400 hover:text-gray-500 transition-colors p-1"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <form onSubmit={handleCreateOperation} className="mt-4 p-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Operation Name</label>
                                                    <input
                                                        type="text"
                                                        value={newOpName}
                                                        onChange={e => setNewOpName(e.target.value)}
                                                        placeholder="e.g. PPV, Phaco, GDI"
                                                        className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Category</label>
                                                    <div className="relative">
                                                        <select
                                                            value={newOpCategory}
                                                            onChange={e => setNewOpCategory(e.target.value)}
                                                            className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                                        >
                                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Trigger Keywords</label>
                                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                    {newOpKeywords.map((kw, idx) => (
                                                        <span 
                                                            key={idx} 
                                                            className="inline-flex items-center gap-1 bg-[#fcb7f0]/35 dark:bg-[#fcb7f0]/15 text-[#8e5a7d] dark:text-[#fcb7f0] border border-[#fcb7f0]/35 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                                                        >
                                                            {kw}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveKeywordFromNewOp(idx)}
                                                                className="hover:bg-[#fcb7f0]/50 dark:hover:bg-[#fcb7f0]/30 rounded-full p-0.5 transition-all text-[#8e5a7d] dark:text-[#fcb7f0]"
                                                            >
                                                                <X size={10} strokeWidth={3} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                    
                                                    {isAddingNewOpKeyword ? (
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            value={newOpKeywordInput}
                                                            onChange={e => setNewOpKeywordInput(e.target.value)}
                                                            onBlur={() => {
                                                                if (newOpKeywordInput.trim()) {
                                                                    handleAddKeywordToNewOp(newOpKeywordInput);
                                                                }
                                                                setIsAddingNewOpKeyword(false);
                                                            }}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    if (newOpKeywordInput.trim()) {
                                                                        handleAddKeywordToNewOp(newOpKeywordInput);
                                                                    }
                                                                    setIsAddingNewOpKeyword(false);
                                                                } else if (e.key === 'Escape') {
                                                                    setIsAddingNewOpKeyword(false);
                                                                    setNewOpKeywordInput('');
                                                                }
                                                            }}
                                                            placeholder="Keyword..."
                                                            className="bg-transparent border-b border-[#fcb7f0] px-1 py-0 text-[10px] font-bold outline-none text-[#8e5a7d] dark:text-[#fcb7f0] w-20 transition-all"
                                                        />
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsAddingNewOpKeyword(true);
                                                                setNewOpKeywordInput('');
                                                            }}
                                                            className="inline-flex items-center gap-0.5 bg-white hover:bg-[#fcb7f0]/10 dark:bg-slate-900 dark:hover:bg-[#fcb7f0]/5 border border-dashed border-[#fcb7f0]/60 text-[#8e5a7d] dark:text-[#fcb7f0] text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                                                        >
                                                            <Plus size={10} strokeWidth={3} /> Add
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="text-[9px] text-gray-400 dark:text-slate-555 mt-1 block font-medium">Keywords are case-insensitive. Small keywords (≤2 characters) will match whole words only.</span>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-slate-800">
                                                <button
                                                    type="button"
                                                    onClick={handleCloseAddOpForm}
                                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-lg transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                                                >
                                                    <Save size={14} />
                                                    Save Operation
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
        
                            {/* Operations Accordion List */}
                            <div className="space-y-4">
                                {categories.map(category => {
                                    if (selectedLogicCategory !== 'All' && category !== selectedLogicCategory) {
                                        return null;
                                    }
                                    const operations = groupedOperations[category];
                                    if (operations.length === 0) return null;
        
                                    return (
                                        <div key={category} className="space-y-2.5">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8e5a7d] dark:text-pink-400/80 px-1 flex items-center gap-2 mt-4">
                                                <span className="w-1.5 h-3 bg-[#fcb7f0] rounded-full"></span>
                                                {(() => {
                                                    if (category.toLowerCase().includes('surgery')) return category;
                                                    if (category === 'Others') return 'Other Surgery';
                                                    return `${category} Surgery`;
                                                })()}
                                            </h3>
                                            
                                            <div className="space-y-2">
                                                {operations.map(op => {
                                                    const isExpanded = expandedOpId === op.id;
                                                    const opRules = config.rules.filter(r => r.operation_id === op.id);
                                                    const isEditingDetails = editOpId === op.id;
        
                                                    return (
                                                        <div 
                                                            key={op.id} 
                                                            className="bg-white dark:bg-[#151f32] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors"
                                                        >
                                                            <OperationHeader
                                                                operation={op}
                                                                ruleCount={opRules.length}
                                                                expanded={isExpanded}
                                                                disabled={isOffline}
                                                                                onToggle={() => handleOpClick(op.id)}
                                                                                onEdit={() => handleStartEditOp(op)}
                                                                                onDelete={() => handleDeleteOperation(op.id)}
                                                                                canReorder={!isExpanded}
                                                                                onDragStart={event => {
                                                                                    setDraggedOperationId(op.id);
                                                                                    setDraggedOperationCategory(op.category);
                                                                                    event.dataTransfer.effectAllowed = 'move';
                                                                                }}
                                                                                onDragOver={event => {
                                                                                    if (isExpanded || !draggedOperationId || draggedOperationId === op.id) return;
                                                                                    event.preventDefault();
                                                                                    setDragOverOperationId(op.id);
                                                                                }}
                                                                                onDrop={async event => {
                                                                                    event.preventDefault();
                                                                                    if (draggedOperationId && draggedOperationId !== op.id && draggedOperationCategory) {
                                                                                        await handleMoveOperation(draggedOperationId, op.id, draggedOperationCategory, op.category);
                                                                                    }
                                                                                    setDraggedOperationId(null);
                                                                                    setDraggedOperationCategory(null);
                                                                                    setDragOverOperationId(null);
                                                                                }}
                                                                                onDragEnd={() => {
                                                                                    setDraggedOperationId(null);
                                                                                    setDraggedOperationCategory(null);
                                                                                    setDragOverOperationId(null);
                                                                                }}
                                                            />
        
                                                            {/* Expanded Operation Body */}
                                                            {isExpanded && (
                                                                <div className="p-3 sm:p-4 border-t border-gray-50 dark:border-slate-800/80 bg-gray-50/30 dark:bg-slate-900/10 animate-slideDown">
                                                                    <div className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4 shadow-sm">
                                                                        {/* Top Details Section */}
                                                                        {isEditingDetails ? (
                                                                            <div className="space-y-3 pb-3 border-b border-gray-100 dark:border-slate-800/80">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-[10px] font-extrabold text-[#8e5a7d] dark:text-[#fcb7f0] uppercase tracking-wider">
                                                                                        Edit Operation Details & Triggers
                                                                                    </span>
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleDeleteOperation(op.id)}
                                                                                            disabled={isOffline}
                                                                                            className="p-1 text-gray-500 hover:text-red-500 disabled:opacity-30 transition-colors"
                                                                                            title="Delete operation"
                                                                                        >
                                                                                            <Trash2 size={16} />
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleSaveOperationDetails(op.id)}
                                                                                            className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                                                                                            title="Save all changes"
                                                                                        >
                                                                                            <Save size={16} />
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                if (hasOpEditChanges(op.id)) {
                                                                                                    const confirmCancel = window.confirm('Are you sure you want to discard your unsaved changes?');
                                                                                                    if (!confirmCancel) return;
                                                                                                }
                                                                                                setEditOpId(null);
                                                                                                setEditOpRules([]);
                                                                                            }}
                                                                                            className="p-1 text-gray-400 hover:text-gray-500 transition-colors"
                                                                                            title="Cancel"
                                                                                        >
                                                                                            <X size={16} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                    <div>
                                                                                        <label className="text-[9px] font-bold text-gray-450 dark:text-slate-500 block mb-1">Name</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={editOpName}
                                                                                            onChange={e => setEditOpName(e.target.value)}
                                                                                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[9px] font-bold text-gray-455 dark:text-slate-500 block mb-1">Category</label>
                                                                                        <div className="relative">
                                                                                            <select
                                                                                                value={editOpCategory}
                                                                                                onChange={e => setEditOpCategory(e.target.value)}
                                                                                                className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#fcb7f0] transition-all"
                                                                                            >
                                                                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                                                            </select>
                                                                                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] font-bold text-gray-450 dark:text-slate-500 block mb-1">Trigger Keywords</label>
                                                                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                                                        {editOpKeywords.map((kw, idx) => (
                                                                                            <span 
                                                                                                key={idx} 
                                                                                                className="inline-flex items-center gap-1 bg-[#fcb7f0]/35 dark:bg-[#fcb7f0]/15 text-[#8e5a7d] dark:text-[#fcb7f0] border border-[#fcb7f0]/35 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                                                                                            >
                                                                                                {kw}
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleRemoveKeywordFromEditOp(idx)}
                                                                                                    className="hover:text-red-500 transition-colors"
                                                                                                >
                                                                                                    <X size={10} />
                                                                                                </button>
                                                                                            </span>
                                                                                        ))}
                                                                                        {isAddingEditOpKeyword ? (
                                                                                            <input
                                                                                                type="text"
                                                                                                autoFocus
                                                                                                value={editOpKeywordInput}
                                                                                                onChange={e => setEditOpKeywordInput(e.target.value)}
                                                                                                onKeyDown={e => {
                                                                                                    if (e.key === 'Enter') {
                                                                                                        e.preventDefault();
                                                                                                        if (handleAddKeywordToEditOp(editOpKeywordInput, op.id)) {
                                                                                                            setIsAddingEditOpKeyword(false);
                                                                                                        }
                                                                                                    } else if (e.key === 'Escape') {
                                                                                                        setIsAddingEditOpKeyword(false);
                                                                                                        setEditOpKeywordInput('');
                                                                                                    }
                                                                                                }}
                                                                                                onBlur={() => {
                                                                                                    if (editOpKeywordInput.trim()) {
                                                                                                        handleAddKeywordToEditOp(editOpKeywordInput, op.id);
                                                                                                    }
                                                                                                    setIsAddingEditOpKeyword(false);
                                                                                                }}
                                                                                                className="bg-white dark:bg-slate-900 border border-[#fcb7f0] text-xs font-semibold px-2 py-0.5 rounded-full outline-none w-24 text-gray-800 dark:text-slate-200"
                                                                                                placeholder="Keyword..."
                                                                                            />
                                                                                        ) : (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setIsAddingEditOpKeyword(true);
                                                                                                    setEditOpKeywordInput('');
                                                                                                }}
                                                                                                className="inline-flex items-center gap-0.5 bg-white hover:bg-[#fcb7f0]/10 dark:bg-slate-900 dark:hover:bg-[#fcb7f0]/5 border border-dashed border-[#fcb7f0]/60 text-[#8e5a7d] dark:text-[#fcb7f0] text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                                                                                            >
                                                                                                <Plus size={10} strokeWidth={3} /> Add
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <OperationSummary
                                                                                operation={op}
                                                                                disabled={isOffline}
                                                                                onEdit={() => handleStartEditOp(op)}
                                                                                onDelete={() => handleDeleteOperation(op.id)}
                                                                            />
                                                                        )}
        
                                                                        {/* Bottom Rules Columns */}
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                                                            {/* 1. Surgical Tools Column (Left) */}
                                                                            <div className="flex flex-col h-full">
                                                                                <div className="flex items-center gap-1.5 mb-3 pb-1 border-b border-gray-100 dark:border-slate-800/80">
                                                                                    <span className="w-1 h-2 bg-sky-400 dark:bg-sky-500 rounded-full"></span>
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-400">Surgical Tools</span>
                                                                                </div>
                                                                                
                                                                                <div className="flex-1 space-y-2 mb-3">
                                                                                    {!isEditingDetails ? (
                                                                                        <OperationRuleSummary
                                                                                            rules={opRules}
                                                                                            targetType="tool"
                                                                                            tools={config.tools}
                                                                                            actions={config.actions}
                                                                                        />
                                                                                    ) : (
                                                                                        <OperationRuleEditor
                                                                                            rules={editOpRules}
                                                                                            targetType="tool"
                                                                                            toolOptions={toolRuleOptions}
                                                                                            actionOptions={actionRuleOptions}
                                                                                            categories={CATEGORY_ORDER}
                                                                                            onChange={(index, changes) => setEditOpRules(prev => prev.map((rule, i) => i === index ? { ...rule, ...changes } : rule))}
                                                                                            onRemove={index => setEditOpRules(prev => prev.filter((_, i) => i !== index))}
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                                
                                                                                {isEditingDetails && (
                                                                                    <button
                                                                                        type="button"
                                                                                        disabled={isOffline}
                                                                                        onClick={() => {
                                                                                            setEditOpRules(prev => [...prev, { operation_id: op.id, target_type: 'tool', target_id: '', default_selected_value: null }]);
                                                                                        }}
                                                                                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-[#fcb7f0]/10 dark:bg-[#111827] dark:hover:bg-[#fcb7f0]/5 border border-dashed border-[#fcb7f0]/60 text-[#8e5a7d] dark:text-[#fcb7f0] text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-auto"
                                                                                    >
                                                                                        <Plus size={12} strokeWidth={3} className="text-[#8e5a7d] dark:text-[#fcb7f0]" /> Add Surgical Tool
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                            
                                                                            {/* 2. Pre-Op Actions Column (Right) */}
                                                                            <div className="flex flex-col h-full">
                                                                                <div className="flex items-center gap-1.5 mb-3 pb-1 border-b border-gray-100 dark:border-slate-800/80">
                                                                                    <span className="w-1 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full"></span>
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Pre-Op Actions</span>
                                                                                </div>
                                                                                <div className="flex-1 space-y-2 mb-3">
                                                                                    {!isEditingDetails ? (
                                                                                        <OperationRuleSummary
                                                                                            rules={opRules}
                                                                                            targetType="action"
                                                                                            tools={config.tools}
                                                                                            actions={config.actions}
                                                                                        />
                                                                                    ) : (
                                                                                        <OperationRuleEditor
                                                                                            rules={editOpRules}
                                                                                            targetType="action"
                                                                                            toolOptions={toolRuleOptions}
                                                                                            actionOptions={actionRuleOptions}
                                                                                            categories={CATEGORY_ORDER}
                                                                                            onChange={(index, changes) => setEditOpRules(prev => prev.map((rule, i) => i === index ? { ...rule, ...changes } : rule))}
                                                                                            onRemove={index => setEditOpRules(prev => prev.filter((_, i) => i !== index))}
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                                
                                                                                {isEditingDetails && (
                                                                                    <button
                                                                                        type="button"
                                                                                        disabled={isOffline}
                                                                                        onClick={() => {
                                                                                            setEditOpRules(prev => [...prev, { operation_id: op.id, target_type: 'action', target_id: '', default_selected_value: null }]);
                                                                                        }}
                                                                                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-[#fcb7f0]/10 dark:bg-[#111827] dark:hover:bg-[#fcb7f0]/5 border border-dashed border-[#fcb7f0]/60 text-[#8e5a7d] dark:text-[#fcb7f0] text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-auto"
                                                                                    >
                                                                                        <Plus size={12} strokeWidth={3} className="text-[#8e5a7d] dark:text-[#fcb7f0]" /> Add Pre-Op Action
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
        
                                {logicSearch.trim() && Object.keys(groupedOperations).filter(cat => selectedLogicCategory === 'All' || cat === selectedLogicCategory).every(cat => groupedOperations[cat].length === 0) && (
                                    <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center text-gray-400 dark:text-slate-500 italic text-xs">
                                        No surgery operations found matching search term "{logicSearch}"
                                    </div>
                                )}
                            </div>
                        </div>
    );
}

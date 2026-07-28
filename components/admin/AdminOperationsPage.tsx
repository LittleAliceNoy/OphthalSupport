import React from 'react';
import { ChevronDown, Plus, Save, Trash2, X } from 'lucide-react';
import { DBAction, DBOperation, DBRule, DBTool } from '../../configService';
import AdminFeatureToolbar from './AdminFeatureToolbar';
import { CATEGORY_ORDER } from './adminCatalog';
import OperationHeader from './OperationHeader';
import OperationRuleEditor, { EditableOperationRule } from './OperationRuleEditor';
import OperationRuleSummary from './OperationRuleSummary';
import OperationSummary from './OperationSummary';
import OperationCreateModal from './OperationCreateModal';

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
                            {showAddOpForm && (
                                <OperationCreateModal
                                    categories={categories}
                                    name={newOpName}
                                    category={newOpCategory}
                                    keywords={newOpKeywords}
                                    keywordInput={newOpKeywordInput}
                                    isAddingKeyword={isAddingNewOpKeyword}
                                    onNameChange={setNewOpName}
                                    onCategoryChange={setNewOpCategory}
                                    onKeywordInputChange={setNewOpKeywordInput}
                                    onAddingKeywordChange={setIsAddingNewOpKeyword}
                                    onAddKeyword={handleAddKeywordToNewOp}
                                    onRemoveKeyword={handleRemoveKeywordFromNewOp}
                                    onClose={handleCloseAddOpForm}
                                    onSubmit={handleCreateOperation}
                                />
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

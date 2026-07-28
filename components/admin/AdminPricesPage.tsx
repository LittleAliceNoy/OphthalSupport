import React from 'react';
import { ChevronDown, Edit, FolderSymlink, Menu, Plus, Save, Trash2, X } from 'lucide-react';
import { DBPrice, DBTool } from '../../configService';
import type { ToolType } from '../../domain/toolTypes';
import { NEW_REUSED_OPTIONS } from '../../constants';
import AdminFeatureToolbar from './AdminFeatureToolbar';
import AdminModalFrame from './AdminModalFrame';
import { CATEGORY_ORDER, getToolDisplayName } from './adminCatalog';
import { getPriceDisplayName } from './adminSelectors';

export interface NewSubtype {
    subKey: string;
    displayName: string;
    csmbs: number;
    sss: number;
    ucs: number;
}

type PriceEditData = { displayName: string; csmbs: number; sss: number; ucs: number };
type Config = { tools: DBTool[]; prices: DBPrice[] };
type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export interface PricesViewState {
    priceSearch: string;
    selectedCategory: string;
    editingCategory: string | null;
    editingPriceId: string | null;
    editPricesData: Record<string, PriceEditData>;
    editToolNames: Record<string, string>;
    showAddToolForm: boolean;
    newToolId: string;
    newToolDisplayName: string;
    newToolCategory: string;
    newToolCsmbs: number;
    newToolSss: number;
    newToolUcs: number;
    newToolType: ToolType;
    newToolSubtypes: NewSubtype[];
    activeAddSubtypeTool: DBTool | null;
    newSubtypeKey: string;
    newSubtypeDisplayName: string;
    newSubtypeCsmbs: number;
    newSubtypeSss: number;
    newSubtypeUcs: number;
    draggedToolId: string | null;
    draggedCategory: string | null;
    dragOverToolId: string | null;
    dragOverCategory: string | null;
}

export interface PricesViewActions {
    setPriceSearch: Setter<string>;
    setSelectedCategory: Setter<string>;
    setEditingCategory: Setter<string | null>;
    setEditingPriceId: Setter<string | null>;
    setShowAddToolForm: Setter<boolean>;
    setNewToolId: Setter<string>;
    setNewToolDisplayName: Setter<string>;
    setNewToolCategory: Setter<string>;
    setNewToolCsmbs: Setter<number>;
    setNewToolSss: Setter<number>;
    setNewToolUcs: Setter<number>;
    setNewToolType: Setter<ToolType>;
    setNewSubtypeKey: Setter<string>;
    setNewSubtypeDisplayName: Setter<string>;
    setNewSubtypeCsmbs: Setter<number>;
    setNewSubtypeSss: Setter<number>;
    setNewSubtypeUcs: Setter<number>;
    setActiveAddSubtypeTool: Setter<DBTool | null>;
    setDraggedToolId: Setter<string | null>;
    setDraggedCategory: Setter<string | null>;
    setDragOverToolId: Setter<string | null>;
    setDragOverCategory: Setter<string | null>;
    handleCloseAddToolForm: () => void;
    handleDisplayNameChange: (value: string) => void;
    handleAddSubtypeRow: () => void;
    handleUpdateSubtypeRow: (index: number, field: keyof NewSubtype, value: string | number) => void;
    handleRemoveSubtypeRow: (index: number) => void;
    handleAddToolSubmit: (event: React.FormEvent) => Promise<void>;
    handleSaveCategoryPrices: (category: string) => Promise<void>;
    handleSavePriceRow: (priceId: string) => Promise<void>;
    handleUpdateEditField: (priceId: string, field: string, value: unknown, price: DBPrice, tool: DBTool | undefined) => void;
    handleUpdateToolName: (toolId: string, value: string) => void;
    handleStartEditCategory: (category: string) => void;
    handleStartEditPriceRow: (price: DBPrice) => void;
    handleDeleteTool: (toolId: string) => Promise<void>;
    handleDeleteSubtype: (price: DBPrice) => Promise<void>;
    handleAddSubtypeSubmit: (event: React.FormEvent) => Promise<void>;
    handleMoveToolToPosition: (draggedId: string, targetId: string, sourceCategory: string, targetCategory: string) => Promise<void>;
    hasUnsavedChanges: () => boolean;
    hasCategoryChanges: (category: string) => boolean;
    hasPriceRowChanges: (priceId: string) => boolean;
}

interface AdminPricesPageProps {
    config: Config;
    categorizedPrices: Record<string, DBPrice[]>;
    isOffline: boolean;
    loading: string | null;
    state: PricesViewState;
    actions: PricesViewActions;
}

export default function AdminPricesPage({ config, categorizedPrices, isOffline, loading, state, actions }: AdminPricesPageProps) {
    const { ...view } = state;
    const {
        setPriceSearch, setSelectedCategory, setEditingCategory, setEditingPriceId, setShowAddToolForm,
        setNewToolId, setNewToolDisplayName, setNewToolCategory, setNewToolCsmbs, setNewToolSss, setNewToolUcs, setNewToolType,
        setNewSubtypeKey, setNewSubtypeDisplayName, setNewSubtypeCsmbs, setNewSubtypeSss, setNewSubtypeUcs,
        setActiveAddSubtypeTool, setDraggedToolId, setDraggedCategory, setDragOverToolId, setDragOverCategory,
        ...handlers
    } = actions;
    const {
        priceSearch, selectedCategory, editingCategory, editingPriceId, editPricesData, editToolNames, showAddToolForm,
        newToolId, newToolDisplayName, newToolCategory, newToolCsmbs, newToolSss, newToolUcs, newToolType,
        newToolSubtypes, activeAddSubtypeTool, newSubtypeKey, newSubtypeDisplayName, newSubtypeCsmbs,
        newSubtypeSss, newSubtypeUcs, draggedToolId, draggedCategory, dragOverToolId, dragOverCategory,
    } = view;
    const {
        hasUnsavedChanges, handleCloseAddToolForm, handleDisplayNameChange, handleAddSubtypeRow,
        handleUpdateSubtypeRow, handleRemoveSubtypeRow, handleAddToolSubmit, handleSaveCategoryPrices,
        handleSavePriceRow, handleUpdateEditField, handleUpdateToolName, handleStartEditCategory, handleStartEditPriceRow,
        handleDeleteTool, handleDeleteSubtype, handleAddSubtypeSubmit, handleMoveToolToPosition,
        hasCategoryChanges, hasPriceRowChanges,
    } = handlers;

    return (
        <div className="space-y-6">
                            <AdminFeatureToolbar
                                categories={['All', ...CATEGORY_ORDER]}
                                selectedCategory={selectedCategory}
                                onCategoryChange={category => {
                                    if (hasUnsavedChanges()) {
                                        alert('You have unsaved changes. Please save or cancel your edits first.');
                                        return;
                                    }
                                    setEditingCategory(null);
                                    setEditingPriceId(null);
                                    setSelectedCategory(category);
                                }}
                                search={priceSearch}
                                onSearchChange={setPriceSearch}
                                searchPlaceholder="Search tools, keys..."
                                addLabel="Add"
                                addOpen={showAddToolForm}
                                disabled={isOffline}
                                onAddToggle={() => {
                                    if (hasUnsavedChanges()) {
                                        alert('You have unsaved changes. Please save or cancel your edits first.');
                                        return;
                                    }
                                    setEditingCategory(null);
                                    setEditingPriceId(null);
                                    if (showAddToolForm) handleCloseAddToolForm();
                                    else setShowAddToolForm(true);
                                }}
                            />
        
                            {/* Add Tool Form Modal */}
                            {showAddToolForm && (
                                <AdminModalFrame title="Add New Tool" maxWidth="max-w-4xl" onClose={handleCloseAddToolForm}>
                                    <form onSubmit={handleAddToolSubmit} className="mt-4 p-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Tool Display Name</label>
                                                <input
                                                    type="text"
                                                    value={newToolDisplayName}
                                                    onChange={e => handleDisplayNameChange(e.target.value)}
                                                    placeholder="e.g. Fine Scissors"
                                                    className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Tool Database ID</label>
                                                <input
                                                    type="text"
                                                    value={newToolId}
                                                    onChange={e => setNewToolId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                    placeholder="e.g. fine-scissors"
                                                    className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                                    required
                                                />
                                            </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Category</label>
                                                    <div className="relative">
                                                        <select
                                                            value={newToolCategory}
                                                            onChange={e => setNewToolCategory(e.target.value)}
                                                            className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                                        >
                                                            {CATEGORY_ORDER.map(cat => (
                                                                <option key={cat} value={cat}>{cat}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Option</label>
                                                    <div className="relative">
                                                        <select
                                                            value={newToolType}
                                                            onChange={e => setNewToolType(e.target.value as ToolType)}
                                                            className="w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all"
                                                        >
                                                            <option value="checkbox">None</option>
                                                            <option value="radio">Subtype (Multiple choices)</option>
                                                            <option value="number-input">Input Value</option>
                                                        </select>
                                                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 dark:text-slate-555 block mt-1 leading-normal">
                                                        {newToolType === 'checkbox' && "• Renders as a simple toggle checkbox (e.g., Fibrin Glue)."}
                                                        {newToolType === 'radio' && "• Renders as multiple choice options (e.g., Constellation vs Stellaris)."}
                                                        {newToolType === 'number-input' && "• Renders with a counter input box (e.g., specifying 4 retractors)."}
                                                    </span>
                                                </div>
                                            </div>
                                        {newToolType === 'radio' ? (
                                            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8e5a7d] dark:text-[#fcb7f0]">Subtypes & Pricing</h4>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddSubtypeRow}
                                                        className="px-2 py-1 bg-[#fcb7f0]/20 hover:bg-[#fcb7f0]/40 text-[#8e5a7d] dark:text-[#fcb7f0] text-[10px] font-bold rounded transition-all border border-[#fcb7f0]/30 flex items-center gap-1"
                                                    >
                                                        <Plus size={10} />
                                                        Add Subtype Option
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {newToolSubtypes.map((st, idx) => (
                                                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-gray-50/50 dark:bg-slate-800/40 p-3 rounded-lg border border-gray-100 dark:border-slate-800 relative">
                                                            <div>
                                                                <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Subtype Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={st.displayName}
                                                                    onChange={e => handleUpdateSubtypeRow(idx, 'displayName', e.target.value)}
                                                                    placeholder="e.g. Constellation"
                                                                    className="w-full bg-white dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Subtype Key ID</label>
                                                                <input
                                                                    type="text"
                                                                    value={st.subKey}
                                                                    onChange={e => handleUpdateSubtypeRow(idx, 'subKey', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                                    placeholder="e.g. constellation"
                                                                    className="w-full bg-white dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 block mb-1">CSMBS Price (฿)</label>
                                                                <input
                                                                    type="number"
                                                                    value={st.csmbs}
                                                                    onChange={e => handleUpdateSubtypeRow(idx, 'csmbs', Number(e.target.value))}
                                                                    className="w-full bg-white dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200 font-mono"
                                                                    min="0"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 block mb-1">SSS Price (฿)</label>
                                                                <input
                                                                    type="number"
                                                                    value={st.sss}
                                                                    onChange={e => handleUpdateSubtypeRow(idx, 'sss', Number(e.target.value))}
                                                                    className="w-full bg-white dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200 font-mono"
                                                                    min="0"
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="flex items-end gap-2">
                                                                <div className="flex-1">
                                                                    <label className="text-[9px] font-bold text-gray-500 dark:text-slate-400 block mb-1">UCS Price (฿)</label>
                                                                    <input
                                                                        type="number"
                                                                        value={st.ucs}
                                                                        onChange={e => handleUpdateSubtypeRow(idx, 'ucs', Number(e.target.value))}
                                                                        className="w-full bg-white dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200 font-mono"
                                                                        min="0"
                                                                        required
                                                                    />
                                                                </div>
                                                                {newToolSubtypes.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveSubtypeRow(idx)}
                                                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded mb-0.5 transition-colors"
                                                                        title="Remove Subtype"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">CSMBS Price (฿)</label>
                                                    <input
                                                        type="number"
                                                        value={newToolCsmbs}
                                                        onChange={e => setNewToolCsmbs(Number(e.target.value))}
                                                        placeholder="0"
                                                        className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                                        min="0"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">SSS Price (฿)</label>
                                                    <input
                                                        type="number"
                                                        value={newToolSss}
                                                        onChange={e => setNewToolSss(Number(e.target.value))}
                                                        placeholder="0"
                                                        className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                                        min="0"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">UCS Price (฿)</label>
                                                    <input
                                                        type="number"
                                                        value={newToolUcs}
                                                        onChange={e => setNewToolUcs(Number(e.target.value))}
                                                        placeholder="0"
                                                        className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-250 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#fcb7f0] focus:border-[#fcb7f0] transition-all dark:text-slate-200"
                                                        min="0"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-slate-800">
                                                <button
                                                    type="button"
                                                    onClick={handleCloseAddToolForm}
                                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-lg transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                                            >
                                                <Save size={14} />
                                                Save Tool
                                            </button>
                                        </div>
                                    </form>
                                </AdminModalFrame>
                        )}
                            {/* Add Subtype Form Modal */}
                            {activeAddSubtypeTool && (
                                <AdminModalFrame title={`Add Subtype Option (Group: ${activeAddSubtypeTool.item})`} maxWidth="max-w-2xl" onClose={() => setActiveAddSubtypeTool(null)}>
                                        <form onSubmit={handleAddSubtypeSubmit} className="mt-4 p-4 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Group Name</label>
                                                    <input
                                                        type="text"
                                                        value={activeAddSubtypeTool.item}
                                                        disabled
                                                        className="w-full bg-gray-150 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-400 dark:text-slate-400 outline-none cursor-not-allowed"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Subtype Display Name</label>
                                                    <input
                                                        type="text"
                                                        value={newSubtypeDisplayName}
                                                        onChange={e => {
                                                            setNewSubtypeDisplayName(e.target.value);
                                                            if (!newSubtypeKey) {
                                                                setNewSubtypeKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
                                                            }
                                                        }}
                                                        placeholder="e.g. Centurion Active Sentry"
                                                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Subtype Key ID</label>
                                                    <input
                                                        type="text"
                                                        value={newSubtypeKey}
                                                        onChange={e => setNewSubtypeKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                        placeholder="e.g. active-sentry"
                                                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-all"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">CSMBS Price (฿)</label>
                                                    <input
                                                        type="number"
                                                        value={newSubtypeCsmbs}
                                                        onChange={e => setNewSubtypeCsmbs(Number(e.target.value))}
                                                        placeholder="0"
                                                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-all"
                                                        min="0"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">SSS Price (฿)</label>
                                                    <input
                                                        type="number"
                                                        value={newSubtypeSss}
                                                        onChange={e => setNewSubtypeSss(Number(e.target.value))}
                                                        placeholder="0"
                                                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-all"
                                                        min="0"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">UCS Price (฿)</label>
                                                    <input
                                                        type="number"
                                                        value={newSubtypeUcs}
                                                        onChange={e => setNewSubtypeUcs(Number(e.target.value))}
                                                        placeholder="0"
                                                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-all"
                                                        min="0"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-slate-800">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveAddSubtypeTool(null)}
                                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-350 text-xs font-bold rounded-lg transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                                                >
                                                    <Save size={14} />
                                                    Save Subtype
                                                </button>
                                            </div>
                                        </form>
                                </AdminModalFrame>
                            )}
        
                            {CATEGORY_ORDER.map(category => {
                                if (selectedCategory !== 'All' && category !== selectedCategory) {
                                    return null;
                                }
                                const items = categorizedPrices[category] || [];
                                if (items.length === 0) {
                                    if (priceSearch.trim()) return null;
                                    return (
                                        <section
                                            key={category}
                                            onDragOver={(e) => {
                                                if (draggedToolId && draggedCategory !== category && !editingPriceId && !editingCategory && !isOffline) {
                                                    e.preventDefault();
                                                    if (dragOverCategory !== category) {
                                                        setDragOverCategory(category);
                                                    }
                                                }
                                            }}
                                            onDragLeave={() => {
                                                if (dragOverCategory === category) {
                                                    setDragOverCategory(null);
                                                }
                                            }}
                                            onDrop={async (e) => {
                                                if (draggedToolId && draggedCategory !== category && !editingPriceId && !editingCategory && !isOffline) {
                                                    e.preventDefault();
                                                    await handleMoveToolToPosition(draggedToolId, 'end', draggedCategory!, category);
                                                }
                                                setDragOverCategory(null);
                                            }}
                                            className={`bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border p-4 sm:p-5 transition-all duration-300
                                                ${dragOverCategory === category 
                                                    ? 'border-[#fcb7f0] dark:border-pink-500/50 ring-2 ring-[#fcb7f0]/30 dark:ring-pink-500/20 bg-pink-50/10 dark:bg-pink-950/5' 
                                                    : 'border-gray-100 dark:border-slate-800'
                                                }
                                            `}
                                        >
                                            <div className="flex justify-between items-center -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-4 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20 rounded-t-2xl">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8e5a7d] dark:text-pink-400/80 flex items-center gap-2">
                                                    <span className="w-1.5 h-3 bg-[#fcb7f0] rounded-full"></span>
                                                    {(() => {
                                                        if (category.toLowerCase().includes('surgery')) return category;
                                                        if (category === 'Generals') return 'General Surgery';
                                                        return `${category} Surgery`;
                                                    })()}
                                                </h3>
                                            </div>
                                            <div className="border border-dashed border-gray-200 dark:border-slate-800/60 rounded-xl p-6 text-center text-xs text-gray-400 dark:text-slate-500 italic bg-gray-50/20 dark:bg-slate-900/10">
                                                No tools in this category. Drag a tool here to assign it.
                                            </div>
                                        </section>
                                    );
                                }
        
                                return (
                                        <section
                                            key={category}
                                            onDragOver={(e) => {
                                                if (draggedToolId && draggedCategory !== category && !editingPriceId && !editingCategory && !isOffline) {
                                                    e.preventDefault();
                                                    if (dragOverCategory !== category) {
                                                        setDragOverCategory(category);
                                                    }
                                                }
                                            }}
                                            onDragLeave={() => {
                                                if (dragOverCategory === category) {
                                                    setDragOverCategory(null);
                                                }
                                            }}
                                            onDrop={async (e) => {
                                                if (draggedToolId && draggedCategory !== category && !editingPriceId && !editingCategory && !isOffline) {
                                                    e.preventDefault();
                                                    await handleMoveToolToPosition(draggedToolId, 'end', draggedCategory!, category);
                                                }
                                                setDragOverCategory(null);
                                            }}
                                            className={`bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border p-4 sm:p-5 transition-all duration-300
                                                ${dragOverCategory === category 
                                                    ? 'border-[#fcb7f0] dark:border-pink-500/50 ring-2 ring-[#fcb7f0]/30 dark:ring-pink-500/20 bg-pink-50/10 dark:bg-pink-950/5' 
                                                    : 'border-gray-100 dark:border-slate-800'
                                                }
                                            `}
                                        >
                                            <div className="flex justify-between items-center -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-4 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20 rounded-t-2xl">
                                                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#8e5a7d] dark:text-[#fcb7f0] flex items-center gap-2">
                                                    <span className="w-1.5 h-3 bg-[#8e5a7d] dark:bg-[#fcb7f0] rounded-full"></span>
                                                    {(() => {
                                                        if (category.toLowerCase().includes('surgery')) return category;
                                                        if (category === 'Generals') return 'General Surgery';
                                                        return `${category} Surgery`;
                                                    })()}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    {editingCategory === category ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleSaveCategoryPrices(category)}
                                                                disabled={loading !== null}
                                                                className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
                                                                title="Save All"
                                                            >
                                                                <Save size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (hasCategoryChanges(category)) {
                                                                        const confirmCancel = window.confirm('Are you sure you want to discard your unsaved changes?');
                                                                        if (!confirmCancel) return;
                                                                    }
                                                                    setEditingCategory(null);
                                                                }}
                                                                disabled={loading !== null}
                                                                className="p-1 text-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50"
                                                                title="Cancel"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                if (hasUnsavedChanges()) {
                                                                    alert('You have unsaved changes. Please save or cancel your edits first.');
                                                                    return;
                                                                }
                                                                handleStartEditCategory(category);
                                                            }}
                                                            disabled={loading !== null || isOffline || editingPriceId !== null}
                                                            className="p-1 text-gray-500 hover:text-[#fcb7f0] disabled:opacity-30 disabled:hover:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                                            title="Edit category prices"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
        
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-[11px] sm:text-xs">
                                                    <thead>
                                                        <tr className="text-gray-400 dark:text-slate-500 border-b border-gray-50 dark:border-slate-800/50">
                                                            <th className="py-2 px-2 font-bold uppercase tracking-wider w-1/3">Tool Name</th>
                                                            <th className="py-2 px-2 font-bold uppercase tracking-wider w-24">Sub-key</th>
                                                            <th className="py-2 px-2 font-bold uppercase tracking-wider text-right">CSMBS</th>
                                                            <th className="py-2 px-2 font-bold uppercase tracking-wider text-right">SSS</th>
                                                            <th className="py-2 px-2 font-bold uppercase tracking-wider text-right">UCS</th>
                                                            <th className="py-2 px-2 font-bold uppercase tracking-wider text-center w-24">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800/30">
                                                        {items.map((price, idx) => {
                                                            const tool = config.tools.find(t => t.id === price.tool_id);
                                                            const isEditingRow = (editingCategory === category) || (editingPriceId === price.id);
                                                             const isFirstOccurrence = items.findIndex(item => item.tool_id === price.tool_id) === idx;
                                                             const isLastOccurrence = (() => {
                                                                 let lastIdx = -1;
                                                                 for (let i = items.length - 1; i >= 0; i--) {
                                                                     if (items[i].tool_id === price.tool_id) {
                                                                         lastIdx = i;
                                                                         break;
                                                                     }
                                                                 }
                                                                 return lastIdx === idx;
                                                             })();
                                                             // New/Reuse is a reusable-option capability, not a subtype group.
                                                             // A reusable tool must retain normal tool-level drag/reorder behavior.
                                                             const hasReusableOption = tool?.options?.some(o => o.value === NEW_REUSED_OPTIONS.NEW || o.value === NEW_REUSED_OPTIONS.REUSED) ?? false;
                                                             const toolPricesCount = items.filter(item => item.tool_id === price.tool_id).length;
                                                             const hasSubtypeOptions = (tool?.type === 'radio' && (tool.options || []).some(option => option.value !== NEW_REUSED_OPTIONS.NEW && option.value !== NEW_REUSED_OPTIONS.REUSED)) ?? false;
                                                             // Keep the group header for a true subtype tool even when only one
                                                             // subtype remains after deleting the others.
                                                             const hasSubtypes = !hasReusableOption && (hasSubtypeOptions || toolPricesCount > 1);
                                                             const isSubtypeTool = !hasReusableOption && (hasSubtypeOptions || hasSubtypes);
                                                             const showGroupHeader = hasSubtypes && isFirstOccurrence && (editingCategory === category);
                                                            const rowData = editPricesData[price.id] || {
                                                                displayName: price.display_name || getToolDisplayName(price.tool_id, tool ? tool.item : price.tool_id, price.sub_key),
                                                                csmbs: price.csmbs_price,
                                                                sss: price.sss_price,
                                                                ucs: price.ucs_price
                                                            };
        
                                                            return (
                                                                <React.Fragment key={price.id}>
                                                                     {showGroupHeader && (
                                                                         <tr
                                                                             key={`group-header-${price.tool_id}`}
                                                                             className="transition-all duration-200 bg-[#fcb7f0]/5 dark:bg-[#fcb7f0]/10 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 font-bold text-xs text-gray-800 dark:text-slate-200"
                                                                             draggable={editingCategory === category && !isOffline}
                                                                             onDragStart={(e) => {
                                                                                 setDraggedToolId(price.tool_id);
                                                                                 setDraggedCategory(category);
                                                                                 e.dataTransfer.effectAllowed = 'move';
                                                                             }}
                                                                             onDragOver={(e) => {
                                                                                 e.preventDefault();
                                                                                 if (draggedToolId && draggedToolId !== price.tool_id) {
                                                                                     if (dragOverToolId !== price.tool_id) {
                                                                                         setDragOverToolId(price.tool_id);
                                                                                     }
                                                                                 }
                                                                             }}
                                                                             onDrop={(e) => {
                                                                                 e.preventDefault();
                                                                                 if (draggedToolId && draggedToolId !== price.tool_id) {
                                                                                     e.stopPropagation();
                                                                                     handleMoveToolToPosition(draggedToolId, price.tool_id, draggedCategory!, category);
                                                                                 }
                                                                                 setDraggedToolId(null);
                                                                                 setDraggedCategory(null);
                                                                                 setDragOverToolId(null);
                                                                                 setDragOverCategory(null);
                                                                             }}
                                                                             onDragEnd={() => {
                                                                                 setDraggedToolId(null);
                                                                                 setDraggedCategory(null);
                                                                                 setDragOverToolId(null);
                                                                                 setDragOverCategory(null);
                                                                             }}
                                                                         >
                                                                             <td className="py-3 px-3" colSpan={2}>
                                                                                 <div className="flex items-center gap-2">
                                                                                     <Menu
                                                                                         size={14}
                                                                                         className="text-gray-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-[#fcb7f0] transition-colors shrink-0"
                                                                                         title="Drag to reorder tool group"
                                                                                     />
                                                                                     {editingCategory === category ? (
                                                                                         <input
                                                                                             type="text"
                                                                                             value={editToolNames[price.tool_id] ?? (tool ? tool.item : price.tool_id)}
                                                                                             onChange={e => handleUpdateToolName(price.tool_id, e.target.value)}
                                                                                             className="w-full max-w-sm px-2 py-1 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-colors"
                                                                                             aria-label={`Edit ${tool ? tool.item : price.tool_id} name`}
                                                                                         />
                                                                                     ) : (
                                                                                         <span className="font-extrabold text-gray-800 dark:text-slate-200 tracking-wide text-[10px]">
                                                                                             {tool ? tool.item : price.tool_id}
                                                                                         </span>
                                                                                     )}
                                                                                 </div>
                                                                             </td>
                                                                             <td className="py-3 px-2 text-right font-mono"></td>
                                                                             <td className="py-3 px-2 text-right font-mono"></td>
                                                                             <td className="py-3 px-2 text-right font-mono"></td>
                                                                             <td className="py-3 px-2 text-center">
                                                                                 <div className="flex items-center justify-center gap-1.5">
                                                                                     <div
                                                                                         className={`relative p-1 text-[#8e5a7d] hover:text-[#734464] hover:bg-[#fcb7f0]/10 dark:text-[#fcb7f0] rounded transition-all flex items-center justify-center ${loading !== null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                                         title="Move tool group category"
                                                                                     >
                                                                                         <FolderSymlink size={13} />
                                                                                         <select
                                                                                             value="move"
                                                                                             disabled={loading !== null || isOffline}
                                                                                             onChange={async e => {
                                                                                                 if (e.target.value !== 'move') {
                                                                                                     await handleMoveToolToPosition(price.tool_id, 'end', category, e.target.value);
                                                                                                 }
                                                                                             }}
                                                                                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                                                         >
                                                                                             <option value="move" disabled hidden>Move</option>
                                                                                             {CATEGORY_ORDER.map(cat => <option key={cat} value={cat} disabled={cat === category}>{cat}</option>)}
                                                                                         </select>
                                                                                     </div>
                                                                                     <button
                                                                                         type="button"
                                                                                         onClick={() => handleDeleteTool(price.tool_id)}
                                                                                         disabled={loading !== null || isOffline}
                                                                                         className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
                                                                                         title="Delete entire tool group"
                                                                                     >
                                                                                         <Trash2 size={13} />
                                                                                     </button>
                                                                                 </div>
                                                                             </td>
                                                                         </tr>
                                                                     )}
                                                                    <tr
                                                                        key={price.id}
                                                                    draggable={isEditingRow && !isOffline && !isSubtypeTool}
                                                                    onDragStart={(e) => {
                                                                         if (isSubtypeTool) return;
                                                                        setDraggedToolId(price.tool_id);
                                                                        setDraggedCategory(category);
                                                                        e.dataTransfer.effectAllowed = 'move';
                                                                    }}
                                                                    onDragOver={(e) => {
                                                                        e.preventDefault();
                                                                        if (draggedToolId && draggedToolId !== price.tool_id) {
                                                                            if (dragOverToolId !== price.tool_id) {
                                                                                setDragOverToolId(price.tool_id);
                                                                            }
                                                                        }
                                                                    }}
                                                                    onDrop={(e) => {
                                                                        e.preventDefault();
                                                                        if (draggedToolId && draggedToolId !== price.tool_id) {
                                                                            e.stopPropagation();
                                                                            handleMoveToolToPosition(draggedToolId, price.tool_id, draggedCategory!, category);
                                                                        }
                                                                        setDraggedToolId(null);
                                                                        setDraggedCategory(null);
                                                                        setDragOverToolId(null);
                                                                        setDragOverCategory(null);
                                                                    }}
                                                                    onDragEnd={() => {
                                                                        setDraggedToolId(null);
                                                                        setDraggedCategory(null);
                                                                        setDragOverToolId(null);
                                                                        setDragOverCategory(null);
                                                                    }}
                                                                    className={`
                                                                        transition-all duration-200
                                                                        ${draggedToolId === price.tool_id ? 'opacity-30 bg-gray-100 dark:bg-slate-800/40' : ''}
                                                                        ${dragOverToolId === price.tool_id ? 'bg-[#fcb7f0]/10 dark:bg-[#fcb7f0]/5' : ''}
                                                                        ${isEditingRow
                                                                            ? (isSubtypeTool ? 'bg-[#8e5a7d]/5 dark:bg-slate-800/60' : 'bg-[#fcb7f0]/5 dark:bg-[#fcb7f0]/10')
                                                                            : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/30'}
                                                                    `}
                                                                >
                                                                    <td className="py-3 px-2">
                                                                        <div className="flex items-center gap-2">
                                                                            {isEditingRow && (
                                                                                (isFirstOccurrence && !isSubtypeTool) ? (
                                                                                    <Menu
                                                                                        size={14}
                                                                                        className="text-gray-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-[#fcb7f0] transition-colors shrink-0"
                                                                                        title="Drag to reorder tool"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-3.5 shrink-0" />
                                                                                )
                                                                            )}
                                                                            {isEditingRow ? (
                                                                                <div className="flex flex-col gap-1.5 w-full">
                                                                                    <div className="flex items-center gap-1.5 w-full">
                                                                                        {editingCategory === category && price.sub_key && !hasReusableOption && (
                                                                                            <span className="text-gray-400 dark:text-slate-600 font-mono select-none pl-1 shrink-0">
                                                                                                └─
                                                                                            </span>
                                                                                        )}
                                                                                        <input
                                                                                            type="text"
                                                                                            value={rowData.displayName}
                                                                                            onChange={e => handleUpdateEditField(price.id, 'displayName', e.target.value, price, tool)}
                                                                                            className="w-full px-2 py-1 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-colors"
                                                                                            placeholder="Display Name"
                                                                                        />
                                                                                    </div>
                                                                                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-mono pl-1">
                                                                                        ID: {price.tool_id}
                                                                                    </span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-bold text-gray-900 dark:text-slate-200">
                                                                                        {price.display_name || getToolDisplayName(price.tool_id, tool ? tool.item : price.tool_id, price.sub_key)}
                                                                                    </span>
                                                                                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-mono">
                                                                                        Db Item: {tool ? tool.item : price.tool_id}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-2">
                                                                        {price.sub_key ? (
                                                                            <span className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                                                {price.sub_key}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-400 dark:text-slate-600 italic">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-2 text-right">
                                                                        {isEditingRow ? (
                                                                            <input
                                                                                type="number"
                                                                                value={rowData.csmbs}
                                                                                onChange={e => handleUpdateEditField(price.id, 'csmbs', Number(e.target.value), price, tool)}
                                                                                className="w-16 sm:w-20 text-right px-2 py-1 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-colors"
                                                                            />
                                                                        ) : (
                                                                            <span className="font-mono font-semibold text-gray-900 dark:text-slate-200">
                                                                                {price.csmbs_price.toLocaleString()}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-2 text-right">
                                                                        {isEditingRow ? (
                                                                            <input
                                                                                type="number"
                                                                                value={rowData.sss}
                                                                                onChange={e => handleUpdateEditField(price.id, 'sss', Number(e.target.value), price, tool)}
                                                                                className="w-16 sm:w-20 text-right px-2 py-1 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-colors"
                                                                            />
                                                                        ) : (
                                                                            <span className="font-mono font-semibold text-gray-900 dark:text-slate-200">
                                                                                {price.sss_price.toLocaleString()}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-2 text-right">
                                                                        {isEditingRow ? (
                                                                            <input
                                                                                type="number"
                                                                                value={rowData.ucs}
                                                                                onChange={e => handleUpdateEditField(price.id, 'ucs', Number(e.target.value), price, tool)}
                                                                                className="w-16 sm:w-20 text-right px-2 py-1 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-[#fcb7f0] text-gray-900 dark:text-slate-200 transition-colors"
                                                                            />
                                                                        ) : (
                                                                            <span className="font-mono font-semibold text-gray-900 dark:text-slate-200">
                                                                                {price.ucs_price.toLocaleString()}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-2 text-center">
                                                                        {isEditingRow ? (
                                                                            editingCategory === category ? (
                                                                                <div className="flex items-center justify-center gap-1.5">
                                                                                    <div 
                                                                                        className={`${isSubtypeTool ? 'hidden' : ''} relative p-1 text-[#8e5a7d] hover:text-[#734464] hover:bg-[#fcb7f0]/10 dark:text-[#fcb7f0] dark:hover:text-[#f78de3] dark:hover:bg-[#fcb7f0]/5 rounded transition-all flex items-center justify-center ${
                                                                                            (loading !== null)
                                                                                                ? 'opacity-50 cursor-not-allowed'
                                                                                                : 'cursor-pointer'
                                                                                        }`}
                                                                                        title="Move Category"
                                                                                    >
                                                                                        <FolderSymlink size={13} />
                                                                                        <select
                                                                                            value="move"
                                                                                            disabled={loading !== null || isOffline}
                                                                                            onChange={async (e) => {
                                                                                                const newCat = e.target.value;
                                                                                                if (newCat !== "move") {
                                                                                                    await handleMoveToolToPosition(price.tool_id, 'end', category, newCat);
                                                                                                }
                                                                                            }}
                                                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                                                        >
                                                                                            <option value="move" disabled hidden>Move</option>
                                                                                            {CATEGORY_ORDER.map(cat => (
                                                                                                <option key={cat} value={cat} disabled={cat === category}>
                                                                                                    {cat}
                                                                                                </option>
                                                                                            ))}
                                                                                        </select>
                                                                                    </div>
                                                                                    {price.sub_key ? (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleDeleteSubtype(price)}
                                                                                            disabled={loading !== null || isOffline}
                                                                                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
                                                                                            title={`Delete Subtype "${price.sub_key}"`}
                                                                                        >
                                                                                            <Trash2 size={13} />
                                                                                        </button>
                                                                                    ) : (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleDeleteTool(price.tool_id)}
                                                                                            disabled={loading !== null || isOffline}
                                                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
                                                                                            title="Delete Tool"
                                                                                        >
                                                                                            <Trash2 size={13} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center justify-center gap-1.5">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleSavePriceRow(price.id)}
                                                                                        disabled={loading !== null}
                                                                                        className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                                                                                        title="Save"
                                                                                    >
                                                                                        <Save size={13} />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            if (hasPriceRowChanges(price.id)) {
                                                                                                const confirmCancel = window.confirm('Are you sure you want to discard your unsaved changes?');
                                                                                                if (!confirmCancel) return;
                                                                                            }
                                                                                            setEditingPriceId(null);
                                                                                        }}
                                                                                        disabled={loading !== null}
                                                                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                                                        title="Cancel"
                                                                                    >
                                                                                        <X size={13} />
                                                                                    </button>
                                                                                    <div 
                                                                                        className={`${isSubtypeTool ? 'hidden' : ''} relative p-1 text-[#8e5a7d] hover:text-[#734464] hover:bg-[#fcb7f0]/10 dark:text-[#fcb7f0] dark:hover:text-[#f78de3] dark:hover:bg-[#fcb7f0]/5 rounded transition-all flex items-center justify-center ${
                                                                                            (loading !== null)
                                                                                                ? 'opacity-50 cursor-not-allowed'
                                                                                                : 'cursor-pointer'
                                                                                        }`}
                                                                                        title="Move Category"
                                                                                    >
                                                                                        <FolderSymlink size={13} />
                                                                                        <select
                                                                                            value="move"
                                                                                            disabled={loading !== null || isOffline}
                                                                                            onChange={async (e) => {
                                                                                                const newCat = e.target.value;
                                                                                                if (newCat !== "move") {
                                                                                                    await handleMoveToolToPosition(price.tool_id, 'end', category, newCat);
                                                                                                    setEditingPriceId(null);
                                                                                                }
                                                                                            }}
                                                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                                                        >
                                                                                            <option value="move" disabled hidden>Move</option>
                                                                                            {CATEGORY_ORDER.map(cat => (
                                                                                                <option key={cat} value={cat} disabled={cat === category}>
                                                                                                    {cat}
                                                                                                </option>
                                                                                            ))}
                                                                                        </select>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        ) : (
                                                                            <div className="flex items-center justify-center gap-1.5">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        if (hasUnsavedChanges()) {
                                                                                            alert('You have unsaved changes. Please save or cancel your edits first.');
                                                                                            return;
                                                                                        }
                                                                                        handleStartEditPriceRow(price);
                                                                                    }}
                                                                                    disabled={isOffline || editingPriceId !== null || editingCategory !== null}
                                                                                    className="p-1 text-gray-500 hover:text-[#fcb7f0] dark:text-slate-400 dark:hover:text-[#fcb7f0] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all"
                                                                                    title="Edit tool prices"
                                                                                >
                                                                                    <Edit size={13} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                                </React.Fragment>
                                                        );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                    );
                                })
                            }
        
                            {priceSearch.trim() && Object.keys(categorizedPrices).filter(cat => selectedCategory === 'All' || cat === selectedCategory).every(cat => categorizedPrices[cat].length === 0) && (
                                <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center text-gray-400 dark:text-slate-500 italic text-xs">
                                    No tools found matching search term "{priceSearch}"
                                </div>
                            )}
                        </div>
    );
}

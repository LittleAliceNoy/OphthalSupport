import React from 'react';
import {
    Plus,
    Trash2,
    Edit,
    Save,
    X,
    UserCheck,
    RotateCcw,
    Shield,
    ChevronDown
} from 'lucide-react';
import { DBAction, DBOperation, DBRule, DBTool } from '../../configService';
import { AdminRulesHook } from './hooks/useAdminRules';
import { PREFERENCE_TOOL_OPTIONS, SurgeonPreference } from './adminRulesCatalog';
import type { SurgeonGroups } from '../../domain/toolTypes';
import SurgeonGroupsEditor from './SurgeonGroupsEditor';
import ActionsTable from './ActionsTable';
import ReusableToolsEditor from './ReusableToolsEditor';

interface AdminRulesPageProps {
    config: { tools: DBTool[]; actions: DBAction[]; operations: DBOperation[]; rules: DBRule[] };
    isOffline: boolean;
    rulesHook: AdminRulesHook;
}

export default function AdminRulesPage({ config, isOffline, rulesHook }: AdminRulesPageProps) {
    const {
        actionsState,
        actionsHandlers,
        surgeonsState,
        surgeonsHandlers,
        reusableToolsState,
        reusableToolsHandlers,
    } = rulesHook;

    const {
        showAddActionModal,
        newActionId,
        newActionItem,
        newActionActive,
        editingActionId,
        editActionItem,
        editActionActive,
        filteredActions,
    } = actionsState;

    const {
        handleOpenAddModal,
        handleCloseAddModal,
        setNewActionId,
        handleNewActionItemChange,
        setNewActionActive,
        handleCreateAction,
        handleStartEditAction,
        handleCancelEditAction,
        setEditActionItem,
        setEditActionActive,
        handleSaveEditAction,
        handleSetActionActive,
        handleDeleteAction,
    } = actionsHandlers;

    const {
        surgeonPreferences,
        showAddPrefModal,
        newPrefSurgeon,
        newPrefTool,
        newPrefValue,
        editingPrefId,
        editPrefSurgeon,
        editPrefTool,
        editPrefValue,
        centurionSurgeons,
        newSurgeonName,
        surgeonGroups,
        isEditingSurgeonGroups,
        editSurgeonGroupsText,
        newSurgeonGroupName,
        addingSurgeonGroup,
        isEditingSurgeonPrefs,
        editSurgeonPrefsList,
    } = surgeonsState;

    const {
        setShowAddPrefModal,
        setNewPrefSurgeon,
        setNewPrefTool,
        setNewPrefValue,
        handleCreatePreference,
        handleCloseAddPrefModal,
        handleStartEditPref,
        handleCancelEditPref,
        setEditPrefSurgeon,
        setEditPrefTool,
        setEditPrefValue,
        handleSaveEditPref,
        handleDeletePref,
        setNewSurgeonName,
        handleAddCenturionSurgeon,
        handleRemoveCenturionSurgeon,
        handleStartEditSurgeonGroups,
        handleCancelEditSurgeonGroups,
        setEditSurgeonGroupsText,
        setNewSurgeonGroupName,
        handleStartAddingSurgeon,
        handleCancelAddingSurgeon,
        handleAddSurgeonToGroup,
        handleRemoveSurgeonFromGroup,
        handleSaveSurgeonGroups,
        handleStartEditSurgeonPrefs,
        handleCancelEditSurgeonPrefs,
        handleSaveSurgeonPrefs,
        handleAddPrefRowInEdit,
        handleRemovePrefRowInEdit,
        handleUpdatePrefRowInEdit,
    } = surgeonsHandlers;

    const {
        reusableTools,
        availableExistingTools,
        showAddReusableToolModal,
        selectedExistingToolId,
        isEditingReusableTools,
    } = reusableToolsState;
    const {
        handleUpdateToolDefault,
        setShowAddReusableToolModal,
        setSelectedExistingToolId,
        handleAddExistingToolAsReusable,
        handleRemoveReusableTool,
        handleStartEditReusableTools,
        handleCancelEditReusableTools,
    } = reusableToolsHandlers;

    const availableSurgeons = React.useMemo(() => {
        const set = new Set<string>();
        Object.values(surgeonGroups as SurgeonGroups).forEach(names => {
            names.forEach(name => set.add(name));
        });
        return Array.from(set).sort();
    }, [surgeonGroups]);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* CARD 1: SURGEON GROUP (Editable, styled with category header bar) */}
            <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-5 transition-all duration-300">
                <div className="flex justify-between items-center -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-4 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20 rounded-t-2xl">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#8e5a7d] dark:text-[#fcb7f0] flex items-center gap-2">
                        <span className="w-1.5 h-3 bg-[#8e5a7d] dark:bg-[#fcb7f0] rounded-full"></span>
                        Surgeon group
                    </h3>

                    {isEditingSurgeonGroups ? (
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleSaveSurgeonGroups}
                                className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                                title="Save surgeon groups"
                            >
                                <Save size={13} />
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelEditSurgeonGroups}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Cancel"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleStartEditSurgeonGroups}
                            disabled={isOffline}
                            className="p-1 text-gray-500 hover:text-[#fcb7f0] dark:text-slate-400 dark:hover:text-[#fcb7f0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Edit surgeon groups"
                        >
                            <Edit size={13} />
                        </button>
                    )}
                </div>

                <SurgeonGroupsEditor
                    groups={surgeonGroups}
                    isEditing={isEditingSurgeonGroups}
                    editedGroups={editSurgeonGroupsText}
                    newSurgeonName={newSurgeonGroupName}
                    addingGroup={addingSurgeonGroup}
                    onNewSurgeonNameChange={setNewSurgeonGroupName}
                    onStartAdding={handleStartAddingSurgeon}
                    onCancelAdding={handleCancelAddingSurgeon}
                    onAdd={handleAddSurgeonToGroup}
                    onRemove={handleRemoveSurgeonFromGroup}
                />
            </div>



            {/* CARD 2: SURGEON PREFERENCES (Table Design - Compact) */}
            <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-3.5 sm:p-4 transition-all duration-300">
                <div className="flex justify-between items-center -mx-3.5 sm:-mx-4 -mt-3.5 sm:-mt-4 mb-2.5 px-3.5 sm:px-4 py-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20 rounded-t-2xl">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#8e5a7d] dark:text-[#fcb7f0] flex items-center gap-2">
                        <span className="w-1.5 h-3 bg-[#8e5a7d] dark:bg-[#fcb7f0] rounded-full"></span>
                        Surgeon preference
                    </h3>
                    {isEditingSurgeonPrefs ? (
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleSaveSurgeonPrefs}
                                className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                                title="Save preferences"
                            >
                                <Save size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelEditSurgeonPrefs}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Cancel"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            disabled={isOffline}
                            onClick={handleStartEditSurgeonPrefs}
                            className="p-1 text-gray-500 hover:text-[#fcb7f0] dark:text-slate-400 dark:hover:text-[#fcb7f0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Edit surgeon preferences"
                        >
                            <Edit size={14} />
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-slate-800/80 text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                                <th className="py-1.5 px-2.5 min-w-[120px]">Surgeon</th>
                                <th className="py-1.5 px-2.5 min-w-[160px]">TOOLS</th>
                                <th className="py-1.5 px-2.5 min-w-[100px]">Value</th>
                                {isEditingSurgeonPrefs && (
                                    <th className="py-1.5 px-2.5 text-center w-12">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-xs">
                            {!isEditingSurgeonPrefs ? (
                                surgeonPreferences.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-3 text-center text-gray-400 italic text-xs">
                                            No surgeon preferences configured.
                                        </td>
                                    </tr>
                                ) : (
                                    surgeonPreferences.map((pref: SurgeonPreference) => (
                                        <tr key={pref.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-1.5 px-2.5 font-semibold text-gray-900 dark:text-white">
                                                {pref.surgeon}
                                            </td>
                                            <td className="py-1.5 px-2.5 text-gray-700 dark:text-slate-300 font-medium">
                                                {pref.tool}
                                            </td>
                                            <td className="py-1.5 px-2.5 text-gray-900 dark:text-white font-medium">
                                                {pref.value}
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                editSurgeonPrefsList.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-3 text-center text-gray-400 italic text-xs">
                                            No surgeon preferences. Click "+ Add Preference" below to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    editSurgeonPrefsList.map((pref: SurgeonPreference, idx: number) => (
                                        <tr key={pref.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            {/* Column 1: Surgeon Dropdown */}
                                            <td className="py-1.5 px-2.5">
                                                <div className="relative">
                                                    <select
                                                        value={pref.surgeon}
                                                        onChange={e => handleUpdatePrefRowInEdit(idx, 'surgeon', e.target.value)}
                                                        className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#fcb7f0] transition-all"
                                                    >
                                                        <option value="">-- Select Surgeon --</option>
                                                        {availableSurgeons.map(s => <option key={s} value={s}>{s}</option>)}
                                                        {!availableSurgeons.includes(pref.surgeon) && pref.surgeon && (
                                                            <option value={pref.surgeon}>{pref.surgeon}</option>
                                                        )}
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                                </div>
                                            </td>

                                            {/* Column 2: Tools Dropdown */}
                                            <td className="py-1.5 px-2.5">
                                                <div className="relative">
                                                    <select
                                                        value={pref.tool}
                                                        onChange={e => {
                                                            const selectedTool = e.target.value;
                                                            const opts = PREFERENCE_TOOL_OPTIONS[selectedTool];
                                                            const newValue = (Array.isArray(opts) && opts.length > 0) ? opts[0] : '';
                                                            handleUpdatePrefRowInEdit(idx, 'tool', selectedTool);
                                                            handleUpdatePrefRowInEdit(idx, 'value', newValue);
                                                        }}
                                                        className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#fcb7f0] transition-all"
                                                    >
                                                        {Object.keys(PREFERENCE_TOOL_OPTIONS).map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                        {!Object.keys(PREFERENCE_TOOL_OPTIONS).includes(pref.tool) && pref.tool && (
                                                            <option value={pref.tool}>{pref.tool}</option>
                                                        )}
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                                </div>
                                            </td>

                                            {/* Column 3: Value Dropdown or Input */}
                                            <td className="py-1.5 px-2.5">
                                                {Array.isArray(PREFERENCE_TOOL_OPTIONS[pref.tool]) ? (
                                                    <div className="relative">
                                                        <select
                                                            value={pref.value}
                                                            onChange={e => handleUpdatePrefRowInEdit(idx, 'value', e.target.value)}
                                                            className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#fcb7f0] transition-all"
                                                        >
                                                            {PREFERENCE_TOOL_OPTIONS[pref.tool]!.map(v => (
                                                                <option key={v} value={v}>{v}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 12, 13, 14"
                                                        value={pref.value}
                                                        onChange={e => handleUpdatePrefRowInEdit(idx, 'value', e.target.value)}
                                                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#fcb7f0] font-mono transition-all"
                                                    />
                                                )}
                                            </td>

                                            {/* Column 4: Actions */}
                                            <td className="py-1.5 px-2.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePrefRowInEdit(idx)}
                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                                                    title="Remove preference"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add Preference Button (Only visible in edit state at the bottom) */}
                {isEditingSurgeonPrefs && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-start">
                        <button
                            type="button"
                            onClick={() => handleAddPrefRowInEdit(availableSurgeons[0] || '')}
                            className="px-3 py-1 bg-[#8e5a7d] hover:bg-[#7a4b6b] dark:bg-[#fcb7f0] dark:hover:bg-[#f39ae4] text-white dark:text-slate-900 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                        >
                            <Plus size={13} />
                            Add Preference
                        </button>
                    </div>
                )}
            </div>

            <ReusableToolsEditor
                tools={reusableTools}
                isEditing={isEditingReusableTools}
                isOffline={isOffline}
                onStartEdit={handleStartEditReusableTools}
                onCancelEdit={handleCancelEditReusableTools}
                onRemove={handleRemoveReusableTool}
                onAdd={() => setShowAddReusableToolModal(true)}
            />

            {/* CARD 4: PRE-OPERATIVE ACTIONS TABLE */}
            <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-5 transition-all duration-300">
                <div className="flex justify-between items-center -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-4 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20 rounded-t-2xl">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#8e5a7d] dark:text-[#fcb7f0] flex items-center gap-2">
                        <span className="w-1.5 h-3 bg-[#8e5a7d] dark:bg-[#fcb7f0] rounded-full"></span>
                        Pre-operative actions
                    </h3>
                    <button
                        disabled={isOffline}
                        onClick={handleOpenAddModal}
                        className="px-3 py-1.5 bg-[#8e5a7d] hover:bg-[#7a4b6b] dark:bg-[#fcb7f0] dark:hover:bg-[#f39ae4] text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <Plus size={14} />
                        Add Action
                    </button>
                </div>

                <ActionsTable
                    actions={filteredActions}
                    isOffline={isOffline}
                    editingActionId={editingActionId}
                    editActionItem={editActionItem}
                    editActionActive={editActionActive}
                    onEditActionItemChange={setEditActionItem}
                    onEditActionActiveChange={setEditActionActive}
                    onSetActionActive={handleSetActionActive}
                    onStartEdit={handleStartEditAction}
                    onSaveEdit={handleSaveEditAction}
                    onCancelEdit={handleCancelEditAction}
                    onDelete={action => handleDeleteAction(action.id, action.item)}
                />
            </div>

            {/* ADD PRE-OP ACTION MODAL */}
            {showAddActionModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fadeIn p-4">
                    <div className="bg-white dark:bg-[#151f32] w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus size={16} className="text-[#8e5a7d] dark:text-[#fcb7f0]" />
                                Add New Pre-Op Action
                            </h3>
                            <button onClick={handleCloseAddModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAction} className="p-4 space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Action Title
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Cornea Topography"
                                    value={newActionItem}
                                    onChange={e => handleNewActionItemChange(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Action ID (Unique Slug Key)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. cornea-topography"
                                    value={newActionId}
                                    onChange={e => setNewActionId(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none font-mono"
                                    required
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Auto-generated from title. Lowercase letters, numbers, and hyphens only.</p>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Initial Status
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setNewActionActive(!newActionActive)}
                                    className={`relative inline-flex items-center h-[22px] rounded-full transition-all duration-300 select-none p-0.5 w-[72px] shrink-0 shadow-sm border ${
                                        newActionActive
                                            ? 'bg-[#FF9666] border-[#FF9666]'
                                            : 'bg-[#475569] dark:bg-[#334155] border-[#475569] dark:border-[#334155]'
                                    } cursor-pointer hover:opacity-95`}
                                >
                                    {newActionActive ? (
                                        <div className="flex items-center justify-between w-full">
                                            <span className="w-4 h-4 bg-white rounded-full shadow-md shrink-0" />
                                            <span className="flex-1 text-center text-[9px] font-black tracking-tight text-white uppercase pr-0.5">
                                                Active
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <span className="flex-1 text-center text-[9px] font-black tracking-tight text-slate-200 dark:text-slate-200 uppercase pl-0.5">
                                                Inactive
                                            </span>
                                            <span className="w-4 h-4 bg-white rounded-full shadow-md shrink-0" />
                                        </div>
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={handleCloseAddModal}
                                    className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    <Save size={14} />
                                    Save Action
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD SURGEON PREFERENCE MODAL */}
            {showAddPrefModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fadeIn p-4">
                    <div className="bg-white dark:bg-[#151f32] w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus size={16} className="text-[#8e5a7d] dark:text-[#fcb7f0]" />
                                Add Surgeon Preference
                            </h3>
                            <button onClick={handleCloseAddPrefModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePreference} className="p-4 space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Surgeon Name
                                </label>
                                <div className="relative">
                                    <select
                                        value={newPrefSurgeon}
                                        onChange={e => setNewPrefSurgeon(e.target.value)}
                                        className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#fcb7f0] transition-all"
                                        required
                                    >
                                        <option value="">-- Select Surgeon --</option>
                                        {availableSurgeons.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Tool / Subtool
                                </label>
                                <div className="relative">
                                    <select
                                        value={newPrefTool}
                                        onChange={e => {
                                            const selectedTool = e.target.value;
                                            setNewPrefTool(selectedTool);
                                            const opts = PREFERENCE_TOOL_OPTIONS[selectedTool];
                                            if (Array.isArray(opts) && opts.length > 0) {
                                                setNewPrefValue(opts[0]);
                                            } else {
                                                setNewPrefValue('');
                                            }
                                        }}
                                        className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#fcb7f0] transition-all"
                                        required
                                    >
                                        {Object.keys(PREFERENCE_TOOL_OPTIONS).map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Preferred Value
                                </label>
                                {Array.isArray(PREFERENCE_TOOL_OPTIONS[newPrefTool]) ? (
                                    <div className="relative">
                                        <select
                                            value={newPrefValue}
                                            onChange={e => setNewPrefValue(e.target.value)}
                                            className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#fcb7f0] transition-all"
                                            required
                                        >
                                            {PREFERENCE_TOOL_OPTIONS[newPrefTool]!.map(v => (
                                                <option key={v} value={v}>{v}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="e.g. 12, 13, 14"
                                        value={newPrefValue}
                                        onChange={e => setNewPrefValue(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#fcb7f0] font-mono transition-all"
                                        required
                                    />
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={handleCloseAddPrefModal}
                                    className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    <Save size={14} />
                                    Save Preference
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD REUSABLE TOOL MODAL */}
            {showAddReusableToolModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fadeIn p-4">
                    <div className="bg-white dark:bg-[#151f32] w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus size={16} className="text-[#8e5a7d] dark:text-[#fcb7f0]" />
                                Add Reusable Tool
                            </h3>
                            <button onClick={() => setShowAddReusableToolModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddExistingToolAsReusable} className="p-4 space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Select Existing Tool
                                </label>
                                {availableExistingTools.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-2">
                                        All existing tools are already marked as reusable.
                                    </p>
                                ) : (
                                    <div className="relative">
                                        <select
                                            value={selectedExistingToolId}
                                            onChange={e => setSelectedExistingToolId(e.target.value)}
                                            className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#fcb7f0] transition-all"
                                            required
                                        >
                                            <option value="">-- Select Existing Tool --</option>
                                            {availableExistingTools.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.item} {t.category ? `(${t.category})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAddReusableToolModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={availableExistingTools.length === 0 || !selectedExistingToolId}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    <Save size={14} />
                                    Save Tool
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

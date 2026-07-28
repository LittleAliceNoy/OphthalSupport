import React from 'react';
import { Edit, Save, Trash2, X } from 'lucide-react';
import { DBAction } from '../../configService';

interface ActionsTableProps {
    actions: DBAction[];
    isOffline: boolean;
    editingActionId: string | null;
    editActionItem: string;
    editActionActive: boolean;
    onEditActionItemChange: (value: string) => void;
    onEditActionActiveChange: (value: boolean) => void;
    onSetActionActive: (action: DBAction, status: boolean) => void;
    onStartEdit: (action: DBAction) => void;
    onSaveEdit: (actionId: string) => void;
    onCancelEdit: () => void;
    onDelete: (action: DBAction) => void;
}

export default function ActionsTable({
    actions,
    isOffline,
    editingActionId,
    editActionItem,
    editActionActive,
    onEditActionItemChange,
    onEditActionActiveChange,
    onSetActionActive,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
}: ActionsTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] sm:text-xs">
                <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800/80 text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3 min-w-[180px]">Action Title</th>
                        <th className="py-2.5 px-3 min-w-[120px]">Key</th>
                        <th className="py-2.5 px-3 text-center min-w-[100px]">Status</th>
                        <th className="py-2.5 px-3 text-center w-24">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                    {actions.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-gray-400 italic text-xs">No pre-op actions found.</td></tr>
                    ) : actions.map(action => {
                        const isEditing = editingActionId === action.id;
                        const isActive = action.is_active !== false;

                        return (
                            <tr key={action.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">
                                    {isEditing ? (
                                        <input type="text" value={editActionItem} onChange={event => onEditActionItemChange(event.target.value)} className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-[#fcb7f0] rounded-lg outline-none" />
                                    ) : <span>{action.item}</span>}
                                </td>
                                <td className="py-3 px-3 font-mono text-[11px] text-gray-500 dark:text-slate-400">{action.id}</td>
                                <td className="py-3 px-3 text-center">
                                    <button
                                        type="button"
                                        disabled={isOffline}
                                        onClick={() => isEditing ? onEditActionActiveChange(!editActionActive) : onSetActionActive(action, !isActive)}
                                        className={`relative inline-flex items-center h-[22px] rounded-full transition-all duration-300 select-none p-0.5 w-[72px] shrink-0 shadow-sm border ${isActive ? 'bg-cyan-500 dark:bg-cyan-400 border-cyan-500 dark:border-cyan-400' : 'bg-slate-400 dark:bg-slate-600 border-slate-400 dark:border-slate-600'} ${isOffline ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-95'}`}
                                        title={isActive ? 'Click to set Inactive' : 'Click to set Active'}
                                    >
                                        {isActive ? <div className="flex items-center justify-between w-full"><span className="w-4 h-4 bg-white rounded-full shadow-md shrink-0" /><span className="flex-1 text-center text-[9px] font-black tracking-tight text-white uppercase pr-0.5">Active</span></div> : <div className="flex items-center justify-between w-full"><span className="flex-1 text-center text-[9px] font-black tracking-tight text-slate-200 uppercase pl-0.5">Inactive</span><span className="w-4 h-4 bg-white rounded-full shadow-md shrink-0" /></div>}
                                    </button>
                                </td>
                                <td className="py-3 px-3 text-center">
                                    {isEditing ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button type="button" onClick={() => onSaveEdit(action.id)} className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors" title="Save"><Save size={13} /></button>
                                            <button type="button" onClick={onCancelEdit} className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Cancel"><X size={13} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button type="button" onClick={() => onStartEdit(action)} disabled={isOffline || editingActionId !== null} className="p-1 text-gray-500 hover:text-[#fcb7f0] dark:text-slate-400 dark:hover:text-[#fcb7f0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Edit action"><Edit size={13} /></button>
                                            <button type="button" onClick={() => onDelete(action)} disabled={isOffline || editingActionId !== null} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Delete action"><Trash2 size={13} /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}


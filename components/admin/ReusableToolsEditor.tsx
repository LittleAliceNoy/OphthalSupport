import React from 'react';
import { Edit, Plus, X } from 'lucide-react';
import { DBTool } from '../../configService';

interface ReusableToolsEditorProps {
    tools: DBTool[];
    isEditing: boolean;
    isOffline: boolean;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onRemove: (toolId: string) => void;
    onAdd: () => void;
}

export default function ReusableToolsEditor({ tools, isEditing, isOffline, onStartEdit, onCancelEdit, onRemove, onAdd }: ReusableToolsEditorProps) {
    return (
        <div className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-3.5 sm:p-4 transition-all duration-300">
            <div className="flex justify-between items-center -mx-3.5 sm:-mx-4 -mt-3.5 sm:-mt-4 mb-3 px-3.5 sm:px-4 py-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20 rounded-t-2xl">
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#8e5a7d] dark:text-[#fcb7f0] flex items-center gap-2"><span className="w-1.5 h-3 bg-[#8e5a7d] dark:bg-[#fcb7f0] rounded-full" />Reusable tool</h3>
                {isEditing ? (
                    <button type="button" onClick={onCancelEdit} className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Exit reusable tool editing"><X size={14} /></button>
                ) : (
                    <button type="button" disabled={isOffline} onClick={onStartEdit} className="p-1 text-gray-500 hover:text-[#fcb7f0] dark:text-slate-400 dark:hover:text-[#fcb7f0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Edit reusable tools"><Edit size={14} /></button>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
                {tools.length === 0 ? <div className="py-2 text-center text-xs text-gray-400 italic">No reusable tools found.</div> : tools.map(tool => (
                    <span key={tool.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/80 rounded-full font-semibold text-xs text-gray-800 dark:text-slate-200 shadow-2xs hover:border-[#fcb7f0]/60 transition-all">
                        {tool.item}
                        {isEditing && <button type="button" onClick={() => onRemove(tool.id)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" title="Remove reusable option"><X size={12} /></button>}
                    </span>
                ))}
            </div>
            {isEditing && <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-start"><button type="button" disabled={isOffline} onClick={onAdd} className="px-3 py-1.5 bg-[#8e5a7d] hover:bg-[#7a4b6b] dark:bg-[#fcb7f0] dark:hover:bg-[#f39ae4] text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"><Plus size={14} />Add Tools</button></div>}
        </div>
    );
}


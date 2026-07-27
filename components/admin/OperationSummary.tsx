import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { DBOperation } from '../../configService';

interface OperationSummaryProps {
    operation: DBOperation;
    disabled: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

export default function OperationSummary({ operation, disabled, onEdit, onDelete }: OperationSummaryProps) {
    return (
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800/80">
            <div className="flex items-center gap-6 text-xs flex-wrap">
            <div>
                    <span className="text-gray-400 dark:text-slate-500 font-bold block mb-0.5 text-[10px]">Name</span>
                    <span className="font-bold text-gray-900 dark:text-white">{operation.name}</span>
                </div>
                <div>
                    <span className="text-gray-400 dark:text-slate-500 font-bold block mb-0.5 text-[10px]">Category</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">{operation.category}</span>
                </div>
                <div>
                    <span className="text-gray-400 dark:text-slate-500 font-bold block mb-0.5 text-[10px]">Trigger Keywords</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">{operation.keywords.join(', ') || '(none)'}</span>
                </div>
            </div>
            <div className="flex gap-2 shrink-0 pt-0.5">
                <button type="button" onClick={onEdit} disabled={disabled} className="p-1 text-gray-500 hover:text-[#fcb7f0] disabled:opacity-30 transition-colors" title="Edit details & triggers">
                    <Edit size={14} />
                </button>
                <button type="button" onClick={onDelete} disabled={disabled} className="p-1 text-gray-500 hover:text-red-500 disabled:opacity-30 transition-colors" title="Delete operation">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

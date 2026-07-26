import React from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { DBOperation } from '../../configService';

interface OperationHeaderProps {
  operation: DBOperation;
  ruleCount: number;
  expanded: boolean;
  disabled: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function OperationHeader({ operation, ruleCount, expanded, disabled, onToggle, onEdit, onDelete }: OperationHeaderProps) {
  return (
    <div onClick={onToggle} className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{operation.name}</span>
        <div className="flex flex-wrap gap-1">
          {operation.keywords.map(keyword => (
            <span key={keyword} className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-[9px] px-1.5 py-0.5 rounded font-mono font-medium">{keyword}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-1.5 py-0.5 rounded">
          {ruleCount} rule{ruleCount !== 1 ? 's' : ''}
        </span>
        <button type="button" onClick={event => { event.stopPropagation(); if (!disabled) onEdit(); }} disabled={disabled} className="p-1 text-gray-500 hover:text-[#fcb7f0] disabled:opacity-30 transition-colors" title="Edit details & triggers">
          <Edit size={14} />
        </button>
        <button type="button" onClick={event => { event.stopPropagation(); if (!disabled) onDelete(); }} disabled={disabled} className="p-1 text-gray-500 hover:text-red-500 disabled:opacity-30 transition-colors" title="Delete operation">
          <Trash2 size={14} />
        </button>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </div>
    </div>
  );
}

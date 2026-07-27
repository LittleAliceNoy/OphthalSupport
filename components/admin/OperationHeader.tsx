import React from 'react';
import { ChevronDown, ChevronUp, Menu } from 'lucide-react';
import { DBOperation } from '../../configService';

interface OperationHeaderProps {
  operation: DBOperation;
  ruleCount: number;
  expanded: boolean;
  disabled: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canReorder?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}

export default function OperationHeader({ operation, ruleCount, expanded, disabled, onToggle, onEdit, onDelete, canReorder = false, onDragStart, onDragOver, onDrop, onDragEnd }: OperationHeaderProps) {
  return (
    <div onClick={onToggle} draggable={canReorder && !disabled} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd} className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {canReorder && <Menu size={14} className="text-gray-400 cursor-grab active:cursor-grabbing shrink-0" title="Drag to reorder operation" />}
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
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </div>
    </div>
  );
}

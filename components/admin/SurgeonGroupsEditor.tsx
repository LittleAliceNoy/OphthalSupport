import React from 'react';
import { Plus, X } from 'lucide-react';
import type { SurgeonGroups } from '../../domain/toolTypes';

const GROUP_STYLES: Record<string, { bubble: string; remove: string; add: string; input: string }> = {
    A: {
        bubble: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
        remove: 'hover:bg-emerald-200 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300',
        add: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border-emerald-500 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300',
        input: 'border-emerald-500 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300',
    },
    B: {
        bubble: 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-500/30',
        remove: 'hover:bg-pink-200 dark:hover:bg-pink-500/30 text-pink-700 dark:text-pink-300',
        add: 'hover:bg-pink-50 dark:hover:bg-pink-500/10 border-pink-500 dark:border-pink-400 text-pink-700 dark:text-pink-300',
        input: 'border-pink-500 text-pink-700 dark:border-pink-400 dark:text-pink-300',
    },
    C: {
        bubble: 'bg-brand-secondary/15 dark:bg-brand-secondary-dark/20 text-brand-secondary dark:text-brand-secondary-dark border-brand-secondary/30 dark:border-brand-secondary-dark/30',
        remove: 'hover:bg-brand-secondary/20 dark:hover:bg-brand-secondary-dark/30 text-brand-secondary dark:text-brand-secondary-dark',
        add: 'hover:bg-brand-secondary/10 dark:hover:bg-brand-secondary-dark/10 border-brand-secondary dark:border-brand-secondary-dark text-brand-secondary dark:text-brand-secondary-dark',
        input: 'border-brand-secondary text-brand-secondary dark:border-brand-secondary-dark dark:text-brand-secondary-dark',
    },
    D: {
        bubble: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',
        remove: 'hover:bg-cyan-200 dark:hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300',
        add: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10 border-cyan-600 dark:border-brand-tertiary-dark text-cyan-700 dark:text-brand-tertiary-dark',
        input: 'border-cyan-600 text-cyan-700 dark:border-brand-tertiary-dark dark:text-brand-tertiary-dark',
    },
};

const DEFAULT_GROUP_STYLE = {
    bubble: 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30',
    remove: 'hover:bg-slate-200 dark:hover:bg-slate-500/30 text-slate-700 dark:text-slate-300',
    add: 'hover:bg-slate-50 dark:hover:bg-slate-500/10 border-slate-300 dark:border-slate-500/40 text-slate-700 dark:text-slate-300',
    input: 'border-slate-300 text-slate-700 dark:border-slate-500/60 dark:text-slate-300',
};

interface SurgeonGroupsEditorProps {
    groups: SurgeonGroups;
    isEditing: boolean;
    editedGroups: Record<string, string>;
    newSurgeonName: string;
    addingGroup: string | null;
    onNewSurgeonNameChange: (value: string) => void;
    onStartAdding: (group: string) => void;
    onCancelAdding: () => void;
    onAdd: (group: string) => void;
    onRemove: (group: string, name: string) => void;
}

function getEditedNames(groups: SurgeonGroups, editedGroups: Record<string, string>, group: string): string[] {
    const value = editedGroups[group] ?? (groups[group] || []).join(', ');
    return value.split(',').map(name => name.trim()).filter(Boolean);
}

export default function SurgeonGroupsEditor({
    groups,
    isEditing,
    editedGroups,
    newSurgeonName,
    addingGroup,
    onNewSurgeonNameChange,
    onStartAdding,
    onCancelAdding,
    onAdd,
    onRemove,
}: SurgeonGroupsEditorProps) {
    return (
        <div className="space-y-2 text-xs">
            {Object.keys(groups).map(group => {
                const style = GROUP_STYLES[group] || DEFAULT_GROUP_STYLE;
                const names = getEditedNames(groups, editedGroups, group);

                return (
                    <div key={group} className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-900 dark:text-slate-200 shrink-0 min-w-[20px]">{group}:</span>
                        {isEditing ? (
                            <div className="flex-1 flex flex-wrap items-center gap-1.5">
                                {names.map(name => (
                                    <span key={name} className={`inline-flex items-center gap-1 border text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${style.bubble}`}>
                                        {name}
                                        <button type="button" onClick={() => onRemove(group, name)} className={`rounded-full p-0.5 transition-all ${style.remove}`} title={`Remove ${name} from group ${group}`}>
                                            <X size={10} strokeWidth={3} />
                                        </button>
                                    </span>
                                ))}
                                {addingGroup === group ? (
                                    <input
                                        type="text"
                                        autoFocus
                                        value={newSurgeonName}
                                        onChange={event => onNewSurgeonNameChange(event.target.value)}
                                        onBlur={() => newSurgeonName.trim() ? onAdd(group) : onCancelAdding()}
                                        onKeyDown={event => {
                                            if (event.key === 'Enter') { event.preventDefault(); onAdd(group); }
                                            if (event.key === 'Escape') onCancelAdding();
                                        }}
                                        placeholder="Surgeon name..."
                                        className={`bg-transparent border-b px-1 py-0 text-[10px] font-bold outline-none w-28 transition-all ${style.input}`}
                                    />
                                ) : (
                                    <button type="button" onClick={() => onStartAdding(group)} className={`inline-flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-dashed text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${style.add}`}>
                                        <Plus size={10} strokeWidth={3} /> Add
                                    </button>
                                )}
                            </div>
                        ) : (
                            <span className="text-gray-600 dark:text-slate-400">{(groups[group] || []).join(', ')}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

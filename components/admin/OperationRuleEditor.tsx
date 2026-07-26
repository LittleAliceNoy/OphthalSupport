import React from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface EditableOperationRule {
    id?: string;
    operation_id: string;
    target_type: 'tool' | 'action';
    target_id: string;
    default_selected_value: string | null;
}

interface RuleOption {
    value: string;
    label: string;
}

interface ToolOption {
    id: string;
    name: string;
    category: string;
    options?: RuleOption[];
}

interface ActionOption {
    id: string;
    name: string;
}

interface OperationRuleEditorProps {
    rules: EditableOperationRule[];
    targetType: 'tool' | 'action';
    toolOptions: ToolOption[];
    actionOptions: ActionOption[];
    categories: string[];
    onChange: (index: number, changes: Partial<EditableOperationRule>) => void;
    onRemove: (index: number) => void;
}

export default function OperationRuleEditor({
    rules,
    targetType,
    toolOptions,
    actionOptions,
    categories,
    onChange,
    onRemove,
}: OperationRuleEditorProps) {
    const matchingRules = rules
        .map((rule, index) => ({ rule, index }))
        .filter(({ rule }) => rule.target_type === targetType);

    const emptyMessage = targetType === 'tool'
        ? 'No surgical tools triggered yet.'
        : 'No pre-op actions triggered yet.';

    if (matchingRules.length === 0) {
        return (
            <div className="p-2.5 text-center border border-dashed border-gray-150 dark:border-slate-800/60 rounded-xl text-gray-400 dark:text-slate-500 text-[10px] italic">
                {emptyMessage}
            </div>
        );
    }

    return (
        <>
            {matchingRules.map(({ rule, index }) => {
                const selectedTool = targetType === 'tool'
                    ? toolOptions.find(option => option.id === rule.target_id)
                    : undefined;
                const selectedToolRuleOptions = selectedTool?.options || [];

                return (
                    <div key={rule.id || `${targetType}-${index}`} className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <select
                                value={rule.target_id}
                                onChange={event => onChange(index, {
                                    target_id: event.target.value,
                                    ...(targetType === 'tool' ? { default_selected_value: null } : {}),
                                })}
                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-2.5 pr-8 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200 appearance-none"
                            >
                                <option value="">- Select {targetType === 'tool' ? 'Tool' : 'Action'} -</option>
                                {targetType === 'tool'
                                    ? categories.map(category => {
                                        const categoryTools = toolOptions.filter(option => option.category === category);
                                        if (categoryTools.length === 0) return null;
                                        return (
                                            <optgroup key={category} label={category} className="text-gray-500 font-bold bg-white dark:bg-slate-800">
                                                {categoryTools.map(option => (
                                                    <option key={option.id} value={option.id} className="text-gray-900 dark:text-white font-medium">
                                                        {option.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        );
                                    })
                                    : actionOptions.map(option => (
                                        <option key={option.id} value={option.id}>{option.name}</option>
                                    ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {targetType === 'tool' && selectedToolRuleOptions.length > 0 && (
                            <div className="relative min-w-[120px]">
                                <select
                                    value={rule.default_selected_value || ''}
                                    onChange={event => onChange(index, { default_selected_value: event.target.value || null })}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-2.5 pr-8 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#fcb7f0] dark:text-slate-200 appearance-none"
                                >
                                    <option value="">- Selection (Opt) -</option>
                                    {selectedToolRuleOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors shrink-0"
                            title={`Remove this ${targetType} trigger`}
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </>
    );
}

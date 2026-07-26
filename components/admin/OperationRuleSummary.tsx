import React from 'react';
import { DBAction, DBRule, DBTool } from '../../configService';

interface OperationRuleSummaryProps {
    rules: DBRule[];
    targetType: 'tool' | 'action';
    tools: DBTool[];
    actions: DBAction[];
}

export default function OperationRuleSummary({ rules, targetType, tools, actions }: OperationRuleSummaryProps) {
    const matchingRules = rules.filter(rule => rule.target_type === targetType);
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
            {matchingRules.map(rule => {
                const tool = targetType === 'tool' ? tools.find(item => item.id === rule.target_id) : undefined;
                const action = targetType === 'action' ? actions.find(item => item.id === rule.target_id) : undefined;
                const targetName = tool?.item || action?.item || rule.target_id;

                return (
                    <div
                        key={rule.id}
                        className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-800 dark:text-slate-200 text-xs">{targetName}</span>
                            {targetType === 'tool' && rule.default_selected_value && (
                                <span className="text-[9px] text-gray-450 dark:text-slate-400 font-semibold mt-0.5">
                                    Default: {rule.default_selected_value}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}

import React from 'react';
import { Calculator } from 'lucide-react';
import { ChecklistItemData, NEW_REUSED_OPTIONS, PatientSession } from '../constants';
import { CostBreakdown } from '../domain/pricing';

interface CostSummaryProps {
    total: number;
    breakdown: CostBreakdown['breakdown'];
    session: PatientSession;
    onToolChange: (itemId: string, value: string) => void;
}

export default function CostSummary({ total, breakdown, session, onToolChange }: CostSummaryProps) {
    return (
        <div className="bg-brand-neutral-dark dark:bg-gradient-to-r dark:from-[#FCAAED] dark:to-[#F1B197] rounded-2xl shadow-xl dark:shadow-[0_0_40px_rgba(252,170,237,0.2)] p-6 text-white dark:text-brand-neutral-dark overflow-hidden relative animate-fadeIn transition-colors duration-300">
            <Calculator className="absolute -right-4 -top-4 w-24 h-24 opacity-10 dark:opacity-20" />
            <h3 className="text-xs font-headline font-black uppercase tracking-widest text-slate-300 dark:text-slate-900/60 mb-2">Estimated Tooling Cost</h3>
            <div className="text-4xl font-headline font-black mb-1 leading-none text-white dark:text-slate-900">{total.toLocaleString()}</div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-900/60 mb-6 uppercase">Total THB ({session.healthCoverage})</div>
            <div className="pt-4 border-t border-slate-700 dark:border-slate-900/10">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-900/80 mb-3">Itemized Breakdown</h4>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {breakdown.length > 0 ? breakdown.map(item => {
                        const tool = session.tools.find(currentTool => currentTool.id === item.id);
                        const isReusable = tool?.options?.some(option => option.value === NEW_REUSED_OPTIONS.NEW || option.value === NEW_REUSED_OPTIONS.REUSED);

                        return (
                            <div key={item.id} className="flex justify-between items-start text-sm group">
                                <div className="flex flex-col flex-1 mr-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-white dark:text-slate-900 truncate">{item.name}</span>
                                        {isReusable && (
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {tool?.disabled ? (
                                                    <span className="inline-flex items-center justify-center h-[20px] w-[60px] rounded-full text-[7px] font-black bg-brand-secondary dark:bg-slate-200 text-white dark:text-slate-900 leading-none uppercase shrink-0">New Only</span>
                                                ) : (
                                                    <button
                                                        onClick={() => onToolChange(item.id, item.isReused ? NEW_REUSED_OPTIONS.NEW : NEW_REUSED_OPTIONS.REUSED)}
                                                        className={`relative inline-flex h-[20px] w-[60px] items-center rounded-full transition-all focus:outline-none ${!item.isReused ? 'bg-brand-secondary dark:bg-slate-200' : 'bg-white/30 dark:bg-slate-800/50'}`}
                                                    >
                                                        <span className={`absolute text-[8px] font-black uppercase tracking-wider transition-all ${!item.isReused ? 'right-2.5 text-white dark:text-slate-900' : 'left-2.5 text-slate-900 dark:text-white'}`}>{item.isReused ? 'Reuse' : 'New'}</span>
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-sm ${!item.isReused ? 'translate-x-1' : 'translate-x-[40px]'}`} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="font-mono text-white dark:text-slate-900 tracking-tight shrink-0 mt-0.5 font-bold">{item.isReused ? '฿0' : `฿${item.price.toLocaleString()}`}</span>
                            </div>
                        );
                    }) : <div className="text-xs text-slate-400 dark:text-slate-800 italic pt-2 font-medium">No tools selected yet</div>}
                </div>
            </div>
        </div>
    );
}


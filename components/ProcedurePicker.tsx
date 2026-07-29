import React from 'react';
import { CheckCircle, CheckSquare, Plus, RefreshCw } from 'lucide-react';
import { DBOperation } from '../configService';
import { GDI_TYPES, MP_TYPES, PPV_TYPES, PatientSession } from '../constants';
import { formatPpvProcedureDisplay } from '../domain/ppvSelection';

interface ProcedurePickerProps {
    session: PatientSession;
    groupedOperations: Record<string, DBOperation[]>;
    isPpvSelected: boolean;
    isMpSelected: boolean;
    isGdiSelected: boolean;
    isMissingRequired: boolean;
    onProcedureToggle: (keyword: string) => void;
    onDiagnosisToggle: (keyword: string, exclusiveGroup?: readonly string[]) => void;
    onOperationInputChange: (value: string) => void;
    onReset: () => void;
}

const selectedOperation = (operationInput: string, operationName: string) => {
    const escapedName = operationName.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|\\+)\\s*' + escapedName + '\\s*($|\\+)', 'i').test(operationInput.toLowerCase());
};

const diagnosisValues = (diagnosis: string) => diagnosis.split(',').map(value => value.trim()).filter(Boolean);

export default function ProcedurePicker({
    session,
    groupedOperations,
    isPpvSelected,
    isMpSelected,
    isGdiSelected,
    isMissingRequired,
    onProcedureToggle,
    onDiagnosisToggle,
    onOperationInputChange,
    onReset,
}: ProcedurePickerProps) {
    const renderDiagnosisButton = (value: string, group: readonly string[], selectedClass: string, idleClass: string) => {
        const selected = diagnosisValues(session.diagnosis).includes(value);
        return (
            <button key={value} onClick={() => onDiagnosisToggle(value, group)} className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${selected ? selectedClass : idleClass}`}>
                {value}
            </button>
        );
    };

    return (
        <section className="bg-white dark:bg-[#151f32] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-5 transition-colors duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-50 dark:border-slate-800 pb-2 sm:pb-3">
                <div className="flex items-center gap-2"><CheckSquare size={16} className="text-[#8e5a7d] dark:text-brand-tertiary-dark sm:w-[18px] sm:h-[18px]" /><h2 className="text-xs sm:text-sm font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide">Procedure</h2></div>
                <button onClick={onReset} className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 flex-shrink-0 rounded transition-colors"><RefreshCw size={10} className="sm:w-[12px] sm:h-[12px]" /> Reset</button>
            </div>
            <div className="space-y-3 sm:space-y-5">
                <div>
                    {Object.entries(groupedOperations).map(([category, operations]) => (
                        <div key={category} className="mb-3 sm:mb-4 last:mb-0">
                            <label className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-slate-400 block mb-1.5 sm:mb-2">{category}</label>
                            <div className="space-y-2.5">
                                <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                                    {operations.map(operation => {
                                        const selected = selectedOperation(session.operationInput, operation.name);
                                        return <button key={operation.id} onClick={() => onProcedureToggle(operation.name)} className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all border shrink-0 ${selected ? 'bg-[#fcb7f0] text-slate-800 border-[#fcb7f0] shadow-md scale-[1.02]' : 'bg-white dark:bg-[#151f32] text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-[#fcb7f0]/50 hover:bg-[#fcb7f0]/5'}`}>
                                            {selected ? <CheckCircle size={14} className="inline mr-1" /> : <Plus size={14} className="inline mr-1 opacity-50" />}{operation.name}
                                        </button>;
                                    })}
                                </div>
                                {category === 'Retinal Surgery' && (isPpvSelected || isMpSelected) && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center pt-1 animate-fadeIn">
                                        {isPpvSelected && <div className="flex items-center gap-1.5 shrink-0"><div className="w-2 h-[2px] bg-pink-400/40 rounded-full" />{PPV_TYPES.map(value => renderDiagnosisButton(value, PPV_TYPES, 'bg-pink-500 dark:bg-pink-400 text-white dark:text-slate-900 border-pink-600', 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200'))}</div>}
                                        {isMpSelected && <div className="flex items-center gap-1.5 shrink-0"><div className="w-2 h-[2px] bg-brand-secondary/40 rounded-full" />{MP_TYPES.map(value => renderDiagnosisButton(value, MP_TYPES, 'bg-brand-secondary dark:bg-brand-secondary-dark text-white dark:text-brand-neutral-dark border-brand-secondary', 'bg-brand-secondary/5 text-brand-secondary border-brand-secondary/30'))}</div>}
                                    </div>
                                )}
                                {category === 'Glaucoma' && isGdiSelected && <div className="flex items-center gap-1.5 pt-1 animate-fadeIn shrink-0"><div className="w-2 h-[2px] bg-cyan-600/40 rounded-full" />{GDI_TYPES.map(value => renderDiagnosisButton(value, GDI_TYPES, 'bg-cyan-600 dark:bg-brand-tertiary-dark text-white dark:text-brand-neutral-dark border-cyan-600', 'bg-cyan-600/5 text-cyan-700 border-cyan-600/30'))}</div>}
                            </div>
                        </div>
                    ))}
                    <input type="text" value={formatPpvProcedureDisplay(session.operationInput, session.diagnosis)} onChange={event => onOperationInputChange(event.target.value)} placeholder="Or type custom procedure..." className="mt-2 sm:mt-3 w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm font-medium outline-none focus:ring-2 focus:ring-[#fcb7f0] dark:text-slate-200" />
                    {isMissingRequired && <p className="text-xs font-bold text-red-500 dark:text-red-400 mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Please select at least one procedure</p>}
                </div>
            </div>
        </section>
    );
}

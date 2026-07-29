import React from 'react';
import { ChevronDown, RefreshCw, User } from 'lucide-react';
import { ANESTHESIA_TYPES, COVERAGE_TYPES, PatientSession } from '../constants';
import type { SurgeonGroups } from '../domain/toolTypes';

interface CaseBasicsPanelProps {
    session: PatientSession;
    surgeonNames: string[];
    surgeonGroups: SurgeonGroups;
    onUpdate: (field: 'surgeonName' | 'anesthesiaType' | 'healthCoverage', value: string) => void;
    onReset: () => void;
}

function getSurgeonGroup(name: string, groups: SurgeonGroups): string {
    if (!name) return '';
    for (const [group, names] of Object.entries(groups)) {
        if (names.some(candidate => name.includes(candidate))) return group;
    }
    return '';
}

function getGroupColorClass(group: string): string {
    const normalized = group.toUpperCase();
    if (normalized === 'A') return 'bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-900 border-emerald-600 dark:border-emerald-500 shadow-sm';
    if (normalized === 'B') return 'bg-pink-500 dark:bg-pink-400 text-white dark:text-slate-900 border-pink-600 dark:border-pink-500 shadow-sm';
    if (normalized === 'C') return 'bg-brand-secondary dark:bg-brand-secondary-dark text-white dark:text-brand-neutral-dark border-brand-secondary dark:border-brand-secondary-dark shadow-sm';
    if (normalized === 'D') return 'bg-cyan-600 dark:bg-brand-tertiary-dark text-white dark:text-brand-neutral-dark border-cyan-600 dark:border-brand-tertiary-dark shadow-sm';
    return 'bg-gray-500 dark:bg-slate-400 text-white dark:text-slate-900 border-gray-600 dark:border-slate-500 shadow-sm';
}

export default function CaseBasicsPanel({ session, surgeonNames, surgeonGroups, onUpdate, onReset }: CaseBasicsPanelProps) {
    const activeSurgeonGroup = getSurgeonGroup(session.surgeonName, surgeonGroups);
    const selectClass = 'w-full appearance-none bg-white dark:bg-[#151f32] border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-slate-700 transition-all';
    return (
        <section className="bg-white dark:bg-[#151f32] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-3 sm:p-4 transition-colors duration-300">
            <div className="flex justify-between items-center mb-2 sm:mb-3 border-b border-gray-50 dark:border-slate-800 pb-1.5 sm:pb-2">
                <div className="flex items-center gap-2">
                    <User size={14} className="text-[#8e5a7d] dark:text-brand-secondary-dark sm:w-[16px] sm:h-[16px]" />
                    <h2 className="text-[11px] sm:text-xs font-headline font-bold text-gray-900 dark:text-white uppercase tracking-wide">Case Basics</h2>
                </div>
                <div className="flex items-center gap-2">
                    {activeSurgeonGroup && <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-black border uppercase ${getGroupColorClass(activeSurgeonGroup)}`}>{activeSurgeonGroup}</span>}
                    <button onClick={onReset} className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 flex-shrink-0 rounded transition-colors" title="Reset Case Basics">
                        <RefreshCw size={10} className="sm:w-[12px] sm:h-[12px]" /> Reset
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Surgeon
                    <div className="relative mt-1">
                        <select value={session.surgeonName} onChange={event => onUpdate('surgeonName', event.target.value)} className={selectClass}>
                            <option value="">- Select -</option>
                            {surgeonNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </label>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Anes.
                    <div className="relative mt-1">
                        <select value={session.anesthesiaType} onChange={event => onUpdate('anesthesiaType', event.target.value)} className={selectClass}>
                            {Object.values(ANESTHESIA_TYPES).map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </label>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block mb-1">Coverage
                    <div className="relative mt-1">
                        <select value={session.healthCoverage} onChange={event => onUpdate('healthCoverage', event.target.value)} className={selectClass}>
                            {Object.values(COVERAGE_TYPES).map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </label>
            </div>
        </section>
    );
}

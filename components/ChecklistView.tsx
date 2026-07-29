import React from 'react';
import { Syringe } from 'lucide-react';
import { PatientSession } from '../constants';
import ChecklistSection, { ChecklistField, ChecklistValue } from './ChecklistSection';
import CostSummary from './CostSummary';

interface ChecklistViewProps {
    session: PatientSession;
    isMissingRequired: boolean;
    total: number;
    breakdown: Array<{ id: string; name: string; price: number; isReused: boolean }>;
    onToolChange: (itemId: string, value: string) => void;
    onItemChange: (type: 'actions' | 'tools', id: string, key: ChecklistField, value: ChecklistValue) => void;
}

export default function ChecklistView({ session, isMissingRequired, total, breakdown, onToolChange, onItemChange }: ChecklistViewProps) {
    if (isMissingRequired) return null;
    return (
        <>
            <CostSummary total={total} breakdown={breakdown} session={session} onToolChange={onToolChange} />
            <section className="space-y-4 animate-fadeIn mb-8">
                <ChecklistSection title="Pre-Operative Checklist" items={session.actions} onItemChange={(id, key, value) => onItemChange('actions', id, key, value)} colorClass="text-slate-100" showAllText="Show All Actions" />
                <ChecklistSection title="Surgical Tools Checklist" items={session.tools} onItemChange={(id, key, value) => onItemChange('tools', id, key, value)} colorClass="text-slate-100" showAllText="Add Tools" icon={Syringe} />
            </section>
        </>
    );
}

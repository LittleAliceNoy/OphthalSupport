import { useEffect, useState } from 'react';
import { ANESTHESIA_TYPES, COVERAGE_TYPES, ChecklistItemData, PatientSession } from '../constants';
import { DBAction, DBTool } from '../configService';
import { ChecklistField, ChecklistValue } from '../components/ChecklistSection';
import { generateChecklist } from '../domain/checklistGenerator';
import { PPV_GAUGES, RETINAL_PROCEDURE_KEYWORDS, ensureDefaultPpvGauge, shouldAutoSelectPpv } from '../domain/ppvSelection';
import { normalizeText } from '../domain/checklistGenerator';

type ChecklistConfig = { tools: DBTool[]; actions: DBAction[]; operations: unknown[]; rules: unknown[]; prices: unknown[] };

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function createInitialSession(): PatientSession {
    return {
        id: generateUUID(), diagnosis: '', operationInput: '', surgeonName: '',
        anesthesiaType: ANESTHESIA_TYPES.LA, healthCoverage: COVERAGE_TYPES.UCS,
        actions: [], tools: [], mpSelectedTypes: [], updatedAt: new Date(),
    };
}

export function useChecklistSession(config: ChecklistConfig | null) {
    const [session, setSession] = useState<PatientSession>(createInitialSession);
    const [ppvUserDismissed, setPpvUserDismissed] = useState(false);

    useEffect(() => {
        if (!config) return;
        const actions: ChecklistItemData[] = config.actions.map(action => ({ id: action.id, item: action.item, type: 'checkbox', checked: false }));
        const tools: ChecklistItemData[] = config.tools.map(tool => {
            const isCtr = tool.id === 'ctr-no';
            return {
                id: tool.id, item: isCtr ? 'CTR No.' : tool.item,
                type: (isCtr ? 'number-input' : tool.type) as ChecklistItemData['type'], options: tool.options,
                checked: false, selectedValue: tool.type === 'radio' ? tool.default_value : null,
                value: isCtr ? '' : tool.type === 'number-input' ? (Array.isArray(tool.default_value) ? tool.default_value : ['', '']) : '',
            };
        });
        setSession(prev => ({ ...prev, actions, tools }));
    }, [config]);

    useEffect(() => {
        if (!config) return;
        const normalizedInput = normalizeText(session.operationInput);
        const hasRetinalProc = RETINAL_PROCEDURE_KEYWORDS.some(keyword => normalizedInput.includes(keyword));
        const hasPpvProc = /\bppv\b/i.test(normalizedInput) || normalizedInput.includes('vitrectomy');
        if (shouldAutoSelectPpv(hasRetinalProc, hasPpvProc, ppvUserDismissed)) {
            const currentProc = session.operationInput.trim();
            setSession(prev => ({ ...prev, operationInput: currentProc ? `${currentProc} + PPV` : 'PPV', diagnosis: ensureDefaultPpvGauge(prev.diagnosis), updatedAt: new Date() }));
            return;
        }
        if (hasPpvProc && !PPV_GAUGES.some(gauge => session.diagnosis.split(',').map(value => value.trim()).includes(gauge))) {
            setSession(prev => ({ ...prev, diagnosis: ensureDefaultPpvGauge(prev.diagnosis), updatedAt: new Date() }));
            return;
        }
        const baseActions = session.actions.length > 0
            ? session.actions
            : config.actions.map(action => ({ id: action.id, item: action.item, type: 'checkbox' as const, checked: false }));
        const baseTools = session.tools.length > 0
            ? session.tools
            : config.tools.map(tool => {
                const isCtr = tool.id === 'ctr-no';
                return {
                    id: tool.id,
                    item: isCtr ? 'CTR No.' : tool.item,
                    type: (isCtr ? 'number-input' : tool.type) as ChecklistItemData['type'],
                    options: tool.options,
                    checked: false,
                    selectedValue: tool.type === 'radio' ? tool.default_value : null,
                    value: isCtr ? '' : tool.type === 'number-input' ? (Array.isArray(tool.default_value) ? tool.default_value : ['', '']) : '',
                };
            });
        const result = generateChecklist({ ...session, actions: baseActions, tools: baseTools }, config as Parameters<typeof generateChecklist>[1]);
        setSession(prev => ({ ...prev, actions: result.actions, tools: result.tools, mpSelectedTypes: result.mpSelectedTypes }));
    }, [config, session.operationInput, session.diagnosis, session.anesthesiaType, session.surgeonName, session.actions.length, session.tools.length, ppvUserDismissed]);

    const updateSession = <K extends keyof PatientSession>(key: K, value: PatientSession[K]) => setSession(prev => ({ ...prev, [key]: value, updatedAt: new Date() }));
    const updateChecklist = (listName: 'actions' | 'tools', itemId: string, key: ChecklistField, value: ChecklistValue) => setSession(prev => ({ ...prev, [listName]: (prev[listName] as ChecklistItemData[]).map(item => item.id === itemId ? { ...item, [key]: value } : item), updatedAt: new Date() }));
    const resetCaseBasics = () => setSession(prev => ({ ...prev, surgeonName: '', anesthesiaType: ANESTHESIA_TYPES.LA, healthCoverage: COVERAGE_TYPES.UCS }));
    const resetProcedure = () => { setPpvUserDismissed(false); setSession(prev => ({ ...prev, operationInput: '', diagnosis: '', mpSelectedTypes: [], updatedAt: new Date() })); };

    return { session, setSession, updateSession, updateChecklist, resetCaseBasics, resetProcedure, ppvUserDismissed, setPpvUserDismissed };
}

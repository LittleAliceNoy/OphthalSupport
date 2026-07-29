import { useEffect, useState } from 'react';
import { ANESTHESIA_TYPES, COVERAGE_TYPES, ChecklistItemData, PatientSession } from '../constants';
import { DBAction, DBOperation, DBRule, DBTool } from '../configService';
import { ChecklistField, ChecklistValue } from '../components/ChecklistSection';
import { generateChecklist } from '../domain/checklistGenerator';
import { PPV_GAUGES, RETINAL_PROCEDURE_KEYWORDS, ensureDefaultPpvGauge, shouldAutoSelectPpv } from '../domain/ppvSelection';
import { normalizeText } from '../domain/checklistGenerator';

type ChecklistConfig = { tools: DBTool[]; actions: DBAction[]; operations: DBOperation[]; rules: DBRule[]; prices: unknown[] };

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function buildChecklistActions(
    actions: DBAction[],
    existingActions: ChecklistItemData[] = [],
): ChecklistItemData[] {
    return actions
        .filter(action => action.is_active !== false)
        .map(action => {
            const existing = existingActions.find(item => item.id === action.id);
            return existing
                ? { ...existing, item: action.item }
                : { id: action.id, item: action.item, type: 'checkbox' as const, checked: false };
        });
}

function createChecklistTool(tool: DBTool): ChecklistItemData {
    const isCtr = tool.id === 'ctr-no';
    const type = (isCtr ? 'number-input' : tool.type) as ChecklistItemData['type'];

    return {
        id: tool.id,
        item: isCtr ? 'CTR No.' : tool.item,
        type,
        options: tool.options,
        checked: false,
        selectedValue: type === 'radio' && typeof tool.default_value === 'string'
            ? tool.default_value
            : null,
        value: isCtr
            ? ''
            : type === 'number-input'
                ? (Array.isArray(tool.default_value) ? tool.default_value : ['', ''])
                : '',
    };
}

export function buildChecklistTools(
    tools: DBTool[],
    existingTools: ChecklistItemData[] = [],
): ChecklistItemData[] {
    return tools.map(tool => {
        const existing = existingTools.find(item => item.id === tool.id);
        if (!existing) return createChecklistTool(tool);

        return {
            ...existing,
            item: tool.id === 'ctr-no' ? 'CTR No.' : tool.item,
            type: (tool.id === 'ctr-no' ? 'number-input' : tool.type) as ChecklistItemData['type'],
            options: tool.options,
        };
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
        setSession(prev => ({
            ...prev,
            actions: buildChecklistActions(config.actions, prev.actions),
            tools: buildChecklistTools(config.tools, prev.tools),
        }));
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
        const baseActions = buildChecklistActions(config.actions, session.actions);
        const baseTools = buildChecklistTools(config.tools, session.tools);
        const result = generateChecklist({ ...session, actions: baseActions, tools: baseTools }, config);
        setSession(prev => ({ ...prev, actions: result.actions, tools: result.tools, mpSelectedTypes: result.mpSelectedTypes }));
    }, [config, session.operationInput, session.diagnosis, session.anesthesiaType, session.surgeonName, session.actions.length, session.tools.length, ppvUserDismissed]);

    const updateSession = <K extends keyof PatientSession>(key: K, value: PatientSession[K]) => setSession(prev => ({ ...prev, [key]: value, updatedAt: new Date() }));
    const updateChecklist = (listName: 'actions' | 'tools', itemId: string, key: ChecklistField, value: ChecklistValue) => setSession(prev => ({ ...prev, [listName]: (prev[listName] as ChecklistItemData[]).map(item => item.id === itemId ? { ...item, [key]: value } : item), updatedAt: new Date() }));
    const resetCaseBasics = () => setSession(prev => ({ ...prev, surgeonName: '', anesthesiaType: ANESTHESIA_TYPES.LA, healthCoverage: COVERAGE_TYPES.UCS }));
    const resetProcedure = () => { setPpvUserDismissed(false); setSession(prev => ({ ...prev, operationInput: '', diagnosis: '', mpSelectedTypes: [], updatedAt: new Date() })); };

    return { session, setSession, updateSession, updateChecklist, resetCaseBasics, resetProcedure, ppvUserDismissed, setPpvUserDismissed };
}

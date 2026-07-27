import { Dispatch, SetStateAction, useMemo } from 'react';
import { GDI_TYPES, MP_TYPES, PPV_TYPES, PatientSession } from '../constants';
import { clearPpvGaugeSelections, ensureDefaultPpvGauge, isPpvProcedureSelected, isRetinalProcedureKeyword, normalizePpvOperationInput, togglePpvGaugeDiagnosis } from '../domain/ppvSelection';

interface UseProcedureSelectionArgs {
    session: PatientSession;
    setSession: Dispatch<SetStateAction<PatientSession>>;
    setPpvUserDismissed: (dismissed: boolean) => void;
}

export function useProcedureSelection({ session, setSession, setPpvUserDismissed }: UseProcedureSelectionArgs) {
    const toggleProcedureKeyword = (keyword: string) => {
        const normalizedInput = keyword.toUpperCase() === 'PPV' ? normalizePpvOperationInput(session.operationInput.trim()) : session.operationInput.trim();
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('(^|\\+)\\s*' + escapedKeyword + '\\s*($|\\+)', 'i');
        const isSelected = keyword.toUpperCase() === 'PPV' ? isPpvProcedureSelected(normalizedInput) : regex.test(normalizedInput);
        if (isSelected) {
            let newValue = normalizedInput.replace(regex, (match, before, after) => before === '+' && after === '+' ? '+' : '').trim();
            newValue = newValue.replace(/^\s*\+\s*|\s*\+\s*$/g, '');
            setSession(prev => ({ ...prev, operationInput: newValue, diagnosis: keyword.toUpperCase() === 'PPV' ? clearPpvGaugeSelections(prev.diagnosis) : prev.diagnosis, updatedAt: new Date() }));
            if (keyword.toUpperCase() === 'PPV') setPpvUserDismissed(true);
            if (keyword.toUpperCase() === 'MP') {
                setSession(prev => ({
                    ...prev,
                    diagnosis: prev.diagnosis
                        .split(',')
                        .map(value => value.trim())
                        .filter(value => value && !MP_TYPES.includes(value))
                        .join(', '),
                    updatedAt: new Date(),
                }));
            }
            if (keyword.toUpperCase() === 'GDI') setSession(prev => ({ ...prev, diagnosis: prev.diagnosis.split(',').map(value => value.trim()).filter(value => value && !GDI_TYPES.includes(value as typeof GDI_TYPES[number])).join(', '), updatedAt: new Date() }));
            return;
        }
        const newValue = normalizedInput ? `${normalizedInput} + ${keyword}` : keyword;
        setSession(prev => ({ ...prev, operationInput: newValue, diagnosis: keyword.toUpperCase() === 'PPV' ? ensureDefaultPpvGauge(prev.diagnosis) : prev.diagnosis, updatedAt: new Date() }));
        if (keyword.toUpperCase() !== 'PPV' && isRetinalProcedureKeyword(keyword)) setPpvUserDismissed(false);
        if (keyword.toUpperCase() === 'PPV') setPpvUserDismissed(false);
    };

    const toggleDiagnosisKeyword = (keyword: string, exclusiveGroup?: string[]) => {
        if (PPV_TYPES.includes(keyword as typeof PPV_TYPES[number])) {
            const nextDiagnosis = togglePpvGaugeDiagnosis(session.diagnosis, keyword, session.operationInput.trim());
            if (nextDiagnosis === session.diagnosis) return;
            setSession(prev => ({ ...prev, diagnosis: nextDiagnosis, updatedAt: new Date() }));
            return;
        }
        let values = session.diagnosis.split(',').map(value => value.trim()).filter(Boolean);
        if (values.includes(keyword)) values = values.filter(value => value !== keyword);
        else { if (exclusiveGroup) values = values.filter(value => !exclusiveGroup.includes(value)); values.push(keyword); }
        setSession(prev => ({ ...prev, diagnosis: values.join(', '), operationInput: session.operationInput.trim(), updatedAt: new Date() }));
    };

    return {
        toggleProcedureKeyword,
        toggleDiagnosisKeyword,
        isMpSelected: useMemo(() => session.operationInput.split('+').map(value => value.trim()).includes('MP'), [session.operationInput]),
        isGdiSelected: useMemo(() => session.operationInput.split('+').map(value => value.trim()).includes('GDI'), [session.operationInput]),
        isPpvSelected: useMemo(() => isPpvProcedureSelected(session.operationInput), [session.operationInput]),
    };
}

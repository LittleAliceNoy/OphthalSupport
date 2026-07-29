import { CLINICAL_CATALOG } from './catalog';

export const PPV_GAUGES = CLINICAL_CATALOG.ppvGauges;
export const RETINAL_PROCEDURE_KEYWORDS: string[] = [...CLINICAL_CATALOG.retinalProcedureKeywords];
const PPV_GAUGE_PATTERN = PPV_GAUGES.join('|');

export function isRetinalProcedureKeyword(keyword: string): boolean {
    const normalized = keyword.toLowerCase().trim();
    return RETINAL_PROCEDURE_KEYWORDS.includes(normalized);
}

export function isPpvProcedureSelected(operationInput: string): boolean {
    return operationInput.split('+').some(part => new RegExp(`\\b(?:${PPV_GAUGE_PATTERN})?\\s*PPV\\b`, 'i').test(part.trim()));
}

export function clearPpvGaugeSelections(diagnosis: string): string {
    return diagnosis
        .split(',')
        .map(value => value.trim())
        .filter(value => value && !PPV_GAUGES.includes(value as typeof PPV_GAUGES[number]))
        .join(', ');
}

export function ensureDefaultPpvGauge(diagnosis: string): string {
    const values = diagnosis.split(',').map(value => value.trim()).filter(Boolean);
    if (values.some(value => PPV_GAUGES.includes(value as typeof PPV_GAUGES[number]))) return values.join(', ');
    return [...values, PPV_GAUGES[0]].join(', ');
}

export function shouldAutoSelectPpv(
    hasRetinalProcedure: boolean,
    hasPpvProcedure: boolean,
    userDismissed: boolean,
): boolean {
    return hasRetinalProcedure && !hasPpvProcedure && !userDismissed;
}

export function normalizePpvOperationInput(operationInput: string): string {
    return operationInput.replace(new RegExp(`\\b(?:${PPV_GAUGE_PATTERN})\\s*PPV\\b`, 'gi'), 'PPV');
}

export function formatPpvProcedureDisplay(operationInput: string, diagnosis: string): string {
    const gauge = diagnosis
        .split(',')
        .map(value => value.trim())
        .find(value => PPV_GAUGES.includes(value as typeof PPV_GAUGES[number]));
    if (!gauge || !isPpvProcedureSelected(operationInput)) return operationInput;
    return operationInput.replace(new RegExp(`\\b(?:${PPV_GAUGE_PATTERN})?\\s*PPV\\b`, 'i'), `${gauge} PPV`);
}

export function togglePpvGaugeDiagnosis(
    diagnosis: string,
    gauge: string,
    operationInput: string,
): string {
    if (!PPV_GAUGES.includes(gauge as typeof PPV_GAUGES[number]) || !isPpvProcedureSelected(operationInput)) {
        return diagnosis;
    }

    const values = diagnosis.split(',').map(value => value.trim()).filter(Boolean);
    const nextValues = values.includes(gauge)
        ? values.filter(value => value !== gauge)
        : [...values.filter(value => !PPV_GAUGES.includes(value as typeof PPV_GAUGES[number])), gauge];

    return nextValues.join(', ');
}

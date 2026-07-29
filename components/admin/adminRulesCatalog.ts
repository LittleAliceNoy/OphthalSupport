export interface SurgeonPreference {
    id: string;
    surgeon: string;
    tool: string;
    value: string;
}

export const PREFERENCE_TOOL_OPTIONS: Record<string, string[] | null> = {
    'Phaco Machine': Object.values(CLINICAL_CATALOG.machineTypes),
    'PPV Set': [...CLINICAL_CATALOG.vitrectomyMachines],
    'GDI Implant': ['Ahmed Valve', ...CLINICAL_CATALOG.gdiTypes.filter(type => type !== 'Ahmed')],
    'CTR Ring Size': null,
};

export const DEFAULT_SURGEON_PREFERENCES: SurgeonPreference[] = [
    { id: 'pref-1', surgeon: 'เกษรา', tool: 'Phaco Machine', value: 'Centurion' },
    { id: 'pref-2', surgeon: 'นภาพร', tool: 'Phaco Machine', value: 'Centurion' },
    { id: 'pref-3', surgeon: 'ลินดา', tool: 'Phaco Machine', value: 'Centurion' },
];
import { CLINICAL_CATALOG } from '../../domain/catalog';


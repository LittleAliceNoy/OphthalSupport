export interface SurgeonPreference {
    id: string;
    surgeon: string;
    tool: string;
    value: string;
}

export const PREFERENCE_TOOL_OPTIONS: Record<string, string[] | null> = {
    'Phaco Machine': ['Centurion', 'Legion', 'Stellaris'],
    'PPV Set': ['Constellation', 'Stellaris'],
    'GDI Implant': ['Ahmed Valve', 'XEN', 'Express GFD', 'Preserflo', 'AADI'],
    'CTR Ring Size': null,
};

export const DEFAULT_SURGEON_PREFERENCES: SurgeonPreference[] = [
    { id: 'pref-1', surgeon: 'เกษรา', tool: 'Phaco Machine', value: 'Centurion' },
    { id: 'pref-2', surgeon: 'นภาพร', tool: 'Phaco Machine', value: 'Centurion' },
    { id: 'pref-3', surgeon: 'ลินดา', tool: 'Phaco Machine', value: 'Centurion' },
];


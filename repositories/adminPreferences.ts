import { CENTURION_PREFERRED_SURGEONS, getSurgeonGroups } from '../constants';
import {
    DEFAULT_SURGEON_PREFERENCES,
    SurgeonPreference,
} from '../components/admin/adminRulesCatalog';
import type { SurgeonGroups } from '../domain/toolTypes';

const STORAGE_KEYS = {
    preferences: 'ophthal_surgeon_preferences',
    centurionSurgeons: 'ophthal_centurion_surgeons',
    groups: 'ophthal_surgeon_groups',
} as const;

function readJson<T>(key: string, fallback: T): T {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) as T : fallback;
    } catch {
        return fallback;
    }
}

export function loadSurgeonPreferences(): SurgeonPreference[] {
    const saved = readJson<SurgeonPreference[] | null>(STORAGE_KEYS.preferences, null);
    if (saved) return saved;

    const centurionSurgeons = loadCenturionSurgeons();
    return centurionSurgeons.map((surgeon, index) => ({
        id: `pref-c-${index}`,
        surgeon,
        tool: 'Phaco Machine',
        value: 'Centurion',
    }));
}

export function saveSurgeonPreferences(preferences: SurgeonPreference[]): void {
    localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
}

export function loadCenturionSurgeons(): string[] {
    return readJson(STORAGE_KEYS.centurionSurgeons, CENTURION_PREFERRED_SURGEONS);
}

export function saveCenturionSurgeons(surgeons: string[]): void {
    localStorage.setItem(STORAGE_KEYS.centurionSurgeons, JSON.stringify(surgeons));
}

export function loadStoredSurgeonGroups(): SurgeonGroups {
    return getSurgeonGroups();
}

export function saveStoredSurgeonGroups(groups: SurgeonGroups): void {
    localStorage.setItem(STORAGE_KEYS.groups, JSON.stringify(groups));
}

export { DEFAULT_SURGEON_PREFERENCES };

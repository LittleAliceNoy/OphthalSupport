import type { SurgeonGroups } from './domain/toolTypes';
import { CLINICAL_CATALOG } from './domain/catalog';

// --- Types ---

export interface Option {
  label: string;
  value: string;
  checked?: boolean; // For checkbox groups
}

export interface ChecklistItemData {
  id: string;
  item: string;
  type: 'checkbox' | 'radio' | 'number-input' | 'number-input-with-radio' | 'checkbox-group';
  checked: boolean;
  autoPopulated?: boolean;
  note?: string;
  disabled?: boolean;
  options?: Option[]; // For radios or checkbox groups
  value?: string | string[]; // For inputs
  selectedValue?: string | null; // For radios
}

export interface PatientSession {
  id: string; // Internal Unique Identifier (UUID)
  diagnosis: string; // NEW: Diagnosis
  operationInput: string;
  surgeonName: string;
  anesthesiaType: string;
  healthCoverage: string;
  actions: ChecklistItemData[];
  tools: ChecklistItemData[];
  mpSelectedTypes: string[];
  updatedAt: Date;
}

// --- Constants ---

// UI & Data Constants
export const ANESTHESIA_TYPES = { LA: 'LA', GA: 'GA' };
export const COVERAGE_TYPES = { CSMBS: 'CSMBS', SSS: 'SSS', UCS: 'UCS' };

// Tool Specific Value Constants
export const NEW_REUSED_OPTIONS = CLINICAL_CATALOG.reusableOptions;
export const PPV_SIZES = { G23: CLINICAL_CATALOG.ppvGauges[0], G25: CLINICAL_CATALOG.ppvGauges[1] };
export const MACHINE_TYPES = CLINICAL_CATALOG.machineTypes;
export const MP_TYPES = [...CLINICAL_CATALOG.mpTypes];
export const GDI_TYPES = [...CLINICAL_CATALOG.gdiTypes];
export const PPV_TYPES = [...CLINICAL_CATALOG.ppvGauges];

// Surgeon Group Data
export const DEFAULT_SURGEON_GROUPS: SurgeonGroups = {
  'A': ['รุ่งเกียรติ', 'อรณิสา', 'อัจฉริยา', 'ดำรงค์'],
  'B': ['อทิตยา', 'ภารดี', 'นภาพร', 'เหมือนพลอย', 'ลินดา'],
  'C': ['เจนจิต', 'เกษรา', 'จุฬาลักษณ์', 'พิชญา', 'ภาวิณี'],
  'D': ['ดิเรก', 'วรพร', 'ธิดารัตน์', 'พิชญ์', 'ธัญญลักษณ์'],
  'Others': ['Resident', 'Fellow'],
};

export function getSurgeonGroups(): SurgeonGroups {
  try {
    const saved = localStorage.getItem('ophthal_surgeon_groups');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_SURGEON_GROUPS;
}

export const SURGEON_GROUPS = getSurgeonGroups();
export const CENTURION_PREFERRED_SURGEONS = ['เกษรา', 'นภาพร', 'ลินดา'];

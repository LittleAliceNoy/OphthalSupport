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
export const NEW_REUSED_OPTIONS = { NEW: 'New', REUSED: 'Reused' };
export const PPV_SIZES = { G23: '23G', G25: '25G' };
export const MACHINE_TYPES = { CENTURION: 'Centurion', LEGION: 'Legion', STELLARIS: 'Stellaris' }; 
export const MP_TYPES = ['RRD', 'TRD', 'MH', 'ERM'];
export const GDI_TYPES = ['Ahmed', 'XEN', 'Express GFD', 'Preserflo', 'AADI'];
export const PPV_TYPES = ['23G', '25G'];

// Surgeon Group Data
export const SURGEON_GROUPS: Record<string, string[]> = {
  'A': ['รุ่งเกียรติ', 'อรณิสา', 'อัจฉริยา', 'ดำรงค์'],
  'B': ['อทิตยา', 'ภารดี', 'นภาพร', 'เหมือนพลอย', 'ลินดา'],
  'C': ['เจนจิต', 'เกษรา', 'จุฬาลักษณ์', 'พิชญา', 'ภาวิณี'],
  'D': ['ดิเรก', 'วรพร', 'ธิดารัตน์', 'พิชญ์', 'ธัญญลักษณ์'],
  'Others': ['Resident', 'Fellow'],
};
export const CENTURION_PREFERRED_SURGEONS = ['เกษรา', 'นภาพร', 'ลินดา'];

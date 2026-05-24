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

// Glaucoma Device Options
export const GLAUCOMA_DEVICE_OPTIONS: Option[] = [
  { label: 'Ahmed Glaucoma Valve', value: 'ahmed-valve' },
  { label: 'XEN Glaucoma Gel Implant', value: 'gdi-xen-room' },
  { label: 'Express GFD / Alcon', value: 'gfd-express' },
  { label: 'Preserflo Microshunt', value: 'preserflo-shunt' },
  { label: 'Glaucoma Shunt AADI', value: 'aadi-shunt' },
];

// IOL Price Data
export const RAW_IOL_PRICES_DATA = [
    { category: 'Monofocal', item: 'SA 60 WF IOL / Alcon', code: '[2006]', sale: 2800, csmbs: 0, sss: 0 },
    { category: 'Monofocal', item: 'SN 60 WF IOL Alcon', code: '[2006]', sale: 2800, csmbs: 0, sss: 0 },
    { category: 'Monofocal', item: 'AR 40 Intraocular Len JJ', code: '[2006]', sale: 2800, csmbs: 0, sss: 0 },
    { category: 'Monofocal', item: 'CT Lucia 621P / Zeiss', code: '[2006]', sale: 2800, csmbs: 0, sss: 0 },
    { category: 'Monofocal', item: 'Tecnis Optiblue GCB00V', code: '[2006]', sale: 2800, csmbs: 0, sss: 0 },
    { category: 'Monofocal', item: 'Akross Adapt IOL ป้าย + ถุงปัสสาวะ', code: '[2006]', sale: 2800, csmbs: 0, sss: 0 },
    { category: 'Monofocal', item: 'Tecnis DCB00 IOL', code: '[2006]', sale: 5020, csmbs: 2220, sss: 2220 },
    { category: 'Monofocal', item: 'AVANSEE 1 Piece [กล่องแดง] IOL / Cosma', code: '[2006]', sale: 5020, csmbs: 2220, sss: 2220 },
    { category: 'Monofocal', item: 'Clareon IOL / Alcon', code: '[2006]', sale: 5660, csmbs: 2860, sss: 2860 },
    { category: 'Monofocal', item: 'AVANSEE 3 Pieces [ใส] IOL / Cosma/PL6AS', code: '[2006]', sale: 3145, csmbs: 345, sss: 345 },
    { category: 'Monofocal', item: 'MA 60 MA IOL / อ้อก้อน', code: '[2006]', sale: 4770, csmbs: 1970, sss: 1970 },
    { category: 'Monofocal', item: 'Eye-O-Care SF65 PMMA IOL / First Eye (Hard)', code: '[2007]', sale: 820, csmbs: 120, sss: 120 },
    { category: 'Monofocal', item: 'Ultrasert AU00T0 IOL / Alcon', code: '[2006]', sale: 2800, csmbs: 0, sss: 0 },
    { category: 'Monofocal', item: 'Lentis Quantum IOL / Transmedic', code: '[2006]', sale: 7765, csmbs: 4965, sss: 4965 },
    { category: 'Monofocal Toric', item: 'Tecnis ZCT Toric IOL / JJ', code: '[2006]', sale: 15500, csmbs: 12700, sss: 12700 },
    { category: 'Monofocal Toric', item: 'Clareon Toric [CNW0T2-9] [Monofocal Toric] IOL / Alcon', code: '[2006]', sale: 14185, csmbs: 11385, sss: 11385 },
    { category: 'EDOF', item: 'Tecnis Eyhance ICB IOL / JJ', code: '[2006]', sale: 6500, csmbs: 3700, sss: 3700 },
    { category: 'EDOF', item: 'Tecnis Eyhance Toric DIU000 [Simplicity] / JJ', code: '[2006]', sale: 16020, csmbs: 13220, sss: 13220 },
    { category: 'EDOF', item: 'Acrysof IQ Vivity IOL / Alcon (Non-Toric)', code: '[2006]', sale: 30100, csmbs: 27300, sss: 27300 },
    { category: 'EDOF', item: 'Acrysof IQ Vivity Toric IOL / Alcon', code: '[2006]', sale: 38320, csmbs: 35520, sss: 35520 },
    { category: 'EDOF', item: 'Clareon Vivity Toric [CNAET--] IOL / Alcon', code: '[2006]', sale: 34200, csmbs: 31400, sss: 31400 },
    { category: 'EDOF', item: 'Clareon Vivity [CNAET0] IOL / Alcon', code: '[2006]', sale: 27721, csmbs: 24921, sss: 24921 },
    { category: 'EDOF', item: 'Tecnis PureSee (DET00) / JJ', code: '[2006]', sale: 35261, csmbs: 32461, sss: 32461 },
    { category: 'EDOF', item: 'Tecnis puresee DEN00V / JJ', code: '[2006]', sale: 27561, csmbs: 24761, sss: 24761 },
    { category: 'Multifocal', item: 'Tecnis ZXR00 Multifocal', code: '[2006]', sale: 30860, csmbs: 28060, sss: 28060 },
    { category: 'Multifocal', item: 'Arriva Trinova RX', code: '[2006]', sale: 30900, csmbs: 28100, sss: 28100 },
    { category: 'Multifocal', item: 'Tecnis Synergy DFW 00 / JJ', code: '[2006]', sale: 35265, csmbs: 32465, sss: 32465 },
    { category: 'Multifocal', item: 'Lentis Comfort LS-313MF15 / Transmedic', code: '[2006]', sale: 17661, csmbs: 14861, sss: 14861 },
    { category: 'Multifocal', item: 'Lentis MPLUS LS-313MF 20/30 / Transmedic', code: '[2006]', sale: 28661, csmbs: 25861, sss: 25861 },
    { category: 'Multifocal', item: 'AT Lisa 839 MP Zeiss', code: '[2006]', sale: 27600, csmbs: 24800, sss: 24800 },
    { category: 'Multifocal', item: 'AT Lara 829 Zeiss', code: '[2006]', sale: 19870, csmbs: 17070, sss: 17070 },
    { category: 'Multifocal', item: 'AT Torbi 709MP Zeiss', code: '[2006]', sale: 16600, csmbs: 13800, sss: 13800 },
    { category: 'Multifocal', item: 'Tecnis Synergy ZFR00V JJ', code: '[2006]', sale: 27600, csmbs: 24800, sss: 24800 },
    { category: 'Multifocal Toric', item: 'Clareon Panoptix [CNWTT0] [Toric Trifocal] IOL / Alcon', code: '[2006]', sale: 32180, csmbs: 29380, sss: 29380 },
    { category: 'Multifocal Toric', item: 'Clareon Panoptic Toric [CNWTT2-6] [Trifocal Toric] IOL', code: '[2006]', sale: 41000, csmbs: 38200, sss: 38200 },
    { category: 'Multifocal Toric', item: 'AT Lisa Tri Toric 939MP Zeiss', code: '[2006]', sale: 44100, csmbs: 41300, sss: 41300 },
    { category: 'Multifocal Toric', item: 'Tecnis Symfony ZXT00 Toric JJ', code: '[2006]', sale: 33100, csmbs: 30300, sss: 30300 },
    { category: 'Multifocal Toric', item: 'Lentis Comfort TORIC LS-313MF15T0 - T6 / Transmedic', code: '[2006]', sale: 31961, csmbs: 29161, sss: 29161 },
    { category: 'Multifocal Toric', item: 'Lentis Mplus TORIC LU-313 MF15T/20T/30T / Transmedic', code: '[2006]', sale: 42961, csmbs: 40161, sss: 40161 },
];

export const IOL_PRICES_DATA = RAW_IOL_PRICES_DATA.reduce((acc: any, item) => {
    if (!acc[item.category]) {
        acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
}, {});

// Base Data Definitions
export const BASE_ACTIONS: ChecklistItemData[] = [
  { id: 'axl', item: 'วัด AXL', type: 'checkbox', checked: false, note: '' },
  { id: 'iol', item: 'วัด IOL', type: 'checkbox', checked: false, note: '' },
  { id: 'b-scan', item: 'B-scan', type: 'checkbox', checked: false, note: '' },
  { id: 'oct-macula', item: 'OCT macula / ONH / GCC', type: 'checkbox', checked: false, note: '' },
  { id: 'anterior-photo', item: 'Anterior photo', type: 'checkbox', checked: false, note: '' },
  { id: 'posterior-photo', item: 'posterior photo', type: 'checkbox', checked: false, note: '' },
  { id: 'sclera-amnion-eye-bank', item: 'จอง Sclera/Amnion (Eye bank)', type: 'checkbox', checked: false, note: '' },
  { id: 'iop', item: 'วัด IOP', type: 'checkbox', checked: false, note: '' },
  { id: 'measure-strabismus', item: 'ส่งวัดมุมเข', type: 'checkbox', checked: false, note: '' },
  { id: 'photo-oculoplastic', item: 'ถ่ายรูป oculoplastic', type: 'checkbox', checked: false, note: '' },
  { id: 'irrigation-probing', item: 'Irrigation & Probing', type: 'checkbox', checked: false, note: '' },
  { id: 'key-mmc', item: 'Key MMC', type: 'checkbox', checked: false, note: '' }
];

export const BASE_TOOLS: ChecklistItemData[] = [
  { 
    id: 'ppv-set', 
    item: 'PPV set', 
    type: 'radio', 
    options: [
        { label: 'Constellation', value: 'Constellation' },
        { label: 'Stellaris', value: 'Stellaris' }
    ],
    selectedValue: 'Stellaris', // Default to Stellaris
    checked: false, 
    note: '' 
  },
  { id: 'soft-tip', item: 'Soft tip', type: 'checkbox', checked: false, note: '' },
  { id: '15-degree-blade', item: '15 degree blade', type: 'checkbox', checked: false, note: '' },
  { id: 'slit-knife', item: 'Slit Knife', type: 'checkbox', checked: false, note: '' },
  { id: 'crescent-knife', item: 'Crescent Knife', type: 'checkbox', checked: false, note: '' },
  // Combined Punch and Trephine
  {
    id: 'punch-trephine',
    item: 'Punch & Trephine',
    type: 'number-input',
    value: ['', ''],
    checked: false,
    note: 'Enter Punch No. and Trephine No.'
  },
  { id: 'cts', item: 'CTS', type: 'checkbox', checked: false, note: '' },
  {
    id: 'glaucoma-device',
    item: 'Glaucoma Drainage Device (GDD)',
    type: 'checkbox',
    checked: false,
    note: 'Select one device if GDD procedure is planned.'
  },
  {
    id: 'ctr-no',
    item: 'CTR No.',
    type: 'checkbox',
    checked: false,
    note: 'AXL<24 : no.12, AXL 24-28 : no.13, AXL >28 ; no.14'
  },
  {
    id: 'micro-scissor',
    item: 'Micro-scissor',
    type: 'radio',
    options: [
      { label: NEW_REUSED_OPTIONS.NEW, value: NEW_REUSED_OPTIONS.NEW },
      { label: NEW_REUSED_OPTIONS.REUSED, value: NEW_REUSED_OPTIONS.REUSED }
    ],
    selectedValue: null,
    checked: false,
    note: ''
  },
  { id: 'bbg', item: 'BBG', type: 'checkbox', checked: false, note: '' },
  {
    id: 'ilm-forceps',
    item: 'ILM forceps',
    type: 'radio',
    options: [
      { label: NEW_REUSED_OPTIONS.NEW, value: NEW_REUSED_OPTIONS.NEW },
      { label: NEW_REUSED_OPTIONS.REUSED, value: NEW_REUSED_OPTIONS.REUSED }
    ],
    selectedValue: null,
    checked: false,
    note: ''
  },
  { id: 'silicone-oil', item: 'Silicone oil', type: 'checkbox', checked: false, note: '' },
  { id: 'silicone-oil-hd', item: 'Silicone Oil HD', type: 'checkbox', checked: false, note: '' },
  { id: 'endolaser', item: 'Endolaser', type: 'checkbox', checked: false, note: '' },
  {
    id: 'centurion-legion',
    item: 'Phaco Machine',
    type: 'radio',
    options: [
      { label: MACHINE_TYPES.CENTURION, value: MACHINE_TYPES.CENTURION },
      { label: MACHINE_TYPES.LEGION, value: MACHINE_TYPES.LEGION },
      { label: MACHINE_TYPES.STELLARIS, value: MACHINE_TYPES.STELLARIS }
    ],
    selectedValue: null,
    checked: false,
    note: ''
  },
  {
    id: 'iris-retractor',
    item: 'Iris retractor',
    type: 'radio',
    options: [
      { label: NEW_REUSED_OPTIONS.NEW, value: NEW_REUSED_OPTIONS.NEW },
      { label: NEW_REUSED_OPTIONS.REUSED, value: NEW_REUSED_OPTIONS.REUSED }
    ],
    selectedValue: null,
    checked: false,
    note: ''
  },
  { id: '5fu', item: '5FU', type: 'checkbox', checked: false, note: '' },
  { id: 'fibrin-glue', item: 'Fibrin glue', type: 'checkbox', checked: false, note: '' },
];

// Operation Specific Data
export interface OperationData {
  name: string;
  category: string;
  keywords: string[];
  actions: { id: string; checked: boolean; selectedValue?: any }[];
  tools: { id: string; checked: boolean; selectedValue?: any }[];
}

export const OPERATIONS_DATA: OperationData[] = [
  // Lens Surgery
  { name: "Phaco", category: "Lens Surgery", keywords: ["Phaco", "PHACO"],
    actions: [{ id: 'axl', checked: true }], 
    tools: [{ id: 'slit-knife', checked: true }, { id: 'centurion-legion', checked: true }]
  },
  { name: "IOL", category: "Lens Surgery", keywords: ["IOL"],
    actions: [{ id: 'iol', checked: true }], 
    tools: []
  },
  { name: "ECCE", category: "Lens Surgery", keywords: ["ECCE"],
    actions: [{ id: 'axl', checked: true }], 
    tools: [{ id: 'slit-knife', checked: true }, { id: '15-degree-blade', checked: true }]
  },
  { name: "SF-IOL", category: "Lens Surgery", keywords: ["SF-IOL", "Sf + iol", "SF IOL", "SFIOL"],
    actions: [{ id: 'iol', checked: true }], 
    tools: [{ id: 'slit-knife', checked: true }, { id: '15-degree-blade', checked: true }]
  },
  { name: "CTR", category: "Lens Surgery", keywords: ["CTR", "Capsular tension ring"], actions: [],
    tools: [{ id: 'ctr-no', checked: true }]
  },
  { name: "CTS", category: "Lens Surgery", keywords: ["CTS", "Capsular tension segment"], actions: [], tools: [{ id: 'cts', checked: true }] },
  { name: "Iris retractor", category: "Lens Surgery", keywords: ["Iris retractor", "Iris retractors"], actions: [], tools: [{ id: 'iris-retractor', checked: true }] },

  // Retinal Surgery
  { name: "PPV", category: "Retinal Surgery", keywords: ["PPV", "Vitrectomy"], actions: [], tools: [{ id: 'ppv-set', checked: true }] },
  { name: "MP", category: "Retinal Surgery", keywords: ["MP", "Membrane peeling", "ILM"], actions: [], tools: [] },
  { name: "SO", category: "Retinal Surgery", keywords: ["SO", "SOI", "Silicone oil injection"], actions: [], tools: [{ id: 'silicone-oil', checked: true }] },
  { name: "HD SO", category: "Retinal Surgery", keywords: ["HD SO", "Heavy SO", "Heavy Silicone Oil"], actions: [], tools: [{ id: 'silicone-oil-hd', checked: true }] },
  { name: "EL", category: "Retinal Surgery", keywords: ["EL", "Endolaser"], actions: [], tools: [{ id: 'endolaser', checked: true }] },
  
  // Glaucoma
  { name: "GDI", category: "Glaucoma", keywords: ["GDI", "GD", "Drainage implant", "XEN", "Ahmed", "Preserflo", "gfd express", "aadi shunt"], 
    actions: [{ id: 'iop', checked: true }, { id: 'sclera-amnion-eye-bank', checked: true }], 
    tools: [{ id: 'glaucoma-device', checked: true, selectedValue: null }, { id: '15-degree-blade', checked: true }] 
  },
  { name: "Tx + MMC", category: "Glaucoma", keywords: ["Tx+MMC", "Tx + MMC"], actions: [{ id: 'iop', checked: true }, { id: 'key-mmc', checked: true }], tools: [{ id: '15-degree-blade', checked: true }] },
  
  // Cornea
  { name: "PKP", category: "Cornea", keywords: ["PKP", "Keratoplasty"], 
    actions: [{ id: 'sclera-amnion-eye-bank', checked: true }, { id: 'anterior-photo', checked: true }], 
    tools: [
        { id: '15-degree-blade', checked: true }, 
        { id: 'punch-trephine', checked: true }
    ] 
  },
  { name: "Sclera/Amnion", category: "Cornea", keywords: ["Sclera graft", "Scleral graft", "Amnion graft", "AMT"], 
    actions: [{ id: 'sclera-amnion-eye-bank', checked: true }], 
    tools: [] 
  },

  // Oculoplastics and Strabismus
  { name: "EDCR", category: "Oculoplastics and Strabismus", keywords: ["EDCR", "DCR"],
    actions: [{ id: 'irrigation-probing', checked: true }],
    tools: [{ id: 'slit-knife', checked: true }, { id: 'crescent-knife', checked: true }]
  },
  { name: "Oculoplastic", category: "Oculoplastics and Strabismus", keywords: ["Oculoplastic", "Frontalis", "Sling", "Ptosis", "Lid", "Entropion", "Ectropion", "Blepharoplasty"],
    actions: [{ id: 'photo-oculoplastic', checked: true }],
    tools: []
  },
  { name: "Strabismus", category: "Oculoplastics and Strabismus", keywords: ["Strabismus", "Squint", "Muscle", "Recession", "Resection"],
    actions: [{ id: 'measure-strabismus', checked: true }],
    tools: []
  }
];

// Surgeon Group Data
export const SURGEON_GROUPS: Record<string, string[]> = {
  'A': ['รุ่งเกียรติ', 'อรณิสา', 'อัจฉริยา', 'ดำรงค์'],
  'B': ['อทิตยา', 'ภารดี', 'นภาพร', 'เหมือนพลอย', 'ลินดา'],
  'C': ['เจนจิต', 'เกษรา', 'จุฬาลักษณ์', 'พิชญา', 'ภาวิณี'],
  'D': ['ดิเรก', 'วรพร', 'ธิดารัตน์', 'พิชญ์', 'ธัญญลักษณ์'],
  'Others': ['Resident', 'Fellow'],
};
export const CENTURION_PREFERRED_SURGEONS = ['เกษรา', 'นภาพร', 'ลินดา'];

// Tool Price Data
export const TOOL_PRICES: any = {
  '15-degree-blade': { name: 'Knife-15 degree (Mani)', CSMBS: 220, SSS: 220, UCS: 220 },
  'slit-knife': { name: 'Slit Knife', CSMBS: 0, SSS: 0, UCS: 0 },
  'crescent-knife': { name: 'Crescent Bevel Up 2.3 mm', CSMBS: 325, SSS: 325, UCS: 325 },
  'centurion-legion': {
    [MACHINE_TYPES.CENTURION]: { name: 'Centurion Gravity Pack', CSMBS: 2140, SSS: 2140, UCS: 2140 },
    [MACHINE_TYPES.LEGION]: { name: 'Legion FMS Basic Pack', CSMBS: 0, SSS: 0, UCS: 0 },
    [MACHINE_TYPES.STELLARIS]: { name: 'Basic Vacuum Phaco Pack BL5111', CSMBS: 1875, SSS: 1875, UCS: 1875 },
  },
  'ctr-no': { name: 'AuroRing/CTR/CTS', CSMBS: 0, SSS: 1381, UCS: 1381 },
  'cts': { name: 'AuroRing/CTR/CTS', CSMBS: 0, SSS: 1381, UCS: 1381 },
  'iris-retractor': { name: 'Iris Retractors', CSMBS: 1565, SSS: 1565, UCS: 1565 },
  'glaucoma-device': {
    'gdi-xen-room': { name: 'Xen Glaucoma gel Implant', CSMBS: 17785, SSS: 19785, UCS: 19785 },
    'ahmed-valve': { name: 'Ahmed Glaucoma Valve', CSMBS: 1660, SSS: 1660, UCS: 1660 },
    'preserflo-shunt': { name: 'Preserflo Microshunt', CSMBS: 23061, SSS: 25061, UCS: 25061 },
    'gfd-express': { name: 'Express GFD / Alcon', CSMBS: 8190, SSS: 10190, UCS: 10190 },
    'aadi-shunt': { name: 'Glaucoma shunt AADI (Sale ฿6,500)', CSMBS: 0, SSS: 0, UCS: 0 },
  },
  'ppv-set': {
    '23G_Constellation': { name: 'Constellation 23G Vitrectomy', CSMBS: 2150, SSS: 2150, UCS: 2150 },
    '25G_Constellation': { name: 'Constellation 25G Vitrectomy', CSMBS: 2150, SSS: 2150, UCS: 2150 },
    '23G_Stellaris': { name: 'Stellaris Vitrectomy Set 23 G', CSMBS: 2150, SSS: 2150, UCS: 2150 },
    '25G_Stellaris': { name: 'Stellaris Vitrectomy Set 25 G', CSMBS: 2150, SSS: 2150, UCS: 2150 },
  },
  'ilm-forceps': { name: 'ILM Forcep Tip', CSMBS: 3600, SSS: 6300, UCS: 6300 },
  'micro-scissor': { name: 'Microscissors', CSMBS: 3600, SSS: 6300, UCS: 6300 },
  'bbg': { name: 'Ocublue 0.05% (BBG Solution)', CSMBS: 910, SSS: 910, UCS: 910 },
  'silicone-oil': { name: 'Oxane Silicone Oil', CSMBS: 400, SSS: 400, UCS: 400 },
  'silicone-oil-hd': { name: 'Oxane HD (Heavy Oil)', CSMBS: 8500, SSS: 8500, UCS: 8500 },
  'endolaser': { name: 'Endolaser', CSMBS: 2500, SSS: 2500, UCS: 2500 },
  'dk-line': { name: 'DK Line 5 ml (Sale ฿5,700)', CSMBS: 0, SSS: 0, UCS: 0 },
  'soft-tip': { name: 'Soft Tip', CSMBS: 514, SSS: 514, UCS: 514 },
  'punch-trephine': { name: 'Punch & Trephine', CSMBS: 0, SSS: 0, UCS: 0 },
  '5fu': { name: '5FU', CSMBS: 0, SSS: 0, UCS: 0 },
  'fibrin-glue': { name: 'Fibrin glue', CSMBS: 0, SSS: 0, UCS: 0 },
};
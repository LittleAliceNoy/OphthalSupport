import type { ToolOption, ToolType } from './toolTypes';

export interface CatalogTool {
    id: string;
    item: string;
    type: ToolType;
    options: ToolOption[] | null;
    default_value: string | string[] | null;
    sort_order: number;
    category: string;
}

export const CLINICAL_CATALOG = {
    reusableOptions: { NEW: 'New', REUSED: 'Reused' },
    ppvGauges: ['23G', '25G'] as const,
    machineTypes: { CENTURION: 'Centurion', LEGION: 'Legion', STELLARIS: 'Stellaris' },
    vitrectomyMachines: ['Constellation', 'Stellaris'] as const,
    mpTypes: ['RRD', 'TRD', 'MH', 'ERM'] as const,
    gdiTypes: ['Ahmed', 'XEN', 'Express GFD', 'Preserflo', 'AADI'] as const,
    retinalProcedureKeywords: ['mp', 'membrane peeling', 'ilm', 'el', 'endolaser', 'so', 'soi', 'hd so', 'heavy so', 'pfcl'] as const,
    toolCategories: ['Lens Surgery', 'Retinal Surgery', 'Glaucoma', 'Cornea', 'Generals'] as const,
    operationCategories: ['Lens Surgery', 'Retinal Surgery', 'Glaucoma', 'Cornea', 'Oculoplastics and Strabismus', 'Others'] as const,
} as const;

export const CANONICAL_TOOL_CATALOG: CatalogTool[] = [
    { id: 'ppv-set', item: 'PPV set', type: 'radio', options: [{ label: 'Constellation', value: 'Constellation' }, { label: 'Stellaris', value: 'Stellaris' }], default_value: 'Stellaris', sort_order: 1, category: 'Retinal Surgery' },
    { id: 'soft-tip', item: 'Soft tip', type: 'checkbox', options: null, default_value: null, sort_order: 2, category: 'Retinal Surgery' },
    { id: '15-degree-blade', item: '15 degree blade', type: 'checkbox', options: null, default_value: null, sort_order: 3, category: 'Generals' },
    { id: 'slit-knife', item: 'Slit Knife', type: 'checkbox', options: null, default_value: null, sort_order: 4, category: 'Generals' },
    { id: 'crescent-knife', item: 'Crescent Knife', type: 'checkbox', options: null, default_value: null, sort_order: 5, category: 'Generals' },
    { id: 'punch-trephine', item: 'Punch & Trephine', type: 'number-input', options: null, default_value: ['', ''], sort_order: 6, category: 'Cornea' },
    { id: 'cts', item: 'CTS', type: 'checkbox', options: null, default_value: null, sort_order: 7, category: 'Lens Surgery' },
    { id: 'glaucoma-device', item: 'Glaucoma Drainage Device (GDD)', type: 'checkbox', options: null, default_value: null, sort_order: 8, category: 'Glaucoma' },
    { id: 'ctr-no', item: 'CTR No.', type: 'checkbox', options: null, default_value: null, sort_order: 9, category: 'Lens Surgery' },
    { id: 'micro-scissor', item: 'Micro-scissor', type: 'radio', options: [{ label: 'New', value: 'New' }, { label: 'Reused', value: 'Reused' }], default_value: null, sort_order: 10, category: 'Retinal Surgery' },
    { id: 'bbg', item: 'BBG', type: 'checkbox', options: null, default_value: null, sort_order: 11, category: 'Retinal Surgery' },
    { id: 'ilm-forceps', item: 'ILM forceps', type: 'radio', options: [{ label: 'New', value: 'New' }, { label: 'Reused', value: 'Reused' }], default_value: null, sort_order: 12, category: 'Retinal Surgery' },
    { id: 'silicone-oil', item: 'Silicone oil', type: 'checkbox', options: null, default_value: null, sort_order: 13, category: 'Retinal Surgery' },
    { id: 'silicone-oil-hd', item: 'Silicone Oil HD', type: 'checkbox', options: null, default_value: null, sort_order: 14, category: 'Retinal Surgery' },
    { id: 'endolaser', item: 'Endolaser', type: 'checkbox', options: null, default_value: null, sort_order: 15, category: 'Retinal Surgery' },
    { id: 'phaco-machine', item: 'Phaco Machine', type: 'radio', options: [{ label: 'Centurion', value: 'Centurion' }, { label: 'Legion', value: 'Legion' }, { label: 'Stellaris', value: 'Stellaris' }], default_value: null, sort_order: 16, category: 'Lens Surgery' },
    { id: 'iris-retractor', item: 'Iris retractor', type: 'radio', options: [{ label: 'New', value: 'New' }, { label: 'Reused', value: 'Reused' }], default_value: null, sort_order: 17, category: 'Lens Surgery' },
    { id: '5fu', item: '5FU', type: 'checkbox', options: null, default_value: null, sort_order: 18, category: 'Generals' },
    { id: 'fibrin-glue', item: 'Fibrin glue', type: 'checkbox', options: null, default_value: null, sort_order: 19, category: 'Generals' },
];

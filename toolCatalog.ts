import { CANONICAL_TOOL_CATALOG as DOMAIN_TOOL_CATALOG, CLINICAL_CATALOG } from './domain/catalog';
import type { ToolOption, ToolType } from './domain/toolTypes';

export interface ToolCatalogEntry {
    id: string;
    item: string;
    type: ToolType;
    options: ToolOption[] | null;
    default_value: string | string[] | null;
    sort_order: number;
    category: string;
}

export const CANONICAL_TOOL_CATALOG: ToolCatalogEntry[] = DOMAIN_TOOL_CATALOG;
export const CATEGORY_ORDER: string[] = [...CLINICAL_CATALOG.toolCategories];
export const CATEGORY_LABELS: Record<string, string> = {
    All: 'All',
    'Lens Surgery': 'Lens',
    'Retinal Surgery': 'Retina',
    Glaucoma: 'Glaucoma',
    Cornea: 'Cornea',
    Generals: 'Generals',
};
export const OPERATION_CATEGORY_ORDER: string[] = [...CLINICAL_CATALOG.operationCategories];

export function getOperationCategory(category: string, operationName = ''): string {
    const normalized = category.trim().toLowerCase();
    const normalizedName = operationName.trim().toLowerCase();
    if (normalizedName.includes('aspiration')) return 'Others';
    if (['oculoplastics', 'oculoplastic', 'strabismus', 'oculoplastics and strabismus'].includes(normalized)) {
        return 'Oculoplastics and Strabismus';
    }
    return OPERATION_CATEGORY_ORDER.includes(category.trim())
        ? category.trim()
        : 'Others';
}

export const TOOL_ORDER = CANONICAL_TOOL_CATALOG.map(tool => tool.id);
export const TOOL_CATEGORIES = Object.fromEntries(CANONICAL_TOOL_CATALOG.map(tool => [tool.id, tool.category]));

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function getToolDisplayName(toolId: string, itemText: string, subKey: string | null): string {
    if (toolId === 'ctr-no') return 'Capsular Tension Ring';
    if (toolId === 'cts') return 'Capsular Tension Segment';
    if (toolId === 'glaucoma-device' && subKey) {
        if (subKey === 'gdi-xen-room') return 'XEN glaucoma gel implant';
        if (subKey === 'aadi-shunt') return 'AADI shunt';
        if (subKey === 'gfd-express') return 'Express GFD';
        return capitalize(subKey.replace(/-/g, ' '));
    }
    if (toolId === 'phaco-machine' && subKey) return `${capitalize(subKey)} phaco machine`;
    if (toolId === 'ppv-set' && subKey) {
        const parts = subKey.split('_');
        return `23G/25G ${capitalize(parts.length > 1 ? parts[1] : parts[0])}`;
    }
    if (toolId === 'soft-tip') return 'Soft tip';
    return itemText || toolId;
}

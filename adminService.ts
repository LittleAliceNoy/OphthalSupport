import { supabase } from './supabase';

export interface PriceUpdate {
    id: string;
    csmbs_price: number;
    sss_price: number;
    ucs_price: number;
    display_name: string;
}

export interface ToolInsert {
    id: string;
    item: string;
    type: string;
    category: string;
    is_active: boolean;
    sort_order: number;
    options: unknown;
    default_value: unknown;
}

export interface PriceInsert {
    tool_id: string;
    sub_key: string | null;
    csmbs_price: number;
    sss_price: number;
    ucs_price: number;
    display_name: string;
}

export interface OperationInsert {
    name: string;
    category: string;
    keywords: string[];
}

export interface OperationUpdate extends OperationInsert {
    id: string;
}

export interface RuleInsert {
    operation_id: string;
    target_type: 'tool' | 'action';
    target_id: string;
    default_selected_value: string | null;
}

export interface RuleUpdate {
    id: string;
    target_id: string;
    default_selected_value: string | null;
}

function isMissingColumn(error: { message?: string; code?: string } | null | undefined, column: string): boolean {
    return Boolean(error && (error.message?.includes(`column "${column}"`) || error.code === '42703'));
}

export async function updateToolPrices(updates: PriceUpdate[]): Promise<{ displayNameSupported: boolean }> {
    const results = await Promise.all(updates.map(update => supabase
        .from('tool_prices')
        .update({
            csmbs_price: update.csmbs_price,
            sss_price: update.sss_price,
            ucs_price: update.ucs_price,
            display_name: update.display_name
        })
        .eq('id', update.id)));
    const missingName = results.find(result => isMissingColumn(result.error, 'display_name'));
    const firstError = results.find(result => result.error && !isMissingColumn(result.error, 'display_name'))?.error;
    if (firstError) throw firstError;
    if (missingName) {
        const fallbackResults = await Promise.all(updates.map(update => supabase
            .from('tool_prices')
            .update({ csmbs_price: update.csmbs_price, sss_price: update.sss_price, ucs_price: update.ucs_price })
            .eq('id', update.id)));
        const fallbackError = fallbackResults.find(result => result.error)?.error;
        if (fallbackError) throw fallbackError;
        return { displayNameSupported: false };
    }
    return { displayNameSupported: true };
}

export async function updatePrice(update: PriceUpdate): Promise<{ displayNameSupported: boolean }> {
    return updateToolPrices([update]);
}

export async function insertTool(tool: ToolInsert): Promise<{ categorySupported: boolean }> {
    const result = await supabase.from('tools').insert(tool);
    if (!isMissingColumn(result.error, 'category')) {
        if (result.error) throw result.error;
        return { categorySupported: true };
    }
    const fallback = await supabase.from('tools').insert({ ...tool, category: undefined });
    if (fallback.error) throw fallback.error;
    return { categorySupported: false };
}

export async function insertPrice(price: PriceInsert): Promise<{ displayNameSupported: boolean }> {
    const result = await supabase.from('tool_prices').insert(price);
    if (!isMissingColumn(result.error, 'display_name')) {
        if (result.error) throw result.error;
        return { displayNameSupported: true };
    }
    const fallback = await supabase.from('tool_prices').insert({ ...price, display_name: undefined });
    if (fallback.error) throw fallback.error;
    return { displayNameSupported: false };
}

export async function deleteTool(toolId: string): Promise<void> {
    const priceResult = await supabase.from('tool_prices').delete().eq('tool_id', toolId);
    if (priceResult.error) throw priceResult.error;
    const ruleResult = await supabase.from('operation_rules').delete().eq('target_type', 'tool').eq('target_id', toolId);
    if (ruleResult.error) throw ruleResult.error;
    const toolResult = await supabase.from('tools').delete().eq('id', toolId);
    if (toolResult.error) throw toolResult.error;
}

export async function deletePrice(priceId: string): Promise<void> {
    const result = await supabase.from('tool_prices').delete().eq('id', priceId);
    if (result.error) throw result.error;
}

export async function updateTool(id: string, changes: Record<string, unknown>): Promise<void> {
    const result = await supabase.from('tools').update(changes).eq('id', id);
    if (result.error) throw result.error;
}

export async function updateToolCategory(id: string, category: string): Promise<{ categorySupported: boolean }> {
    const result = await supabase.from('tools').update({ category }).eq('id', id);
    if (isMissingColumn(result.error, 'category')) return { categorySupported: false };
    if (result.error) throw result.error;
    return { categorySupported: true };
}

export async function updateToolOrder(updates: Array<{ id: string; sort_order: number }>): Promise<void> {
    const results = await Promise.all(updates.map(update => supabase.from('tools').update({ sort_order: update.sort_order }).eq('id', update.id)));
    const error = results.find(result => result.error)?.error;
    if (error) throw error;
}

export async function createOperation(operation: OperationInsert): Promise<void> {
    const result = await supabase.from('operations').insert([operation]);
    if (result.error) throw result.error;
}

export async function updateOperation(operation: OperationUpdate): Promise<void> {
    const result = await supabase.from('operations').update({ name: operation.name, category: operation.category, keywords: operation.keywords }).eq('id', operation.id);
    if (result.error) throw result.error;
}

export async function syncOperationRules(operationId: string, deleteIds: string[], inserts: RuleInsert[], updates: RuleUpdate[]): Promise<void> {
    if (deleteIds.length > 0) {
        const deleted = await supabase.from('operation_rules').delete().in('id', deleteIds);
        if (deleted.error) throw deleted.error;
    }
    if (inserts.length > 0) {
        const inserted = await supabase.from('operation_rules').insert(inserts);
        if (inserted.error) throw inserted.error;
    }
    for (const update of updates) {
        const result = await supabase.from('operation_rules').update({ target_id: update.target_id, default_selected_value: update.default_selected_value }).eq('id', update.id);
        if (result.error) throw result.error;
    }
}

export async function deleteOperation(operationId: string): Promise<void> {
    const rules = await supabase.from('operation_rules').delete().eq('operation_id', operationId);
    if (rules.error) throw rules.error;
    const operation = await supabase.from('operations').delete().eq('id', operationId);
    if (operation.error) throw operation.error;
}

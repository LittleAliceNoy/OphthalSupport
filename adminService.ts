import { supabase } from './supabase';

export interface PriceUpdate {
    id: string;
    csmbs_price: number;
    sss_price: number;
    ucs_price: number;
    display_name: string;
}

export interface ToolNameUpdate {
    id: string;
    item: string;
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

export interface ActionInsert {
    id: string;
    item: string;
    is_active?: boolean;
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

export interface ToolPlacementUpdate {
    id: string;
    sort_order: number;
}

function isMissingColumn(error: { message?: string; code?: string } | null | undefined, column: string): boolean {
    return Boolean(error && (error.message?.includes(`column "${column}"`) || error.code === '42703'));
}

export async function updateToolPrices(updates: PriceUpdate[]): Promise<{ displayNameSupported: boolean }> {
    if (updates.length === 0) return { displayNameSupported: true };
    const { error } = await supabase.rpc('admin_update_tool_prices', {
        p_updates: updates,
    });
    if (error) throw new Error(`Supabase price update failed: ${error.message || 'Unable to update prices'}`);
    return { displayNameSupported: true };
}

export async function updatePrice(update: PriceUpdate): Promise<{ displayNameSupported: boolean }> {
    return updateToolPrices([update]);
}

export async function updateCategoryPrices(
    priceUpdates: PriceUpdate[],
    toolUpdates: ToolNameUpdate[],
): Promise<void> {
    const { error } = await supabase.rpc('admin_update_category_prices', {
        p_price_updates: priceUpdates,
        p_tool_updates: toolUpdates,
    });
    if (error) throw new Error(`Supabase category price update failed: ${error.message || 'Unable to update prices'}`);
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

export async function createToolWithPrices(tool: ToolInsert, prices: PriceInsert[]): Promise<{ categorySupported: boolean; displayNameSupported: boolean }> {
    const { data, error } = await supabase.rpc('admin_create_tool_with_prices', {
        p_tool: tool,
        p_prices: prices,
    });
    if (error) throw error;
    return {
        categorySupported: data?.category_supported === true,
        displayNameSupported: data?.display_name_supported === true,
    };
}

export async function deleteTool(toolId: string): Promise<void> {
    const { error } = await supabase.rpc('admin_delete_tool', { p_tool_id: toolId });
    if (error) throw error;
}

export async function deleteSubtypeAndUpdateTool(priceId: string, toolId: string, options: unknown, type: string, defaultValue: unknown): Promise<void> {
    const { error } = await supabase.rpc('admin_delete_subtype_and_update_tool', {
        p_price_id: priceId,
        p_tool_id: toolId,
        p_options: options,
        p_type: type,
        p_default_value: defaultValue,
    });
    if (error) {
        const message = error.message || 'Unable to delete subtype';
        throw new Error(`Supabase subtype deletion failed: ${message}`);
    }
}

export async function addSubtypeToTool(toolId: string, options: unknown, price: PriceInsert): Promise<void> {
    const { error } = await supabase.rpc('admin_add_subtype_to_tool', {
        p_tool_id: toolId,
        p_options: options,
        p_price: price,
    });
    if (error) throw error;
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

export async function updateToolPlacement(toolId: string, category: string | null, updates: ToolPlacementUpdate[]): Promise<{ categorySupported: boolean }> {
    const { data, error } = await supabase.rpc('admin_update_tool_placement', {
        p_tool_id: toolId,
        p_category: category,
        p_order_updates: updates,
    });
    if (error) throw error;
    return { categorySupported: data?.category_supported === true };
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

export async function updateOperationWithRules(operation: OperationUpdate, deleteIds: string[], inserts: RuleInsert[], updates: RuleUpdate[]): Promise<void> {
    const { error } = await supabase.rpc('admin_update_operation_with_rules', {
        p_operation: operation,
        p_delete_rule_ids: deleteIds,
        p_insert_rules: inserts,
        p_update_rules: updates,
    });
    if (error) {
        const message = error.message || 'Unable to update operation';
        throw new Error(`Supabase operation update failed: ${message}`);
    }
}

export async function updateOperationPlacement(operationId: string, category: string | null, updates: Array<{ id: string; sort_order: number }>): Promise<void> {
    const { error } = await supabase.rpc('admin_update_operation_placement', {
        p_operation_id: operationId,
        p_category: category,
        p_order_updates: updates,
    });
    if (error) throw new Error(`Supabase operation placement failed: ${error.message || 'Unable to reorder operation'}`);
}

export async function deleteOperation(operationId: string): Promise<void> {
    const { error } = await supabase.rpc('admin_delete_operation', { p_operation_id: operationId });
    if (error) throw new Error(`Supabase operation deletion failed: ${error.message || 'Unable to delete operation'}`);
}

export async function createAction(action: ActionInsert): Promise<void> {
    const result = await supabase.from('actions').insert([{
        id: action.id,
        item: action.item,
        is_active: action.is_active ?? true
    }]);
    if (result.error) throw result.error;
}

export async function updateAction(id: string, changes: { item?: string; is_active?: boolean }): Promise<void> {
    const result = await supabase.from('actions').update(changes).eq('id', id);
    if (result.error) throw result.error;
}

export async function deleteAction(actionId: string): Promise<void> {
    const { error } = await supabase.rpc('admin_delete_action', { p_action_id: actionId });
    if (error) throw error;
}

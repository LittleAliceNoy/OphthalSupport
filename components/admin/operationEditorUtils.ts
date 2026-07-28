import { DBAction, DBOperation, DBRule, DBTool } from '../../configService';
import { CATEGORY_ORDER } from './adminCatalog';
import { EditableOperationRule } from './OperationRuleEditor';

export function findKeywordConflict(
    operations: DBOperation[],
    keyword: string,
    operationId?: string,
): DBOperation | undefined {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return operations.find(operation => (
        operation.id !== operationId
        && operation.keywords.some(item => item.toLowerCase() === normalizedKeyword)
    ));
}

export function getToolRuleOptions(tools: DBTool[]) {
    return [...tools]
        .filter(tool => tool.id.toLowerCase() !== 'mm' && tool.item.trim().toLowerCase() !== 'mm')
        .sort((a, b) => {
            const categoryA = CATEGORY_ORDER.indexOf(a.category || 'Generals');
            const categoryB = CATEGORY_ORDER.indexOf(b.category || 'Generals');
            const normalizedCategoryA = categoryA < 0 ? Number.MAX_SAFE_INTEGER : categoryA;
            const normalizedCategoryB = categoryB < 0 ? Number.MAX_SAFE_INTEGER : categoryB;
            if (normalizedCategoryA !== normalizedCategoryB) return normalizedCategoryA - normalizedCategoryB;
            return (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER)
                || a.item.localeCompare(b.item);
        })
        .map(tool => ({
            id: tool.id,
            name: tool.item,
            options: tool.options,
            category: tool.category || 'Generals',
        }));
}

export function isOperationEditDirty(
    operation: DBOperation | undefined,
    existingRules: DBRule[],
    edited: { name: string; category: string; keywords: string[]; rules: EditableOperationRule[] },
): boolean {
    if (!operation) return false;
    if (
        edited.name.trim() !== operation.name
        || edited.category !== operation.category
        || edited.keywords.join(', ') !== operation.keywords.join(', ')
    ) return true;

    const validRules = edited.rules.filter(rule => rule.target_id.trim());
    return validRules.length !== existingRules.length || validRules.some((rule, index) => {
        const original = existingRules[index];
        return !original
            || rule.id !== original.id
            || rule.target_type !== original.target_type
            || rule.target_id !== original.target_id
            || (rule.default_selected_value || null) !== (original.default_selected_value || null);
    });
}

export function buildRuleChanges(operationId: string, existingRules: DBRule[], editedRules: EditableOperationRule[]) {
    const validRules = editedRules.filter(rule => rule.target_id.trim());
    const deleteIds = existingRules
        .map(rule => rule.id)
        .filter(id => !validRules.some(rule => rule.id === id));
    const inserts = validRules
        .filter(rule => !rule.id)
        .map(rule => ({
            operation_id: operationId,
            target_type: rule.target_type,
            target_id: rule.target_id,
            default_selected_value: rule.default_selected_value?.trim() || null,
        }));
    const updates = validRules
        .filter(rule => rule.id)
        .flatMap(rule => {
            const original = existingRules.find(item => item.id === rule.id);
            const defaultValue = rule.default_selected_value?.trim() || null;
            return original && (
                original.target_id !== rule.target_id
                || (original.default_selected_value || null) !== defaultValue
            ) ? [{ id: rule.id as string, target_id: rule.target_id, default_selected_value: defaultValue }] : [];
        });

    return { validRules, deleteIds, inserts, updates };
}

export function findDuplicateRuleName(
    rules: EditableOperationRule[],
    tools: DBTool[],
    actions: DBAction[],
): string | null {
    const seen = new Set<string>();
    for (const rule of rules) {
        const key = `${rule.target_type}:${rule.target_id}`;
        if (seen.has(key)) {
            const name = rule.target_type === 'tool'
                ? tools.find(tool => tool.id === rule.target_id)?.item
                : actions.find(action => action.id === rule.target_id)?.item;
            return `${rule.target_type === 'tool' ? 'Surgical tool' : 'Pre-Op action'} "${name || rule.target_id}" is selected more than once.`;
        }
        seen.add(key);
    }
    return null;
}

export function buildOrderedIds(ids: string[], draggedId: string, targetId: string): string[] {
    const ordered = ids.filter(id => id !== draggedId);
    const targetIndex = ordered.indexOf(targetId);
    ordered.splice(targetIndex < 0 ? ordered.length : targetIndex, 0, draggedId);
    return ordered;
}

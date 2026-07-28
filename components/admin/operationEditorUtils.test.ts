import { describe, expect, it } from 'vitest';
import { DBOperation, DBRule } from '../../configService';
import {
    buildOrderedIds,
    buildRuleChanges,
    findKeywordConflict,
    isOperationEditDirty,
} from './operationEditorUtils';

const operation: DBOperation = {
    id: 'op-1',
    name: 'PPV',
    category: 'Retinal Surgery',
    keywords: ['PPV'],
};

const rule: DBRule = {
    id: 'rule-1',
    operation_id: 'op-1',
    target_type: 'tool',
    target_id: 'vitrectomy-machine',
    default_selected_value: null,
};

describe('operationEditorUtils', () => {
    it('detects duplicate keywords without matching the operation being edited', () => {
        expect(findKeywordConflict([operation], 'ppv')?.id).toBe('op-1');
        expect(findKeywordConflict([operation], 'ppv', 'op-1')).toBeUndefined();
    });

    it('builds a stable drag-and-drop order', () => {
        expect(buildOrderedIds(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b']);
        expect(buildOrderedIds(['a', 'b', 'c'], 'a', 'missing')).toEqual(['b', 'c', 'a']);
    });

    it('detects operation edits from details and rule changes', () => {
        const unchanged = { name: 'PPV', category: 'Retinal Surgery', keywords: ['PPV'], rules: [rule] };
        expect(isOperationEditDirty(operation, [rule], unchanged)).toBe(false);
        expect(isOperationEditDirty(operation, [rule], { ...unchanged, name: 'PPV with EL' })).toBe(true);
    });

    it('derives inserts, updates, and deletions for edited rules', () => {
        const changes = buildRuleChanges('op-1', [rule], [
            { ...rule, target_id: 'new-target' },
            { id: '', operation_id: 'op-1', target_type: 'action', target_id: 'book-eye-bank', default_selected_value: null },
        ]);
        expect(changes.deleteIds).toEqual([]);
        expect(changes.updates).toEqual([{ id: 'rule-1', target_id: 'new-target', default_selected_value: null }]);
        expect(changes.inserts).toEqual([{ operation_id: 'op-1', target_type: 'action', target_id: 'book-eye-bank', default_selected_value: null }]);
    });
});

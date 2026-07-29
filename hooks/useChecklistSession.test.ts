import { describe, expect, it } from 'vitest';
import type { DBTool } from '../configService';
import { buildChecklistTools } from './useChecklistSession';

const tool = (overrides: Partial<DBTool> = {}): DBTool => ({
    id: 'new-tool',
    item: 'New tool',
    type: 'checkbox',
    options: null,
    default_value: null,
    is_active: true,
    ...overrides,
});

describe('buildChecklistTools', () => {
    it('adds tools introduced by a refreshed database catalog', () => {
        const existing = buildChecklistTools([tool({ id: 'existing-tool', item: 'Existing tool' })]);
        existing[0].checked = true;

        const refreshed = buildChecklistTools([
            tool({ id: 'existing-tool', item: 'Existing tool' }),
            tool({ id: 'new-tool', item: 'New tool' }),
        ], existing);

        expect(refreshed.map(item => item.id)).toEqual(['existing-tool', 'new-tool']);
        expect(refreshed[0].checked).toBe(true);
        expect(refreshed[1].checked).toBe(false);
    });

    it('initializes a newly added radio tool with its configured default', () => {
        const refreshed = buildChecklistTools([tool({
            id: 'ppv-set-new',
            type: 'radio',
            options: [{ value: '23g', label: '23G' }],
            default_value: '23g',
        })]);

        expect(refreshed[0].selectedValue).toBe('23g');
        expect(refreshed[0].options).toEqual([{ value: '23g', label: '23G' }]);
    });
});

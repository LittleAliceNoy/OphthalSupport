import { describe, expect, it } from 'vitest';
import { DBPrice } from '../../configService';
import { buildToolPlacementUpdates, toSlug } from './priceEditorUtils';

describe('priceEditorUtils', () => {
    it('creates stable database-safe slugs', () => {
        expect(toSlug('  Fine Scissors (23G)  ')).toBe('fine-scissors-23g');
    });

    it('reorders unique tool ids even when a tool has several price rows', () => {
        const prices = [
            { tool_id: 'a' },
            { tool_id: 'a' },
            { tool_id: 'b' },
            { tool_id: 'c' },
        ] as DBPrice[];
        expect(buildToolPlacementUpdates(prices, 'c', 'a')).toEqual([
            { id: 'c', sort_order: 10 },
            { id: 'a', sort_order: 20 },
            { id: 'b', sort_order: 30 },
        ]);
    });
});

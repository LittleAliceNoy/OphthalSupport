import { describe, expect, it } from 'vitest';
import { CANONICAL_TOOL_CATALOG, CLINICAL_CATALOG } from './catalog';
import { PPV_GAUGES } from './ppvSelection';
import { CANONICAL_TOOL_CATALOG as publicToolCatalog } from '../toolCatalog';

describe('domain catalog', () => {
    it('exposes one source for PPV gauges and tools', () => {
        expect(PPV_GAUGES).toBe(CLINICAL_CATALOG.ppvGauges);
        expect(publicToolCatalog).toBe(CANONICAL_TOOL_CATALOG);
    });

    it('keeps tool identifiers unique', () => {
        const ids = CANONICAL_TOOL_CATALOG.map(tool => tool.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

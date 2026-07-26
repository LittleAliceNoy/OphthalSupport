import { describe, expect, it } from 'vitest';
import { DBOperation, DBPrice, DBTool } from '../../configService';
import { filterAndSortPrices, filterOperations, groupOperations } from './adminSelectors';

const tool = (id: string, category: string, sort_order: number): DBTool => ({
  id,
  item: id,
  type: 'checkbox',
  options: null,
  default_value: null,
  category,
  sort_order,
});

const price = (id: string, tool_id: string, sub_key: string | null = null): DBPrice => ({
  id,
  tool_id,
  sub_key,
  csmbs_price: 0,
  sss_price: 0,
  ucs_price: 0,
});

describe('admin selectors', () => {
  it('filters prices by tool name and sorts them by catalog order', () => {
    const tools = [tool('soft-tip', 'Retinal Surgery', 2), tool('ppv-set', 'Retinal Surgery', 1)];
    const prices = [price('soft-price', 'soft-tip'), price('ppv-price', 'ppv-set', '23G_Constellation')];

    expect(filterAndSortPrices(prices, tools, 'ppv')).toEqual([prices[1]]);
    expect(filterAndSortPrices(prices, tools, '')).toEqual([prices[1], prices[0]]);
  });

  it('matches operations by name, keyword, or category', () => {
    const operations: DBOperation[] = [
      { id: '1', name: 'Phaco', category: 'Lens Surgery', keywords: ['Cataract'] },
      { id: '2', name: 'PPV', category: 'Retinal Surgery', keywords: ['Vitrectomy'] },
    ];

    expect(filterOperations(operations, 'vitrectomy')).toEqual([operations[1]]);
    expect(filterOperations(operations, 'lens surgery')).toEqual([operations[0]]);
  });

  it('groups unknown operation categories under Others', () => {
    const operation: DBOperation = { id: '1', name: 'Custom', category: 'Unlisted', keywords: [] };
    expect(groupOperations([operation], ['Lens Surgery', 'Others'])).toEqual({
      'Lens Surgery': [],
      Others: [operation],
    });
  });
});

import { DBOperation, DBPrice, DBTool } from '../../configService';
import { CATEGORY_ORDER, TOOL_CATEGORIES, TOOL_ORDER, getToolDisplayName } from './adminCatalog';

export function filterAndSortPrices(prices: DBPrice[], tools: DBTool[], searchTerm: string): DBPrice[] {
  const search = searchTerm.toLowerCase();
  return prices
    .filter(price => {
      const tool = tools.find(item => item.id === price.tool_id);
      const toolName = tool?.item.toLowerCase() || '';
      const subKey = price.sub_key?.toLowerCase() || '';
      return toolName.includes(search) || subKey.includes(search) || price.tool_id.toLowerCase().includes(search);
    })
    .sort((a, b) => {
      const toolA = tools.find(item => item.id === a.tool_id);
      const toolB = tools.find(item => item.id === b.tool_id);
      const categoryA = toolA?.category || TOOL_CATEGORIES[a.tool_id] || 'Generals';
      const categoryB = toolB?.category || TOOL_CATEGORIES[b.tool_id] || 'Generals';
      const categoryDiff = CATEGORY_ORDER.indexOf(categoryA) - CATEGORY_ORDER.indexOf(categoryB);
      if (categoryDiff !== 0) return categoryDiff;

      const orderA = typeof toolA?.sort_order === 'number' ? toolA.sort_order : 0;
      const orderB = typeof toolB?.sort_order === 'number' ? toolB.sort_order : 0;
      if (orderA !== orderB) return orderA - orderB;

      const toolDiff = (TOOL_ORDER.indexOf(a.tool_id) === -1 ? 999 : TOOL_ORDER.indexOf(a.tool_id))
        - (TOOL_ORDER.indexOf(b.tool_id) === -1 ? 999 : TOOL_ORDER.indexOf(b.tool_id));
      return toolDiff || (a.sub_key || '').localeCompare(b.sub_key || '');
    });
}

export function groupPricesByCategory(prices: DBPrice[], tools: DBTool[]): Record<string, DBPrice[]> {
  const groups: Record<string, DBPrice[]> = {};
  CATEGORY_ORDER.forEach(category => { groups[category] = []; });

  for (const price of prices) {
    const tool = tools.find(item => item.id === price.tool_id);
    const category = tool?.category || TOOL_CATEGORIES[price.tool_id] || 'Generals';
    groups[CATEGORY_ORDER.includes(category) ? category : 'Generals'].push(price);
  }
  return groups;
}

export function filterOperations(operations: DBOperation[], searchTerm: string): DBOperation[] {
  const search = searchTerm.toLowerCase();
  return operations.filter(operation =>
    operation.name.toLowerCase().includes(search)
    || operation.keywords.join(' ').toLowerCase().includes(search)
    || operation.category.toLowerCase().includes(search),
  );
}

export function groupOperations(operations: DBOperation[], categories: string[]): Record<string, DBOperation[]> {
  const groups: Record<string, DBOperation[]> = {};
  categories.forEach(category => { groups[category] = []; });
  operations.forEach(operation => {
    const category = categories.includes(operation.category) ? operation.category : 'Others';
    groups[category].push(operation);
  });
  return groups;
}

export function getPriceDisplayName(price: DBPrice, tool?: DBTool): string {
  return price.display_name || getToolDisplayName(price.tool_id, tool?.item || price.tool_id, price.sub_key);
}

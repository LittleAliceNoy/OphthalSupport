export { CATEGORY_ORDER, TOOL_CATEGORIES, TOOL_ORDER } from '../../toolCatalog';

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

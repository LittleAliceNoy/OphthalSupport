import { DBPrice } from '../../configService';

export function toSlug(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

export function buildToolPlacementUpdates(
    prices: DBPrice[],
    draggedId: string,
    targetId: string,
): Array<{ id: string; sort_order: number }> {
    const ids = prices.reduce<string[]>((all, price) => (
        all.includes(price.tool_id) ? all : [...all, price.tool_id]
    ), []);
    const reordered = ids.filter(id => id !== draggedId);
    const targetIndex = targetId === 'end' ? reordered.length : reordered.indexOf(targetId);
    reordered.splice(targetIndex < 0 ? reordered.length : targetIndex, 0, draggedId);
    return reordered.map((id, index) => ({ id, sort_order: (index + 1) * 10 }));
}

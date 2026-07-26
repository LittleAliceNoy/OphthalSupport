import { ChecklistItemData, NEW_REUSED_OPTIONS, PatientSession } from '../constants';
import { DBPrice } from '../configService';

export interface CostBreakdownItem {
  id: string;
  name: string;
  price: number;
  isReused: boolean;
}

export interface CostBreakdown {
  total: number;
  breakdown: CostBreakdownItem[];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getGauge(diagnosis: string): string {
  if (diagnosis.includes('25G')) return '25G';
  if (diagnosis.includes('23G')) return '23G';
  return '';
}

function getPriceRow(
  tool: ChecklistItemData,
  session: PatientSession,
  prices: DBPrice[],
): DBPrice | undefined {
  if (tool.id === 'ppv-set') {
    const tipSize = session.diagnosis.includes('25G') ? '25G' : '23G';
    const subKey = tool.selectedValue ? `${tipSize}_${tool.selectedValue}` : null;
    return prices.find((price) => price.tool_id === tool.id && price.sub_key === subKey);
  }

  // Some subtype-backed tools, such as GDI, are stored as checkboxes
  // because the subtype is selected independently. Look for a matching
  // sub-key whenever a selected value is present, not only for radio tools.
  if (tool.selectedValue) {
    return prices.find(
      (price) => price.tool_id === tool.id && price.sub_key === tool.selectedValue,
    ) || prices.find((price) => price.tool_id === tool.id && price.sub_key === null);
  }

  return prices.find((price) => price.tool_id === tool.id && price.sub_key === null);
}

function getDisplayName(
  tool: ChecklistItemData,
  priceRow: DBPrice | undefined,
  gauge: string,
): string {
  if (priceRow?.display_name) return priceRow.display_name;
  if (tool.id === 'ctr-no') return 'Capsular tension ring';
  if (tool.id === 'phaco-machine' && tool.selectedValue) {
    return `${capitalize(tool.selectedValue)} machine`;
  }
  if (tool.id === 'ppv-set' && tool.selectedValue) {
    return `${gauge} ${capitalize(tool.selectedValue)}`.trim();
  }
  if (tool.id === 'soft-tip') return `${gauge} Soft tip`.trim();
  return tool.item;
}

export function calculateCostAndBreakdown(
  tools: ChecklistItemData[],
  healthCoverage: string,
  session: PatientSession,
  prices: DBPrice[],
): CostBreakdown {
  const coverageKey = `${healthCoverage.toLowerCase()}_price` as keyof DBPrice;
  const gauge = getGauge(session.diagnosis);

  const breakdown = tools
    .filter((tool) => tool.checked)
    .map((tool) => {
      const isReused = tool.selectedValue === NEW_REUSED_OPTIONS.REUSED;
      const priceRow = getPriceRow(tool, session, prices);
      const price = isReused ? 0 : Number(priceRow?.[coverageKey] || 0);

      return {
        id: tool.id,
        name: getDisplayName(tool, priceRow, gauge),
        price,
        isReused,
      };
    });

  return {
    total: breakdown.reduce((total, item) => total + item.price, 0),
    breakdown,
  };
}

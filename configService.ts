import { isSupabaseConfigured, supabase } from './supabase';
import type { ToolOption, ToolType } from './domain/toolTypes';
import { 
  FALLBACK_ACTIONS, 
  FALLBACK_TOOLS, 
  FALLBACK_OPERATIONS, 
  FALLBACK_RULES, 
  FALLBACK_PRICES 
} from './localConfigData';

export interface DBTool {
  id: string;
  item: string;
  type: ToolType;
  options: ToolOption[] | null;
  default_value: DBToolDefaultValue;
  sort_order?: number;
  category?: string;
  is_active?: boolean;
}

export type DBToolOption = ToolOption;

export type DBToolDefaultValue = string | number | string[] | null;

export interface DBAction {
  id: string;
  item: string;
  is_active?: boolean;
}

export interface DBOperation {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  sort_order?: number;
}

export interface DBRule {
  id: string;
  operation_id: string;
  target_type: 'tool' | 'action';
  target_id: string;
  default_selected_value: string | null;
}

export interface DBPrice {
  id: string;
  tool_id: string;
  sub_key: string | null;
  csmbs_price: number;
  sss_price: number;
  ucs_price: number;
  display_name?: string | null;
}

function isLegacyPlaceholderTool(tool: DBTool): boolean {
  return tool.id.trim().toLowerCase() === 'mm' || tool.item.trim().toLowerCase() === 'mm';
}

export const fetchConfig = async () => {
  if (!isSupabaseConfigured) {
    return {
      tools: FALLBACK_TOOLS,
      actions: FALLBACK_ACTIONS,
      operations: FALLBACK_OPERATIONS,
      rules: FALLBACK_RULES,
      prices: FALLBACK_PRICES,
      isFallback: true
    };
  }

  try {
    const [
      { data: tools, error: toolsErr },
      { data: actions, error: actionsErr },
      { data: operations, error: operationsErr },
      { data: rules, error: rulesErr },
      { data: prices, error: pricesErr }
    ] = await Promise.all([
      supabase.from('tools').select('*').eq('is_active', true),
      supabase.from('actions').select('*'),
      supabase.from('operations').select('*'),
      supabase.from('operation_rules').select('*'),
      supabase.from('tool_prices').select('*')
    ]);

    if (toolsErr || actionsErr || operationsErr || rulesErr || pricesErr || !tools || tools.length === 0) {
      const err = toolsErr || actionsErr || operationsErr || rulesErr || pricesErr;
      if (err) {
        console.warn('Supabase fetch failed or returned error, falling back to local configuration:', err);
      } else {
        console.warn('Supabase database is empty, falling back to local configuration.');
      }
      return {
        tools: FALLBACK_TOOLS,
        actions: FALLBACK_ACTIONS,
        operations: FALLBACK_OPERATIONS,
        rules: FALLBACK_RULES,
        prices: FALLBACK_PRICES,
        isFallback: true
      };
    }

    return {
      tools: (tools as DBTool[]).filter(tool => !isLegacyPlaceholderTool(tool)),
      actions: actions as DBAction[],
      operations: operations as DBOperation[],
      rules: rules as DBRule[],
      prices: prices as DBPrice[],
      isFallback: false
    };
  } catch (error) {
    console.warn('Supabase network connection failed, falling back to local configuration:', error);
    return {
      tools: FALLBACK_TOOLS,
      actions: FALLBACK_ACTIONS,
      operations: FALLBACK_OPERATIONS,
      rules: FALLBACK_RULES,
      prices: FALLBACK_PRICES,
      isFallback: true
    };
  }
};

import { supabase } from './supabase';

export interface DBTool {
  id: string;
  item: string;
  type: string;
  options: any;
  default_value: any;
}

export interface DBAction {
  id: string;
  item: string;
}

export interface DBOperation {
  id: string;
  name: string;
  category: string;
  keywords: string[];
}

export interface DBRule {
  operation_id: string;
  target_type: 'tool' | 'action';
  target_id: string;
  default_selected_value: string | null;
}

export interface DBPrice {
  tool_id: string;
  sub_key: string | null;
  csmbs_price: number;
  sss_price: number;
  ucs_price: number;
}

export const fetchConfig = async () => {
  const [
    { data: tools },
    { data: actions },
    { data: operations },
    { data: rules },
    { data: prices }
  ] = await Promise.all([
    supabase.from('tools').select('*').eq('is_active', true),
    supabase.from('actions').select('*').eq('is_active', true),
    supabase.from('operations').select('*'),
    supabase.from('operation_rules').select('*'),
    supabase.from('tool_prices').select('*')
  ]);

  return {
    tools: (tools || []) as DBTool[],
    actions: (actions || []) as DBAction[],
    operations: (operations || []) as DBOperation[],
    rules: (rules || []) as DBRule[],
    prices: (prices || []) as DBPrice[]
  };
};

import { supabase } from './supabase';

export interface DBTool {
  id: string;
  item: string;
  type: string;
  options: any;
  default_value: any;
  sort_order?: number;
  category?: string;
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

export const fetchConfig = async () => {
  const [
    { data: tools },
    { data: actions },
    { data: operations },
    { data: rules },
    { data: prices }
  ] = await Promise.all([
    supabase.from('tools').select('*').eq('is_active', true).order('item'),
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

export const updateTool = async (id: string, updates: Partial<DBTool>) => {
  const { data, error } = await supabase
    .from('tools')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  return data;
};

export const createTool = async (tool: Omit<DBTool, 'id'> & { id?: string }) => {
  const { data, error } = await supabase
    .from('tools')
    .insert([tool])
    .select();
  if (error) throw error;
  return data?.[0];
};

export const deleteTool = async (id: string) => {
  // We use soft delete by setting is_active to false
  const { error } = await supabase
    .from('tools')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
};

export const upsertPrice = async (price: DBPrice) => {
  const { data, error } = await supabase
    .from('tool_prices')
    .upsert([price], { onConflict: 'tool_id,sub_key' });
  if (error) throw error;
  return data;
};

export const deletePrice = async (tool_id: string, sub_key: string | null) => {
    const query = supabase.from('tool_prices').delete().eq('tool_id', tool_id);
    if (sub_key === null) {
        query.is('sub_key', null);
    } else {
        query.eq('sub_key', sub_key);
    }
    const { error } = await query;
    if (error) throw error;
};

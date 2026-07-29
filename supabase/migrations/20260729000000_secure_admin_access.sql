-- OphthalSupport production access and admin RPC migration
-- Immutable, versioned production migration. Apply with `supabase db push`.
-- This migration does not create, truncate, or seed tables.

begin;

alter table operations add column if not exists sort_order integer;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if auth.uid() is null or not public.is_admin() then
        raise exception 'Admin role required'
            using errcode = '42501';
    end if;
end;
$$;

create or replace function public.admin_create_tool_with_prices(p_tool jsonb, p_prices jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.require_admin();

    insert into tools (id, item, type, category, is_active, sort_order, options, default_value)
    values (
        p_tool->>'id', p_tool->>'item', p_tool->>'type', p_tool->>'category',
        coalesce((p_tool->>'is_active')::boolean, true),
        coalesce((p_tool->>'sort_order')::integer, 999),
        p_tool->'options', p_tool->'default_value'
    );

    insert into tool_prices (tool_id, sub_key, csmbs_price, sss_price, ucs_price, display_name)
    select tool_id, sub_key, csmbs_price, sss_price, ucs_price, display_name
    from jsonb_to_recordset(p_prices) as price(
        tool_id text, sub_key text, csmbs_price numeric,
        sss_price numeric, ucs_price numeric, display_name text
    );

    return jsonb_build_object('category_supported', true, 'display_name_supported', true);
end;
$$;

create or replace function public.admin_delete_tool(p_tool_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.require_admin();
    delete from tool_prices where tool_id = p_tool_id;
    delete from operation_rules where target_type = 'tool' and target_id = p_tool_id;
    delete from tools where id = p_tool_id;
end;
$$;

create or replace function public.admin_delete_action(p_action_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.require_admin();
    delete from operation_rules where target_type = 'action' and target_id = p_action_id;
    delete from actions where id = p_action_id;
end;
$$;

create or replace function public.admin_add_subtype_to_tool(
    p_tool_id text, p_options jsonb, p_price jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.require_admin();
    update tools set options = p_options, type = 'radio' where id = p_tool_id;
    insert into tool_prices (
        tool_id, sub_key, csmbs_price, sss_price, ucs_price, display_name
    )
    values (
        p_price->>'tool_id', p_price->>'sub_key',
        (p_price->>'csmbs_price')::numeric, (p_price->>'sss_price')::numeric,
        (p_price->>'ucs_price')::numeric, p_price->>'display_name'
    );
end;
$$;

create or replace function public.admin_delete_subtype_and_update_tool(
    p_price_id text, p_tool_id text, p_options jsonb,
    p_type text, p_default_value jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.require_admin();
    delete from tool_prices where id::text = p_price_id;
    update tools
    set options = p_options, type = p_type, default_value = p_default_value
    where id = p_tool_id;
end;
$$;

create or replace function public.admin_update_tool_placement(
    p_tool_id text, p_category text, p_order_updates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.require_admin();
    if p_category is not null then
        update tools set category = p_category where id = p_tool_id;
    end if;
    update tools as tool
    set sort_order = changes.sort_order
    from jsonb_to_recordset(p_order_updates) as changes(id text, sort_order integer)
    where tool.id = changes.id;
    return jsonb_build_object('category_supported', true);
end;
$$;

create or replace function public.admin_update_operation_with_rules(
    p_operation jsonb, p_delete_rule_ids text[],
    p_insert_rules jsonb, p_update_rules jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.require_admin();
    update operations
    set name = p_operation->>'name',
        category = p_operation->>'category',
        keywords = array(select jsonb_array_elements_text(p_operation->'keywords'))
    where id::text = p_operation->>'id';

    if coalesce(array_length(p_delete_rule_ids, 1), 0) > 0 then
        delete from operation_rules where id::text = any(p_delete_rule_ids);
    end if;

    insert into operation_rules (
        operation_id, target_type, target_id, default_selected_value
    )
    select operation_id::uuid, target_type, target_id, default_selected_value
    from jsonb_to_recordset(p_insert_rules) as added(
        operation_id text, target_type text, target_id text,
        default_selected_value text
    );

    update operation_rules as rule
    set target_id = changes.target_id,
        default_selected_value = changes.default_selected_value
    from jsonb_to_recordset(p_update_rules) as changes(
        id text, target_id text, default_selected_value text
    )
    where rule.id::text = changes.id;
end;
$$;

create or replace function public.admin_update_operation_placement(
    p_operation_id text, p_category text, p_order_updates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.require_admin();
    if p_category is not null then
        update operations set category = p_category
        where id::text = p_operation_id;
    end if;
    update operations as operation
    set sort_order = changes.sort_order
    from jsonb_to_recordset(p_order_updates) as changes(id text, sort_order integer)
    where operation.id::text = changes.id;
    return jsonb_build_object('sort_order_supported', true);
end;
$$;

create or replace function public.admin_update_tool_prices(p_updates jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.require_admin();
    update tool_prices as price
    set csmbs_price = changes.csmbs_price,
        sss_price = changes.sss_price,
        ucs_price = changes.ucs_price,
        display_name = changes.display_name
    from jsonb_to_recordset(p_updates) as changes(
        id text, csmbs_price numeric, sss_price numeric,
        ucs_price numeric, display_name text
    )
    where price.id::text = changes.id;
end;
$$;

create or replace function public.admin_delete_operation(p_operation_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.require_admin();
    delete from operation_rules where operation_id::text = p_operation_id;
    delete from operations where id::text = p_operation_id;
end;
$$;

create or replace function public.admin_update_category_prices(
    p_price_updates jsonb, p_tool_updates jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.require_admin();
    update tool_prices as price
    set csmbs_price = changes.csmbs_price,
        sss_price = changes.sss_price,
        ucs_price = changes.ucs_price,
        display_name = changes.display_name
    from jsonb_to_recordset(p_price_updates) as changes(
        id text, csmbs_price numeric, sss_price numeric,
        ucs_price numeric, display_name text
    )
    where price.id::text = changes.id;

    update tools as tool
    set item = changes.item
    from jsonb_to_recordset(p_tool_updates) as changes(id text, item text)
    where tool.id = changes.id;
end;
$$;

alter table tools enable row level security;
alter table actions enable row level security;
alter table operations enable row level security;
alter table operation_rules enable row level security;
alter table tool_prices enable row level security;

grant select on tools, actions, operations, operation_rules, tool_prices
to anon, authenticated;
grant insert, update, delete on tools, actions, operations, operation_rules, tool_prices
to authenticated;

drop policy if exists "Public can read tools" on tools;
create policy "Public can read tools" on tools
for select to anon, authenticated using (true);
drop policy if exists "Admins can manage tools" on tools;
create policy "Admins can manage tools" on tools
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read actions" on actions;
create policy "Public can read actions" on actions
for select to anon, authenticated using (true);
drop policy if exists "Admins can manage actions" on actions;
create policy "Admins can manage actions" on actions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read operations" on operations;
create policy "Public can read operations" on operations
for select to anon, authenticated using (true);
drop policy if exists "Admins can manage operations" on operations;
create policy "Admins can manage operations" on operations
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read operation rules" on operation_rules;
create policy "Public can read operation rules" on operation_rules
for select to anon, authenticated using (true);
drop policy if exists "Admins can manage operation rules" on operation_rules;
create policy "Admins can manage operation rules" on operation_rules
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read tool prices" on tool_prices;
create policy "Public can read tool prices" on tool_prices
for select to anon, authenticated using (true);
drop policy if exists "Admins can manage tool prices" on tool_prices;
create policy "Admins can manage tool prices" on tool_prices
for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
revoke execute on function public.require_admin() from public, anon, authenticated;

revoke execute on function public.admin_create_tool_with_prices(jsonb, jsonb) from public, anon;
revoke execute on function public.admin_delete_tool(text) from public, anon;
revoke execute on function public.admin_delete_action(text) from public, anon;
revoke execute on function public.admin_add_subtype_to_tool(text, jsonb, jsonb) from public, anon;
revoke execute on function public.admin_delete_subtype_and_update_tool(text, text, jsonb, text, jsonb) from public, anon;
revoke execute on function public.admin_update_tool_placement(text, text, jsonb) from public, anon;
revoke execute on function public.admin_update_operation_with_rules(jsonb, text[], jsonb, jsonb) from public, anon;
revoke execute on function public.admin_update_operation_placement(text, text, jsonb) from public, anon;
revoke execute on function public.admin_update_tool_prices(jsonb) from public, anon;
revoke execute on function public.admin_delete_operation(text) from public, anon;
revoke execute on function public.admin_update_category_prices(jsonb, jsonb) from public, anon;

grant execute on function public.admin_create_tool_with_prices(jsonb, jsonb) to authenticated;
grant execute on function public.admin_delete_tool(text) to authenticated;
grant execute on function public.admin_delete_action(text) to authenticated;
grant execute on function public.admin_add_subtype_to_tool(text, jsonb, jsonb) to authenticated;
grant execute on function public.admin_delete_subtype_and_update_tool(text, text, jsonb, text, jsonb) to authenticated;
grant execute on function public.admin_update_tool_placement(text, text, jsonb) to authenticated;
grant execute on function public.admin_update_operation_with_rules(jsonb, text[], jsonb, jsonb) to authenticated;
grant execute on function public.admin_update_operation_placement(text, text, jsonb) to authenticated;
grant execute on function public.admin_update_tool_prices(jsonb) to authenticated;
grant execute on function public.admin_delete_operation(text) to authenticated;
grant execute on function public.admin_update_category_prices(jsonb, jsonb) to authenticated;

commit;

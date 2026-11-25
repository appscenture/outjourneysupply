begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, auth, app_private;

select plan(10);

select ok(
  (select count(*) = 19 from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity),
  'RLS is enabled on all application tables'
);
select has_table('public', 'purchase_orders', 'purchase orders table exists');
select has_table('public', 'inventory_items', 'inventory table exists');
select has_table('public', 'purchase_order_payments', 'payment ledger exists');
select ok(
  has_column_privilege('authenticated', 'public.purchase_orders', 'status', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.purchase_orders', 'organization_id', 'UPDATE')
    and has_column_privilege('authenticated', 'public.pos_sales', 'status', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.pos_sales', 'cashier_id', 'UPDATE'),
  'authenticated users cannot change purchase order or POS ownership fields'
);
select ok(
  not has_table_privilege('anon', 'public.purchase_orders', 'SELECT'),
  'anonymous users cannot read tenant purchase orders'
);
select throws_ok(
  $$insert into public.products (sku, name, category, unit) values ('TEST-BAD-UNIT', 'Invalid unit', 'Frozen', '')$$,
  '23514',
  null,
  'product units cannot be blank'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tenant-a@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tenant-b@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.organizations (id, name, slug)
values
  ('50000000-0000-4000-8000-000000000001', 'Test Kitchen A', 'test-kitchen-a'),
  ('50000000-0000-4000-8000-000000000002', 'Test Kitchen B', 'test-kitchen-b');

insert into public.organization_members (organization_id, user_id, role)
values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'owner'),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'owner');

set local role authenticated;
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000001';

select is(
  (select count(*)::integer from public.organizations),
  1,
  'an authenticated user only reads their own organization'
);
select is(
  (with changed as (
    update public.organizations
    set name = 'Not allowed'
    where id = '50000000-0000-4000-8000-000000000002'
    returning id
  ) select count(*)::integer from changed),
  0,
  'a tenant cannot update another tenant organization'
);
select throws_ok(
  $$delete from public.organization_members
    where organization_id = '50000000-0000-4000-8000-000000000001'
      and user_id = '40000000-0000-4000-8000-000000000001'$$,
  '23514',
  null,
  'an organization cannot remove its last owner'
);

select * from finish();
rollback;

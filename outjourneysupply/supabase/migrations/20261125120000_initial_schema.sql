create schema if not exists app_private;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'purchaser', 'inventory_manager', 'cashier')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  address text,
  timezone text not null default 'Asia/Jakarta',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, name)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplier_memberships (
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (supplier_id, user_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (length(trim(sku)) between 1 and 64),
  name text not null check (length(trim(name)) between 1 and 160),
  category text not null check (length(trim(category)) between 1 and 80),
  description text,
  unit text not null check (length(trim(unit)) between 1 and 80),
  image_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  supplier_sku text,
  price_idr bigint not null check (price_idr >= 0),
  minimum_quantity integer not null default 1 check (minimum_quantity > 0),
  lead_time_days integer not null default 1 check (lead_time_days between 0 and 365),
  is_available boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (supplier_id, product_id),
  unique (id, supplier_id, product_id)
);

create table public.organization_product_preferences (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  is_favorite boolean not null default false,
  reorder_point integer not null default 0 check (reorder_point >= 0),
  target_quantity integer check (target_quantity is null or target_quantity >= reorder_point),
  updated_at timestamptz not null default now(),
  primary key (organization_id, product_id)
);

create table public.inventory_items (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  target_quantity integer check (target_quantity is null or target_quantity >= reorder_point),
  updated_at timestamptz not null default now(),
  primary key (location_id, product_id),
  foreign key (location_id, organization_id)
    references public.locations(id, organization_id) on delete cascade
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  location_id uuid not null,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  po_number text not null check (length(trim(po_number)) between 1 and 40),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'confirmed', 'preparing', 'in_transit', 'delivered', 'cancelled')),
  created_by uuid not null references auth.users(id) on delete restrict,
  requested_delivery_date date,
  delivery_window_start time,
  delivery_window_end time,
  supplier_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, po_number),
  unique (id, organization_id),
  unique (id, supplier_id),
  foreign key (location_id, organization_id)
    references public.locations(id, organization_id) on delete restrict,
  check (
    (delivery_window_start is null and delivery_window_end is null)
    or (delivery_window_start is not null and delivery_window_end is not null and delivery_window_end > delivery_window_start)
  )
);

create table public.purchase_order_events (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete restrict,
  changed_by uuid references auth.users(id) on delete set null,
  previous_status text,
  new_status text not null check (new_status in ('draft', 'submitted', 'confirmed', 'preparing', 'in_transit', 'delivered', 'cancelled')),
  note text,
  created_at timestamptz not null default now()
);

create table public.purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null,
  supplier_id uuid not null,
  supplier_product_id uuid not null,
  product_id uuid not null,
  product_name_snapshot text not null default '',
  sku_snapshot text not null default '',
  unit_snapshot text not null default '',
  quantity_ordered integer not null check (quantity_ordered > 0),
  unit_price_idr bigint not null check (unit_price_idr >= 0),
  created_at timestamptz not null default now(),
  unique (purchase_order_id, product_id),
  unique (id, purchase_order_id),
  foreign key (purchase_order_id, supplier_id)
    references public.purchase_orders(id, supplier_id) on delete cascade,
  foreign key (supplier_product_id, supplier_id, product_id)
    references public.supplier_products(id, supplier_id, product_id) on delete restrict
);

create table public.purchase_order_receipts (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete restrict,
  received_by uuid not null references auth.users(id) on delete restrict,
  received_at timestamptz not null default now(),
  note text,
  unique (id, purchase_order_id)
);

create table public.purchase_order_receipt_lines (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null,
  purchase_order_id uuid not null,
  purchase_order_line_id uuid not null,
  quantity_received integer not null check (quantity_received > 0),
  created_at timestamptz not null default now(),
  foreign key (receipt_id, purchase_order_id)
    references public.purchase_order_receipts(id, purchase_order_id) on delete cascade,
  foreign key (purchase_order_line_id, purchase_order_id)
    references public.purchase_order_lines(id, purchase_order_id) on delete restrict
);

create table public.purchase_order_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete restrict,
  amount_idr bigint not null check (amount_idr > 0),
  method text not null check (method in ('qris', 'invoice', 'bank_transfer', 'cash', 'card', 'other')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  provider text,
  provider_reference text,
  idempotency_key text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (purchase_order_id, organization_id)
    references public.purchase_orders(id, organization_id) on delete restrict
);

create table public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  location_id uuid not null,
  cashier_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'completed', 'voided')),
  note text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  foreign key (location_id, organization_id)
    references public.locations(id, organization_id) on delete restrict
);

create table public.pos_sale_lines (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null default '',
  unit_snapshot text not null default '',
  quantity integer not null check (quantity > 0),
  unit_price_idr bigint not null check (unit_price_idr >= 0),
  line_total_idr bigint generated always as (quantity::bigint * unit_price_idr) stored,
  created_at timestamptz not null default now(),
  unique (sale_id, product_id),
  unique (id, sale_id)
);

create table public.pos_sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete restrict,
  method text not null check (method in ('cash', 'qris')),
  amount_idr bigint not null check (amount_idr > 0),
  reference text,
  created_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  location_id uuid not null,
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type text not null check (movement_type in ('purchase_receipt', 'pos_sale', 'adjustment')),
  quantity_delta integer not null check (quantity_delta <> 0),
  receipt_line_id uuid unique references public.purchase_order_receipt_lines(id) on delete restrict,
  pos_sale_line_id uuid unique references public.pos_sale_lines(id) on delete restrict,
  reason text,
  performed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (location_id, organization_id)
    references public.locations(id, organization_id) on delete restrict,
  check (
    (movement_type = 'purchase_receipt' and quantity_delta > 0 and receipt_line_id is not null and pos_sale_line_id is null)
    or (movement_type = 'pos_sale' and quantity_delta < 0 and pos_sale_line_id is not null and receipt_line_id is null)
    or (movement_type = 'adjustment' and receipt_line_id is null and pos_sale_line_id is null and length(trim(coalesce(reason, ''))) >= 3)
  )
);

create unique index purchase_order_payments_provider_reference_uidx
  on public.purchase_order_payments(provider, provider_reference)
  where provider is not null and provider_reference is not null;

create unique index purchase_order_payments_idempotency_uidx
  on public.purchase_order_payments(idempotency_key)
  where idempotency_key is not null;

create index organization_members_user_idx on public.organization_members(user_id, organization_id);
create index supplier_memberships_user_idx on public.supplier_memberships(user_id, supplier_id);
create index locations_org_active_idx on public.locations(organization_id, is_active);
create index products_category_active_idx on public.products(category, is_active);
create index supplier_products_product_available_idx on public.supplier_products(product_id, is_available, supplier_id);
create index organization_product_preferences_product_idx on public.organization_product_preferences(product_id);
create index inventory_items_org_location_idx on public.inventory_items(organization_id, location_id, product_id);
create index purchase_orders_org_status_date_idx on public.purchase_orders(organization_id, status, created_at desc);
create index purchase_orders_location_date_idx on public.purchase_orders(location_id, created_at desc);
create index purchase_orders_supplier_status_date_idx on public.purchase_orders(supplier_id, status, created_at desc);
create index purchase_order_events_order_date_idx on public.purchase_order_events(purchase_order_id, created_at desc);
create index purchase_order_lines_order_idx on public.purchase_order_lines(purchase_order_id);
create index purchase_order_lines_product_idx on public.purchase_order_lines(product_id);
create index purchase_order_receipts_order_date_idx on public.purchase_order_receipts(purchase_order_id, received_at desc);
create index purchase_order_receipt_lines_line_idx on public.purchase_order_receipt_lines(purchase_order_line_id);
create index purchase_order_payments_org_status_date_idx on public.purchase_order_payments(organization_id, status, created_at desc);
create index purchase_order_payments_order_idx on public.purchase_order_payments(purchase_order_id);
create index pos_sales_org_location_date_idx on public.pos_sales(organization_id, location_id, created_at desc);
create index pos_sale_lines_product_idx on public.pos_sale_lines(product_id);
create index stock_movements_org_location_product_date_idx
  on public.stock_movements(organization_id, location_id, product_id, created_at desc);

create or replace function app_private.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function app_private.has_organization_role(p_organization_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.role = any (p_roles)
  );
$$;

create or replace function app_private.is_supplier_member(p_supplier_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.supplier_memberships m
    where m.supplier_id = p_supplier_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function app_private.can_access_purchase_order(p_purchase_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.purchase_orders po
    where po.id = p_purchase_order_id
      and (
        app_private.is_organization_member(po.organization_id)
        or app_private.is_supplier_member(po.supplier_id)
      )
  );
$$;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function app_private.record_purchase_order_status_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.purchase_order_events (purchase_order_id, changed_by, previous_status, new_status)
  values (new.id, auth.uid(), old.status, new.status);
  return new;
end;
$$;

create or replace function app_private.snapshot_purchase_order_line()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text;
  v_sku text;
  v_unit text;
  v_price bigint;
  v_minimum_quantity integer;
  v_available boolean;
begin
  select p.name, p.sku, p.unit, sp.price_idr, sp.minimum_quantity, sp.is_available
    into v_name, v_sku, v_unit, v_price, v_minimum_quantity, v_available
  from public.supplier_products sp
  join public.products p on p.id = sp.product_id
  where sp.id = new.supplier_product_id
    and sp.supplier_id = new.supplier_id
    and sp.product_id = new.product_id
    and p.is_active;

  if v_name is null or not v_available then
    raise exception 'This supplier product is unavailable' using errcode = '23514';
  end if;
  if new.quantity_ordered < v_minimum_quantity then
    raise exception 'Quantity is below the supplier minimum of %', v_minimum_quantity using errcode = '23514';
  end if;

  new.product_name_snapshot := v_name;
  new.sku_snapshot := v_sku;
  new.unit_snapshot := v_unit;
  new.unit_price_idr := v_price;
  return new;
end;
$$;

create or replace function app_private.protect_last_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    if old.role = 'owner' and not exists (
      select 1 from public.organization_members m
      where m.organization_id = old.organization_id
        and m.user_id <> old.user_id
        and m.role = 'owner'
    ) then
      raise exception 'An organization must retain at least one owner' using errcode = '23514';
    end if;
    return old;
  end if;

  if old.role = 'owner' and new.role <> 'owner' and not exists (
    select 1 from public.organization_members m
    where m.organization_id = old.organization_id
      and m.user_id <> old.user_id
      and m.role = 'owner'
  ) then
    raise exception 'An organization must retain at least one owner' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function app_private.snapshot_pos_sale_line()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product_name text;
  v_unit text;
begin
  select p.name, p.unit into v_product_name, v_unit
  from public.products p
  join public.pos_sales s on s.id = new.sale_id
  where p.id = new.product_id
    and p.is_active
    and s.status = 'draft';

  if v_product_name is null then
    raise exception 'Sale item must be an active catalog product on a draft sale'
      using errcode = '23514';
  end if;

  new.product_name_snapshot := v_product_name;
  new.unit_snapshot := v_unit;
  return new;
end;
$$;

create or replace function public.create_organization(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organization_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to create an organization' using errcode = '28000';
  end if;

  insert into public.organizations (name, slug)
  values (trim(p_name), lower(trim(p_slug)))
  returning id into v_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_organization_id, auth.uid(), 'owner');

  return v_organization_id;
end;
$$;

create or replace function public.adjust_inventory(
  p_location_id uuid,
  p_product_id uuid,
  p_quantity_delta integer,
  p_reason text,
  p_reorder_point integer default null
)
returns integer
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  v_organization_id uuid;
  v_quantity_on_hand integer;
begin
  if p_quantity_delta = 0 or length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'A non-zero adjustment and a reason of at least 3 characters are required'
      using errcode = '22023';
  end if;
  if p_reorder_point is not null and p_reorder_point < 0 then
    raise exception 'Reorder point cannot be negative' using errcode = '22023';
  end if;

  select l.organization_id into v_organization_id
  from public.locations l
  where l.id = p_location_id and l.is_active;

  if v_organization_id is null
    or not app_private.has_organization_role(v_organization_id, array['owner', 'admin', 'inventory_manager']) then
    raise exception 'You cannot adjust inventory for this location' using errcode = '42501';
  end if;

  insert into public.inventory_items (organization_id, location_id, product_id, quantity_on_hand, reorder_point)
  values (v_organization_id, p_location_id, p_product_id, p_quantity_delta, coalesce(p_reorder_point, 0))
  on conflict (location_id, product_id) do update
  set quantity_on_hand = public.inventory_items.quantity_on_hand + excluded.quantity_on_hand,
      reorder_point = coalesce(p_reorder_point, public.inventory_items.reorder_point),
      updated_at = now()
  where public.inventory_items.quantity_on_hand + excluded.quantity_on_hand >= 0
  returning quantity_on_hand into v_quantity_on_hand;

  if v_quantity_on_hand is null then
    raise exception 'Inventory adjustment would make stock negative' using errcode = '23514';
  end if;

  insert into public.stock_movements (
    organization_id, location_id, product_id, movement_type, quantity_delta, reason, performed_by
  ) values (
    v_organization_id, p_location_id, p_product_id, 'adjustment', p_quantity_delta, trim(p_reason), auth.uid()
  );

  return v_quantity_on_hand;
end;
$$;

create or replace function public.set_inventory_reorder_point(
  p_location_id uuid,
  p_product_id uuid,
  p_reorder_point integer,
  p_target_quantity integer default null
)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  v_organization_id uuid;
begin
  select l.organization_id into v_organization_id
  from public.locations l
  where l.id = p_location_id and l.is_active;

  if v_organization_id is null
    or not app_private.has_organization_role(v_organization_id, array['owner', 'admin', 'inventory_manager']) then
    raise exception 'You cannot configure inventory for this location' using errcode = '42501';
  end if;
  if p_reorder_point < 0 or (p_target_quantity is not null and p_target_quantity < p_reorder_point) then
    raise exception 'Target quantity must be greater than or equal to the reorder point'
      using errcode = '22023';
  end if;

  update public.inventory_items
  set reorder_point = p_reorder_point,
      target_quantity = p_target_quantity,
      updated_at = now()
  where organization_id = v_organization_id
    and location_id = p_location_id
    and product_id = p_product_id;

  if not found then
    raise exception 'Inventory item must be initialized before setting reorder levels'
      using errcode = 'P0002';
  end if;
end;
$$;

create or replace function app_private.validate_purchase_order_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if not (
    (old.status = 'draft' and new.status in ('submitted', 'cancelled'))
    or (old.status = 'submitted' and new.status in ('confirmed', 'cancelled'))
    or (old.status = 'confirmed' and new.status = 'preparing')
    or (old.status = 'preparing' and new.status = 'in_transit')
    or (old.status = 'in_transit' and new.status = 'delivered')
  ) then
    raise exception 'Invalid purchase order status transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;
  if old.status = 'draft' and new.status = 'submitted' and not exists (
    select 1 from public.purchase_order_lines pol
    where pol.purchase_order_id = new.id
  ) then
    raise exception 'A purchase order must contain at least one item before submission'
      using errcode = '23514';
  end if;
  if old.status = 'in_transit' and new.status = 'delivered' and exists (
    select 1
    from public.purchase_order_lines pol
    where pol.purchase_order_id = new.id
      and pol.quantity_ordered > (
        select coalesce(sum(rl.quantity_received), 0)
        from public.purchase_order_receipt_lines rl
        where rl.purchase_order_line_id = pol.id
      )
  ) then
    raise exception 'A purchase order cannot be delivered until all items have been received'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function app_private.validate_receipt_line()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ordered integer;
  v_received integer;
  v_status text;
begin
  select pol.quantity_ordered, po.status
    into v_ordered, v_status
  from public.purchase_order_lines pol
  join public.purchase_orders po on po.id = pol.purchase_order_id
  where pol.id = new.purchase_order_line_id
    and pol.purchase_order_id = new.purchase_order_id
  for update of pol;

  if v_ordered is null then
    raise exception 'Purchase order line does not exist' using errcode = '23503';
  end if;
  if v_status not in ('confirmed', 'preparing', 'in_transit') then
    raise exception 'Items can only be received for confirmed or dispatched orders' using errcode = '23514';
  end if;

  select coalesce(sum(rl.quantity_received), 0)::integer into v_received
  from public.purchase_order_receipt_lines rl
  where rl.purchase_order_line_id = new.purchase_order_line_id;

  if v_received + new.quantity_received > v_ordered then
    raise exception 'Received quantity cannot exceed the quantity ordered' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function app_private.apply_receipt_to_inventory()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organization_id uuid;
  v_location_id uuid;
  v_product_id uuid;
begin
  select po.organization_id, po.location_id, pol.product_id
    into v_organization_id, v_location_id, v_product_id
  from public.purchase_orders po
  join public.purchase_order_lines pol on pol.purchase_order_id = po.id
  where po.id = new.purchase_order_id and pol.id = new.purchase_order_line_id;

  insert into public.inventory_items (organization_id, location_id, product_id, quantity_on_hand)
  values (v_organization_id, v_location_id, v_product_id, new.quantity_received)
  on conflict (location_id, product_id) do update
  set quantity_on_hand = public.inventory_items.quantity_on_hand + excluded.quantity_on_hand,
      updated_at = now();

  insert into public.stock_movements (
    organization_id, location_id, product_id, movement_type, quantity_delta, receipt_line_id, performed_by
  ) values (
    v_organization_id, v_location_id, v_product_id, 'purchase_receipt', new.quantity_received, new.id, auth.uid()
  );
  return new;
end;
$$;

create or replace function app_private.validate_pos_sale_completion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_line_total bigint;
  v_payment_total bigint;
  v_line_count integer;
begin
  if new.status = old.status then
    return new;
  end if;
  if old.status <> 'draft' or new.status not in ('completed', 'voided') then
    raise exception 'POS sales can only transition from draft to completed or voided'
      using errcode = '23514';
  end if;

  if new.status = 'completed' then
    select count(*), coalesce(sum(line_total_idr), 0)
      into v_line_count, v_line_total
    from public.pos_sale_lines where sale_id = new.id;
    select coalesce(sum(amount_idr), 0) into v_payment_total
    from public.pos_sale_payments where sale_id = new.id;
    if v_line_count = 0 or v_payment_total <> v_line_total then
      raise exception 'A completed sale must have items and fully settled payments'
        using errcode = '23514';
    end if;
    new.completed_at := now();
  end if;
  return new;
end;
$$;

create or replace function app_private.apply_pos_sale_to_inventory()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_line record;
  v_quantity integer;
begin
  for v_line in
    select sl.id, sl.product_id, sl.quantity, s.organization_id, s.location_id
    from public.pos_sale_lines sl
    join public.pos_sales s on s.id = sl.sale_id
    where s.id = new.id
    order by sl.product_id
  loop
    select ii.quantity_on_hand into v_quantity
    from public.inventory_items ii
    where ii.organization_id = v_line.organization_id
      and ii.location_id = v_line.location_id
      and ii.product_id = v_line.product_id
    for update;

    if v_quantity is null or v_quantity < v_line.quantity then
      raise exception 'Insufficient inventory for product %', v_line.product_id
        using errcode = '23514';
    end if;

    update public.inventory_items
    set quantity_on_hand = quantity_on_hand - v_line.quantity, updated_at = now()
    where organization_id = v_line.organization_id
      and location_id = v_line.location_id
      and product_id = v_line.product_id;

    insert into public.stock_movements (
      organization_id, location_id, product_id, movement_type, quantity_delta, pos_sale_line_id, performed_by
    ) values (
      v_line.organization_id, v_line.location_id, v_line.product_id, 'pos_sale', -v_line.quantity, v_line.id, new.cashier_id
    );
  end loop;
  return new;
end;
$$;

create trigger organizations_updated_at before update on public.organizations
  for each row execute function app_private.touch_updated_at();
create trigger suppliers_updated_at before update on public.suppliers
  for each row execute function app_private.touch_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function app_private.touch_updated_at();
create trigger purchase_orders_updated_at before update on public.purchase_orders
  for each row execute function app_private.touch_updated_at();
create trigger purchase_orders_status before update of status on public.purchase_orders
  for each row execute function app_private.validate_purchase_order_status();
create trigger purchase_orders_status_event after update of status on public.purchase_orders
  for each row when (old.status is distinct from new.status)
  execute function app_private.record_purchase_order_status_event();
create trigger organization_members_owner_guard before update or delete on public.organization_members
  for each row execute function app_private.protect_last_organization_owner();
create trigger purchase_order_lines_snapshot before insert or update on public.purchase_order_lines
  for each row execute function app_private.snapshot_purchase_order_line();
create trigger pos_sale_lines_snapshot before insert on public.pos_sale_lines
  for each row execute function app_private.snapshot_pos_sale_line();
create trigger receipt_line_validate before insert on public.purchase_order_receipt_lines
  for each row execute function app_private.validate_receipt_line();
create trigger receipt_line_inventory after insert on public.purchase_order_receipt_lines
  for each row execute function app_private.apply_receipt_to_inventory();
create trigger pos_sale_validate before update of status on public.pos_sales
  for each row execute function app_private.validate_pos_sale_completion();
create trigger pos_sale_inventory after update of status on public.pos_sales
  for each row when (old.status = 'draft' and new.status = 'completed')
  execute function app_private.apply_pos_sale_to_inventory();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.locations enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_memberships enable row level security;
alter table public.products enable row level security;
alter table public.supplier_products enable row level security;
alter table public.organization_product_preferences enable row level security;
alter table public.inventory_items enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_events enable row level security;
alter table public.purchase_order_lines enable row level security;
alter table public.purchase_order_receipts enable row level security;
alter table public.purchase_order_receipt_lines enable row level security;
alter table public.purchase_order_payments enable row level security;
alter table public.pos_sales enable row level security;
alter table public.pos_sale_lines enable row level security;
alter table public.pos_sale_payments enable row level security;
alter table public.stock_movements enable row level security;

create policy "organization members can read their organizations"
  on public.organizations for select to authenticated
  using (app_private.is_organization_member(id));
create policy "organization admins can update their organizations"
  on public.organizations for update to authenticated
  using (app_private.has_organization_role(id, array['owner', 'admin']))
  with check (app_private.has_organization_role(id, array['owner', 'admin']));

create policy "members can read their organization membership"
  on public.organization_members for select to authenticated
  using (user_id = auth.uid() or app_private.has_organization_role(organization_id, array['owner', 'admin']));
create policy "organization admins can add members"
  on public.organization_members for insert to authenticated
  with check (app_private.has_organization_role(organization_id, array['owner', 'admin']));
create policy "organization admins can update members"
  on public.organization_members for update to authenticated
  using (app_private.has_organization_role(organization_id, array['owner', 'admin']))
  with check (app_private.has_organization_role(organization_id, array['owner', 'admin']));
create policy "organization admins can remove members"
  on public.organization_members for delete to authenticated
  using (app_private.has_organization_role(organization_id, array['owner', 'admin']));

create policy "members can read organization locations"
  on public.locations for select to authenticated
  using (
    app_private.is_organization_member(organization_id)
    or exists (
      select 1
      from public.purchase_orders po
      where po.location_id = id
        and app_private.is_supplier_member(po.supplier_id)
    )
  );
create policy "organization admins can create locations"
  on public.locations for insert to authenticated
  with check (app_private.has_organization_role(organization_id, array['owner', 'admin']));
create policy "organization admins can update locations"
  on public.locations for update to authenticated
  using (app_private.has_organization_role(organization_id, array['owner', 'admin']))
  with check (app_private.has_organization_role(organization_id, array['owner', 'admin']));
create policy "organization admins can delete locations"
  on public.locations for delete to authenticated
  using (app_private.has_organization_role(organization_id, array['owner', 'admin']));

create policy "authenticated members can read active suppliers"
  on public.suppliers for select to authenticated
  using (
    status = 'active'
    and exists (
      select 1 from public.organization_members m where m.user_id = auth.uid()
    )
    or app_private.is_supplier_member(id)
  );
create policy "supplier users can read their supplier membership"
  on public.supplier_memberships for select to authenticated
  using (user_id = auth.uid());

create policy "organization and supplier members can read active products"
  on public.products for select to authenticated
  using (
    is_active and (
      exists (select 1 from public.organization_members m where m.user_id = auth.uid())
      or exists (
        select 1 from public.supplier_products sp
        where sp.product_id = id and app_private.is_supplier_member(sp.supplier_id)
      )
    )
  );
create policy "organizations and assigned suppliers can read supplier listings"
  on public.supplier_products for select to authenticated
  using (
    is_available
    and exists (select 1 from public.organization_members m where m.user_id = auth.uid())
    or app_private.is_supplier_member(supplier_id)
  );

create policy "members can read organization product preferences"
  on public.organization_product_preferences for select to authenticated
  using (app_private.is_organization_member(organization_id));
create policy "purchasing roles can manage product preferences"
  on public.organization_product_preferences for all to authenticated
  using (app_private.has_organization_role(organization_id, array['owner', 'admin', 'purchaser']))
  with check (app_private.has_organization_role(organization_id, array['owner', 'admin', 'purchaser']));

create policy "members can read inventory"
  on public.inventory_items for select to authenticated
  using (app_private.is_organization_member(organization_id));
create policy "inventory roles can configure inventory"
  on public.inventory_items for insert to authenticated
  with check (app_private.has_organization_role(organization_id, array['owner', 'admin', 'inventory_manager']));
create policy "inventory roles can update inventory settings"
  on public.inventory_items for update to authenticated
  using (app_private.has_organization_role(organization_id, array['owner', 'admin', 'inventory_manager']))
  with check (app_private.has_organization_role(organization_id, array['owner', 'admin', 'inventory_manager']));
create policy "organization admins can remove inventory items"
  on public.inventory_items for delete to authenticated
  using (app_private.has_organization_role(organization_id, array['owner', 'admin']));

create policy "organization and assigned supplier users can read purchase orders"
  on public.purchase_orders for select to authenticated
  using (
    app_private.is_organization_member(organization_id)
    or app_private.is_supplier_member(supplier_id)
  );
create policy "purchasing roles can create purchase orders"
  on public.purchase_orders for insert to authenticated
  with check (
    status = 'draft'
    and created_by = auth.uid()
    and app_private.has_organization_role(organization_id, array['owner', 'admin', 'purchaser'])
  );
create policy "purchasing roles can update draft and submitted orders"
  on public.purchase_orders for update to authenticated
  using (
    status in ('draft', 'submitted')
    and app_private.has_organization_role(organization_id, array['owner', 'admin', 'purchaser'])
  )
  with check (
    status in ('draft', 'submitted', 'cancelled')
    and app_private.has_organization_role(organization_id, array['owner', 'admin', 'purchaser'])
  );
create policy "assigned suppliers can update fulfillment status"
  on public.purchase_orders for update to authenticated
  using (
    status in ('confirmed', 'preparing', 'in_transit')
    and app_private.is_supplier_member(supplier_id)
  )
  with check (
    status in ('preparing', 'in_transit', 'delivered')
    and app_private.is_supplier_member(supplier_id)
  );

create policy "purchase order participants can read order lines"
  on public.purchase_order_lines for select to authenticated
  using (app_private.can_access_purchase_order(purchase_order_id));
create policy "purchase order participants can read status history"
  on public.purchase_order_events for select to authenticated
  using (app_private.can_access_purchase_order(purchase_order_id));
create policy "purchasing roles can manage draft order lines"
  on public.purchase_order_lines for all to authenticated
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id
        and po.status = 'draft'
        and app_private.has_organization_role(po.organization_id, array['owner', 'admin', 'purchaser'])
    )
  )
  with check (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id
        and po.status = 'draft'
        and app_private.has_organization_role(po.organization_id, array['owner', 'admin', 'purchaser'])
    )
  );

create policy "organization members can read purchase receipts"
  on public.purchase_order_receipts for select to authenticated
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id and app_private.is_organization_member(po.organization_id)
    )
  );
create policy "inventory roles can create purchase receipts"
  on public.purchase_order_receipts for insert to authenticated
  with check (
    received_by = auth.uid()
    and exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id
        and app_private.has_organization_role(po.organization_id, array['owner', 'admin', 'inventory_manager'])
    )
  );
create policy "organization members can read receipt lines"
  on public.purchase_order_receipt_lines for select to authenticated
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id and app_private.is_organization_member(po.organization_id)
    )
  );
create policy "inventory roles can add receipt lines"
  on public.purchase_order_receipt_lines for insert to authenticated
  with check (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id
        and app_private.has_organization_role(po.organization_id, array['owner', 'admin', 'inventory_manager'])
    )
  );

create policy "purchasing roles can read purchase order payments"
  on public.purchase_order_payments for select to authenticated
  using (app_private.has_organization_role(organization_id, array['owner', 'admin', 'purchaser']));

create policy "organization members can read POS sales"
  on public.pos_sales for select to authenticated
  using (
    app_private.has_organization_role(organization_id, array['owner', 'admin', 'inventory_manager', 'cashier'])
  );
create policy "cashiers can create draft POS sales"
  on public.pos_sales for insert to authenticated
  with check (
    status = 'draft'
    and cashier_id = auth.uid()
    and app_private.has_organization_role(organization_id, array['owner', 'admin', 'cashier'])
  );
create policy "cashiers can complete or void their draft sale"
  on public.pos_sales for update to authenticated
  using (
    status = 'draft'
    and app_private.has_organization_role(organization_id, array['owner', 'admin', 'cashier'])
  )
  with check (
    status in ('draft', 'completed', 'voided')
    and app_private.has_organization_role(organization_id, array['owner', 'admin', 'cashier'])
  );

create policy "organization members can read POS sale lines"
  on public.pos_sale_lines for select to authenticated
  using (
    exists (
      select 1 from public.pos_sales s
      where s.id = sale_id
        and app_private.has_organization_role(s.organization_id, array['owner', 'admin', 'inventory_manager', 'cashier'])
    )
  );
create policy "cashiers can add items to draft sales"
  on public.pos_sale_lines for insert to authenticated
  with check (
    exists (
      select 1 from public.pos_sales s
      where s.id = sale_id
        and s.status = 'draft'
        and app_private.has_organization_role(s.organization_id, array['owner', 'admin', 'cashier'])
    )
  );
create policy "cashiers can edit items on draft sales"
  on public.pos_sale_lines for update to authenticated
  using (
    exists (
      select 1 from public.pos_sales s
      where s.id = sale_id and s.status = 'draft'
        and app_private.has_organization_role(s.organization_id, array['owner', 'admin', 'cashier'])
    )
  )
  with check (
    exists (
      select 1 from public.pos_sales s
      where s.id = sale_id and s.status = 'draft'
        and app_private.has_organization_role(s.organization_id, array['owner', 'admin', 'cashier'])
    )
  );
create policy "cashiers can remove items from draft sales"
  on public.pos_sale_lines for delete to authenticated
  using (
    exists (
      select 1 from public.pos_sales s
      where s.id = sale_id and s.status = 'draft'
        and app_private.has_organization_role(s.organization_id, array['owner', 'admin', 'cashier'])
    )
  );

create policy "organization members can read POS payments"
  on public.pos_sale_payments for select to authenticated
  using (
    exists (
      select 1 from public.pos_sales s
      where s.id = sale_id
        and app_private.has_organization_role(s.organization_id, array['owner', 'admin', 'cashier'])
    )
  );
create policy "cashiers can add payments to draft sales"
  on public.pos_sale_payments for insert to authenticated
  with check (
    exists (
      select 1 from public.pos_sales s
      where s.id = sale_id and s.status = 'draft'
        and app_private.has_organization_role(s.organization_id, array['owner', 'admin', 'cashier'])
    )
  );

create policy "organization members can read stock movement history"
  on public.stock_movements for select to authenticated
  using (app_private.is_organization_member(organization_id));

revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;
revoke all on all functions in schema app_private from public, anon;
grant execute on function app_private.is_organization_member(uuid) to authenticated;
grant execute on function app_private.has_organization_role(uuid, text[]) to authenticated;
grant execute on function app_private.is_supplier_member(uuid) to authenticated;
grant execute on function app_private.can_access_purchase_order(uuid) to authenticated;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.adjust_inventory(uuid, uuid, integer, text, integer) to authenticated;
grant execute on function public.set_inventory_reorder_point(uuid, uuid, integer, integer) to authenticated;
create view public.pos_sale_totals
with (security_invoker = true)
as
select
  s.id as sale_id,
  s.organization_id,
  s.location_id,
  s.status,
  coalesce(lines.total_idr, 0)::bigint as total_idr,
  coalesce(payments.paid_idr, 0)::bigint as paid_idr
from public.pos_sales s
left join (
  select sale_id, sum(line_total_idr)::bigint as total_idr
  from public.pos_sale_lines
  group by sale_id
) lines on lines.sale_id = s.id
left join (
  select sale_id, sum(amount_idr)::bigint as paid_idr
  from public.pos_sale_payments
  group by sale_id
) payments on payments.sale_id = s.id;

create view public.purchase_order_receipt_totals
with (security_invoker = true)
as
select
  pol.id as purchase_order_line_id,
  pol.purchase_order_id,
  pol.quantity_ordered,
  coalesce(sum(rl.quantity_received), 0)::integer as quantity_received,
  (pol.quantity_ordered - coalesce(sum(rl.quantity_received), 0)::integer) as quantity_remaining
from public.purchase_order_lines pol
left join public.purchase_order_receipt_lines rl on rl.purchase_order_line_id = pol.id
group by pol.id, pol.purchase_order_id, pol.quantity_ordered;


revoke all on all tables in schema public from public, anon, authenticated;
revoke all on function public.create_organization(text, text) from public, anon, authenticated;
revoke all on function public.adjust_inventory(uuid, uuid, integer, text, integer) from public, anon, authenticated;
revoke all on function public.set_inventory_reorder_point(uuid, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.adjust_inventory(uuid, uuid, integer, text, integer) to authenticated;
grant execute on function public.set_inventory_reorder_point(uuid, uuid, integer, integer) to authenticated;

grant select, update (name, slug) on public.organizations to authenticated;
grant select, insert, update (role), delete on public.organization_members to authenticated;
grant select, insert, update (name, address, timezone, is_active), delete on public.locations to authenticated;
grant select on public.suppliers, public.supplier_memberships, public.products, public.supplier_products to authenticated;
grant select, insert, update (is_favorite, reorder_point, target_quantity), delete
  on public.organization_product_preferences to authenticated;
grant select on public.inventory_items to authenticated;
grant select, insert (
  organization_id, location_id, supplier_id, po_number, created_by,
  requested_delivery_date, delivery_window_start, delivery_window_end
), update (status, requested_delivery_date, delivery_window_start, delivery_window_end, supplier_note)
  on public.purchase_orders to authenticated;
grant select, insert, update (quantity_ordered), delete on public.purchase_order_lines to authenticated;
grant select on public.purchase_order_events, public.purchase_order_payments to authenticated;
grant select, insert (purchase_order_id, received_by, note) on public.purchase_order_receipts to authenticated;
grant select, insert (receipt_id, purchase_order_id, purchase_order_line_id, quantity_received)
  on public.purchase_order_receipt_lines to authenticated;
grant select, insert (organization_id, location_id, cashier_id, note), update (status, note)
  on public.pos_sales to authenticated;
grant select, insert (sale_id, product_id, quantity, unit_price_idr),
  update (quantity, unit_price_idr), delete on public.pos_sale_lines to authenticated;
grant select, insert (sale_id, method, amount_idr, reference) on public.pos_sale_payments to authenticated;
grant select on public.stock_movements, public.pos_sale_totals, public.purchase_order_receipt_totals
  to authenticated;

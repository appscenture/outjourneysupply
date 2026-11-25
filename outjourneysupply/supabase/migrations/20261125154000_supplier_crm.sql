alter table public.organizations
  add column contact_name text,
  add column email text,
  add column whatsapp_phone text,
  add column billing_address text,
  add column notes text,
  add column status text not null default 'active'
    check (status in ('active', 'inactive'));

create table public.supplier_inventory (
  product_id uuid primary key references public.products(id) on delete restrict,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  updated_at timestamptz not null default now()
);

create table public.crm_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  document_type text not null check (document_type in ('purchase_order', 'rfq', 'invoice')),
  document_number text not null check (length(trim(document_number)) between 1 and 80),
  amount_idr bigint check (amount_idr is null or amount_idr >= 0),
  issued_at date not null default current_date,
  due_at date,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'pending', 'overdue', 'paid', 'closed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type, document_number)
);

create index crm_documents_customer_date_idx
  on public.crm_documents(organization_id, issued_at desc);
create index crm_documents_type_status_due_idx
  on public.crm_documents(document_type, status, due_at);

create trigger supplier_inventory_touch_updated_at
  before update on public.supplier_inventory
  for each row execute function app_private.touch_updated_at();
create trigger crm_documents_touch_updated_at
  before update on public.crm_documents
  for each row execute function app_private.touch_updated_at();

alter table public.supplier_inventory enable row level security;
alter table public.crm_documents enable row level security;

create policy "organization members can read their CRM documents"
  on public.crm_documents for select to authenticated
  using (app_private.is_organization_member(organization_id));

revoke all on table public.supplier_inventory, public.crm_documents from public, anon, authenticated;
grant select on public.crm_documents to authenticated;
grant all on table public.supplier_inventory, public.crm_documents to service_role;
grant select, insert, update on public.organizations to service_role;

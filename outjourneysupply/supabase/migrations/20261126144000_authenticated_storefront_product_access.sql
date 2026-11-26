create policy "authenticated users can read active storefront products"
  on public.products for select to authenticated
  using (is_active);

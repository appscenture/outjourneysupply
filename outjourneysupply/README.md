# Outjourney

Outjourney is a Next.js installable app for food-service businesses. The original Outjourney supply site is the public home page at `/`; the B2B ordering workspace is at `/workspace`. The workspace is designed for quick ordering, purchase-order tracking, location inventory, suppliers, QRIS-ready payments, and counter POS. The supplied Outjourney logo is used on the site and in the PWA icons.

## Run the app

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. To create a production build, run `npm run build`; run it locally with `npm start`.

The `/login` page supports the `admin` username/password and Google OAuth through Supabase Auth. The username maps to the existing Auth account configured by `NEXT_PUBLIC_ADMIN_LOGIN_EMAIL`; its password must be set on that account in Supabase Auth and is never stored in project files. `/workspace` verifies that account's session and redirects other visitors to login. Workspace orders and inventory still use demo records saved in the browser, and the hosted database schema has not been applied.

## Supabase development

The versioned migration, fictional seed data, and pgTAP checks are under `supabase/`. The schema is designed for Supabase Auth and Postgres RLS. Browser and server-side session clients use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; set `NEXT_PUBLIC_ADMIN_LOGIN_EMAIL` to the email of the existing Supabase Auth account used for the `admin` username. The login and workspace guard do not require a Supabase secret key.

For isolated local database development:

1. Install and start Docker Desktop.
2. Copy `.env.example` to `.env.local`. Use the local URL and publishable key shown by `npx supabase status`, and set `NEXT_PUBLIC_ADMIN_LOGIN_EMAIL` to the Auth account email used for local sign-in.
3. Run `npm run supabase:start`.
4. Run `npm run supabase:reset` to apply migrations and load fictional seed data.
5. Run `npm run supabase:test` to execute the database and RLS checks.

`.env.local` is ignored by Git. Never put a secret key in a `NEXT_PUBLIC_` variable or commit credentials. A secret key is unnecessary for the current sign-in flow. The hosted Supabase project has **not** been linked, migrated, or otherwise changed; do not run `supabase link` or `supabase db push` as part of local testing.

To enable Google sign-in, configure the Google provider in Supabase Auth with your Google OAuth client ID and secret. Add `http://localhost:3000/auth/callback` to Supabase's allowed redirect URLs, and configure Supabase's callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`) as an authorized redirect URI in Google Cloud. Google must return the same email configured by `NEXT_PUBLIC_ADMIN_LOGIN_EMAIL` to access the admin workspace.

For Vercel or another deployment, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_ADMIN_LOGIN_EMAIL` in the deployment environment before building. The last value is the existing Auth account email; it is public configuration, not a password or secret.

## Database design

The initial migration creates 19 RLS-enabled application tables:

- **Tenants and access:** `organizations`, `organization_members` (roles: owner, admin, purchaser, inventory manager, cashier), and `locations`.
- **Shared catalog:** `suppliers`, `supplier_memberships`, `products`, `supplier_products` (supplier price, minimum quantity, availability, and lead time), and `organization_product_preferences`.
- **Inventory:** `inventory_items` is scoped to an organization and location; `stock_movements` audits adjustments, receipts, and POS deductions.
- **Purchasing:** `purchase_orders`, `purchase_order_lines`, `purchase_order_events`, `purchase_order_receipts`, `purchase_order_receipt_lines`, and `purchase_order_payments`.
- **POS:** `pos_sales`, `pos_sale_lines`, and `pos_sale_payments`.

Organization-owned data is tenant-scoped and location relationships use composite foreign keys to prevent cross-tenant references. Supplier and product catalog records are shared; a supplier listing carries its own price, MOQ, availability, and delivery lead time. Order lines retain product and price snapshots. IDR amounts use integer rupiah values (`bigint`).

RLS is enabled on every application table. Organization roles govern purchasing, inventory, and POS access; supplier members can access only their assigned supplier's orders and fulfillment information. Purchasers can submit or cancel eligible orders, suppliers advance fulfillment through the allowed status transitions, and inventory receipt and POS completion triggers create stock movements. Partial receipts are supported, but an order cannot be marked delivered until all ordered quantities have been received. Payments have provider-neutral QRIS and other tender fields; payment-provider callbacks and payment writes are intentionally not exposed to browser clients.

Indexes cover tenant/order status and date filters, supplier fulfillment queues, location inventory, catalog categories and supplier listings, order/receipt history, POS activity, payments, and stock movement history. The `pos_sale_totals` and `purchase_order_receipt_totals` views use invoker security so their results remain subject to the caller's RLS access.

The seed file contains development-only fictional suppliers and products. TypeScript database types are not generated because this project currently uses JavaScript.

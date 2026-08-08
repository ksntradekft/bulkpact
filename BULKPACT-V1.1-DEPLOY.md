# BulkPact V1.1.0 — deployment

## Existing V9.2.1 Supabase database

1. Create a backup of the current Supabase project and GitHub repository.
2. In Supabase SQL Editor run `BULKPACT-V1.1-UPGRADE-FROM-PLH-V9.2.1.sql` once.
3. Upload the complete BulkPact project to a new GitHub repository (recommended) or replace the old application files.
4. Add the values from `.env.example` to Vercel → Project → Settings → Environment Variables.
5. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
6. Optional: `DEEPSEEK_API_KEY`, SMTP variables and `CRON_SECRET`.
7. Deploy on Vercel.
8. Open `/api/system/status`. `supabaseConfigured`, `authConfigured` and `groupOrderDatabaseReady` should be `true`.
9. Supplier test: register at `/supplier/register`, approve the supplier in `/admin/suppliers`, then create a fixed-price Group Order.
10. Admin test: set the campaign to `OPEN` and `PUBLIC` or `BUYERS_ONLY`.
11. Buyer test: register at `/buyer/register`, open the campaign and reserve quantity. The progress bar must update and the database function prevents overbooking.

## Core commercial rule

BulkPact V1.1 uses exactly one fixed `unit_price` and one `target_quantity`/MOQ per Group Order. The price unit can differ from the reservation unit through `price_unit` and `price_units_per_order_unit` (for example €18.50/carton, 60 cartons/pallet, MOQ 66 pallets). The legacy `group_order_price_tiers` table is not used by the application.

## Security

Never commit `SUPABASE_SERVICE_ROLE_KEY`, SMTP passwords, DeepSeek keys or `CRON_SECRET` to GitHub. Keep them only in Vercel environment variables.

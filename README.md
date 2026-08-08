# BulkPact V1.1.0

**Buy together. Reach the MOQ.**

BulkPact is a European B2B group-buying platform for retailers, HoReCa businesses, e-commerce sellers, manufacturers, importers, distributors and wholesalers.

## Core rule

Every Group Order has:

- one **fixed deal price**;
- one **fixed MOQ**;
- one participation deadline;
- a minimum quantity per buyer;
- a reservation/MOQ unit (for example pallet);
- a separate price unit and conversion (for example €18.50/carton and 60 cartons/pallet);
- interest and commitment tracked separately.

There are **no dynamic quantity price tiers**. If combined commitments reach the MOQ, the deal proceeds at the fixed campaign price. If the MOQ is not reached, the deal does not proceed.

## Main product surfaces

### Public
- `/` — Group Order-first homepage
- `/group-orders` — public deal marketplace
- `/how-it-works` — fixed-price / fixed-MOQ explanation
- `/pricing` — buyer and supplier plans
- `/login` / `/register`
- `/legal/privacy` / `/legal/terms`

### Buyer
- `/buyer` — dashboard
- `/buyer/group-orders` — interest + commitment workflow
- `/buyer/landed-cost` — landed-cost calculator
- `/buyer/profile` — company profile
- `/buyer/messages`
- `/buyer/billing`
- `/buyer/support`

### Supplier
- `/supplier` — supplier dashboard
- `/supplier/group-orders` — submit fixed-price, fixed-MOQ offers
- `/supplier/profile`
- `/supplier/verification`
- `/supplier/messages`
- `/supplier/billing`
- `/supplier/support`

### Admin
- `/admin` — platform overview
- `/admin/group-orders` — Group Order control center
- `/admin/suppliers` — supplier approvals
- `/admin/verifications`
- `/admin/users`
- `/admin/commercial`
- `/admin/operations`
- `/admin/analytics`
- `/admin/support`
- `/admin/settings`

## Existing Supabase database

This project was deliberately kept compatible with the existing V9.2.1 Supabase database. Run `BULKPACT-V1.1-UPGRADE-FROM-PLH-V9.2.1.sql` once before the first BulkPact deployment. It is non-destructive and keeps legacy tables/data intact while enforcing the BulkPact Group Order lifecycle.

Legacy database column/table names such as `manufacturer_profiles` remain internally so the existing production data and authentication continue to work. They are presented to users as **Suppliers**.

The historical `group_order_price_tiers` table can remain in Supabase, but BulkPact V1.1 does not read from it, write to it or display it. New campaigns require one fixed `unit_price` greater than zero.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the required Supabase values. Never commit `.env.local` or `SUPABASE_SERVICE_ROLE_KEY`.

DeepSeek is optional and is used only for HU/EN translation of user-generated content. SMTP is optional. `CRON_SECRET` protects scheduled follow-up execution.

## Vercel deployment

1. Run `BULKPACT-V1.1-UPGRADE-FROM-PLH-V9.2.1.sql` in Supabase SQL Editor.
2. Upload the project files to the GitHub repository, replacing the previous application files.
3. Keep secrets only in **Vercel → Settings → Environment Variables**.
4. Set `NEXT_PUBLIC_SITE_URL` to the final deployment/domain.
5. Deploy.
6. Check `/api/system/status` and `/api/system/version`.

## Brand

Working brand: **BulkPact**  
Tagline: **Buy together. Reach the MOQ.**

The name was selected because it communicates bulk purchasing + a pact between buyers. A preliminary web search did not surface an obvious same-name European B2B group-buying marketplace. This is not trademark or domain clearance; complete EUIPO/domain checks before a public commercial launch.

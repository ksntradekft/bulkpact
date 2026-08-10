# BulkPact 1.2.0

**Buy together. Reach the MOQ.**

BulkPact is a B2B group-buying platform for retailers, HoReCa businesses, e-commerce sellers, importers, distributors, wholesalers and manufacturers.

This repository is the **clean-start edition**: it can be connected to a brand-new Supabase project. It does not require the former Private Label House database, RFQs, sourcing tables or migration history.

## Commercial rule

Every Group Order has exactly:

- one fixed supplier price;
- one fixed MOQ / target quantity;
- one participation deadline;
- one minimum quantity per buyer;
- a reservation unit and, when needed, a separate price unit conversion;
- separate non-binding interest and quantity commitment tracking.

There are **no dynamic price tiers**. When combined commitments reach the MOQ, the campaign can proceed through the order lifecycle. The default transaction fee is **1.5% for the buyer and 1.5% for the supplier**; subscription and add-on prices are managed separately.

Lifecycle:

`DRAFT → OPEN → FILLED → DEPOSIT → LOCKED → SUPPLIER_CONFIRMED → ORDERED → DISPATCHED → DELIVERED → COMPLETED`

A campaign can also become `CANCELLED`.

## Product surfaces

### Public
- `/` — Group Order-first homepage
- `/group-orders` — public deal marketplace
- `/group-orders/[id]` — campaign detail
- `/how-it-works`
- `/pricing`
- `/login` / `/register`
- `/legal/privacy` / `/legal/terms`

### Buyer
- `/buyer` — dashboard
- `/buyer/group-orders` — interest + commitment workflow
- `/buyer/landed-cost` — landed-cost calculator
- `/buyer/profile`
- `/buyer/messages`
- `/buyer/billing`
- `/buyer/support`

### Supplier
- `/supplier` — dashboard
- `/supplier/group-orders` — create fixed-price / fixed-MOQ offers
- `/supplier/profile`
- `/supplier/verification` — including VIES check
- `/supplier/messages`
- `/supplier/billing`
- `/supplier/support`

### Admin
- `/admin` — platform overview
- `/admin/group-orders`
- `/admin/suppliers`
- `/admin/verifications`
- `/admin/users`
- `/admin/commercial`
- `/admin/operations`
- `/admin/analytics`
- `/admin/support`
- `/admin/settings`

## Stack

- Next.js 15.5.21
- React 19.1.1
- TypeScript
- Supabase PostgreSQL + Auth + Storage
- Vercel-ready deployment
- optional SMTP notifications
- optional DeepSeek HU → EN content translation

The application deliberately pins the framework versions used by the last working BulkPact build instead of doing a framework migration at the same time as the database reset.

## 1. Create a new Supabase project

Open **Supabase → SQL Editor** and run:

```text
supabase/migrations/202608090001_initial.sql
```

That single migration creates all tables, RLS rules, auth trigger, Group Order reservation RPC, billing/operations tables and the private `bulkpact-documents` Storage bucket.

Optional demo marketplace data:

```text
supabase/seed.sql
```

Do not run the demo seed on production unless you intentionally want demo campaigns.

## 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional:

```env
NEXT_PUBLIC_SUPPORT_EMAIL=
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-v4-flash
CRON_SECRET=
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
MAIL_FROM_NAME=BulkPact
MAIL_FROM_EMAIL=
```

Never commit `.env.local`, the Supabase service-role key, SMTP passwords, DeepSeek keys or the cron secret.

## 3. Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run build
```

Then open:

- `/api/system/status`
- `/api/system/version`

The status endpoint should report the database, commercial and operations modules as ready.

## 4. Create the first admin

Register a normal buyer account first, then in Supabase SQL Editor run:

```sql
update public.profiles
set role='ADMIN', status='ACTIVE', updated_at=now()
where email='YOUR-EMAIL@EXAMPLE.COM';
```

Log in at `/admin/login`.

## 5. Supplier flow

1. Supplier registers at `/supplier/register`.
2. Admin approves the supplier in `/admin/suppliers`.
3. Supplier creates a Group Order; new supplier-created campaigns start as `DRAFT` and `BUYERS_ONLY`.
4. Admin reviews and opens/publishes the campaign.
5. Buyers can register interest or reserve quantity.
6. `reserve_group_order(...)` locks the Group Order row and prevents overbooking while recalculating MOQ progress transactionally.

## 6. New GitHub repository

From the project root:

```bash
git init
git add .
git commit -m "Initial BulkPact 1.2.0"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPO.git
git push -u origin main
```

## 7. Vercel

1. Import the new GitHub repository into Vercel.
2. Add the environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_SITE_URL` to the deployed domain.
4. Deploy.
5. Check `/api/system/status`.

For scheduled follow-ups, configure a protected request to `/api/automation/followups` and set `CRON_SECRET`.

## Security model

- The service-role key is used only in server-side code.
- Browser profile writes are restricted by RLS and column-level grants.
- Group Order commitments are created through a server-side transactional RPC.
- Documents are stored in a private bucket and served through authenticated application routes.
- Sensitive keys are excluded by `.gitignore`.

## Internal naming

For code stability the authenticated supplier role is internally named `MANUFACTURER`, while `manufacturer_profiles.supplier_type` supports `MANUFACTURER`, `WHOLESALER` and `BOTH`. The user-facing product consistently uses **Supplier**. No private-label/RFQ workflow is part of this clean database.

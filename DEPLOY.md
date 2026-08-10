# BulkPact clean deployment

1. Create an empty Supabase project.
2. Run `supabase/migrations/202608090001_initial.sql` in SQL Editor.
3. Optionally run `supabase/seed.sql` for public demo campaigns.
4. Copy `.env.example` to `.env.local` for local development.
5. Set the same required environment variables in Vercel.
6. Run `npm install`, `npm run typecheck`, and `npm run build`.
7. Push this directory to a new GitHub repository.
8. Import that repository in Vercel and deploy.
9. Verify `/api/system/status`.
10. Create the first admin by registering, then changing that profile's role to `ADMIN` in Supabase.

No legacy database upgrade is required.

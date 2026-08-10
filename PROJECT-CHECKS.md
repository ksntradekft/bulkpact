# BulkPact repository checks

This clean-start package was checked before packaging.

- Next.js route collision check: passed (52 page routes).
- TypeScript/TSX syntax transpilation check: passed (150 source files; dependency resolution intentionally skipped).
- Internal `@/` and relative import target check: passed.
- Fresh Supabase schema/table reference check: passed.
- PostgREST embedded foreign-key join name check: passed.
- Legacy Group Order price-tier and old document-bucket reference scan: passed.
- Fixed transaction-fee rule: 1.5% buyer + 1.5% supplier is enforced in schema/server paths.

## Environment limitation

A full `npm install`, `npm run typecheck` and `npm run build` could not be executed in the artifact sandbox because its internal npm registry returned HTTP 404 for `@types/node`. This is an infrastructure/package-registry limitation of the sandbox, not a successful build result. Run the commands below from a normal npm environment before production deployment:

```bash
npm install
npm run check:repo
npm run typecheck
npm run build
```

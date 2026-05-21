# Susu Collector

A mobile-first fintech application for field agents to record customer savings collections, upload receipts, and monitor assigned customers in a Susu microfinance system.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/susu-collector run dev` — run the frontend (port 24522)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — token signing key

## Test Login

- **Email**: `collector@susu.gh`
- **Password**: `password123`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Charts: Recharts

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `lib/db/src/schema/` — Drizzle ORM tables: collectors, customers, collections, loans, receipts
- `artifacts/api-server/src/routes/` — Express route handlers (auth, dashboard, customers, collections, receipts)
- `artifacts/susu-collector/src/` — React frontend (pages, components, hooks)

## Architecture decisions

- Contract-first API: OpenAPI spec gates all codegen; no hand-written types
- Simple token auth: AES-256-CBC encrypted JWT-style tokens stored in localStorage
- Dark mode default: CSS custom properties with HSL values, toggled via class on `document.documentElement`
- Mobile-first layout: Bottom nav on mobile (<768px), sidebar on desktop
- Currency: GHS (Ghanaian Cedis) formatting throughout

## Product

Field collectors log in to see their daily dashboard: total collected, pending customers, loan repayments, and a 7-day trend chart. They can browse their assigned customer list (with search + status filter), view customer detail pages with savings/loans/receipts tabs, record new collections, and upload receipts. All data feeds into real-time dashboard updates.

## User preferences

- Supabase-ready architecture requested (can swap Drizzle/PG for Supabase client)
- Dark mode by default
- Mobile-first design
- Currency: GHS (Ghanaian Cedis)

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes
- Run `pnpm run typecheck:libs` after schema changes before running the API server typecheck
- The `SESSION_SECRET` env var is used for token signing (falls back to a default in dev)
- Password hashing uses SHA-256 + static salt — replace with bcrypt for production

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

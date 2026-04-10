# AGENTS.md

This is the quick-start guide for humans or agents working in `gym-community`.
Use it as the repo root signpost, not as the full source of truth.

Read product and setup details in `README.md`, system structure in `ARCHITECTURE.md`, and secret or data-safety rules in `SECURITY.md`.

## Read This First

1. `README.md`
2. `ARCHITECTURE.md`
3. `SECURITY.md`
4. The route, component, service, or SQL file closest to the change

## Quick Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run test
npm run test:e2e
```

- Run `npm run build` before `npm run test:e2e`.
- For database setup, use `supabase/schema.sql` and then `supabase/verify.sql`.
- Treat `supabase/run_once.sql` as legacy bootstrap material, not the default path for new work.

## Repo Map

- `src/App.jsx`: app shell, top-level state, overlays, action handlers
- `src/routes/`: screen-level route entry points
- `src/hooks/useAppBootstrap.js`: initial load and refresh orchestration
- `src/hooks/useAppDerivedState.js`: computed UI state
- `src/services/communityService.js`: main Supabase data access layer
- `src/services/auth.js`: session lookup and sign-in/out helpers
- `src/lib/supabaseClient.js`: Supabase client initialization
- `supabase/schema.sql`: source of truth for tables, RLS, storage, grants, RPC
- `supabase/verify.sql`: post-schema health checks
- `test/run-tests.js`: fast flow and utility regression checks
- `test/e2e/run-e2e.js`: headless E2E for built output

## Working Rules

- Routing is hash-based. Check `src/utils/appRouting.js` before changing navigation behavior.
- Prefer existing helpers in `src/features/*`, `src/utils/*`, and `src/services/*` before adding more logic inside UI components.
- If a data model changes, update `supabase/schema.sql` and `supabase/verify.sql` together.
- Community access depends on having a saved nickname. Review `src/features/community/communityFlow.js` and `src/routes/CommunityRoute.jsx` when changing that rule.
- The client only uses Supabase anon credentials. Do not place a service-role key in frontend code.
- Avoid committing generated PNGs, logs, or server output unless they are intentional QA artifacts.

## Safe Change Checklist

- Confirmed the route or component that owns the behavior
- Checked whether the same logic already exists in a feature, util, or service module
- Updated `verify.sql` if schema or policy work changed
- Ran at least one regression command such as `npm run test` or `npm run build`

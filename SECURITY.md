# SECURITY.md

## Secrets

- Never commit `.env` or `.env.*`. Keep only `.env.example` under version control.
- The frontend currently expects only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Never place a Supabase service-role key or admin token in client code.
- Do not hardcode secrets or deployment-specific URLs.

## Supabase Safety Rules

- The app uses anonymous sessions plus authenticated-user flows.
- RLS, storage policies, RPC functions, and grants are part of the contract in `supabase/schema.sql`.
- If upload paths change, review the matching storage policies as well.
- Public buckets are `profile-avatars` and `workout-photos`. Do not design sensitive uploads around those paths.

## Change Checklist

When auth or database behavior changes:

1. Update `supabase/schema.sql`
2. Update the matching checks in `supabase/verify.sql`
3. Review related policies, indexes, functions, and grants
4. Update `README.md` if setup steps changed

## Local Artifact Hygiene

- Avoid committing generated PNGs, logs, or server output unless they are intentional QA evidence.
- Do not store real user data, personal images, or sensitive screenshots in the repo.
- Prefer fixtures or synthetic data over copied production data.

## Review Hotspots

- `src/services/communityService.js`: write paths, uploads, report and moderation actions
- `src/services/auth.js`: login, logout, redirect behavior
- `src/lib/supabaseClient.js`: env-variable wiring
- `supabase/schema.sql`: policies, grants, buckets, RPC definitions

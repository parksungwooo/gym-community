# ARCHITECTURE.md

## Overview

`gym-community` is a React 19 + Vite + Supabase single-page app for a fitness community MVP.
It uses hash-based routing and switches between `home`, `community`, `progress`, and `profile` surfaces inside one client app.

The high-level flow is:

1. `src/lib/supabaseClient.js` creates the client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. `src/App.jsx` owns the shell, lazy routes, overlays, and most top-level handlers.
3. `src/hooks/useAppBootstrap.js` loads session state, public data, and user-specific data.
4. `src/hooks/useAppDerivedState.js` computes badges, feed previews, gating flags, and other derived UI state.
5. Most writes and reads go through `src/services/communityService.js`.

## Frontend Shape

### App Shell

- `src/App.jsx`
  - stores raw top-level state
  - coordinates lazy route loading
  - opens overlays such as workout, test, notifications, report, and paywall
  - wires user actions to service-layer calls

### Routes

- `src/routes/HomeRoute.jsx`: dashboard, quick workout entry, summary surfaces
- `src/routes/CommunityRoute.jsx`: feed, mate board, ranking, public profile, moderation
- `src/routes/ProgressRoute.jsx`: test results, workout history, calendar, progress
- `src/routes/ProfileRoute.jsx`: profile editing, language, reminders, goals, body data

### State Layers

- raw state: `App.jsx`
- load and refresh orchestration: `useAppBootstrap`
- computed UI state: `useAppDerivedState`
- domain rules and pure flow helpers: `src/features/*`
- shared low-level helpers: `src/utils/*`

Keep that split intact. As features grow, move calculations into `features` or `utils`, and keep Supabase IO in `services`.

## Backend And Data

### Supabase Usage

- auth
  - anonymous sessions plus OAuth sign-in
- database
  - key tables include `users`, `test_results`, `workout_logs`, `workout_templates`, `weight_logs`, `xp_events`, `user_badges`, `feed_posts`, `likes`, `comments`, `follows`, `blocks`, `reports`, `notifications`, and `mate_posts`
- storage
  - `workout-photos`
  - `profile-avatars`
- RPC
  - public ranking, public profile, moderation, and other server-side helpers are defined in `supabase/schema.sql`

### Important Invariants

- Authenticated users should have a matching row in `public.users`.
- Community access is gated by having a saved nickname.
- Image upload rules depend on user-owned folder paths in storage policies.
- Public image rendering follows the storage public and render URL patterns used in `src/utils/imageOptimization.js`.
- Schema work is not complete unless `supabase/verify.sql` reflects the same contract.

## Folder Responsibilities

- `src/components/`: reusable UI units
- `src/routes/`: screen entry points
- `src/features/`: feature-specific pure logic
- `src/hooks/`: app loading and derived-state orchestration
- `src/services/`: Supabase IO
- `src/utils/`: shared helpers
- `src/styles/`: CSS grouped by surface
- `supabase/`: SQL source of truth and verification queries
- `test/`: regression and E2E checks

## Testing Strategy

- `npm run test`
  - fast checks for pure logic and app flow helpers
- `npm run test:e2e`
  - builds the app, serves `dist/`, and exercises core UI behavior in a headless browser

For UI or flow work, aim to run `build` and at least one relevant test path before calling the change done.

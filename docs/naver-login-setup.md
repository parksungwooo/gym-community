# Naver Login Setup

This project uses Supabase Auth Custom OAuth/OIDC for Naver login.

## 1. Supabase Dashboard

1. Open Supabase Dashboard.
2. Go to Authentication > Providers.
3. Click New Provider.
4. Choose Custom OAuth/OIDC.
5. Use OIDC auto-discovery when available.
6. Enter these values:
   - Identifier: `custom:naver`
   - Name: `Naver`
   - Issuer URL: `https://nid.naver.com`
   - Scopes: `openid profile email`
   - Client ID: Naver Developers Client ID
   - Client Secret: Naver Developers Client Secret
7. Enable Allow users without email if available.
8. Save and enable the provider.

The app calls `provider: 'custom:naver'`, so the custom provider identifier must match exactly.

## 2. Naver Developers

1. Open Naver Developers Console.
2. Create a new application.
3. Choose Naver Login as the API.
4. Add the service URL for the deployed app, for example:
   - `https://gym-community.vercel.app`
   - `http://localhost:5173` for local testing, if Naver allows the development URL.
5. Add this callback URL:
   - `https://<project-id>.supabase.co/auth/v1/callback`
6. Copy the Client ID and Client Secret into Supabase Dashboard > Authentication > Providers > Custom OAuth/OIDC > `custom:naver`.

Use the Supabase project ref in place of `<project-id>`. For example, if the Supabase URL is `https://abcxyz.supabase.co`, the callback URL is:

```text
https://abcxyz.supabase.co/auth/v1/callback
```

## 3. Environment Variables

`.env.example` includes these fields for setup notes:

```env
VITE_NAVER_CLIENT_ID=your-naver-client-id
VITE_NAVER_CLIENT_SECRET=dashboard-only-do-not-ship-real-secret
```

Do not ship the real Client Secret in a Vite frontend. Vite variables are exposed to the browser when they are prefixed with `VITE_`. The real secret should live in the Supabase Dashboard provider settings.

## 4. Frontend Flow

The app calls:

```js
await supabase.auth.signInWithOAuth({
  provider: 'custom:naver',
  options: {
    redirectTo: window.location.origin,
  },
})
```

After OAuth redirects back, `useAppBootstrap` loads the Supabase user and fills empty profile fields from OAuth metadata:

- `display_name`: Naver name or nickname
- `avatar_url`: Naver profile image
- `avatar_emoji`: `NAVER` fallback tag

Existing user-edited profile names and photos are not overwritten.

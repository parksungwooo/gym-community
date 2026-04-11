# Naver Login Setup

This project uses Supabase Auth OAuth for Naver login.

## 1. Supabase Dashboard

1. Open Supabase Dashboard.
2. Go to Authentication > Providers.
3. Enable Naver.
4. Paste the Naver Client ID and Client Secret from Naver Developers.
5. Save the provider settings.

If the Naver provider is not visible in the Supabase Dashboard, check whether your Supabase project has the latest Auth provider list enabled. The frontend is ready to call `provider: 'naver'`, but the provider must also be enabled on the Supabase project.

## 2. Naver Developers

1. Open Naver Developers Console.
2. Create a new application.
3. Choose Naver Login as the API.
4. Add the service URL for the deployed app, for example:
   - `https://gym-community.vercel.app`
   - `http://localhost:5173` for local testing, if Naver allows the development URL.
5. Add this callback URL:
   - `https://<project-id>.supabase.co/auth/v1/callback`
6. Copy the Client ID and Client Secret into Supabase Dashboard > Authentication > Providers > Naver.

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
  provider: 'naver',
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

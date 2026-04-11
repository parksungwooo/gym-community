# KakaoTalk Share Setup

Gym Community uses a hybrid KakaoTalk sharing strategy.

- Free users share a lightweight text message and UTM link.
- Pro users share a generated premium image card and UTM link.

## 1. Kakao Developers

1. Open Kakao Developers.
2. Create or select the Gym Community application.
3. Go to App Keys and copy the JavaScript key.
4. Add the app domain in Platform > Web:
   - `https://gym-community.vercel.app`
   - `http://localhost:5173` for local development
5. Enable KakaoTalk Share if the console requires product activation.

## 2. Environment Variable

Add the JavaScript key:

```env
VITE_KAKAO_JS_KEY=your-kakao-javascript-key
```

This is a browser key. Do not use the Kakao REST API key or Admin key here.

## 3. SDK Loading

`index.html` loads the Kakao JavaScript SDK:

```html
<script src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.0/kakao.min.js" defer></script>
```

The app initializes it lazily when a user taps a share button.

## 4. Share Behavior

Every Kakao share URL automatically includes:

```text
utm_source=kakaotalk
utm_medium=social
utm_campaign=gym_community_share
utm_content=<content-type>
```

Examples:

- `utm_content=level_result`
- `utm_content=workout_complete`
- `utm_content=ai_plan`

## 5. Free vs Pro

Free users:

- Use Kakao text template.
- Share a short message and app link.
- See a Pro card upsell near share actions.

Pro users:

- Generate a 1200x630 premium card.
- Convert the SVG card to PNG in the browser.
- Upload the image through Kakao Share image upload.
- Share the uploaded image in a Kakao feed template.

If Kakao SDK is unavailable, the app falls back to Web Share API, clipboard, or local card download.

# ARCHITECTURE.ko.md

## 개요

`gym-community`는 React 19, Vite, Supabase로 만든 운동 커뮤니티 MVP입니다.
앱은 하나의 SPA로 동작하며, 해시 라우팅으로 `home`, `community`, `progress`, `profile` 화면을 전환합니다.

큰 흐름은 아래와 같습니다.

1. `src/lib/supabaseClient.js`가 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`로 클라이언트를 생성합니다.
2. `src/App.jsx`가 앱 셸, lazy route, 오버레이, 주요 핸들러를 소유합니다.
3. `src/hooks/useAppBootstrap.js`가 세션, 공개 데이터, 사용자별 데이터를 초기 로드합니다.
4. `src/hooks/useAppDerivedState.js`가 배지, 추천 유저, 커뮤니티 가시 데이터, 홈 인사이트 같은 파생 상태를 계산합니다.
5. 대부분의 읽기/쓰기는 `src/services/communityService.js`를 통해 이뤄집니다.

## 프런트 구조

### 앱 셸

- `src/App.jsx`
  - 최상위 raw state를 보관합니다.
  - lazy route를 로드합니다.
  - 운동 기록, 테스트, 알림, 신고, 페이월 같은 오버레이를 엽니다.
  - 사용자 액션을 service 계층 호출에 연결합니다.

### 라우트

- `src/routes/HomeRoute.jsx`: 대시보드, 빠른 운동 기록, 요약 진입점
- `src/routes/CommunityRoute.jsx`: 피드, 메이트 모집, 랭킹, 공개 프로필, 운영 패널
- `src/routes/ProgressRoute.jsx`: 테스트 결과, 운동 기록, 캘린더, 진척
- `src/routes/ProfileRoute.jsx`: 프로필 수정, 언어, 알림, 목표, 신체 정보

### 상태 계층

- raw state: `App.jsx`
- 로드와 새로고침 orchestration: `useAppBootstrap`
- 계산된 UI state: `useAppDerivedState`
- 도메인 규칙과 순수 흐름 헬퍼: `src/features/*`
- 공용 저수준 헬퍼: `src/utils/*`

이 분리를 유지하는 것이 중요합니다. 기능이 커질수록 계산 로직은 `features`나 `utils`로 보내고, Supabase IO는 `services`에 남겨둡니다.

## 백엔드와 데이터

### Supabase 사용 방식

- auth
  - anonymous session과 OAuth 로그인을 함께 사용합니다.
- database
  - 주요 테이블은 `users`, `test_results`, `workout_logs`, `workout_templates`, `weight_logs`, `xp_events`, `user_badges`, `feed_posts`, `likes`, `comments`, `follows`, `blocks`, `reports`, `notifications`, `mate_posts`입니다.
- storage
  - `workout-photos`
  - `profile-avatars`
- RPC
  - 공개 랭킹, 공개 프로필, 운영 관련 서버 함수들이 `supabase/schema.sql`에 정의되어 있습니다.

### 중요한 불변 조건

- 인증된 사용자는 `public.users`에 대응 row가 있어야 합니다.
- 커뮤니티 입장은 닉네임 저장 여부에 의해 열립니다.
- 이미지 업로드 정책은 user-owned folder 경로 규칙에 의존합니다.
- 공개 이미지 렌더링은 `src/utils/imageOptimization.js`에서 쓰는 public/render URL 규칙을 따릅니다.
- 스키마 작업은 `supabase/verify.sql`까지 같이 반영되어야 완료입니다.

## 폴더 책임

- `src/components/`: 재사용 UI 조각
- `src/routes/`: 화면 진입점
- `src/features/`: 기능별 순수 로직
- `src/hooks/`: 앱 로딩과 파생 상태 orchestration
- `src/services/`: Supabase IO
- `src/utils/`: 공용 헬퍼
- `src/styles/`: 화면별 CSS
- `supabase/`: SQL 기준 문서와 검증 쿼리
- `test/`: 회귀 테스트와 E2E

## 테스트 전략

- `npm run test`
  - 순수 로직과 앱 플로우 헬퍼를 빠르게 점검합니다.
- `npm run test:e2e`
  - 앱을 빌드하고 `dist/`를 띄운 뒤 헤드리스 브라우저로 핵심 UI 동작을 확인합니다.

UI나 흐름을 바꿨다면 보통 `build`와 관련 테스트 하나 이상은 확인하고 마무리하는 것이 좋습니다.

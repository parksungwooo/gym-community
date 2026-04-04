# Fitness Community MVP (React + Vite + Supabase)

운동 레벨 테스트 + 운동 기록 기반 자동 커뮤니티 MVP입니다.

## 핵심 기능

- 체력 테스트 10문항, 총점 0~100 계산
- 5단계 레벨 결과 출력
- 결과 공유(링크 복사)
- 오늘 운동 완료 기록 저장
- 운동 기록/테스트 결과 기반 자동 피드 생성
- 좋아요/댓글 인터랙션
- Supabase Anonymous 로그인 기반 게스트 사용

## 폴더 구조

```txt
gym-community/
  src/
    components/
      FeedList.jsx
      ResultView.jsx
      TestForm.jsx
      WorkoutPanel.jsx
    constants/
      questions.js
    lib/
      supabaseClient.js
    services/
      auth.js
      communityService.js
    utils/
      level.js
    App.jsx
    index.css
    main.jsx
  supabase/
    schema.sql
  .env.example
  package.json
```

## 1) 설치 및 실행

```bash
npm install
npm run dev
```

## 2) Supabase 연동 방법

1. Supabase 프로젝트 생성
2. `Authentication > Providers`에서 `Anonymous` 활성화
3. Supabase SQL Editor에서 아래 둘 중 하나 실행
- 가장 쉬운 방법: `supabase/run_once.sql`
- 분리 실행: `supabase/schema.sql` -> `supabase/verify.sql`
4. verify 결과의 `ok` 값이 모두 `true`인지 확인
5. 프로젝트 URL/anon key 확인 후 `.env` 생성

```bash
cp .env.example .env
```

`.env` 예시:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3) 테이블 구조

- `users` (auth 사용자 매핑)
- `test_results`
- `workout_logs` (하루 여러 기록 가능)
- `workout_templates` (루틴 저장/재사용)
- `feed_posts` (`type`, `metadata` 포함)
- `likes` (user_id + post_id unique)
- `comments`

## 4) Vercel 배포

1. Git 저장소 연결
2. Vercel Project 생성 (Framework Preset: Vite)
3. Environment Variables에 아래 값 등록
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
4. Deploy

## 5) 모바일 실사용 QA

배포 전에는 아래 흐름을 실제 폰에서 한 번 확인하는 것을 권장합니다.

1. 홈 진입
- 첫 화면이 너무 길지 않은지
- 하단 탭이 손가락으로 누르기 편한지

2. 언어/계정
- 프로필 탭에서 `한국어 / English` 전환이 잘 되는지
- 게스트/로그인 상태가 자연스럽게 보이는지

3. 테스트 흐름
- 기록 탭에서 체력 테스트 열기
- 결과 저장 후 기록 탭/홈으로 자연스럽게 이어지는지

4. 운동 기록
- 홈에서 빠른 기록 저장
- 기록 입력 시트에서 운동 종류/시간/메모 입력
- 같은 날 여러 번 저장 가능한지

5. 루틴
- 루틴 저장
- 저장된 루틴 탭 한 번으로 재사용
- 루틴 삭제

6. 기록 관리
- 기록 탭에서 수정/삭제
- 월간 캘린더/타임라인 반영 확인

7. 커뮤니티
- 추천 유저/랭킹/피드 로딩 확인
- 좋아요/댓글 동작 확인
- 댓글 입력창이 모바일에서 너무 크지 않은지 확인

## 6) 배포 전 체크리스트

- `npm run lint` 통과
- `npm run build` 통과
- Supabase `schema.sql` 최신 반영
- Supabase `verify.sql` 실행 후 모든 `ok` 값이 `true`
- 아래 테이블/함수 존재 확인
  - `users`
  - `test_results`
  - `workout_logs`
  - `feed_posts`
  - `likes`
  - `comments`
  - `workout_templates`
  - `get_public_leaderboard`
- `Anonymous` 로그인 활성화 확인
- `Google / Kakao` Provider 설정 확인
- `Site URL` / Redirect URL 확인
- `.env`의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 확인
- 실제 폰에서 홈/커뮤니티/기록/프로필 한 바퀴 점검

## 7) 확장 포인트

- 운동 추천: `feed_posts.metadata`와 `test_results` 기반 추천 로직 추가
- 랭킹: 주간 집계 테이블 또는 뷰 추가
- 구독: 결제 상태 테이블 추가 후 premium 피드/기능 분기

## 참고

- MVP 중심으로 최소 기능만 구현되어 있습니다.
- 모든 키는 `.env`로 관리하며 하드코딩하지 않습니다.

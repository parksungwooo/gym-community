# AGENTS.ko.md

이 문서는 `gym-community`에서 사람이나 에이전트가 빠르게 맥락을 잡기 위한 협업용 루트 안내판입니다.
모든 내용을 다 담는 문서가 아니라, 어디부터 읽고 어떻게 움직이면 되는지 알려주는 시작점으로 사용합니다.

제품 설명과 실행 방법은 `README.md`, 구조 설명은 `ARCHITECTURE.ko.md`, 보안과 민감 정보 규칙은 `SECURITY.ko.md`를 참고합니다.

## 먼저 읽기

1. `README.md`
2. `ARCHITECTURE.ko.md`
3. `SECURITY.ko.md`
4. 내가 수정할 기능과 가장 가까운 route, component, service, SQL 파일

## 자주 쓰는 명령

```bash
npm install
npm run dev
npm run lint
npm run build
npm run test
npm run test:e2e
```

- `npm run test:e2e` 전에 `npm run build`를 먼저 실행합니다.
- 데이터베이스 설정은 `supabase/schema.sql` 적용 후 `supabase/verify.sql` 확인이 기본입니다.
- `supabase/run_once.sql`은 레거시 부트스트랩용이므로 새 작업의 기본 경로로 보지 않습니다.

## 저장소 지도

- `src/App.jsx`: 앱 셸, 최상위 상태, 오버레이, 주요 액션 핸들러
- `src/routes/`: 화면 단위 진입점
- `src/hooks/useAppBootstrap.js`: 초기 로드와 새로고침 orchestration
- `src/hooks/useAppDerivedState.js`: 파생 UI 상태 계산
- `src/services/communityService.js`: Supabase 데이터 접근의 중심
- `src/services/auth.js`: 세션 조회와 로그인/로그아웃 헬퍼
- `src/lib/supabaseClient.js`: Supabase 클라이언트 초기화
- `supabase/schema.sql`: 테이블, RLS, storage, grant, RPC의 기준 문서
- `supabase/verify.sql`: 스키마 반영 후 점검용 SQL
- `test/run-tests.js`: 빠른 로직 및 플로우 회귀 확인
- `test/e2e/run-e2e.js`: 빌드 결과 기준 헤드리스 E2E

## 작업 규칙

- 라우팅은 해시 기반입니다. 이동 규칙을 바꾸기 전에 `src/utils/appRouting.js`를 먼저 확인합니다.
- UI 컴포넌트 안에 로직을 계속 쌓기보다 `src/features/*`, `src/utils/*`, `src/services/*`의 기존 헬퍼를 우선 재사용합니다.
- 데이터 모델이 바뀌면 `supabase/schema.sql`과 `supabase/verify.sql`을 함께 수정합니다.
- 커뮤니티 입장은 닉네임 저장 여부에 연결되어 있습니다. 이 규칙을 바꿀 때는 `src/features/community/communityFlow.js`와 `src/routes/CommunityRoute.jsx`를 같이 봅니다.
- 프런트엔드에는 Supabase anon credential만 둡니다. service-role key는 넣지 않습니다.
- 생성된 PNG, 로그, 서버 출력 파일은 의도된 QA 산출물이 아니면 커밋하지 않습니다.

## 안전한 변경 체크리스트

- 이 동작을 실제로 소유한 route나 component를 확인했다
- 같은 로직이 이미 feature, util, service 계층에 있는지 확인했다
- 스키마나 정책이 바뀌었다면 `verify.sql`도 갱신했다
- 최소 한 번은 `npm run test` 또는 `npm run build`로 회귀를 확인했다

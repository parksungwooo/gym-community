# SECURITY.ko.md

## 비밀값 관리

- `.env`, `.env.*`는 커밋하지 않습니다. 버전 관리에는 `.env.example`만 남깁니다.
- 현재 프런트엔드가 기대하는 환경변수는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`입니다.
- Supabase service-role key나 관리자 토큰은 클라이언트 코드에 넣지 않습니다.
- 비밀값이나 배포 환경별 URL을 하드코딩하지 않습니다.

## Supabase 안전 규칙

- 이 앱은 anonymous session과 authenticated user 흐름을 함께 사용합니다.
- RLS, storage policy, RPC function, grant는 모두 `supabase/schema.sql` 계약의 일부입니다.
- 업로드 경로를 바꾸면 연결된 storage policy도 같이 검토해야 합니다.
- 공개 bucket은 `profile-avatars`, `workout-photos`입니다. 민감한 파일 설계를 여기에 기대지 않습니다.

## 변경 체크리스트

auth나 database 동작이 바뀔 때는 아래를 확인합니다.

1. `supabase/schema.sql`을 갱신했다
2. 대응되는 `supabase/verify.sql` 검증도 갱신했다
3. 관련 policy, index, function, grant를 같이 검토했다
4. 설정 절차가 달라졌다면 `README.md`도 수정했다

## 로컬 산출물 관리

- 생성된 PNG, 로그, 서버 출력 파일은 의도된 QA 증적이 아니면 커밋하지 않습니다.
- 실제 사용자 데이터, 개인 이미지, 민감한 스크린샷을 저장소에 넣지 않습니다.
- 가능하면 실데이터 복사보다 fixture나 synthetic data를 사용합니다.

## 특히 조심할 영역

- `src/services/communityService.js`: 쓰기 경로, 업로드, 신고/운영 액션
- `src/services/auth.js`: 로그인, 로그아웃, redirect 동작
- `src/lib/supabaseClient.js`: 환경변수 연결
- `supabase/schema.sql`: policy, grant, bucket, RPC 정의

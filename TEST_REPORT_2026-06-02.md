# Fluento 기능 테스트 보고서

- **작성일**: 2026-06-02
- **테스트 환경**: 로컬 (`dev` 프로필, 백엔드 `localhost:8080` / 프론트 `localhost:5173`), 회원가입/로그인은 EC2 배포 백엔드(`3.35.22.100:8080`)로 브라우저 E2E
- **범위**: AI 채팅 SSE, 채팅방 CRUD, 레벨 조절, 오답 노트, 사용자 프로필, 회원가입/로그인(Cognito)

---

## 요약

| # | 기능 | 결과 | 발견 버그 | 비고 |
|---|------|------|-----------|------|
| 1 | AI 채팅 SSE 스트리밍 | ✅ 통과 | 4건 수정 | Bedrock 로컬 불가 → Mock 도입 |
| 2 | 채팅방 CRUD | ✅ 통과 | 0건 | 무결점 |
| 3 | 레벨 자동 조절 | ✅ 통과 | 3건 수정 | 실제론 작동 안 하던 기능 |
| 4 | 오답 노트 | ✅ 통과 | 2건 수정 | 백엔드 미구현 → 신규 구현 |
| 5 | 사용자 프로필 | ✅ 통과 | 0건 | 무결점 |
| 6 | 회원가입/로그인 | ✅ 통과 | 1건 수정 | EC2 전체 E2E 통과 (signup→메일인증→login) |

**총 발견·수정 버그: 10건 + 백엔드 1개 API 신규 구현**

---

## 1. AI 채팅 SSE 스트리밍

**테스트**: 채팅방 생성 → 메시지 전송 → SSE 스트림 수신
**이벤트 흐름**: `ai_start → level_assessment → ai_chunk(반복) → evaluation → ai_complete`

### 발견·수정한 버그
1. **Bedrock 로컬 사용 불가** — AWS 자격증명 미존재로 AI 응답 실패.
   → `AIService` 인터페이스 추출 + `MockAIService`(@Profile dev) 도입. 운영(EC2)에선 `BedrockService` 자동 활성화.
2. **senderType 대소문자 불일치** — 프론트가 `'user'`로 비교하는데 백엔드는 `'USER'` 반환 → 모든 메시지가 AI로 표시됨.
   → `ChatPage.jsx`에서 `.toLowerCase()` 비교로 수정.
3. **messageType 불일치** — `'text'` vs `'TEXT'`.
   → `chat.js` 기본값을 `'TEXT'`로 수정.
4. **SSE named event 미처리** — 서버가 `event:ai_chunk` 등 named event로 보내는데 프론트는 `onmessage`(unnamed only)만 처리 → AI 응답 수신 안 됨.
   → `addEventListener('ai_chunk'|'evaluation'|'ai_complete')`로 변경.
5. **EventSource 인증** — `EventSource`는 Authorization 헤더 미지원.
   → SSE URL에 `access_token` query param 전달 + `DevSecurityConfig`에 `setAllowUriQueryParameter(true)` 추가.

### 결과
USER/AI 메시지 방향 정상, 스트리밍 청크 정상 수신, 교정창 연동 확인.

---

## 2. 채팅방 CRUD

**테스트 (11 케이스 전부 통과)**

| 항목 | 엔드포인트 | 결과 |
|------|-----------|------|
| 목록 조회 | `GET /chat/rooms` | ✅ |
| 방 생성 | `POST /chat/rooms` | ✅ |
| 중복 생성 차단 | `POST` (같은 characterId) | ✅ 409 `CHAT_ROOM_EXISTS` |
| 단건 조회 | `GET /chat/rooms/{id}` | ✅ |
| 제목 수정 | `PUT /chat/rooms/{id}` | ✅ |
| 핀 고정/해제 | `PUT /chat/rooms/{id}/pin` | ✅ |
| 핀 필터 조회 | `GET ?pinned=true` | ✅ |
| 방 삭제 | `DELETE /chat/rooms/{id}` | ✅ 204 |
| 삭제 후 재조회 | `GET` | ✅ 404 `CHAT_ROOM_NOT_FOUND` |
| 입력 검증 | `POST` (characterId 누락) | ✅ 400 |
| 없는 방 삭제 | `DELETE` | ✅ 404 |

**버그 없음.**

---

## 3. 레벨 자동 조절

**규칙**: 올리기(연속 3개 ≥90점), 내리기(연속 2개 ≤50점), 점수는 Redis List에 누적.

### 발견·수정한 버그 (실제로 작동하지 않던 기능)
1. **점수 하드코딩** — `AIResponseService`가 레벨 조절 함수에 실제 평가 점수 대신 **고정값 75**를 전달 → 레벨이 절대 안 바뀜.
2. **평가 비동기 구조** — 평가가 백그라운드로 돌아 레벨 조절 시점에 점수를 모름.
   → 흐름을 `... ai_chunk → evaluation(동기) → level_adjustment → ai_complete`로 재구성, 실제 점수 전달.
3. **evaluation SSE 이벤트 누락** — 명세에 있으나 실제 전송 안 됨.
   → 이벤트 추가.
- (dev 테스트 인프라) `Evaluator` 인터페이스 + `MockEvaluator` — 메시지 길이로 점수 산출(8단어+=95, 3단어-=40, 그외 70).

### 검증 시나리오 (전부 통과)

| 시나리오 | 입력 | 기대 | 결과 |
|----------|------|------|------|
| 레벨 UP | 95점 × 3연속 | beginner→intermediate | ✅ |
| 레벨 DOWN | 40점 × 2연속 | intermediate→beginner | ✅ |
| 변동 없음 | 70점 × 3연속 | 유지 | ✅ |
| Floor | beginner에서 40점 × 2 | beginner 유지 | ✅ |
| Redis 누적/초기화 | - | 최근 5개 유지, 레벨변경 시 비움 | ✅ |

---

## 4. 오답 노트

**상태**: 백엔드 `/wrong-answers` API가 **아예 미구현** 상태였음 → 신규 구현.

### 신규 구현
- `WrongAnswerController` — `GET /wrong-answers`(is_correct=false 메시지 조회), `DELETE /wrong-answers/{id}`.
- `ChatMessageRepository` — 오답 조회 + 소유권 확인 쿼리 추가.

### 발견·수정한 버그
1. **LazyInitializationException** — 삭제 시 세션 밖에서 `ChatRoom.getUser()` 접근 → 500.
   → JPQL `findByIdAndRoomUserId` 쿼리로 소유권 확인.
2. **라우트 불일치** — 프론트 라우트 `/wrong-answer`(단수) vs API `/wrong-answers`(복수).

### 결과
- 목록 조회: `is_correct=false` 메시지가 오답 카드로 렌더링 ✅
- 삭제: 카드 삭제 후 화면 즉시 반영 ✅ (브라우저 E2E 확인)

---

## 5. 사용자 프로필

**테스트 (6 케이스 전부 통과)**

| 항목 | 엔드포인트 | 결과 |
|------|-----------|------|
| 내 정보 조회 | `GET /users/me` | ✅ |
| 전체 수정 | `PUT /users/profile` | ✅ |
| 영속성 확인 | `GET /users/me` 재조회 | ✅ |
| 부분 수정 | `PUT` (theme만) | ✅ 나머지 유지 |
| 검증: 이름 100자 초과 | `PUT` | ✅ 400 |
| 검증: 이름 빈 문자열 | `PUT` | ✅ 400 |

**버그 없음.**
참고: `profileImageUrl`은 `null` 입력 시 "변경 안 함"으로 처리되어 **이미지를 비우는 경로가 없음**(의도된 동작). 필요 시 별도 처리 추가 가능.

---

## 6. 회원가입 / 로그인 (Cognito) — 전체 E2E 통과

**테스트 환경**: EC2 배포 백엔드(`3.35.22.100:8080`) + 로컬 프론트(`localhost:5173`, Playwright 브라우저 E2E)
**인증 방식**: 표준 공개 Cognito API — `signUp` → 이메일 인증 코드 → `confirmSignUp` → `login`(USER_PASSWORD_AUTH). admin 권한 불필요.

### 사전 조치 (권한)
- 학교 AWS 계정(`SafeRole-sgu-mong`)은 Cognito admin 권한이 없어 `adminConfirmSignUp` 등 사용 불가 → admin 없이 동작하는 표준 흐름으로 구현.
- 교수님이 그룹에 `UpdateUserPoolClient`/`UpdateUserPool` 권한 추가 → AWS CloudShell에서 App Client(`35cdo4a4b9iesrkm98orsflti0`)에 `ALLOW_USER_PASSWORD_AUTH` auth flow 활성화. (활성화 전 로그인은 `USER_PASSWORD_AUTH flow not enabled` 오류였음)

### E2E 시나리오 (Playwright, 전부 통과)

| 단계 | 동작 | 결과 |
|------|------|------|
| 1 | 회원가입 폼 제출 (`POST /auth/signup`) | ✅ Cognito `signUp` 성공 → "이메일 인증" 화면 진입 |
| 2 | 인증 메일 수신 | ✅ mailinator로 코드 수신 (`no-reply@verificationemail.com`) |
| 3 | 코드 입력 → 인증 (`POST /auth/signup/confirm`) | ✅ `confirmSignUp` 성공 → "회원가입이 완료되었습니다!" |
| 4 | 로그인 (`POST /auth/login`) | ✅ JWT 발급 → `/home` 이동 |
| 5 | 인증 상태 유지 | ✅ `accessToken`(JWT)·`userId` localStorage 저장, 홈에 사용자 이메일 표시 |

### 발견·수정한 버그
1. **프론트 API baseURL 불일치** — `auth.js` 경로가 `/auth/...`로 변경됐는데 `.env`/`.env.local`이 옛 EC2(`43.201.25.12`)·`localhost`를 가리키거나 `/api/v1` 중복으로 꼬여 요청이 401/connection-refused 발생.
   → `.env.local`을 `VITE_API_BASE_URL=http://3.35.22.100:8080/api/v1`로 정리하고 dev 서버 재시작 → 정상 연결.

### 비고
- 콘솔에 React 경고 1건(uncontrolled→controlled input)이 있으나 인증 기능과 무관한 코드 품질 경고. 기능 영향 없음.

---

## 변경된 파일 목록

### 백엔드 (`02-backend`)
- `service/AIService.java` (신규)
- `service/MockAIService.java` (신규)
- `service/BedrockService.java` (AIService 구현)
- `service/Evaluator.java` (신규)
- `service/MockEvaluator.java` (신규)
- `service/EvaluationService.java` (Evaluator 구현)
- `service/AIResponseService.java` (흐름 재구성, 레벨 조절 버그 수정)
- `controller/WrongAnswerController.java` (신규)
- `domain/chat/ChatMessageRepository.java` (오답/소유권 쿼리 추가)
- `config/DevSecurityConfig.java` (SSE query param 토큰 허용)

### 프론트엔드 (`01_frontend`)
- `pages/ChatPage.jsx` (senderType 대소문자, SSE named event 처리)
- `api/chat.js` (messageType 대문자, SSE URL 토큰)
- `pages/SignupPage.jsx` (2단계: 폼 → 이메일 인증 코드)
- `api/auth.js` (`confirmSignup` 추가)
- `.env.local` (API baseURL을 EC2 + `/api/v1`로 정리)

### 인증 (이메일 인증 흐름, `02-backend`)
- `service/CognitoService.java` (표준 `signUp`/`confirmSignUp`로 전환, admin API 제거)
- `controller/AuthController.java` (`POST /auth/signup`, `POST /auth/signup/confirm`)
- `dto/auth/ConfirmSignupRequest.java` (신규)
- `exception/InvalidVerificationCodeException.java` + `GlobalExceptionHandler` (INVALID_CODE 400)
- `docker-compose.yml` (`AWS_COGNITO_CLIENT_ID` 주입), `Dockerfile` (plain JAR 제거)

---

## 비고 / 알려진 제약
- 로컬에서는 **Bedrock 사용 불가**(IAM Role 정책상 Access Key 발급 금지). dev 프로필의 Mock 서비스로 대체.
- dev 프로필에서 로그인은 항상 `dev-token` 반환(인증 우회). 실제 Cognito 흐름은 운영 모드/원격 서버에서만 테스트 가능 → 회원가입/로그인은 EC2(`3.35.22.100`)에서 검증함.
- Cognito App Client `35cdo4a4b9iesrkm98orsflti0`에 `ALLOW_USER_PASSWORD_AUTH` 활성화 완료(2026-06-02). 인증 코드 발송 도메인(`no-reply@verificationemail.com`)은 mailinator로 정상 수신 확인.

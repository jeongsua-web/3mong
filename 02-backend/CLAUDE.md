# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# 빌드 (테스트 제외)
./gradlew clean build -x test

# 로컬 실행 (dev 프로필 - 인증 우회)
./gradlew bootRun --args='--spring.profiles.active=dev'

# 운영 실행 (JWT 인증 활성화)
./gradlew bootRun

# 전체 테스트 실행
./gradlew test

# 단일 테스트 실행
./gradlew test --tests "com.fluento.DatabaseConnectionTest"

# 포트 8080 프로세스 종료
lsof -ti:8080 | xargs kill -9
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DB_HOST` | PostgreSQL 호스트 | `localhost` |
| `DB_PORT` | PostgreSQL 포트 | `5432` |
| `DB_NAME` | DB 이름 | `fluento` |
| `DB_USER` | DB 유저 | `jeongsua` |
| `DB_PASSWORD` | DB 비밀번호 | `1234` |
| `REDIS_HOST` | Redis 호스트 | `localhost` |
| `REDIS_PORT` | Redis 포트 | `6379` |
| `APP_JWT_SECRET` | 자체 JWT 서명 시크릿 (HMAC-SHA256, 최소 32바이트) | - |
| `GOOGLE_CLIENT_ID` | Google 로그인 OAuth 클라이언트 ID | application.yml 기본값 |
| `OPENAI_API_KEY` | OpenAI API 키 | - |
| `OPENAI_MODEL` | OpenAI 모델 ID | `gpt-4o-mini` |

## 아키텍처

### 기술 스택
- **Spring Boot 4.0 / Spring 7 / JDK 17**
- **PostgreSQL 18** (로컬) + Flyway 마이그레이션
- **Redis** (레벨 점수 캐싱, 추후 세션)
- **자체 JWT 인증** (jjwt `JwtTokenProvider`로 발급/검증, 운영), dev 프로필에서 우회
- **Google 로그인** GSI id_token을 백엔드가 Google `tokeninfo`로 직접 검증 후 자체 JWT 발급 (`AuthService`)
- **OpenAI API** gpt-4o-mini 스트리밍 응답 (`OpenAIService`, JDK HttpClient 사용 — Alpine netty TLS 버그 회피)
- **SSE (Server-Sent Events)** 실시간 AI 응답 스트림
- dev 프로필: `MockEvaluator`로 OpenAI API 없이 평가 로직 테스트 가능

### 패키지 구조

```
com.fluento
├── config/
│   ├── SecurityConfig.java       # 운영용 JWT 인증 (@Profile("!dev"))
│   ├── DevSecurityConfig.java    # dev 프로필 인증 우회 (@Profile("dev"))
│   ├── DevDataInitializer.java   # dev 프로필 초기 유저 생성
│   ├── RedisConfig.java          # RedisTemplate, StringRedisTemplate Bean
│   └── JacksonConfig.java        # ObjectMapper Bean (JavaTimeModule 포함)
├── domain/
│   ├── user/User.java            # users 테이블
│   └── chat/                     # ChatRoom, ChatMessage, LevelAssessment, Level enum
├── dto/
│   ├── ApiResponse.java          # 공통 응답 래퍼 {success, data, error}
│   ├── ApiError.java             # 에러 포맷 {code, message, statusCode, timestamp}
│   └── chat/                     # 채팅 관련 Request/Response DTO
├── exception/
│   └── GlobalExceptionHandler    # 에러 코드 → ApiResponse.fail() 변환
├── service/
│   ├── UserService               # 유저 조회/생성/수정
│   ├── ChatRoomService           # 채팅방 CRUD
│   ├── ChatMessageService        # 메시지 저장/조회
│   ├── OpenAIService             # OpenAI 스트리밍 + 프롬프트 생성 (AIService 구현체)
│   ├── MockEvaluator             # dev 프로필용 가짜 평가기 (OpenAI 없이 테스트)
│   ├── LevelAssessmentService    # 사용자 영어 수준 판단 (OpenAI 호출)
│   ├── LevelAdjustmentService    # 난이도 조절 규칙 (Redis 점수 추적)
│   ├── EvaluationService         # 문법/뉘앙스 평가 (OpenAI 호출)
│   └── AIResponseService         # SSE 전체 흐름 통합
└── controller/
    ├── HealthController          # GET /api/v1/health (공개)
    ├── AuthController            # POST /api/v1/auth/register, /logout
    ├── UserController            # GET /api/v1/users/me, PUT /api/v1/users/profile
    ├── ChatRoomController        # /api/v1/chat/rooms CRUD
    ├── ChatMessageController     # /api/v1/chat/rooms/{roomId}/messages
    └── ChatSSEController         # SSE /stream, /initial-message, /level
```

### API 응답 포맷
모든 응답은 `ApiResponse<T>` 래퍼를 사용:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "CHAT_ROOM_NOT_FOUND", "message": "...", "statusCode": 404, "timestamp": "..." } }
```

### SSE 스트림 흐름
`POST /messages` → 메시지 저장 → `streamUrl` 반환 → `GET /stream?messageId=` SSE 연결
이벤트 순서: `ai_start` → `level_assessment` → `level_adjustment`(선택) → `ai_chunk`(반복) → `evaluation_start` → `evaluation` → `ai_complete`

### 인증 흐름
- **로그인**: 일반(이메일/비번 BCrypt) 또는 Google 로그인(GSI `credential`을 `AuthService.googleLogin`이 Google `tokeninfo`로 검증) → `JwtTokenProvider.generate(userId)`로 자체 JWT 발급
- **운영**: `Authorization: Bearer <자체 JWT>` → `JwtAuthenticationFilter` → `JwtTokenProvider.getUserId()` 검증 (Cognito/OAuth2 Resource Server 사용 안 함)
- **dev**: `DevSecurityConfig`가 모든 요청 통과시키고 `googleId = "dev-user"` 유저로 자동 인증
- JWT subject = `user.id` (DB PK)

### 난이도 조절 규칙
- 올리기: 연속 3개 메시지 ≥ 90점
- 내리기: 연속 2개 메시지 ≤ 50점
- 최근 점수는 Redis List에 저장 (`fluento:scores:{roomId}`)

### DB 스키마
`src/main/resources/db/migration/V1__Initial_schema.sql` 참조.
`ddl-auto: validate` 사용 중 — 엔티티 변경 시 반드시 Flyway 마이그레이션 스크립트 추가 필요.
Flyway가 Spring Boot 4에서 자동 실행 안 되는 이슈 있어 첫 실행 전 SQL을 직접 적용:
```bash
psql -d fluento -f src/main/resources/db/migration/V1__Initial_schema.sql
```

### 외부 서비스 인증 (키)
- **OpenAI**: `OPENAI_API_KEY`(EC2는 `.env`)로 호출. 키 없이는 `dev` 프로필 + `MockEvaluator`/`MockAIService`로 테스트
- **Google 로그인**: `GOOGLE_CLIENT_ID`로 id_token `aud` 검증 (서버 시크릿 불필요 — id_token만 검증)
- AWS SDK/Cognito/Bedrock 의존성은 제거됨 (OpenAI API + 자체 JWT로 대체)

## 알려진 이슈 / 미구현

- **Sentry** 미연동 (Spring Boot 4 호환 버전 미출시)
- **S3 이미지 업로드** 미구현 (이미지 메시지 API 구조만 있음)
- **Flyway 자동 실행** Spring Boot 4에서 동작 안 함 — SQL 직접 실행 필요
- **캐릭터 서비스** 없음 — `characterName`은 클라이언트가 직접 전달
- `Level` enum JSON 직렬화는 소문자 (`beginner`, `intermediate`, `advanced`)

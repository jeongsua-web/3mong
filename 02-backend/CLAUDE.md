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
| `AWS_REGION` | AWS 리전 | `ap-northeast-2` |
| `AWS_COGNITO_USER_POOL_ID` | Cognito User Pool ID | - |
| `BEDROCK_REGION` | Bedrock 리전 (US만 가능) | `us-east-1` |
| `BEDROCK_MODEL_ID` | Bedrock 모델 ID (cross-region inference profile) | `us.anthropic.claude-sonnet-4-6` |

## 아키텍처

### 기술 스택
- **Spring Boot 4.0 / Spring 7 / JDK 17**
- **PostgreSQL 18** (로컬) + Flyway 마이그레이션
- **Redis** (레벨 점수 캐싱, 추후 세션)
- **AWS Cognito** JWT 인증 (운영), dev 프로필에서 우회
- **AWS Bedrock** Claude 3.5 Sonnet 스트리밍 응답 (`BedrockService`)
- **SSE (Server-Sent Events)** 실시간 AI 응답 스트림
- dev 프로필: `MockEvaluator`로 Bedrock 없이 평가 로직 테스트 가능

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
│   ├── BedrockService            # Claude 스트리밍 + 프롬프트 생성 (AIService 구현체)
│   ├── MockEvaluator             # dev 프로필용 가짜 평가기 (Bedrock 없이 테스트)
│   ├── LevelAssessmentService    # 사용자 영어 수준 판단 (Bedrock 호출)
│   ├── LevelAdjustmentService    # 난이도 조절 규칙 (Redis 점수 추적)
│   ├── EvaluationService         # 문법/뉘앙스 평가 (Bedrock 호출)
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
- **운영**: Cognito JWT → `JwtDecoder` 검증 → `@AuthenticationPrincipal Jwt jwt`
- **dev**: `Authorization: Bearer dev-token` → 가짜 JwtDecoder → `googleId = "dev-user"` 자동 매핑
- 컨트롤러에서 userId 추출: `jwt.getSubject()` → `userRepository.findByGoogleId(sub)`

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

### AWS 인증 구조
- **Access Key 발급 불가** — IAM Role만 사용 가능
- **EC2**: 인스턴스 프로필 `SafeInstanceProfile-sgu-mong` 자동 인증
- **로컬**: IAM Role 사용 불가 → Bedrock 직접 호출 불가 → `dev` 프로필 + `MockEvaluator`로 테스트
- **Bedrock 리전**: 서울(`ap-northeast-2`) 미지원 → `us-east-1` 사용, 모델 ID는 `us.`로 시작하는 cross-region inference profile 사용

## 알려진 이슈 / 미구현

- **Sentry** 미연동 (Spring Boot 4 호환 버전 미출시)
- **S3 이미지 업로드** 미구현 (이미지 메시지 API 구조만 있음)
- **Flyway 자동 실행** Spring Boot 4에서 동작 안 함 — SQL 직접 실행 필요
- **캐릭터 서비스** 없음 — `characterName`은 클라이언트가 직접 전달
- `Level` enum JSON 직렬화는 소문자 (`beginner`, `intermediate`, `advanced`)

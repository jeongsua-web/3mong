# Fluento Backend

영어 회화 학습 앱 Fluento의 백엔드 서버입니다.

---

## 기술 스택 및 버전

| 분류 | 기술 | 버전 |
|------|------|------|
| Language | Java (JDK) | 17 |
| Framework | Spring Boot | 4.0.0 |
| Framework | Spring Security | 7.x (Spring Boot 관리) |
| Build Tool | Gradle | 9.0.0 |
| Database | PostgreSQL | 17 |
| Cache | Redis | 7 |
| ORM | Spring Data JPA / Hibernate | Spring Boot 관리 |
| DB Migration | Flyway | Spring Boot 관리 |
| Auth | AWS Cognito (JWT / OAuth2 Resource Server) | AWS SDK v2 2.30.19 |
| AI | AWS Bedrock (Claude 3.5 Sonnet) | AWS SDK v2 2.30.19 |
| API Docs | springdoc-openapi (Swagger UI) | 2.8.5 |
| JWT | jjwt | 0.12.6 |
| Reactive | Spring WebFlux (SSE 스트리밍용) | Spring Boot 관리 |
| Util | Lombok | Spring Boot 관리 |

---

## 로컬 실행

### 사전 요구사항

- JDK 17
- Docker / Docker Compose
- PostgreSQL 17 (또는 Docker)
- Redis 7 (또는 Docker)

### 환경변수 설정

```bash
cp .env.example .env
# .env 파일에 실제 값 입력
```

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
| `BEDROCK_MODEL_ID` | Bedrock 모델 ID | `us.anthropic.claude-sonnet-4-6` |

### 빌드 및 실행

```bash
# dev 프로필 (JWT 인증 우회)
./gradlew bootRun --args='--spring.profiles.active=dev'

# 운영 프로필 (Cognito JWT 인증 활성화)
./gradlew bootRun

# 빌드 (테스트 제외)
./gradlew clean build -x test
```

### DB 초기화 (최초 1회)

Flyway가 Spring Boot 4에서 자동 실행되지 않으므로 수동으로 스키마를 적용합니다.

```bash
psql -d fluento -f src/main/resources/db/migration/V1__Initial_schema.sql
```

---

## Docker로 실행 (운영)

```bash
# 이미지 빌드 및 컨테이너 시작
docker compose up -d --build

# 로그 확인
docker compose logs -f app

# 중지
docker compose down
```

컨테이너 구성:

| 컨테이너 | 이미지 | 포트 |
|----------|--------|------|
| fluento-app | 로컬 빌드 | 8080 |
| fluento-postgres | postgres:17-alpine | 5432 |
| fluento-redis | redis:7-alpine | 6379 |

> PostgreSQL 컨테이너 최초 시작 시 `V1__Initial_schema.sql`이 자동 적용됩니다.

---

## API

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`
- Health Check: `GET /api/v1/health`

### 응답 포맷

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "statusCode": 404, "timestamp": "..." } }
```

### 주요 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/health` | 헬스체크 (인증 불필요) |
| POST | `/api/v1/auth/register` | 회원가입 |
| GET | `/api/v1/users/me` | 내 정보 조회 |
| PUT | `/api/v1/users/profile` | 프로필 수정 |
| GET | `/api/v1/chat/rooms` | 채팅방 목록 |
| POST | `/api/v1/chat/rooms` | 채팅방 생성 |
| POST | `/api/v1/chat/rooms/{roomId}/messages` | 메시지 전송 |
| GET | `/api/v1/chat/rooms/{roomId}/messages` | 메시지 목록 |
| GET | `/api/v1/chat/stream` | SSE AI 응답 스트림 |

---

## 아키텍처

```
com.fluento
├── config/         # Security, Redis, Jackson, Swagger 설정
├── controller/     # REST / SSE 컨트롤러
├── domain/         # JPA 엔티티 및 Repository
├── dto/            # 요청/응답 DTO
├── exception/      # 글로벌 예외 처리
└── service/        # 비즈니스 로직 (AI, 채팅, 레벨 조절 등)
```

### SSE 스트림 이벤트 순서

```
ai_start → level_assessment → level_adjustment(선택) → ai_chunk(반복) → ai_complete
                                                       └─ 백그라운드: evaluation
```

### 난이도 조절 규칙

- **레벨 올리기**: 연속 3개 메시지 점수 ≥ 90
- **레벨 내리기**: 연속 2개 메시지 점수 ≤ 50
- 점수는 Redis List에 저장 (`fluento:scores:{roomId}`)

---

## 알려진 이슈

- **Flyway 자동 실행 불가**: Spring Boot 4에서 미동작 — SQL 직접 실행 필요
- **Sentry 미연동**: Spring Boot 4 호환 버전 미출시
- **S3 이미지 업로드 미구현**: API 구조만 존재

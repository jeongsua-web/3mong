# Fluento 시스템 구성도

> AI 영어회화 학습 서비스 Fluento의 시스템 아키텍처 문서
> 최종 업데이트: 2026-06-16

---

## 1. 전체 시스템 구성도

```mermaid
graph TB
    subgraph Client["사용자 브라우저"]
        FE["React 19 SPA<br/>(Vite 8)<br/>react-router · axios · GSI"]
    end

    subgraph Google["Google"]
        GSI["Google Identity Services<br/>(OAuth id_token 발급)"]
        TOKENINFO["Google tokeninfo<br/>(id_token 검증)"]
    end

    subgraph OpenAI["OpenAI"]
        GPT["OpenAI API<br/>gpt-4o-mini (스트리밍)"]
    end

    subgraph EC2["AWS EC2 (43.201.25.12) — Docker Compose"]
        subgraph App["fluento-app (Spring Boot 4 / JDK 17)"]
            CTRL["Controller Layer<br/>REST + SSE"]
            SVC["Service Layer<br/>Chat · Level · Evaluation · AI"]
            SEC["Security<br/>JwtAuthenticationFilter<br/>JwtTokenProvider"]
        end
        PG[("fluento-postgres<br/>PostgreSQL 17<br/>users · chat · assessment")]
        RD[("fluento-redis<br/>Redis 7<br/>레벨 점수 캐싱")]
    end

    FE -- "HTTPS REST<br/>/api/v1/**" --> CTRL
    FE -- "SSE GET /stream<br/>(access_token 쿼리)" --> CTRL
    FE -- "Google 로그인 버튼" --> GSI
    GSI -- "id_token (credential)" --> FE

    CTRL --> SEC
    CTRL --> SVC
    SEC -- "id_token 검증" --> TOKENINFO
    SVC -- "JDK HttpClient<br/>스트리밍 호출" --> GPT
    SVC -- "JPA" --> PG
    SVC -- "RedisTemplate" --> RD
```

---

## 2. 배포 / 인프라 구성도

```mermaid
graph LR
    DEV["개발자<br/>git push (main)"] --> GH["GitHub<br/>monorepo (3mong)"]
    GH -- "02-backend/** 변경 시" --> GHA["GitHub Actions<br/>deploy.yml"]
    GHA -- "SSH (appleboy/ssh-action)" --> EC2

    subgraph EC2["AWS EC2 — 43.201.25.12 (ubuntu)"]
        direction TB
        COMPOSE["docker compose up -d --build"]
        COMPOSE --> C1["fluento-app :8080"]
        COMPOSE --> C2["fluento-postgres :5432"]
        COMPOSE --> C3["fluento-redis :6379"]
        COMPOSE --> C4["migrate (1회성 Flyway SQL 적용)"]
        ENV[".env<br/>OPENAI_API_KEY · APP_JWT_SECRET<br/>GOOGLE_CLIENT_ID · DB_*"]
        ENV -.-> C1
    end

    EC2 -. "HTTPS" .-> OPENAI["OpenAI API"]
    EC2 -. "HTTPS" .-> GOOGLE["Google tokeninfo"]
```

**배포 흐름**
- `main` 브랜치에 `02-backend/**` 변경 푸시 → GitHub Actions가 EC2로 SSH 접속
- `git pull` → `docker compose down` → `docker compose up -d --build`
- 컨테이너: `fluento-app`, `fluento-postgres`, `fluento-redis`, 1회성 `migrate`
- 시크릿은 EC2의 `.env` 파일로 주입 (저장소에 커밋되지 않음)

---

## 3. 백엔드 계층 구조

```mermaid
graph TB
    subgraph Controller["Controller (com.fluento.controller)"]
        HC["HealthController"]
        AC["AuthController"]
        UC["UserController"]
        CRC["ChatRoomController"]
        CMC["ChatMessageController"]
        SSE["ChatSSEController (SSE)"]
    end

    subgraph Service["Service (com.fluento.service)"]
        US["UserService"]
        CRS["ChatRoomService"]
        CMS["ChatMessageService"]
        AIR["AIResponseService<br/>(SSE 흐름 통합)"]
        OAI["OpenAIService (AIService)"]
        LAS["LevelAssessmentService"]
        LADJ["LevelAdjustmentService"]
        ES["EvaluationService"]
        AUTH["AuthService (Google 로그인)"]
    end

    subgraph Domain["Domain / Persistence"]
        USER[("users")]
        CHAT[("chat_rooms · chat_messages")]
        ASSESS[("level_assessments")]
        REDIS[("Redis: fluento:scores:{roomId}")]
    end

    AC --> AUTH
    UC --> US
    CRC --> CRS
    CMC --> CMS
    SSE --> AIR
    AIR --> OAI & LAS & LADJ & ES & CMS
    OAI --> EXT["OpenAI API"]
    AUTH --> GG["Google tokeninfo"]
    US --> USER
    CRS & CMS --> CHAT
    LAS --> ASSESS
    LADJ --> REDIS
```

---

## 4. 인증 흐름 (자체 JWT + Google 로그인)

```mermaid
sequenceDiagram
    participant U as 사용자(브라우저)
    participant G as Google GSI
    participant BE as Spring Boot (AuthService)
    participant GT as Google tokeninfo
    participant DB as PostgreSQL

    Note over U,G: 1) Google 로그인
    U->>G: 로그인 버튼 클릭 (팝업)
    G-->>U: id_token (credential)
    U->>BE: POST /api/v1/auth/... (credential)
    BE->>GT: id_token 검증
    GT-->>BE: 사용자 정보(email, sub)
    BE->>DB: 사용자 조회/생성 (이메일 인증 없음)
    BE-->>U: 자체 JWT (subject = user.id)

    Note over U,BE: 2) 인증된 API 호출
    U->>BE: Authorization: Bearer <자체 JWT>
    Note right of BE: JwtAuthenticationFilter →<br/>JwtTokenProvider.getUserId()
    BE-->>U: ApiResponse<T>
```

> dev 프로필에서는 `DevSecurityConfig`가 모든 요청을 통과시키고 `googleId="dev-user"`로 자동 인증.

---

## 5. AI 응답 SSE 스트림 흐름

```mermaid
sequenceDiagram
    participant U as 사용자(브라우저)
    participant CMC as ChatMessageController
    participant SSE as ChatSSEController
    participant AIR as AIResponseService
    participant AI as OpenAIService → OpenAI API

    U->>CMC: POST /messages (사용자 메시지)
    CMC->>CMC: 메시지 저장
    CMC-->>U: streamUrl 반환
    U->>SSE: GET /stream?messageId=&access_token=
    SSE->>AIR: 스트림 시작

    AIR-->>U: ai_start
    AIR->>AI: 레벨 판단
    AIR-->>U: level_assessment
    opt 난이도 변동 시
        AIR-->>U: level_adjustment
    end
    loop 토큰 스트리밍
        AI-->>AIR: chunk
        AIR-->>U: ai_chunk
    end
    AIR-->>U: evaluation_start
    AIR->>AI: 문법/뉘앙스 평가
    AIR-->>U: evaluation
    AIR-->>U: ai_complete
```

**난이도 조절 규칙** (`LevelAdjustmentService`, Redis 점수 추적)
- 올리기: 연속 3개 메시지 ≥ 90점
- 내리기: 연속 2개 메시지 ≤ 50점

---

## 6. 기술 스택 요약

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19, Vite 8, react-router-dom 7, axios, @react-oauth/google, lucide-react |
| 백엔드 | Spring Boot 4.0 / Spring 7 / JDK 17, jjwt(자체 JWT) |
| 데이터 | PostgreSQL 17 (+ Flyway), Redis 7 |
| AI | OpenAI API `gpt-4o-mini` (스트리밍, JDK HttpClient) |
| 인증 | 자체 JWT + Google Identity Services (GSI) |
| 실시간 | SSE (Server-Sent Events) |
| 인프라 | AWS EC2 (43.201.25.12), Docker Compose |
| CI/CD | GitHub Actions → SSH 배포 (monorepo) |

> 참고: 과거 AWS Cognito / Bedrock(Claude 3.5 Sonnet v2)을 사용했으나,
> Cognito는 Google GSI 직접 검증으로, Bedrock은 OpenAI API로 각각 전환됨 (2026-06).

# Fluento

> AI 영어 회화 학습 앱 — AI 친구와 대화하며 영어를 배우고, 틀린 표현은 오답노트로 복습합니다.

사용자는 개성 있는 AI 친구(캐릭터)를 골라 영어로 대화하고, AI가 실시간 스트리밍으로 응답·교정해 줍니다. 대화 중 어색한 표현은 오답노트에 자동으로 쌓이고, 매일 학습 목표와 난이도가 사용자 수준에 맞춰 조절됩니다.

---

## 주요 기능

- **AI 친구와 영어 회화** — 캐릭터별 성격을 가진 AI와 자유 대화 (OpenAI `gpt-4o-mini`, SSE 실시간 스트리밍)
- **커스텀 친구 만들기** — 이름·성격·말투를 직접 설정한 나만의 AI 친구 생성
- **오답노트** — 대화 중 틀린 표현을 모아 한국어 AI 해설과 함께 복습
- **오늘의 목표 / 레벨 조절** — 학습 시간·단어 수·복습 여부를 자동 추적하고 난이도를 사용자 수준에 맞춰 조정
- **Google 로그인** — Google Identity Services(GSI) `id_token` 검증 기반 로그인, 자체 JWT 발급

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | React 19, Vite 8, React Router 7, Axios, `@react-oauth/google`, lucide-react |
| **Backend** | Java 17, Spring Boot 4.0, Spring Security 7, Spring WebFlux(SSE), Gradle 9 |
| **Database** | PostgreSQL 17, Redis 7 |
| **ORM / Migration** | Spring Data JPA · Hibernate, Flyway |
| **Auth** | 자체 JWT(jjwt) + Google 로그인(GSI id_token 검증) |
| **AI** | OpenAI API (`gpt-4o-mini`, 스트리밍) |
| **API Docs** | springdoc-openapi (Swagger UI) |
| **Infra** | Docker Compose, AWS EC2, GitHub Actions(CI/CD) |

---

## 레포 구조

```
.
├── 01_frontend/     # React 19 + Vite SPA (프론트엔드)
├── 02-backend/      # Spring Boot 4 API 서버 (백엔드)
├── doc/             # 시스템 문서 (ERD · 아키텍처 · 유스케이스)
├── .github/         # GitHub Actions 배포 워크플로
├── E2E_TEST_REPORT.md
└── TEST_REPORT_2026-06-02.md
```

각 모듈의 상세 실행법은 하위 README를 참고하세요.

- [`01_frontend/README.md`](01_frontend/README.md) — 프론트엔드 실행 및 학습 목표 추적 로직
- [`02-backend/README.md`](02-backend/README.md) — 백엔드 환경변수·실행·API

---

## 로컬 실행

### Backend

```bash
cd 02-backend
cp .env.example .env        # .env에 실제 값 입력 (DB·Redis·JWT·Google·OpenAI)
docker compose up -d        # PostgreSQL 17 + Redis 7
./gradlew bootRun
```

- 필요: JDK 17, Docker / Docker Compose
- `OPENAI_API_KEY`, `APP_JWT_SECRET`(최소 32바이트), `GOOGLE_CLIENT_ID` 설정 필수
- Swagger UI: `http://localhost:8080/swagger-ui.html`

자세한 환경변수는 [백엔드 README](02-backend/README.md) 참고.

### Frontend

```bash
cd 01_frontend
npm install
npm run dev
```

- 필요: Node.js, 실행 중인 백엔드 서버

---

## 시스템 아키텍처

```
사용자 브라우저 (React 19 SPA)
        │  REST + SSE
        ▼
AWS EC2 — Docker Compose
  └─ Spring Boot 4 (Controller · Service · Security)
        ├─ PostgreSQL 17 / Redis 7
        ├─ Google tokeninfo (id_token 검증)
        └─ OpenAI API (gpt-4o-mini 스트리밍)
```

전체 구성도·ERD·유스케이스는 [`doc/`](doc/) 디렉터리를 참고하세요.

- [`doc/system-architecture.md`](doc/system-architecture.md) — 시스템 구성도
- [`doc/erd.md`](doc/erd.md) — 데이터베이스 ERD
- [`doc/usecase.md`](doc/usecase.md) — 유스케이스

---

## 배포

`main` 브랜치의 `02-backend/**` 변경 시 GitHub Actions가 AWS EC2로 자동 배포합니다. (`.github/workflows/deploy.yml`)

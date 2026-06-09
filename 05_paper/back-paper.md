# AI 기반 적응형 영어 회화 학습 시스템 Fluento 설계 및 구현

**발표 분야**: ICT 전분야 캡스톤 디자인 / 학부생 논문

---

## 초록

본 논문은 대규모 언어 모델(LLM)을 활용하여 학습자의 영어 수준을 실시간으로 분석하고, 난이도를 자동으로 조절하는 적응형 영어 회화 학습 시스템 Fluento의 설계와 구현을 다룬다. 기존 영어 학습 앱은 정적인 수준 분류와 단방향 콘텐츠 제공 방식에 머물러, 학습자의 실력 변화에 즉각적으로 반응하지 못하는 한계가 있다. 본 시스템은 AWS Bedrock의 Claude 3.5 Sonnet 모델을 통해 대화 메시지마다 어휘, 문법, 유창성, 문맥 인식 능력을 분석하고, 규칙 기반 난이도 조절 알고리즘과 결합하여 학습자에게 최적의 대화 경험을 제공한다. Server-Sent Events(SSE)를 이용한 스트리밍 응답, AWS Cognito 기반 인증, Redis를 활용한 점수 캐싱으로 실시간성과 확장성을 동시에 확보하였다.

---

## 1. 서론

### 1.1 연구 배경 및 필요성

세계화가 가속화됨에 따라 영어 의사소통 능력에 대한 수요는 지속적으로 증가하고 있다. 그러나 전통적인 영어 교육 방식은 강사 의존적이며, 개인의 수준과 학습 속도를 반영하기 어렵다. 기존 상용 영어 학습 앱들은 사전 정의된 커리큘럼에 따라 콘텐츠를 제공하기 때문에 학습자가 이미 알고 있는 내용을 반복하거나, 반대로 지나치게 어려운 내용에 노출되는 문제가 발생한다.

최근 GPT, Claude 등 대규모 언어 모델의 등장으로 자연어 처리 기술이 급격히 발전하였고, 이를 영어 회화 교육에 접목하려는 시도가 증가하고 있다. 그러나 대부분의 연구는 단순 챗봇 수준의 대화 제공에 그치며, 학습자의 언어 수준을 동적으로 감지하고 대화 난이도를 실시간으로 조절하는 적응형 학습 시스템은 아직 연구 단계에 머물러 있다.

### 1.2 연구 목적

본 연구의 목적은 다음과 같다.

1. 학습자의 메시지를 AI가 분석하여 영어 수준(초급·중급·고급)을 실시간으로 판별하는 시스템을 구현한다.
2. 판별된 수준에 따라 AI 응답의 어휘 수준·문장 복잡도·문법 구조를 자동으로 조절한다.
3. 대화 완료 후 문법 오류 및 뉘앙스 개선점을 제공하는 피드백 기능을 구현한다.
4. 실시간 스트리밍 응답을 통해 사용자 경험(UX)을 향상시킨다.

### 1.3 논문 구성

본 논문은 2장에서 관련 연구를 검토하고, 3장에서 시스템 설계 및 기술 스택을 설명한다. 4장에서는 핵심 기능의 구현 방법을 기술하며, 5장에서 결론 및 향후 연구 방향을 제시한다.

---

## 2. 관련 연구

### 2.1 적응형 학습 시스템(Adaptive Learning System)

적응형 학습 시스템은 학습자의 반응을 분석하여 학습 경로나 콘텐츠를 동적으로 조정하는 시스템이다. Knewton, Duolingo 등 상용 서비스는 문항 반응 이론(IRT)이나 지식 추적(Knowledge Tracing) 기법을 활용하나, 자유 형식의 회화 데이터를 실시간으로 분석하는 데는 한계가 있다.

### 2.2 LLM 기반 언어 교육

대규모 언어 모델을 언어 교육에 활용한 연구는 최근 급증하고 있다. [1] GPT-4를 활용한 에세이 첨삭 연구, [2] 챗봇 기반 회화 연습 시스템 등이 있으나, 다음과 같은 한계가 있다.

- 학습자 수준 판별이 입력 전 설문에 의존하며 대화 중 동적 갱신이 없음
- AI 응답이 학습자 수준에 맞게 자동 조절되지 않음
- 문법·뉘앙스 피드백이 별도 세션으로 분리되어 학습 흐름이 끊김

본 연구는 이러한 한계를 극복하기 위해 수준 판별·난이도 조절·피드백을 단일 대화 흐름 안에서 통합 처리한다.

---

## 3. 시스템 설계

### 3.1 전체 시스템 아키텍처

Fluento 백엔드는 RESTful API 서버와 SSE 스트리밍 서버를 통합한 단일 Spring Boot 애플리케이션으로 구성된다. 클라이언트는 메시지 전송 후 반환된 스트림 URL로 SSE 연결을 맺어 AI 응답을 실시간으로 수신한다.

```
클라이언트
  │
  ├─ POST /api/v1/chat/rooms/{roomId}/messages   (메시지 전송)
  │       └─ messageId + streamUrl 반환
  │
  └─ GET /api/v1/chat/stream?messageId=...       (SSE 구독)
          │
          ├── ai_start          (스트리밍 시작 알림)
          ├── level_assessment  (수준 판별 결과)
          ├── level_adjustment  (난이도 변경 알림, 조건부)
          ├── ai_chunk × N      (AI 응답 텍스트 스트리밍)
          └── ai_complete       (완료 + 메시지 ID)
                  └─ [백그라운드] evaluation (문법·뉘앙스 피드백 저장)
```

### 3.2 기술 스택

| 분류 | 기술 | 버전 | 선택 이유 |
|------|------|------|-----------|
| Language | Java (JDK) | 17 | 안정성, 생태계 |
| Framework | Spring Boot | 4.0.0 | 최신 LTS, 반응형 지원 |
| Reactive | Spring WebFlux | Spring 관리 | 비동기 SSE 스트리밍 |
| Database | PostgreSQL | 17 | JSONB 지원, 오픈소스 |
| Cache | Redis | 7 | 인메모리 점수 추적 |
| ORM | Spring Data JPA | Spring 관리 | 생산성 |
| DB 마이그레이션 | Flyway | Spring 관리 | 스키마 버전 관리 |
| 인증 | AWS Cognito | SDK v2 2.30.19 | OAuth 2.0 / JWT |
| AI | AWS Bedrock (Claude 3.5 Sonnet) | SDK v2 2.30.19 | 고성능 LLM, 스트리밍 |
| Build | Gradle | 9.0.0 | 빠른 빌드, 의존성 관리 |
| 컨테이너 | Docker / Docker Compose | - | 환경 일관성 |

### 3.3 데이터베이스 스키마

핵심 테이블은 다음과 같다.

| 테이블 | 역할 |
|--------|------|
| `users` | 사용자 계정 (Cognito Sub 매핑) |
| `chat_rooms` | 채팅방 (현재 수준, 캐릭터 정보) |
| `chat_messages` | 메시지 (수준, 평가 점수, 피드백 JSONB) |
| `level_assessments` | 수준 판별 이력 (신뢰도, 지표) |

### 3.4 패키지 구조

```
com.fluento
├── config/          # 보안, Redis, Jackson, Swagger 설정
├── controller/      # REST 및 SSE 컨트롤러
├── domain/          # JPA 엔티티 및 Repository
├── dto/             # 요청·응답 DTO
├── exception/       # 전역 예외 처리
└── service/
    ├── BedrockService          # AWS Bedrock API 호출 (동기·비동기)
    ├── AIResponseService       # SSE 스트림 전체 흐름 통합
    ├── LevelAssessmentService  # 수준 판별
    ├── LevelAdjustmentService  # 난이도 조절 (Redis 기반)
    └── EvaluationService       # 문법·뉘앙스 평가
```

---

## 4. 구현

### 4.1 AI 수준 판별 (Level Assessment)

사용자가 메시지를 전송할 때마다 `LevelAssessmentService`가 해당 메시지를 AWS Bedrock의 Claude 3.5 Sonnet 모델에 전달하여 영어 수준을 판별한다. 분석 항목은 어휘(vocabulary), 문법(grammar), 유창성(fluency), 문맥 인식(contextAwareness)의 4가지이며, 각 항목은 `beginner / intermediate / advanced`로 분류된다.

프롬프트 설계는 모델이 JSON 형식으로만 응답하도록 지시하여 파싱 오류를 최소화하였다.

```
입력 → 현재 수준 + 최근 대화 이력 + 사용자 메시지
출력 → { detectedLevel, confidence(0~1), indicators: { vocabulary, grammar, fluency, contextAwareness } }
```

### 4.2 적응형 난이도 조절 (Adaptive Level Adjustment)

`LevelAdjustmentService`는 Redis List(`fluento:scores:{roomId}`)에 저장된 최근 평가 점수를 기반으로 다음 규칙에 따라 난이도를 조절한다.

| 조건 | 조치 |
|------|------|
| 연속 3개 메시지 점수 ≥ 90 | 수준 상향 |
| 연속 2개 메시지 점수 ≤ 50 | 수준 하향 |
| 그 외 | 현재 수준 유지 |

Redis를 사용하여 DB 조회 없이 O(1) 속도로 최근 점수를 조회하고, 수준 변경 시 `chat_rooms` 테이블의 `current_level` 컬럼을 갱신한다.

### 4.3 수준별 AI 응답 생성

`BedrockService`는 현재 학습자 수준에 따라 서로 다른 시스템 프롬프트를 AWS Bedrock에 전달한다.

| 수준 | 시스템 프롬프트 특징 |
|------|----------------------|
| Beginner | 가장 빈번한 1,000~2,000개 어휘, 5~10 단어 단문, 현재 시제만 사용 |
| Intermediate | 3,000~5,000개 어휘, 10~20 단어 문장, 다양한 시제, 일반 관용어 포함 |
| Advanced | 5,000개 이상 어휘, 복문·가정법·학문적 표현, 문화적 참조 포함 |

응답은 AWS SDK의 `ConverseStreamRequest`를 통해 스트리밍으로 수신하며, `Flux<String>` 형태로 리액티브 파이프라인에 통합된다.

### 4.4 실시간 SSE 스트리밍

Spring WebFlux의 `Flux<ServerSentEvent<>>` 를 활용하여 비동기 스트리밍을 구현하였다. `AIResponseService`는 다음 순서로 이벤트를 발행한다.

1. `ai_start` — 즉시 발행 (사용자 대기 시간 최소화)
2. `level_assessment` — Bedrock 수준 판별 완료 후 발행
3. `level_adjustment` — 난이도 변경이 발생한 경우에만 발행
4. `ai_chunk` × N — Bedrock 스트리밍 응답 청크를 그대로 전달
5. `ai_complete` — 전체 AI 메시지 저장 완료 후 발행

문법·뉘앙스 평가는 `ai_complete` 발행 이후 별도 스레드(`Schedulers.boundedElastic()`)에서 비동기 실행되므로 SSE 스트림의 응답 시간에 영향을 주지 않는다.

### 4.5 문법·뉘앙스 피드백 (Evaluation)

`EvaluationService`는 대화가 완료된 후 사용자 메시지와 AI 응답을 함께 Bedrock에 전달하여 다음 항목을 평가한다.

```json
{
  "isCorrect": true,
  "score": 0~100,
  "feedback": {
    "grammarIssues": [{ "type", "issue", "correction", "explanation" }],
    "nuanceIssues":  [{ "type", "context", "suggestion" }],
    "positivePoints": ["..."],
    "overallFeedback": "..."
  }
}
```

평가 결과는 `chat_messages` 테이블의 JSONB 컬럼에 저장되어, 클라이언트가 메시지 조회 시 피드백을 함께 확인할 수 있다.

### 4.6 인증 및 보안

운영 환경에서는 AWS Cognito가 발급한 JWT를 Spring Security OAuth2 Resource Server가 검증한다. 개발 환경(dev 프로필)에서는 `DevSecurityConfig`가 활성화되어 `Authorization: Bearer dev-token` 헤더로 인증을 우회할 수 있다. 이를 통해 개발 편의성과 운영 보안을 분리하였다.

### 4.7 API 명세

모든 응답은 통일된 래퍼 포맷을 사용한다.

```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": { "code": "CHAT_ROOM_NOT_FOUND", "message": "...", "statusCode": 404 } }
```

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/health` | 헬스체크 |
| POST | `/api/v1/auth/register` | 회원가입 |
| GET | `/api/v1/users/me` | 내 정보 조회 |
| PUT | `/api/v1/users/profile` | 프로필 수정 |
| GET | `/api/v1/chat/rooms` | 채팅방 목록 조회 |
| POST | `/api/v1/chat/rooms` | 채팅방 생성 |
| POST | `/api/v1/chat/rooms/{roomId}/messages` | 메시지 전송 |
| GET | `/api/v1/chat/rooms/{roomId}/messages` | 메시지 목록 조회 |
| GET | `/api/v1/chat/stream?messageId=` | SSE AI 응답 스트림 |
| GET | `/api/v1/chat/rooms/{roomId}/level` | 현재 수준 조회 |

---

## 5. 결론

### 5.1 기대 효과

본 시스템은 학습자에게 다음과 같은 가치를 제공한다.

**학습 효율 향상**: AI가 매 대화마다 수준을 분석하고 응답 난이도를 자동 조절함으로써, 학습자는 항상 자신의 실력보다 약간 어려운 '최적 학습 구간'에서 대화를 이어갈 수 있다. 이는 Vygotsky의 근접 발달 영역(Zone of Proximal Development) 이론과 일치한다.

**즉각적인 피드백**: 대화가 끝난 직후 문법 오류·뉘앙스 개선점·긍정 포인트를 구조화된 형태로 제공하므로, 학습자는 자신의 실수를 빠르게 인지하고 교정할 수 있다.

**낮은 심리적 장벽**: AI 캐릭터와의 대화이므로 실수에 대한 두려움 없이 자유롭게 표현할 수 있으며, 언제 어디서나 반복 연습이 가능하다.

**개인 맞춤형 경험**: 동일한 앱을 사용하더라도 초급자와 고급자가 전혀 다른 수준의 대화를 경험하며, 실력이 향상됨에 따라 시스템이 자동으로 더 높은 수준의 콘텐츠를 제공한다.

### 5.2 향후 연구 방향

**단기 과제**
- 프론트엔드(iOS/Android) 앱 개발 및 실사용자 테스트
- AWS S3 기반 이미지 메시지 전송 구현
- Flyway 자동 마이그레이션 이슈 해결 (Spring Boot 4 호환 버전 대응)

**중기 과제**
- 수준 판별 정확도 평가 지표 수립 및 A/B 테스트 도입
- 학습 이력 분석 대시보드 구현 (주간 점수 추이, 오류 유형 통계)
- 다국어 지원 확장 (일어, 중국어, 스페인어)
- RAG(Retrieval-Augmented Generation) 기반 학습 콘텐츠 확장

**장기 과제**
- 학습자 행동 데이터를 기반으로 한 파인튜닝 모델 개발
- 음성 입출력(STT/TTS) 통합으로 발음 교정 기능 추가
- 그룹 학습 모드: 다수 학습자 간 AI 퍼실리테이터 역할
- 실시간 수준 판별 모델의 경량화를 통한 온디바이스 추론 연구

---

## 참고문헌

[1] Gan, W., et al. (2024). Adapting Large Language Models for Education: Foundational Capabilities, Potentials, and Challenges. *arXiv preprint arXiv:2401.08664*.
- https://arxiv.org/abs/2401.08664

[2] Huang, W., Hew, K. F., & Fryer, L. K. (2022). Chatbots for language learning—Are they really useful? A systematic review of chatbot-supported language learning. *Journal of Computer Assisted Learning*, 38(1), 237–257.
- https://onlinelibrary.wiley.com/doi/abs/10.1111/jcal.12610

[3] Wang, Z., et al. (2025). Automatic Proficiency Assessment in L2 English Learners. *arXiv preprint arXiv:2505.02615*.
- https://arxiv.org/abs/2505.02615

[4] Fang, T., et al. (2024). Evaluating Prompting Strategies for Grammatical Error Correction Based on Language Proficiency. *arXiv preprint arXiv:2402.15930*.
- https://arxiv.org/abs/2402.15930

[5] OpenAI. (2023). GPT-4 Technical Report. *arXiv preprint arXiv:2303.08774*.
- https://arxiv.org/abs/2303.08774

[6] Anthropic. (2024). *Claude 3.5 Sonnet Model Card Addendum*. Anthropic.
- 공식 발표: https://www.anthropic.com/news/claude-3-5-sonnet
- Model Card PDF: https://www-cdn.anthropic.com/fed9cc193a14b84131812372d8d5857f8f304c52/Model_Card_Claude_3_Addendum.pdf

[7] AWS. (2024). *Amazon Bedrock Developer Guide*. Amazon Web Services.
- https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html

[8] VMware Tanzu. (2024). *Spring WebFlux Reference Documentation*. Spring Framework.
- https://docs.spring.io/spring-framework/reference/web/webflux.html

[9] WHATWG. (2024). *Server-Sent Events — HTML Living Standard*. Web Hypertext Application Technology Working Group.
- https://html.spec.whatwg.org/multipage/server-sent-events.html

---

*본 논문은 ICT 전분야 캡스톤 디자인 발표를 위해 작성되었습니다.*

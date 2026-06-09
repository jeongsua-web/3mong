# FLUENTO 백엔드 개발 단계별 프롬프트

---

## 📋 PHASE 1: 프로젝트 초기 설정

### Step 1-1: Spring Boot 프로젝트 생성

**프롬프트:**
```
Spring Boot 4.0.x 프로젝트를 다음 설정으로 생성해줘:
- Project: Gradle Project (Groovy)
- Language: Java
- Spring Boot: 4.0.0
- Java Version: 17
- Group: com.fluento
- Artifact: fluento-backend
- Package name: com.fluento

Dependencies:
- Spring Web
- Spring Data JPA
- PostgreSQL Driver
- Spring Security
- Validation
- Actuator
- OpenAPI 3 (Swagger)

build.gradle에 추가로 필요한 의존성:
- JWT (jjwt)
- Redis
- AWS SDK (Cognito)
- Sentry (에러 추적)

프로젝트 구조도 함께 생성해줘.
```

---

### Step 1-2: PostgreSQL 연결 설정

**프롬프트:**
```
PostgreSQL 17과 Spring Boot를 연결하기 위한 설정을 해줘:

1. application.yml 작성:
   - DB 연결 (postgresql)
   - Hibernate 설정 (ddl-auto: validate)
   - Connection Pool (HikariCP)

2. 기본 테스트:
   - 데이터베이스 연결 확인
   - Hibernate 작동 확인

환경 변수로 DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD를 받도록 설정해줘.
```

---

### Step 1-3: Redis 연결 설정

**프롬프트:**
```
Redis 캐싱 설정을 해줘:

1. RedisConfig 클래스 작성:
   - RedisTemplate Bean
   - StringRedisTemplate Bean

2. application.yml 설정:
   - Redis 호스트/포트
   - Connection Pool
   - Timeout 설정

3. 테스트:
   - Redis 연결 확인
   - 간단한 캐시 테스트

환경 변수: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
```

---

### Step 1-4: AWS Cognito + JWT 설정

**프롬프트:**
```
AWS Cognito와 JWT 검증을 설정해줘:

1. SecurityConfig 클래스 작성:
   - JWT 기반 인증 (stateless)
   - CORS 설정 (localhost:3000 허용)
   - 공개 엔드포인트: /api/v1/auth/**, /api/v1/health
   - 나머지: 인증 필수

2. JwtDecoder Bean:
   - Cognito JWK Set URI 사용
   - JWT 자동 검증

3. application.yml:
   - spring.security.oauth2.resourceserver.jwt.issuer-uri
   - spring.security.oauth2.resourceserver.jwt.jwk-set-uri

환경 변수:
   - AWS_REGION
   - AWS_COGNITO_USER_POOL_ID

테스트:
   - 인증 없이 /health 접근 → 성공
   - 인증 없이 다른 엔드포인트 접근 → 401
```

---

## 📊 PHASE 2: 데이터 모델 & DB 스키마

### Step 2-1: Entity 클래스 작성 (User)

**프롬프트:**
```
User Entity를 작성해줘:

필드:
- id (Long, PK)
- googleId (String, unique, nullable)
- email (String, unique, not null)
- name (String, not null)
- profileImageUrl (String, nullable)
- appLanguage (String, default: "ko")
- theme (String, default: "system")
- notificationEnabled (Boolean, default: true)
- createdAt (LocalDateTime, not updatable)
- updatedAt (LocalDateTime)

기능:
- @PrePersist: createdAt, updatedAt 자동 설정
- @PreUpdate: updatedAt 자동 업데이트
- Lombok 사용 (@Data, @Builder 등)

Repository도 함께 작성해줘.
```

---

### Step 2-2: Entity 클래스 작성 (ChatRoom)

**프롬프트:**
```
ChatRoom Entity를 작성해줘:

필드:
- id (String, UUID, PK)
- user (User, FK, not null, cascade delete)
- characterId (String, not null)
- characterName (String, not null)
- title (String, not null)
- isPinned (Boolean, default: false)
- currentLevel (Enum: BEGINNER, INTERMEDIATE, ADVANCED)
- messageCount (Integer, default: 0)
- lastMessageAt (LocalDateTime, nullable)
- createdAt (LocalDateTime, not updatable)
- updatedAt (LocalDateTime)

제약조건:
- 같은 사용자 + AI는 1개의 채팅방만 (unique constraint)

Index:
- user_id
- character_id

Repository:
- findByUserIdAndCharacterId (exists 체크용)
- findByUserId (목록 조회)
- findByIdAndUserId (소유권 확인)
```

---

### Step 2-3: Entity 클래스 작성 (ChatMessage & LevelAssessment)

**프롬프트:**
```
ChatMessage Entity를 작성해줘:

필드:
- id (String, UUID, PK)
- room (ChatRoom, FK, cascade delete)
- senderType (Enum: USER, AI)
- senderName (String)
- content (String, not null)
- messageType (Enum: TEXT, IMAGE)
- imageUrl (String, nullable)
- levelAtTime (Enum: BEGINNER, INTERMEDIATE, ADVANCED)
- isCorrect (Boolean, nullable)
- score (Integer, nullable)
- feedbackJson (JSON, nullable) - 평가 결과 저장
- createdAt (LocalDateTime, not updatable)

Index:
- room_id
- created_at (최신 메시지 조회)

Repository:
- findByRoomId (페이지네이션)
- findLatestByRoomId (최신 메시지)

---

LevelAssessment Entity도 만들어줘:
- id (Long, PK)
- room (ChatRoom, FK)
- message (ChatMessage, FK)
- detectedLevel (Enum)
- confidence (BigDecimal)
- indicatorsJson (JSON)
- recommendationJson (JSON)
- assessedAt (LocalDateTime)

Repository:
- findLatestByRoomId (현재 수준 확인)
- findByRoomIdOrderByAssessedAtDesc (수준 이력)
```

---

### Step 2-4: PostgreSQL 마이그레이션 스크립트

**프롬프트:**
```
Flyway 또는 Liquibase를 사용해서 DB 초기화 스크립트를 작성해줘:

V1__Initial_schema.sql:
- users 테이블
- chat_rooms 테이블
- chat_messages 테이블
- level_assessments 테이블
- 모든 필드, 제약조건, 인덱스 포함

테스트:
- Spring Boot 실행 시 자동으로 스크립트 실행 확인
- psql로 테이블 확인
```

---

## 🔐 PHASE 3: 인증 & 사용자 관리

### Step 3-1: User Service 작성

**프롬프트:**
```
UserService를 작성해줘:

메서드:
1. getCurrentUser(Jwt jwt) -> UserResponse
   - JWT에서 사용자 ID 추출
   - DB에서 사용자 조회
   - UserResponse로 변환

2. getOrCreateUser(String googleId, String email, String name) -> User
   - 사용자 존재하면 반환
   - 없으면 새로 생성

3. updateProfile(Long userId, UpdateProfileRequest) -> UserResponse
   - 프로필 수정

4. deleteUser(Long userId) -> void
   - 사용자 및 모든 데이터 삭제

UserResponse DTO도 작성해줘:
- id, email, name, profileImageUrl, currentLevel
```

---

### Step 3-2: Auth Controller 작성

**프롬프트:**
```
AuthController를 작성해줘:

엔드포인트:
1. GET /api/v1/auth/login/callback
   - 쿼리 파라미터: code
   - Cognito에서 JWT 토큰 교환 (또는 프론트에서 받음)
   - 사용자 생성 또는 조회
   - TokenResponse 반환 (accessToken, refreshToken 등)

2. GET /api/v1/users/me
   - @AuthenticationPrincipal Jwt jwt
   - 현재 사용자 정보 반환

3. PUT /api/v1/users/profile
   - 프로필 수정
   - @AuthenticationPrincipal Jwt jwt
   
4. POST /api/v1/auth/logout
   - JWT를 헤더에서 제거하도록 지시
   - 간단하게 OK만 반환

응답:
- GlobalExceptionHandler로 에러 처리
- @Valid로 요청 검증
```

---

## 💬 PHASE 4: 채팅 기본 기능

### Step 4-1: ChatRoom Service 작성

**프롬프트:**
```
ChatRoomService를 작성해줘:

메서드:
1. createChatRoom(Long userId, String characterId, String title) -> ChatRoom
   - 같은 사용자 + AI 조합이 이미 있는지 확인
   - 없으면 생성
   - 있으면 ChatRoomExists 예외 발생

2. getChatRoomsByUserId(Long userId, Pageable) -> Page<ChatRoom>
   - 사용자의 모든 채팅방
   - isPinned 먼저, lastMessageAt DESC로 정렬

3. getChatRoomById(String roomId, Long userId) -> ChatRoom
   - 소유권 확인 필수

4. updateChatRoomTitle(String roomId, Long userId, String newTitle) -> ChatRoom

5. togglePin(String roomId, Long userId) -> ChatRoom

6. deleteChatRoom(String roomId, Long userId) -> void

예외:
- ChatRoomNotFoundException
- ChatRoomAlreadyExistsException
- UnauthorizedException
```

---

### Step 4-2: ChatMessage Service (기본)

**프롬프트:**
```
ChatMessageService를 작성해줘 (AI 응답은 아직 없이):

메서드:
1. sendMessage(String roomId, Long userId, ChatMessageRequest) -> ChatMessage
   - 메시지 타입 검증 (text, image)
   - 이미지면 S3에 업로드
   - ChatMessage 저장
   - ChatRoom.lastMessageAt 업데이트
   - ChatMessage 반환

2. getMessageHistory(String roomId, Long userId, Pageable) -> Page<ChatMessage>
   - 소유권 확인
   - 페이지네이션으로 조회

3. saveChatMessage(ChatMessage) -> ChatMessage
   - DB 저장

ChatMessageRequest DTO:
- content (String)
- messageType (TEXT, IMAGE)
- imageUrl (String, nullable) 또는 이미지 파일

ChatMessageResponse DTO:
- id, roomId, senderType, senderName, content, messageType, imageUrl, evaluation, createdAt
```

---

### Step 4-3: ChatRoom Controller 작성

**프롬프트:**
```
ChatRoomController를 작성해줘:

엔드포인트:
1. POST /api/v1/chat/rooms
   - 요청: { characterId, title }
   - 응답: ChatRoomResponse

2. GET /api/v1/chat/rooms?pinned=true&limit=20&offset=0
   - 응답: { rooms: [...], total, limit, offset }

3. GET /api/v1/chat/rooms/{roomId}
   - 응답: ChatRoomResponse

4. PUT /api/v1/chat/rooms/{roomId}
   - 요청: { title }
   - 응답: ChatRoomResponse

5. PUT /api/v1/chat/rooms/{roomId}/pin
   - 요청: { isPinned }
   - 응답: ChatRoomResponse

6. DELETE /api/v1/chat/rooms/{roomId}
   - 응답: 204 No Content

모든 메서드:
- @AuthenticationPrincipal Jwt jwt로 사용자 ID 추출
- 소유권 확인
- GlobalExceptionHandler로 에러 처리
```

---

### Step 4-4: ChatMessage Controller (기본)

**프롬프트:**
```
ChatMessageController를 작성해줘:

엔드포인트:
1. POST /api/v1/chat/rooms/{roomId}/messages
   - 요청: ChatMessageRequest (multipart/form-data도 지원)
   - 응답: { success: true, data: ChatMessageResponse, streamUrl: "..." }
   - 상태: 202 Accepted

2. GET /api/v1/chat/rooms/{roomId}/messages?limit=50&offset=0
   - 응답: { messages: [...], total, currentLevel }

이미지 업로드:
- S3에 저장
- URL 반환
- DB에 저장

모든 메서드:
- @AuthenticationPrincipal Jwt jwt로 사용자 ID 추출
- 소유권 확인
```

---

## 🤖 PHASE 5: AI 응답 & SSE 스트리밍

### Step 5-1: OpenAI Service 작성

**프롬프트:**
```
OpenAIService를 작성해줘:

메서드:
1. generateAIResponse(String prompt, String difficulty) -> Flux<String>
   - OpenAI API 호출
   - 난이도(BEGINNER, INTERMEDIATE, ADVANCED)에 맞게 프롬프트 추가
   - 스트리밍 응답 반환 (Flux<String>)

프롬프트 템플릿:
- 사용자: "What did you do yesterday?"
- 난이도별로 시스템 프롬프트 다르게
  - BEGINNER: "답변은 5-10단어, 간단한 현재형만 사용"
  - INTERMEDIATE: "일반적인 영어, 다양한 시제"
  - ADVANCED: "고급 표현, 자연스러운 영어"

의존성:
- OpenAI Java Client
- Spring WebFlux (Flux 사용)

환경 변수: OPENAI_API_KEY
```

---

### Step 5-2: LevelAssessment Service 작성

**프롬프트:**
```
LevelAssessmentService를 작성해줘:

메서드:
1. assessUserMessage(String content, String currentLevel, List<String> conversationHistory) -> LevelAssessmentDTO
   - 사용자 메시지 분석
   - 어휘, 문법, 복잡도, 유창성 평가
   - 수준 판단 (BEGINNER, INTERMEDIATE, ADVANCED)
   - 신뢰도 (0.0-1.0) 계산

판단 기준:
- 어휘: 단어의 복잡도 (기본 1000개, 중급 3000개, 고급 5000개+)
- 문법: 오류 개수 (정확도 계산)
- 복잡도: 평균 문장 길이
- 유창성: 자연스러움 (AI로 판단)

응답:
{
  "detectedLevel": "INTERMEDIATE",
  "confidence": 0.92,
  "indicators": {
    "vocabulary": "INTERMEDIATE",
    "grammar": "INTERMEDIATE",
    "fluency": "INTERMEDIATE",
    "contextAwareness": "ADVANCED"
  }
}

의존성:
- OpenAI 또는 Claude API
```

---

### Step 5-3: Level Adjustment Service

**프롬프트:**
```
LevelAdjustmentService를 작성해줘:

메서드:
1. shouldAdjustLevel(String roomId, LevelAssessmentDTO assessment, int recentScore) -> LevelAdjustmentDTO
   - 최근 3개 메시지의 점수 확인
   - 난이도 올릴지/내릴지 결정
   
규칙:
- 올리기: 연속 3개 메시지 ≥ 90점
- 내리기: 연속 2개 메시지 ≤ 50점
- 유지: 그 외

응답:
{
  "shouldAdjust": true,
  "from": "BEGINNER",
  "to": "INTERMEDIATE",
  "reason": "User showed consistent high accuracy"
}

2. saveLevelAdjustment(String roomId, LevelAdjustmentDTO) -> void
   - level_adjustments 테이블에 저장
   - chat_rooms.currentLevel 업데이트

의존성:
- Redis (최근 점수 캐싱)
```

---

### Step 5-4: Evaluation Service

**프롬프트:**
```
EvaluationService를 작성해줘:

메서드:
1. evaluateUserMessage(String userMessage, String aiResponse) -> EvaluationDTO
   - 사용자 메시지 정확성 평가
   - 점수 (0-100) 계산
   - 문법 오류 찾기
   - 뉘앙스 개선 제안
   - 긍정 피드백 포함

평가 항목:
- isCorrect (90점 이상?)
- score (0-100)
- grammarIssues: [{ type, issue, correction, explanation }]
- nuanceIssues: [{ type, context, suggestion }]
- positivePoints: ["좋은 점들"]
- overallFeedback: "종합 의견"

응답:
{
  "isCorrect": false,
  "score": 85,
  "feedback": {
    "grammarIssues": [...],
    "nuanceIssues": [...],
    "positivePoints": [...],
    "overallFeedback": "..."
  }
}

의존성:
- OpenAI API (또는 Claude)
```

---

### Step 5-5: Chat SSE Controller

**프롬프트:**
```
ChatSSEController를 작성해줘:

엔드포인트:
GET /api/v1/chat/rooms/{roomId}/stream?messageId={messageId}
- Accept: text/event-stream
- 응답: SSE 스트림

흐름:
1. ai_start 이벤트 전송
2. level_assessment 이벤트 (수준 판단)
3. level_adjustment 이벤트 (난이도 변경, 필요시)
4. ai_chunk 이벤트들 (응답 내용)
5. evaluation_start 이벤트
6. evaluation 이벤트 (평가 결과)
7. ai_complete 이벤트 (완료)

구현:
- Flux를 사용해서 비동기 스트리밍
- 각 단계마다 이벤트 전송
- 응답 완료 후 DB에 저장

의존성:
- Spring WebFlux
- SseEmitter 또는 Flux<ServerSentEvent>
```

---

### Step 5-6: AI 응답 통합 Service

**프롬프트:**
```
AIResponseService를 작성해줘:

메서드:
1. generateAndStreamResponse(String roomId, String messageId, ChatMessage userMessage) -> Flux<ServerSentEvent<Map>>
   - 사용자 메시지로부터 수준 판단
   - 필요시 난이도 조절
   - AI 응답 생성 (스트리밍)
   - 응답 평가
   - 모든 과정을 SSE로 전송

상세 흐름:
1. LevelAssessmentService.assess() → 수준 판단
2. emit(LevelAssessmentEvent)
3. LevelAdjustmentService.shouldAdjust() → 난이도 조절 필요 여부
4. emit(LevelAdjustmentEvent) - 필요시
5. OpenAIService.generateResponse() → AI 응답 생성 (Flux)
6. emit(ai_chunk) - 각 청크마다
7. EvaluationService.evaluate() → 평가
8. emit(EvaluationEvent)
9. ChatMessage, LevelAdjustment, MistakePattern DB 저장
10. emit(ai_complete)

에러 처리:
- AI API 실패 → emit(error)
- 평가 실패 → emit(error)
- 저장 실패 → emit(error)

의존성:
- OpenAIService
- LevelAssessmentService
- LevelAdjustmentService
- EvaluationService
- ChatMessageService
```

---

## 🧪 PHASE 6: 테스트 & 배포

### Step 6-1: 단위 테스트 작성

**프롬프트:**
```
다음 클래스들의 단위 테스트를 작성해줘:

1. UserServiceTest
   - getCurrentUser (JWT 정상, 사용자 존재, 사용자 없음)
   - getOrCreateUser (신규, 기존)
   - updateProfile

2. ChatRoomServiceTest
   - createChatRoom (정상, 중복)
   - getChatRoomsByUserId
   - deleteChatRoom (소유권 확인)

3. ChatMessageServiceTest
   - sendMessage (텍스트, 이미지)
   - getMessageHistory

4. LevelAssessmentServiceTest
   - assessUserMessage (각 수준별)
   - 신뢰도 계산

테스트 도구:
- JUnit 5
- Mockito
- Spring Boot Test
- TestContainers (DB 테스트)

커버리지: 최소 70% 이상
```

---

### Step 6-2: 통합 테스트 작성

**프롬프트:**
```
API 통합 테스트를 작성해줘:

테스트 케이스:
1. 로그인 → 사용자 생성
2. 채팅방 생성
3. 메시지 전송
4. SSE 스트림 연결
5. AI 응답 받기
6. 평가 결과 저장
7. 채팅방 삭제

도구:
- MockMvc (또는 WebTestClient)
- TestRestTemplate
- @SpringBootTest
- @AutoConfigureMockMvc

각 테스트:
- 요청 → 응답 검증
- DB 상태 검증
- 예외 처리 검증
```

---

### Step 6-3: Swagger 문서화

**프롬프트:**
```
Swagger/OpenAPI 문서를 자동 생성하고 커스터마이징해줘:

1. SpringDoc OpenAPI 설정
   - @OpenAPIDefinition
   - @Info
   - @SecurityScheme (JWT)

2. API 엔드포인트에 문서화
   - @Operation
   - @Parameter
   - @RequestBody
   - @ApiResponse

3. DTO에 문서화
   - @Schema
   - @Schema.Required

접속:
http://localhost:8080/swagger-ui.html

확인 사항:
- 모든 엔드포인트 나열
- Request/Response 형식 정확
- 에러 코드 표시
```

---

### Step 6-4: 배포 준비

**프롬프트:**
```
AWS 배포를 위한 준비를 해줘:

1. Docker 이미지 생성
   - Dockerfile 작성
   - Multi-stage build
   - JDK 17 기반

2. AWS RDS PostgreSQL 생성
   - 마이그레이션 스크립트 준비
   - 백업 정책

3. AWS ElastiCache Redis
   - 클러스터 설정

4. AWS Cognito
   - User Pool 생성
   - Google OAuth 연동
   - 앱 클라이언트 생성

5. AWS EC2 또는 ECS
   - 컨테이너 배포
   - 로드 밸런싱

6. 환경 변수 관리
   - AWS Systems Manager Parameter Store 사용
   - 민감한 정보는 암호화

7. 모니터링 설정
   - CloudWatch 로그
   - Prometheus 메트릭
   - Alert 정책

배포 체크리스트:
- [ ] 로컬에서 모든 테스트 통과
- [ ] Swagger 문서 확인
- [ ] 환경 변수 설정 완료
- [ ] Docker 이미지 빌드 성공
- [ ] AWS 리소스 생성 완료
- [ ] 배포 스크립트 테스트
```

---

## 🎯 사용 방법

### 각 단계별로 사용하기:

```
Step 1-1 프롬프트
→ Spring Boot 프로젝트 생성
→ Step 1-2 프롬프트
→ PostgreSQL 설정
→ ...

한 번에 한 단계씩만!
이전 단계가 완료되어야 다음 단계로.
```

---

## 📝 프롬프트 사용 팁

### 더 구체적으로 하고 싶으면:

**예:**
```
Step 3-1 프롬프트에서:

"UserService를 작성해줘" 다음에
"이미지 업로드는 AWS S3를 사용할건데,
 ProfileImageUrl을 S3 URL로 저장하는 로직도 추가해줘"
```

### 막힐 때:

```
"Step 3-2를 구현했는데 401 Unauthorized가 떠.
 뭐가 문제일까?"

→ 이렇게 구체적으로 물어보면
  더 정확한 답변을 받을 수 있음
```

---

## ✅ 완료 체크리스트

```
Phase 1 완료:
[ ] Spring Boot 프로젝트 생성
[ ] PostgreSQL 연결
[ ] Redis 연결
[ ] Cognito + JWT 설정

Phase 2 완료:
[ ] Entity 모두 작성
[ ] Repository 작성
[ ] DB 마이그레이션 스크립트 실행

Phase 3 완료:
[ ] User Service
[ ] Auth Controller
[ ] /api/v1/users/me 테스트

Phase 4 완료:
[ ] ChatRoom 모든 기능
[ ] ChatMessage 기본 기능
[ ] 컨트롤러 모두 작성

Phase 5 완료:
[ ] AI 응답 생성
[ ] 수준 판단
[ ] 평가 시스템
[ ] SSE 스트리밍

Phase 6 완료:
[ ] 모든 테스트 작성
[ ] Swagger 문서 생성
[ ] 배포 준비 완료
```

---

**이 프롬프트들을 순서대로 사용하면**
**완벽한 FLUENTO 백엔드가 만들어집니다!** 🚀

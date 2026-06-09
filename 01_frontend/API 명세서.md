# FLUENTO - AI 채팅 API 명세서 (최종 개선 버전)

**버전**: 2.0  
**작성일**: 2026-03-29
**상태**: Final - Improved  
**Java**: JDK 25

---

## 목차

1. [개요](#1-개요)
2. [핵심 특징](#2-핵심-특징)
3. [API 엔드포인트](#3-api-엔드포인트)
4. [데이터 모델](#4-데이터-모델)
5. [상세 API 명세](#5-상세-api-명세)
6. [난이도 자동 조절 시스템](#6-난이도-자동-조절-시스템)
7. [에러 처리](#7-에러-처리)
8. [FAQ](#8-faq)

---

## 1. 개요

### 1.1 목적

FLUENTO 애플리케이션에서 사용자가 AI 캐릭터와 **모두 영어로** 실시간으로 대화하며 언어를 학습할 수 있는 API입니다. AI는 사용자의 영어 수준을 대화를 통해 실시간으로 판단하고 자동으로 난이도를 조절합니다.

### 1.2 핵심 기능

- ✅ **모두 영어로 채팅** (사용자 & AI 100% 영어)
- ✅ **실시간 수준 판단** - 사용자 메시지 분석으로 난이도 자동 결정
- ✅ **동적 난이도 조절** - 단어, 문장 길이, 표현 복잡도 자동 조절
- ✅ **텍스트 & 이미지 메시지** 송수신
- ✅ **전체 메시지 히스토리** 관리
- ✅ **AI 자동 평가** - 사용자 답변의 정확성 판단 & 피드백
- ✅ **오답노트 연동** - 평가 결과 자동 저장
- ✅ **서버센트 이벤트(SSE)** 기반 실시간 응답 스트리밍
- ✅ **채팅방 관리** - 생성/수정/삭제/고정
- ✅ **AI 첫 인사말** - 채팅 시작 시 AI가 먼저 인사

### 1.3 기술 스택

| 항목 | 기술 |
|------|------|
| **Java** | JDK 25 |
| **프레임워크** | Spring Boot 4.0.x |
| **빌드** | Gradle (Groovy) |
| **ORM** | Spring Data JPA / Hibernate |
| **데이터베이스** | PostgreSQL 17 |
| **캐싱** | Redis |
| **인증** | Spring Security + JWT |
| **API 문서** | Swagger/SpringDoc OpenAPI |
| **실시간** | Server-Sent Events (SSE) |
| **AI API** | OpenAI GPT-4o / Claude API |
| **파일 저장** | AWS S3 |
| **클라우드** | AWS (Cognito, EC2, RDS, ElastiCache) |

---

## 2. 핵심 특징

### 2.1 모두 영어로 채팅

**중요: 사용자와 AI 모두 100% 영어로만 통신합니다.**

```
사용자 (영어): "Hello! What did you do yesterday?"
        ↓
AI (영어): "Hi there! I had a busy day yesterday. 
           I attended classes in the morning and studied 
           English in the afternoon. What about you?"
        ↓
사용자 (영어): "I went to school too. It was fun."
```

**한국어 입력 시:**
- 프론트엔드에서 영어 입력 유도 (권장)

### 2.2 실시간 수준 판단

AI는 사용자 메시지마다 영어 수준을 자동 분석합니다.

**판단 기준:**
- 단어 복잡도 (basic 1000-2000개 / intermediate 3000-5000개 / advanced 5000개+)
- 문법 정확성 (오류 개수 및 종류)
- 문장 구조 복잡도 (평균 단어 수)
- 자연스러움 (발화의 자연성)
- 맥락 이해도 (이전 대화와의 연관성)

**판단 결과:**
```json
{
  "detectedLevel": "intermediate",
  "confidence": 0.92,
  "indicators": {
    "vocabulary": "intermediate (good range of words)",
    "grammar": "intermediate (1 minor error)",
    "fluency": "intermediate (natural flow)",
    "contextAwareness": "advanced"
  }
}
```

### 2.3 동적 난이도 조절

AI는 판단된 수준에 맞춰 자동으로 응답의 난이도를 조절합니다.

| 항목 | Beginner | Intermediate | Advanced |
|------|----------|--------------|----------|
| **어휘** | 기본 단어만 (1000-2000개) | 일반적 단어 (3000-5000개) | 고급/학문 단어 (5000개+) |
| **문장 길이** | 5-10단어 | 10-20단어 | 20단어+ |
| **표현** | "It is..." | "It seems..." | "One could argue..." |
| **시제** | 현재형 중심 | 과거/미래형 | 조건문/가정법 |
| **정보량** | 기본만 | 보통 정보 | 풍부한 정보 |

**예시:**

```
사용자 질문: "What did you do yesterday?"

【Beginner Level】
I go to school. I read book. I eat food. I sleep.

【Intermediate Level】
I had a busy day yesterday. I went to school in the morning, 
studied English in the afternoon, watched a movie, and had dinner 
with my family.

【Advanced Level】
Yesterday was quite eventful. I attended classes this morning, 
subsequently engaged in a productive study session focusing on 
English literature, and later spent time with my family discussing 
recent developments in our lives.
```

### 2.4 난이도 자동 조절 규칙

| 상황 | 조건 | 동작 |
|------|------|------|
| **올리기** | 연속 3개 메시지 ≥ 90점 | → 다음 수준 |
| **내리기** | 연속 2개 메시지 ≤ 50점 | → 이전 수준 |
| **유지** | 60~80점 범위 | 현재 유지 |

---

## 3. API 엔드포인트

### 3.1 기본 정보

```
Base URL: https://api.fluento.com/api/v1
인증: JWT Bearer Token (Authorization Header)
응답 포맷: JSON
실시간: Server-Sent Events (SSE)
```

### 3.2 엔드포인트 목록

#### 채팅방 관리

| 메서드 | 엔드포인트 | 설명 | 인증 |
|--------|-----------|------|------|
| `POST` | `/chat/rooms` | 채팅방 생성 | ✓ |
| `GET` | `/chat/rooms` | 채팅방 목록 | ✓ |
| `GET` | `/chat/rooms/{roomId}` | 채팅방 상세 | ✓ |
| `PUT` | `/chat/rooms/{roomId}` | 채팅방 수정 (제목) | ✓ |
| `PUT` | `/chat/rooms/{roomId}/pin` | 고정/해제 | ✓ |
| `DELETE` | `/chat/rooms/{roomId}` | 삭제 | ✓ |

#### 메시지 및 AI 응답

| 메서드 | 엔드포인트 | 설명 | 인증 |
|--------|-----------|------|------|
| `POST` | `/chat/rooms/{roomId}/messages` | 사용자 메시지 전송 | ✓ |
| `GET` | `/chat/rooms/{roomId}/messages` | 메시지 히스토리 | ✓ |
| `GET` | `/chat/rooms/{roomId}/stream` | AI 응답 스트림 (SSE) | ✓ |
| `POST` | `/chat/rooms/{roomId}/initial-message` | AI 첫 인사말 요청 | ✓ |

#### 난이도 정보

| 메서드 | 엔드포인트 | 설명 | 인증 |
|--------|-----------|------|------|
| `GET` | `/chat/rooms/{roomId}/level` | 현재 난이도 & 이력 | ✓ |

---

## 4. 데이터 모델

### 4.1 ChatRoom

```json
{
  "id": "room_abc123",
  "userId": "user_123",
  "characterId": "char_sarah",
  "characterName": "Sarah",
  "title": "Daily Conversation with Sarah",
  "isPinned": true,
  "currentLevel": "intermediate",
  "messageCount": 45,
  "lastMessageAt": "2024-03-24T14:30:00Z",
  "levelHistory": [
    {
      "level": "beginner",
      "startedAt": "2024-03-20T10:00:00Z",
      "endedAt": "2024-03-22T14:30:00Z"
    },
    {
      "level": "intermediate",
      "startedAt": "2024-03-22T14:30:00Z",
      "endedAt": null
    }
  ],
  "createdAt": "2024-03-20T10:00:00Z",
  "updatedAt": "2024-03-24T14:30:00Z"
}
```

### 4.2 ChatMessage

```json
{
  "id": "msg_xyz789",
  "roomId": "room_abc123",
  "senderType": "user",
  "senderName": "You",
  "content": "I went to school and studied English yesterday.",
  "messageType": "text",
  "imageUrl": null,
  "levelAtTime": "intermediate",
  "evaluation": {
    "isCorrect": false,
    "score": 85,
    "detectedLevel": "intermediate",
    "feedback": {
      "grammarIssues": [
        {
          "type": "article_usage",
          "issue": "Minor: 'went to school' vs 'went to the school'",
          "correction": "I went to school and studied English yesterday.",
          "explanation": "We typically say 'go to school' without an article. Your version is actually correct!"
        }
      ],
      "nuanceIssues": [
        {
          "type": "formality",
          "context": "With friends, your version is perfect",
          "suggestion": "In formal writing: 'I attended school and engaged in English study.'"
        }
      ],
      "positivePoints": [
        "Excellent use of past tense",
        "Natural sentence structure",
        "Proper coordination with 'and'"
      ],
      "overallFeedback": "Great work! Your sentence is clear and grammatically sound."
    }
  },
  "createdAt": "2024-03-24T14:35:00Z"
}
```

### 4.3 LevelAssessment

```json
{
  "assessmentId": "assess_123",
  "roomId": "room_abc123",
  "messageId": "msg_xyz789",
  "detectedLevel": "intermediate",
  "confidence": 0.92,
  "indicators": {
    "vocabulary": {
      "level": "intermediate",
      "description": "Good range of vocabulary, appropriate word choices"
    },
    "grammar": {
      "level": "intermediate",
      "errorCount": 0,
      "description": "Grammatically correct"
    },
    "complexity": {
      "level": "intermediate",
      "sentenceLength": 11,
      "description": "Moderate sentence complexity"
    },
    "fluency": {
      "level": "intermediate",
      "description": "Natural and fluent expression"
    }
  },
  "recommendation": {
    "action": "maintain",
    "reason": "User is performing well at current level",
    "score": 85
  },
  "assessedAt": "2024-03-24T14:35:05Z"
}
```

---

## 5. 상세 API 명세

### 5.1 채팅방 생성

#### Request

```http
POST /api/v1/chat/rooms
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "characterId": "char_sarah",
  "title": "Practice with Sarah"
}
```

**파라미터:**

| 필드 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| **characterId** | String | ✓ | - | AI 캐릭터 ID |
| **title** | String | ✗ | 1-100자 | 채팅방 제목 (비우면 "Chat with {characterName}"로 자동 생성) |

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "room_abc123",
    "userId": "user_123",
    "characterId": "char_sarah",
    "characterName": "Sarah",
    "title": "Practice with Sarah",
    "isPinned": false,
    "currentLevel": "beginner",
    "messageCount": 0,
    "levelHistory": [
      {
        "level": "beginner",
        "startedAt": "2024-03-24T14:30:00Z",
        "endedAt": null
      }
    ],
    "createdAt": "2024-03-24T14:30:00Z"
  }
}
```

#### Error Cases

```json
{
  "success": false,
  "error": {
    "code": "CHAT_ROOM_EXISTS",
    "message": "A chat room with this AI character already exists for this user",
    "statusCode": 409
  }
}
```

---

### 5.2 채팅방 목록 조회

#### Request

```http
GET /api/v1/chat/rooms?pinned=false&limit=20&offset=0
Authorization: Bearer {accessToken}
```

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 최대 | 설명 |
|---------|------|--------|------|------|
| **pinned** | Boolean | 없음 | - | true=고정만, false=비고정만, 없음=모두 |
| **limit** | Integer | 20 | 100 | 페이지당 항목 수 |
| **offset** | Integer | 0 | - | 오프셋 (페이지네이션) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "room_abc123",
        "userId": "user_123",
        "characterId": "char_sarah",
        "characterName": "Sarah",
        "title": "Practice with Sarah",
        "isPinned": true,
        "currentLevel": "intermediate",
        "messageCount": 45,
        "lastMessageAt": "2024-03-24T14:30:00Z",
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "total": 5,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 5.3 메시지 전송

#### Request

```http
POST /api/v1/chat/rooms/{roomId}/messages
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "content": "What's your favorite hobby?",
  "messageType": "text"
}
```

**또는 이미지 포함:**

```http
POST /api/v1/chat/rooms/{roomId}/messages
Content-Type: multipart/form-data
Authorization: Bearer {accessToken}

form-data:
- content: "What is this animal?"
- messageType: "image"
- image: [binary file]
```

**파라미터:**

| 필드 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| **content** | String | ✓ | 1-5000자 | 메시지 내용 (영어만) |
| **messageType** | Enum | ✓ | text, image | 메시지 타입 |
| **image** | File | image일 때 ✓ | jpg, png, gif, webp, max 10MB | 이미지 파일 |

#### Response (202 Accepted)

```json
{
  "success": true,
  "data": {
    "id": "msg_xyz789",
    "roomId": "room_abc123",
    "senderType": "user",
    "content": "What's your favorite hobby?",
    "messageType": "text",
    "createdAt": "2024-03-24T14:35:00Z",
    "streamUrl": "https://api.fluento.com/api/v1/chat/rooms/{roomId}/stream?messageId={msg_xyz789}"
  }
}
```

---

### 5.4 AI 응답 스트림 (SSE)

#### Request

```http
GET /api/v1/chat/rooms/{roomId}/stream?messageId={messageId}
Authorization: Bearer {accessToken}
Accept: text/event-stream
```

#### Response (200 OK - text/event-stream)

```
data: {"type": "ai_start", "timestamp": "2024-03-24T14:35:05Z"}

data: {"type": "level_assessment", "assessment": {"detectedLevel": "intermediate", "confidence": 0.92, "indicators": {...}}}

data: {"type": "level_adjustment", "adjustment": {"from": "beginner", "to": "intermediate", "reason": "User showed consistent high accuracy"}}

data: {"type": "ai_chunk", "content": "I"}

data: {"type": "ai_chunk", "content": " think"}

data: {"type": "ai_chunk", "content": " reading"}

data: {"type": "ai_chunk", "content": " is"}

data: {"type": "ai_chunk", "content": " my"}

data: {"type": "ai_chunk", "content": " favorite"}

data: {"type": "ai_chunk", "content": "."}

data: {"type": "evaluation_start", "timestamp": "2024-03-24T14:35:08Z"}

data: {"type": "evaluation", "evaluation": {"isCorrect": true, "score": 95, "feedback": {...}}}

data: {"type": "ai_complete", "messageId": "msg_ai_123", "totalContent": "I think reading is my favorite.", "timestamp": "2024-03-24T14:35:10Z"}
```

**SSE Event Types:**

| Type | 설명 | 페이로드 |
|------|------|---------|
| **ai_start** | AI 응답 시작 | `{timestamp}` |
| **level_assessment** | 수준 판단 | `{assessment}` |
| **level_adjustment** | 난이도 변경 | `{from, to, reason}` |
| **ai_chunk** | AI 응답 청크 | `{content}` |
| **evaluation_start** | 평가 시작 | `{timestamp}` |
| **evaluation** | 평가 완료 | `{evaluation}` |
| **ai_complete** | 완료 | `{messageId, totalContent, timestamp}` |
| **error** | 에러 | `{code, message}` |

---

### 5.5 AI 첫 인사말 요청

#### Request

```http
POST /api/v1/chat/rooms/{roomId}/initial-message
Authorization: Bearer {accessToken}

{}
```

#### Response (202 Accepted)

```json
{
  "success": true,
  "data": {
    "messageId": "msg_ai_initial",
    "roomId": "room_abc123",
    "senderType": "ai",
    "streamUrl": "https://api.fluento.com/api/v1/chat/rooms/{roomId}/stream?messageId={msg_ai_initial}"
  }
}
```

**설명:**
- 채팅방 생성 후 호출
- AI가 첫 인사말을 스트리밍으로 반환
- 동일한 SSE 스트림 사용

---

### 5.6 메시지 히스토리 조회

#### Request

```http
GET /api/v1/chat/rooms/{roomId}/messages?limit=50&offset=0
Authorization: Bearer {accessToken}
```

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 최대 |
|---------|------|--------|------|
| **limit** | Integer | 50 | 100 |
| **offset** | Integer | 0 | - |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_xyz789",
        "roomId": "room_abc123",
        "senderType": "user",
        "content": "What's your favorite hobby?",
        "messageType": "text",
        "levelAtTime": "intermediate",
        "evaluation": {...},
        "createdAt": "2024-03-24T14:35:00Z"
      }
    ],
    "total": 45,
    "currentLevel": "intermediate"
  }
}
```

---

### 5.7 채팅방 수정 (제목 변경)

#### Request

```http
PUT /api/v1/chat/rooms/{roomId}
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "title": "Advanced English Conversation"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "room_abc123",
    "title": "Advanced English Conversation",
    "updatedAt": "2024-03-24T14:40:00Z"
  }
}
```

---

### 5.8 채팅방 고정/해제

#### Request

```http
PUT /api/v1/chat/rooms/{roomId}/pin
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "isPinned": true
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "room_abc123",
    "isPinned": true,
    "updatedAt": "2024-03-24T14:41:00Z"
  }
}
```

---

### 5.9 채팅방 삭제

#### Request

```http
DELETE /api/v1/chat/rooms/{roomId}
Authorization: Bearer {accessToken}
```

#### Response (204 No Content)

```
(응답 본문 없음)
```

---

### 5.10 현재 난이도 조회

#### Request

```http
GET /api/v1/chat/rooms/{roomId}/level
Authorization: Bearer {accessToken}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "currentLevel": "intermediate",
    "confidence": 0.92,
    "levelHistory": [
      {
        "level": "beginner",
        "startedAt": "2024-03-20T10:00:00Z",
        "endedAt": "2024-03-22T14:30:00Z",
        "reason": "Initial level"
      },
      {
        "level": "intermediate",
        "startedAt": "2024-03-22T14:30:00Z",
        "endedAt": null,
        "reason": "User demonstrated consistent accuracy"
      }
    ],
    "nextLevelCriteria": {
      "targetLevel": "advanced",
      "currentProgress": "3/5 messages",
      "requiredAccuracy": "90% (current: 87%)",
      "estimatedTime": "2-3 more messages"
    }
  }
}
```

---

## 6. 난이도 자동 조절 시스템

### 6.1 알고리즘

```
사용자 메시지 입력
    ↓
1. 수준 판단 (LevelAssessment)
   - 어휘, 문법, 복잡도, 유창성 분석
   - 신뢰도 계산 (0.0-1.0)
    ↓
2. 난이도 결정
   - 현재 수준 vs 판단된 수준
   - 조절 규칙 적용
    ↓
3. 필요시 난이도 조절
   - 올리기: 연속 3개 ≥ 90점
   - 내리기: 연속 2개 ≤ 50점
    ↓
4. AI 응답 생성
   - 최종 수준으로 조절된 응답 생성
    ↓
5. 사용자 답변 평가
   - 정확도 점수 (0-100)
   - 문법, 뉘앙스 피드백
    ↓
6. 데이터 저장
   - 메시지, 평가, 난이도 이력 저장
```

---

## 7. 에러 처리

### 7.1 에러 응답 형식

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "statusCode": 400,
    "timestamp": "2024-03-24T14:35:00Z"
  }
}
```

### 7.2 주요 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| **CHAT_ROOM_NOT_FOUND** | 404 | 채팅방을 찾을 수 없음 |
| **CHAT_ROOM_EXISTS** | 409 | 같은 AI와의 채팅방이 이미 존재 |
| **UNAUTHORIZED** | 401 | 인증 없음 또는 만료 |
| **FORBIDDEN** | 403 | 권한 없음 (소유권 확인) |
| **INVALID_MESSAGE** | 400 | 메시지 형식 오류 |
| **INVALID_IMAGE** | 400 | 이미지 형식 오류 (jpg, png, gif, webp만 가능) |
| **IMAGE_TOO_LARGE** | 413 | 이미지 크기 초과 (max 10MB) |
| **AI_API_ERROR** | 503 | AI API 호출 실패 |
| **LEVEL_ASSESSMENT_FAILED** | 500 | 수준 판단 실패 |
| **RATE_LIMIT_EXCEEDED** | 429 | 요청 제한 초과 |

---

## 8. FAQ

### Q1: 사용자가 한국어로 메시지를 보내면?

**A:** 
- 프론트에서 영어 입력만 가능하도록 UI 제한 (권장)
- 또는 백엔드에서 감지하여 400 Bad Request 반환
- 향후: 자동 번역 기능 추가 가능

### Q2: 이미지를 보낼 때 텍스트도 함께 보낼 수 있나?

**A:** 네, 가능합니다.
```json
{
  "content": "What animal is this?",
  "messageType": "image",
  "image": [binary file]
}
```

### Q3: SSE 연결이 끊어지면?

**A:**
- 프론트엔드에서 재연결 시도
- 마지막 messageId로 다시 요청
- AI가 이미 저장된 응답 재전송

### Q4: 난이도가 자동으로 올라갈 수 있나?

**A:** 네, 자동으로 올라갑니다.
- 연속 3개 메시지가 90점 이상이면 자동 상향
- 변경 시 SSE level_adjustment 이벤트로 알림

### Q5: 채팅 히스토리는 얼마나 보관하나?

**A:** 무한정 보관합니다.
- 모든 메시지가 PostgreSQL에 영구 저장
- 페이지네이션으로 조회

---

**이 명세서를 바탕으로 백엔드를 구현할 수 있습니다!**

---

## 기술 스택 (JDK 25 사용 시 주의사항)

### JDK 25의 새로운 기능 활용

```java
// Virtual Threads (Project Loom - Preview)
// SSE 스트리밍에 유용
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

// Record Classes (더 간단한 DTO)
public record ChatMessageResponse(
  String id,
  String roomId,
  String senderType,
  String content,
  LocalDateTime createdAt
) {}

// Text Blocks (멀티라인 스트링)
String query = """
  SELECT * FROM chat_messages
  WHERE room_id = ?
  ORDER BY created_at DESC
  """;

// Pattern Matching (더 강력한 instanceof)
if (evaluation instanceof EvaluationDTO eval) {
  // eval 직접 사용 가능
}
```

**권장:** JDK 25의 Virtual Threads를 사용하면 SSE 스트리밍 성능이 크게 향상됩니다.

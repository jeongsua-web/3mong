# Fluento ERD (데이터베이스 설계도)

> AI 영어회화 학습 서비스 Fluento의 엔티티 관계도(Entity-Relationship Diagram)
> 최종 업데이트: 2026-06-16
> 기준: `02-backend/src/main/java/com/fluento/domain` JPA 엔티티 (PostgreSQL)

---

## 1. ERD

```mermaid
erDiagram
    users ||--o{ chat_rooms : "소유"
    users ||--o{ characters : "생성"
    chat_rooms ||--o{ chat_messages : "포함"
    chat_rooms ||--o{ level_assessments : "평가 대상"
    chat_messages |o--o{ level_assessments : "평가 근거"

    users {
        bigint id PK "AUTO_INCREMENT"
        varchar google_id UK "Google OAuth ID (nullable)"
        varchar email UK "이메일 (필수)"
        varchar name "이름 (필수)"
        varchar password "비밀번호 (nullable, 소셜로그인 시 null)"
        varchar profile_image_url "프로필 이미지"
        varchar app_language "앱 언어 (기본 ko)"
        varchar theme "테마 (기본 system)"
        boolean notification_enabled "알림 여부 (기본 true)"
        timestamp created_at "생성일시"
        timestamp updated_at "수정일시"
    }

    characters {
        bigint id PK "AUTO_INCREMENT"
        bigint user_id FK "소유 사용자 (논리적 참조)"
        varchar name "캐릭터 이름 (필수)"
        varchar gender "성별 (기본 male)"
        varchar role "역할/직업"
        varchar personality "성격"
        text memo "메모"
        varchar profile_image_url "프로필 이미지"
        boolean is_favorite "즐겨찾기 (기본 false)"
        timestamp created_at "생성일시"
        timestamp updated_at "수정일시"
    }

    chat_rooms {
        varchar id PK "UUID"
        bigint user_id FK "소유 사용자 (필수)"
        varchar character_id "캐릭터 ID (필수, 논리적 참조)"
        varchar character_name "캐릭터 이름 스냅샷 (필수)"
        varchar title "채팅방 제목 (필수)"
        boolean is_pinned "상단 고정 (기본 false)"
        varchar current_level "현재 레벨 (BEGINNER/INTERMEDIATE/ADVANCED)"
        integer message_count "메시지 수 (기본 0)"
        timestamp last_message_at "마지막 메시지 일시"
        timestamp created_at "생성일시"
        timestamp updated_at "수정일시"
    }

    chat_messages {
        varchar id PK "UUID"
        varchar room_id FK "소속 채팅방 (필수)"
        varchar sender_type "발신자 유형 (USER/AI, 필수)"
        varchar sender_name "발신자 이름 (필수)"
        text content "메시지 본문 (필수)"
        varchar message_type "메시지 유형 (TEXT/IMAGE, 기본 TEXT)"
        varchar image_url "이미지 URL"
        varchar level_at_time "작성 시점 레벨"
        boolean is_correct "정답 여부 (오답노트용)"
        integer score "점수"
        jsonb feedback_json "AI 피드백(JSON)"
        timestamp created_at "생성일시"
    }

    level_assessments {
        bigint id PK "AUTO_INCREMENT"
        varchar room_id FK "대상 채팅방 (필수)"
        varchar message_id FK "근거 메시지 (nullable)"
        varchar detected_level "감지된 레벨 (필수)"
        decimal confidence "신뢰도 (precision 4, scale 3)"
        jsonb indicators_json "판단 지표(JSON)"
        jsonb recommendation_json "추천 사항(JSON)"
        timestamp assessed_at "평가일시"
    }
```

---

## 2. 테이블 설명

| 테이블 | 설명 | PK 전략 |
|---|---|---|
| `users` | 서비스 사용자. Google 소셜 로그인 + 이메일/비밀번호 로그인 지원 | `bigint` IDENTITY |
| `characters` | 사용자가 만든 대화 상대 AI 캐릭터(역할/성격 설정) | `bigint` IDENTITY |
| `chat_rooms` | 사용자–캐릭터 간 채팅방. 현재 레벨·메시지 수 등 상태 보유 | `UUID` (String) |
| `chat_messages` | 채팅방의 개별 메시지. AI 피드백·점수·오답 여부 포함 | `UUID` (String) |
| `level_assessments` | 대화 기반 레벨 진단 이력. 신뢰도·지표·추천을 JSON으로 저장 | `bigint` IDENTITY |

---

## 3. 관계 및 제약조건

### 물리적 외래키 (JPA `@ManyToOne` + `@JoinColumn`)
- `chat_rooms.user_id` → `users.id` (필수)
- `chat_messages.room_id` → `chat_rooms.id` (필수)
- `level_assessments.room_id` → `chat_rooms.id` (필수)
- `level_assessments.message_id` → `chat_messages.id` (nullable)

### 논리적 참조 (FK 제약 없음, 애플리케이션 레벨 연결)
- `characters.user_id` → `users.id` — 단순 `Long` 컬럼으로 매핑(연관관계 매핑 아님)
- `chat_rooms.character_id` → `characters.id` — `varchar`로 보관하며 `character_name` 스냅샷을 함께 저장

> 참고: `chat_rooms`는 `(user_id, character_id)` 유니크 제약(`uk_chat_rooms_user_character`)을 둬 동일 사용자–캐릭터 채팅방 중복 생성을 방지합니다.

### 인덱스
- `chat_rooms`: `user_id`, `character_id`
- `chat_messages`: `room_id`, `created_at`
- `level_assessments`: `room_id`, `assessed_at`

---

## 4. Enum 값

| Enum | 사용 컬럼 | 값 |
|---|---|---|
| `Level` | `chat_rooms.current_level`, `chat_messages.level_at_time`, `level_assessments.detected_level` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| `SenderType` | `chat_messages.sender_type` | `USER`, `AI` |
| `MessageType` | `chat_messages.message_type` | `TEXT`, `IMAGE` |

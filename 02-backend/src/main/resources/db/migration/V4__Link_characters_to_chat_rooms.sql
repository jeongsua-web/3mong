-- ============================================================
-- V4: 추천 캐릭터를 characters 테이블로 이전하고
--     chat_rooms.character_id 를 characters.id 와 FK로 연결
-- ============================================================
-- 배경:
--   - 기존 chat_rooms.character_id 는 VARCHAR 로,
--     저장 캐릭터 id("10"), 추천 캐릭터 id("1"), 레거시 자유문자열("sarah")이 섞여 있었음.
--   - 추천 캐릭터는 CharacterService 의 메모리 List(id 1~6)로만 존재해 DB에 없었음.
--   본 마이그레이션으로 추천 캐릭터를 전역(소유자 없는) 행으로 DB에 적재하고,
--   character_id 를 BIGINT FK 로 정규화한다.

-- 1) characters: 전역 추천 캐릭터를 담을 수 있도록 스키마 확장
ALTER TABLE characters ALTER COLUMN user_id DROP NOT NULL;          -- 추천 캐릭터는 소유자(user) 없음
ALTER TABLE characters ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) 추천 캐릭터 6명 시드 (CharacterService.RECOMMENDED 의 id/이름과 일치)
--    id 1~6 은 현재 비어 있으므로 고정 id 로 삽입 → 기존 chat_rooms."1" 이 그대로 유효해짐.
--    이미 해당 id 가 점유돼 있으면(타 환경) 건너뜀.
INSERT INTO characters (id, user_id, name, gender, role, personality, is_recommended, created_at, updated_at)
VALUES
    (1, NULL, 'James',   'male',   'Boyfriend', 'nonchalant, shy',     TRUE, now(), now()),
    (2, NULL, 'Charles', 'male',   'Colleague', 'cool, detached',      TRUE, now(), now()),
    (3, NULL, 'Anna',    'female', 'Mom',       'warm, kind',          TRUE, now(), now()),
    (4, NULL, 'Jenny',   'female', 'Colleague', 'bright, shy',         TRUE, now(), now()),
    (5, NULL, 'Alex',    'male',   'Professor', 'kind, strict',        TRUE, now(), now()),
    (6, NULL, 'Sophie',  'female', 'Neighbor',  'cheerful, talkative', TRUE, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 3) 시퀀스 보정: 이후 생성되는 사용자 캐릭터 id 가 추천 캐릭터(≤6)와 충돌하지 않도록
SELECT setval(
    pg_get_serial_sequence('characters', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 0) FROM characters), 6)
);

-- 4) chat_rooms.character_id 를 characters.id FK 로 연결
ALTER TABLE chat_rooms ALTER COLUMN character_id DROP NOT NULL;

--    FK 로 연결할 수 없는 값(비숫자 또는 존재하지 않는 id)은 NULL 처리. 예: 'sarah'
--    (describePersona 가 null 이면 레벨 기본 프롬프트로 폴백하므로 대화는 정상 동작)
UPDATE chat_rooms
SET character_id = NULL
WHERE character_id !~ '^[0-9]+$'
   OR NOT EXISTS (SELECT 1 FROM characters c WHERE c.id = character_id::bigint);

--    VARCHAR → BIGINT 타입 변환
ALTER TABLE chat_rooms
    ALTER COLUMN character_id TYPE BIGINT USING NULLIF(character_id, '')::bigint;

--    FK 추가: 캐릭터가 삭제되면 방의 참조만 끊고 방/대화는 보존(SET NULL)
ALTER TABLE chat_rooms
    ADD CONSTRAINT fk_chat_rooms_character
        FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE SET NULL;

-- ============================================================
-- V1: Initial Schema
-- ============================================================

-- users 테이블
CREATE TABLE users
(
    id                   BIGSERIAL PRIMARY KEY,
    google_id            VARCHAR(255) UNIQUE,
    email                VARCHAR(255) NOT NULL UNIQUE,
    name                 VARCHAR(255) NOT NULL,
    profile_image_url    VARCHAR(500),
    app_language         VARCHAR(10)  NOT NULL DEFAULT 'ko',
    theme                VARCHAR(20)  NOT NULL DEFAULT 'system',
    notification_enabled BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP    NOT NULL,
    updated_at           TIMESTAMP    NOT NULL
);

-- chat_rooms 테이블
CREATE TABLE chat_rooms
(
    id             VARCHAR(36)  PRIMARY KEY,
    user_id        BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    character_id   VARCHAR(255) NOT NULL,
    character_name VARCHAR(255) NOT NULL,
    title          VARCHAR(255) NOT NULL,
    is_pinned      BOOLEAN      NOT NULL DEFAULT FALSE,
    current_level  VARCHAR(20)  NOT NULL DEFAULT 'BEGINNER',
    message_count  INTEGER      NOT NULL DEFAULT 0,
    last_message_at TIMESTAMP,
    created_at     TIMESTAMP    NOT NULL,
    updated_at     TIMESTAMP    NOT NULL,
    CONSTRAINT uk_chat_rooms_user_character UNIQUE (user_id, character_id)
);

CREATE INDEX idx_chat_rooms_user_id ON chat_rooms (user_id);
CREATE INDEX idx_chat_rooms_character_id ON chat_rooms (character_id);

-- chat_messages 테이블
CREATE TABLE chat_messages
(
    id            VARCHAR(36)  PRIMARY KEY,
    room_id       VARCHAR(36)  NOT NULL REFERENCES chat_rooms (id) ON DELETE CASCADE,
    sender_type   VARCHAR(10)  NOT NULL,
    sender_name   VARCHAR(255) NOT NULL,
    content       TEXT         NOT NULL,
    message_type  VARCHAR(10)  NOT NULL DEFAULT 'TEXT',
    image_url     VARCHAR(500),
    level_at_time VARCHAR(20),
    is_correct    BOOLEAN,
    score         INTEGER,
    feedback_json JSONB,
    created_at    TIMESTAMP    NOT NULL
);

CREATE INDEX idx_chat_messages_room_id ON chat_messages (room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages (created_at);

-- level_assessments 테이블
CREATE TABLE level_assessments
(
    id                  BIGSERIAL PRIMARY KEY,
    room_id             VARCHAR(36)    NOT NULL REFERENCES chat_rooms (id) ON DELETE CASCADE,
    message_id          VARCHAR(36)    REFERENCES chat_messages (id) ON DELETE SET NULL,
    detected_level      VARCHAR(20)    NOT NULL,
    confidence          NUMERIC(4, 3),
    indicators_json     JSONB,
    recommendation_json JSONB,
    assessed_at         TIMESTAMP      NOT NULL
);

CREATE INDEX idx_level_assessments_room_id ON level_assessments (room_id);
CREATE INDEX idx_level_assessments_assessed_at ON level_assessments (assessed_at);

#!/bin/sh
set -e

export PGPASSWORD="$DB_PASSWORD"
PSQL="psql -h $DB_HOST -U $DB_USER -d $DB_NAME"

$PSQL -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);"

$PSQL -c "
CREATE TABLE IF NOT EXISTS characters (
    id                BIGSERIAL    PRIMARY KEY,
    user_id           BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    gender            VARCHAR(20)  NOT NULL DEFAULT 'male',
    role              VARCHAR(255),
    personality       VARCHAR(255),
    memo              TEXT,
    profile_image_url VARCHAR(500),
    is_favorite       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP    NOT NULL,
    updated_at        TIMESTAMP    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
"

echo "Migrations applied successfully."

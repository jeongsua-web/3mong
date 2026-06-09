package com.fluento.domain.chat;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Level {
    BEGINNER,
    INTERMEDIATE,
    ADVANCED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }
}

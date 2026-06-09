package com.fluento.dto;

import java.time.Instant;

public record ApiError(
        String code,
        String message,
        int statusCode,
        Instant timestamp
) {
    public static ApiError of(String code, String message, int statusCode) {
        return new ApiError(code, message, statusCode, Instant.now());
    }
}

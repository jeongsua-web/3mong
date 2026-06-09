package com.fluento.dto.auth;

public record LoginResponse(
        String accessToken,
        String idToken,
        String refreshToken,
        Integer expiresIn
) {}

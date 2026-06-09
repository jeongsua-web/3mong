package com.fluento.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record ConfirmSignupRequest(
        @NotBlank String email,
        @NotBlank String code
) {}

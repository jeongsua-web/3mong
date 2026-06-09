package com.fluento.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 1, max = 100) String name,
        String profileImageUrl,
        String appLanguage,
        String theme,
        Boolean notificationEnabled
) {}

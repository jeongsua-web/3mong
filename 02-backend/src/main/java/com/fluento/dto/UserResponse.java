package com.fluento.dto;

import com.fluento.domain.chat.Level;
import com.fluento.domain.user.User;
import lombok.Builder;

@Builder
public record UserResponse(
        Long id,
        String email,
        String name,
        String profileImageUrl,
        String appLanguage,
        String theme,
        Boolean notificationEnabled
) {
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .profileImageUrl(user.getProfileImageUrl())
                .appLanguage(user.getAppLanguage())
                .theme(user.getTheme())
                .notificationEnabled(user.getNotificationEnabled())
                .build();
    }
}

package com.fluento.dto.character;

import com.fluento.domain.character.Character;

import java.time.LocalDateTime;

public record CharacterResponse(
        Long id,
        String name,
        String gender,
        String role,
        String personality,
        String memo,
        String profileImageUrl,
        boolean isFavorite,
        LocalDateTime createdAt
) {
    public static CharacterResponse from(Character c) {
        return new CharacterResponse(
                c.getId(), c.getName(), c.getGender(), c.getRole(),
                c.getPersonality(), c.getMemo(), c.getProfileImageUrl(),
                c.getIsFavorite(), c.getCreatedAt()
        );
    }
}

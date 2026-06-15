package com.fluento.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateChatRoomRequest(
        @NotBlank String characterId,
        @NotBlank String characterName,
        @Size(max = 100) String title
) {}

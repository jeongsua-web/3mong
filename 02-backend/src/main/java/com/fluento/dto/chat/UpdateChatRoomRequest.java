package com.fluento.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateChatRoomRequest(
        @NotBlank @Size(min = 1, max = 100) String title
) {}

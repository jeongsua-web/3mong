package com.fluento.dto.chat;

import com.fluento.domain.chat.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
        @NotBlank @Size(min = 1, max = 5000) String content,
        @NotNull MessageType messageType
) {}

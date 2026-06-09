package com.fluento.dto.chat;

import com.fluento.domain.chat.ChatMessage;
import com.fluento.domain.chat.Level;
import com.fluento.domain.chat.MessageType;
import com.fluento.domain.chat.SenderType;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;

@Builder
public record ChatMessageResponse(
        String id,
        String roomId,
        SenderType senderType,
        String senderName,
        String content,
        MessageType messageType,
        String imageUrl,
        Level levelAtTime,
        Map<String, Object> evaluation,
        LocalDateTime createdAt,
        String streamUrl
) {
    public static ChatMessageResponse from(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .roomId(message.getRoom().getId())
                .senderType(message.getSenderType())
                .senderName(message.getSenderName())
                .content(message.getContent())
                .messageType(message.getMessageType())
                .imageUrl(message.getImageUrl())
                .levelAtTime(message.getLevelAtTime())
                .evaluation(message.getFeedbackJson())
                .createdAt(message.getCreatedAt())
                .build();
    }

    public ChatMessageResponse withStreamUrl(String streamUrl) {
        return ChatMessageResponse.builder()
                .id(this.id)
                .roomId(this.roomId)
                .senderType(this.senderType)
                .senderName(this.senderName)
                .content(this.content)
                .messageType(this.messageType)
                .imageUrl(this.imageUrl)
                .levelAtTime(this.levelAtTime)
                .evaluation(this.evaluation)
                .createdAt(this.createdAt)
                .streamUrl(streamUrl)
                .build();
    }
}

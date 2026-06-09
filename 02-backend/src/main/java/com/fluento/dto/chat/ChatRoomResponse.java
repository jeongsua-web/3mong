package com.fluento.dto.chat;

import com.fluento.domain.chat.ChatRoom;
import com.fluento.domain.chat.Level;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record ChatRoomResponse(
        String id,
        Long userId,
        String characterId,
        String characterName,
        String title,
        Boolean isPinned,
        Level currentLevel,
        Integer messageCount,
        LocalDateTime lastMessageAt,
        List<LevelHistoryEntry> levelHistory,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record LevelHistoryEntry(Level level, LocalDateTime startedAt, LocalDateTime endedAt) {}

    public static ChatRoomResponse from(ChatRoom room) {
        return ChatRoomResponse.builder()
                .id(room.getId())
                .userId(room.getUser().getId())
                .characterId(room.getCharacterId())
                .characterName(room.getCharacterName())
                .title(room.getTitle())
                .isPinned(room.getIsPinned())
                .currentLevel(room.getCurrentLevel())
                .messageCount(room.getMessageCount())
                .lastMessageAt(room.getLastMessageAt())
                .levelHistory(List.of(new LevelHistoryEntry(room.getCurrentLevel(), room.getCreatedAt(), null)))
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }
}

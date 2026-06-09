package com.fluento.domain.chat;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    Page<ChatMessage> findByRoomId(String roomId, Pageable pageable);

    // Replaces non-standard JPQL LIMIT 1 with a JPA derived query
    Optional<ChatMessage> findFirstByRoomIdOrderByCreatedAtDesc(String roomId);

    Page<ChatMessage> findByRoomUserIdAndIsCorrectAndSenderType(
            Long roomUserId, Boolean isCorrect, SenderType senderType, Pageable pageable);

    @org.springframework.data.jpa.repository.Query(
            "SELECT m FROM ChatMessage m WHERE m.id = :id AND m.room.user.id = :userId")
    java.util.Optional<ChatMessage> findByIdAndRoomUserId(
            @org.springframework.data.repository.query.Param("id") String id,
            @org.springframework.data.repository.query.Param("userId") Long userId);
}

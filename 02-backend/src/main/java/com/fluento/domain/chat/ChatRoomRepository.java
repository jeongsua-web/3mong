package com.fluento.domain.chat;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {

    boolean existsByUserIdAndCharacterId(Long userId, String characterId);

    Page<ChatRoom> findByUserId(Long userId, Pageable pageable);

    Page<ChatRoom> findByUserIdAndIsPinned(Long userId, Boolean isPinned, Pageable pageable);

    Optional<ChatRoom> findByIdAndUserId(String id, Long userId);
}

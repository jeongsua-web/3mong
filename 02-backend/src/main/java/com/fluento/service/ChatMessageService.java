package com.fluento.service;

import com.fluento.domain.chat.*;
import com.fluento.dto.chat.SendMessageRequest;
import com.fluento.exception.ChatRoomNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;

    @Transactional
    public ChatMessage sendMessage(String roomId, Long userId, SendMessageRequest request) {
        ChatRoom room = chatRoomRepository.findByIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ChatRoomNotFoundException(roomId));

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .senderType(SenderType.USER)
                .senderName("You")
                .content(request.content())
                .messageType(request.messageType())
                .levelAtTime(room.getCurrentLevel())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        room.recordMessage();
        return saved;
    }

    public Page<ChatMessage> getMessageHistory(String roomId, Long userId, int limit, int offset) {
        if (limit <= 0) {
            throw new IllegalArgumentException("limit must be greater than 0");
        }
        chatRoomRepository.findByIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ChatRoomNotFoundException(roomId));

        // NOTE: PageRequest uses page-number semantics; offset/limit is exact only when offset is a multiple of limit.
        PageRequest pageable = PageRequest.of(offset / limit, limit,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return chatMessageRepository.findByRoomId(roomId, pageable);
    }

    @Transactional
    public ChatMessage saveMessage(ChatMessage message) {
        return chatMessageRepository.save(message);
    }
}

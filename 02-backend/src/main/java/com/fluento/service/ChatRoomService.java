package com.fluento.service;

import com.fluento.domain.chat.ChatRoom;
import com.fluento.domain.chat.ChatRoomRepository;
import com.fluento.domain.chat.Level;
import com.fluento.domain.user.User;
import com.fluento.domain.user.UserRepository;
import com.fluento.exception.ChatRoomAlreadyExistsException;
import com.fluento.exception.ChatRoomNotFoundException;
import com.fluento.exception.UnauthorizedException;
import com.fluento.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatRoom createChatRoom(Long userId, String characterId, String characterName, String title) {
        if (chatRoomRepository.existsByUserIdAndCharacterId(userId, characterId)) {
            throw new ChatRoomAlreadyExistsException(characterId);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        String roomTitle = (title != null && !title.isBlank())
                ? title
                : "Chat with " + characterName;

        return chatRoomRepository.save(ChatRoom.builder()
                .user(user)
                .characterId(characterId)
                .characterName(characterName)
                .title(roomTitle)
                .currentLevel(Level.BEGINNER)
                .build());
    }

    public Page<ChatRoom> getChatRoomsByUserId(Long userId, Boolean pinned, int limit, int offset) {
        if (limit <= 0) {
            throw new IllegalArgumentException("limit must be greater than 0");
        }
        // NOTE: PageRequest uses page-number semantics; offset/limit is exact only when offset is a multiple of limit.
        Pageable pageable = PageRequest.of(offset / limit, limit,
                Sort.by(Sort.Order.desc("isPinned"), Sort.Order.desc("lastMessageAt")));

        if (pinned != null) {
            return chatRoomRepository.findByUserIdAndIsPinned(userId, pinned, pageable);
        }
        return chatRoomRepository.findByUserId(userId, pageable);
    }

    public ChatRoom getChatRoomById(String roomId, Long userId) {
        return chatRoomRepository.findByIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ChatRoomNotFoundException(roomId));
    }

    @Transactional
    public ChatRoom updateTitle(String roomId, Long userId, String newTitle) {
        ChatRoom room = getChatRoomById(roomId, userId);
        room.updateTitle(newTitle);
        return room;
    }

    @Transactional
    public ChatRoom togglePin(String roomId, Long userId, Boolean isPinned) {
        ChatRoom room = getChatRoomById(roomId, userId);
        if (!room.getIsPinned().equals(isPinned)) {
            room.togglePin();
        }
        return room;
    }

    @Transactional
    public void deleteChatRoom(String roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ChatRoomNotFoundException(roomId));
        if (!room.getUser().getId().equals(userId)) {
            throw new UnauthorizedException();
        }
        chatRoomRepository.delete(room);
    }
}

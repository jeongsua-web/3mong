package com.fluento.controller;

import com.fluento.domain.chat.ChatMessage;
import com.fluento.domain.user.User;
import com.fluento.domain.user.UserRepository;
import com.fluento.dto.ApiResponse;
import com.fluento.dto.chat.ChatMessageResponse;
import com.fluento.dto.chat.SendMessageRequest;
import com.fluento.exception.UserNotFoundException;
import com.fluento.service.ChatMessageService;
import com.fluento.service.ChatRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat/rooms/{roomId}")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService chatMessageService;
    private final ChatRoomService chatRoomService;
    private final UserRepository userRepository;

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String roomId,
            @Valid @RequestBody SendMessageRequest request) {
        Long userId = resolveUserId(jwt);
        ChatMessage message = chatMessageService.sendMessage(roomId, userId, request);

        String streamUrl = "/api/v1/chat/rooms/" + roomId + "/stream?messageId=" + message.getId();
        ChatMessageResponse response = ChatMessageResponse.from(message).withStreamUrl(streamUrl);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMessages(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String roomId,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        Long userId = resolveUserId(jwt);
        Page<ChatMessage> page = chatMessageService.getMessageHistory(roomId, userId, limit, offset);

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "messages", page.getContent().stream().map(ChatMessageResponse::from).toList(),
                "total", page.getTotalElements(),
                "currentLevel", chatRoomService.getChatRoomById(roomId, userId).getCurrentLevel()
        )));
    }

    private Long resolveUserId(Jwt jwt) {
        String sub = jwt.getSubject();
        User user = userRepository.findByGoogleId(sub)
                .orElseThrow(() -> new UserNotFoundException(-1L));
        return user.getId();
    }
}

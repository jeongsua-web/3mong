package com.fluento.controller;

import com.fluento.domain.chat.*;
import com.fluento.domain.user.User;
import com.fluento.domain.user.UserRepository;
import com.fluento.dto.ApiResponse;
import com.fluento.exception.ChatRoomNotFoundException;
import com.fluento.exception.UserNotFoundException;
import com.fluento.service.AIResponseService;
import com.fluento.service.ChatMessageService;
import com.fluento.service.ChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat/rooms/{roomId}")
@RequiredArgsConstructor
public class ChatSSEController {

    private final AIResponseService aiResponseService;
    private final ChatMessageService chatMessageService;
    private final ChatRoomService chatRoomService;
    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;

    /**
     * AI 응답 스트림 (SSE)
     * GET /api/v1/chat/rooms/{roomId}/stream?messageId={messageId}
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<Map<String, Object>>> streamAIResponse(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String roomId,
            @RequestParam String messageId) {
        Long userId = resolveUserId(jwt);
        chatRoomService.getChatRoomById(roomId, userId); // 소유권 확인
        return aiResponseService.generateAndStreamResponse(roomId, messageId);
    }

    /**
     * AI 첫 인사말 요청
     * POST /api/v1/chat/rooms/{roomId}/initial-message
     */
    @PostMapping("/initial-message")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestInitialMessage(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String roomId) {
        Long userId = resolveUserId(jwt);
        ChatRoom room = chatRoomService.getChatRoomById(roomId, userId);

        // AI 인사말 메시지를 placeholder로 저장하고 stream URL 반환
        ChatMessage placeholder = chatMessageService.saveMessage(
                ChatMessage.builder()
                        .room(room)
                        .senderType(SenderType.AI)
                        .senderName(room.getCharacterName())
                        .content("")   // 실제 내용은 SSE 스트림에서 채워짐
                        .messageType(MessageType.TEXT)
                        .levelAtTime(room.getCurrentLevel())
                        .build()
        );

        String streamUrl = "/api/v1/chat/rooms/" + roomId + "/stream?messageId=" + placeholder.getId();

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.ok(Map.of(
                "messageId", placeholder.getId(),
                "roomId", roomId,
                "senderType", "ai",
                "streamUrl", streamUrl
        )));
    }

    /**
     * 현재 난이도 & 이력 조회
     * GET /api/v1/chat/rooms/{roomId}/level
     */
    @GetMapping("/level")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLevel(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String roomId) {
        Long userId = resolveUserId(jwt);
        ChatRoom room = chatRoomService.getChatRoomById(roomId, userId);

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "currentLevel", room.getCurrentLevel(),
                "messageCount", room.getMessageCount()
        )));
    }

    private Long resolveUserId(Jwt jwt) {
        String sub = jwt.getSubject();
        User user = userRepository.findByGoogleId(sub)
                .orElseThrow(() -> new UserNotFoundException(-1L));
        return user.getId();
    }
}

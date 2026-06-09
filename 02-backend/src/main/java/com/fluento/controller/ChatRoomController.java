package com.fluento.controller;

import com.fluento.domain.chat.ChatRoom;
import com.fluento.dto.ApiResponse;
import com.fluento.dto.chat.*;
import com.fluento.service.ChatRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat/rooms")
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    @PostMapping
    public ResponseEntity<ApiResponse<ChatRoomResponse>> createRoom(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreateChatRoomRequest request) {
        // characterName은 향후 캐릭터 서비스에서 조회; 현재는 characterId로 대체
        String characterName = request.characterId();
        ChatRoom room = chatRoomService.createChatRoom(userId, request.characterId(), characterName, request.title());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ChatRoomResponse.from(room)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRooms(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) Boolean pinned,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        Page<ChatRoom> page = chatRoomService.getChatRoomsByUserId(userId, pinned, limit, offset);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "rooms", page.getContent().stream().map(ChatRoomResponse::from).toList(),
                "total", page.getTotalElements(),
                "limit", limit,
                "offset", offset
        )));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> getRoom(
            @AuthenticationPrincipal Long userId,
            @PathVariable String roomId) {
        ChatRoom room = chatRoomService.getChatRoomById(roomId, userId);
        return ResponseEntity.ok(ApiResponse.ok(ChatRoomResponse.from(room)));
    }

    @PutMapping("/{roomId}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> updateRoom(
            @AuthenticationPrincipal Long userId,
            @PathVariable String roomId,
            @Valid @RequestBody UpdateChatRoomRequest request) {
        ChatRoom room = chatRoomService.updateTitle(roomId, userId, request.title());
        return ResponseEntity.ok(ApiResponse.ok(ChatRoomResponse.from(room)));
    }

    @PutMapping("/{roomId}/pin")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> pinRoom(
            @AuthenticationPrincipal Long userId,
            @PathVariable String roomId,
            @RequestBody PinChatRoomRequest request) {
        ChatRoom room = chatRoomService.togglePin(roomId, userId, request.isPinned());
        return ResponseEntity.ok(ApiResponse.ok(ChatRoomResponse.from(room)));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteRoom(
            @AuthenticationPrincipal Long userId,
            @PathVariable String roomId) {
        chatRoomService.deleteChatRoom(roomId, userId);
        return ResponseEntity.noContent().build();
    }

}

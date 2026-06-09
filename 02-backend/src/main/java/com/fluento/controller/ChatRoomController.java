package com.fluento.controller;

import com.fluento.domain.chat.ChatRoom;
import com.fluento.domain.user.User;
import com.fluento.domain.user.UserRepository;
import com.fluento.dto.ApiResponse;
import com.fluento.dto.chat.*;
import com.fluento.exception.UserNotFoundException;
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
@RequestMapping("/api/v1/chat/rooms")
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatRoomService chatRoomService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<ChatRoomResponse>> createRoom(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateChatRoomRequest request) {
        Long userId = resolveUserId(jwt);
        // characterName은 향후 캐릭터 서비스에서 조회; 현재는 characterId로 대체
        String characterName = request.characterId();
        ChatRoom room = chatRoomService.createChatRoom(userId, request.characterId(), characterName, request.title());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ChatRoomResponse.from(room)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRooms(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Boolean pinned,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        Long userId = resolveUserId(jwt);
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
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String roomId) {
        Long userId = resolveUserId(jwt);
        ChatRoom room = chatRoomService.getChatRoomById(roomId, userId);
        return ResponseEntity.ok(ApiResponse.ok(ChatRoomResponse.from(room)));
    }

    @PutMapping("/{roomId}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> updateRoom(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String roomId,
            @Valid @RequestBody UpdateChatRoomRequest request) {
        Long userId = resolveUserId(jwt);
        ChatRoom room = chatRoomService.updateTitle(roomId, userId, request.title());
        return ResponseEntity.ok(ApiResponse.ok(ChatRoomResponse.from(room)));
    }

    @PutMapping("/{roomId}/pin")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> pinRoom(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String roomId,
            @RequestBody PinChatRoomRequest request) {
        Long userId = resolveUserId(jwt);
        ChatRoom room = chatRoomService.togglePin(roomId, userId, request.isPinned());
        return ResponseEntity.ok(ApiResponse.ok(ChatRoomResponse.from(room)));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteRoom(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String roomId) {
        Long userId = resolveUserId(jwt);
        chatRoomService.deleteChatRoom(roomId, userId);
        return ResponseEntity.noContent().build();
    }

    private Long resolveUserId(Jwt jwt) {
        String sub = jwt.getSubject();
        User user = userRepository.findByGoogleId(sub)
                .orElseThrow(() -> new UserNotFoundException(-1L));
        return user.getId();
    }
}

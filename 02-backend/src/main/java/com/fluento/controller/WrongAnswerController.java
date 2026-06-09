package com.fluento.controller;

import com.fluento.domain.chat.ChatMessage;
import com.fluento.domain.chat.ChatMessageRepository;
import com.fluento.domain.chat.SenderType;
import com.fluento.domain.user.User;
import com.fluento.domain.user.UserRepository;
import com.fluento.dto.ApiResponse;
import com.fluento.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wrong-answers")
@RequiredArgsConstructor
public class WrongAnswerController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWrongAnswers(
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = resolveUserId(jwt);

        List<Map<String, Object>> wrongAnswers = chatMessageRepository
                .findByRoomUserIdAndIsCorrectAndSenderType(userId, false, SenderType.USER,
                        PageRequest.of(0, 100, Sort.by("createdAt").descending()))
                .getContent()
                .stream()
                .map(this::toWrongAnswer)
                .toList();

        return ResponseEntity.ok(ApiResponse.ok(Map.of("wrongAnswers", wrongAnswers)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWrongAnswer(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id) {
        Long userId = resolveUserId(jwt);
        ChatMessage message = chatMessageRepository.findByIdAndRoomUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        chatMessageRepository.delete(message);
        return ResponseEntity.noContent().build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toWrongAnswer(ChatMessage message) {
        String corrected = message.getContent();
        String explanation = "";

        Map<String, Object> feedbackJson = message.getFeedbackJson();
        if (feedbackJson != null) {
            Object feedbackObj = feedbackJson.get("feedback");
            if (feedbackObj instanceof Map<?, ?> feedback) {
                Object overall = feedback.get("overallFeedback");
                if (overall != null) explanation = String.valueOf(overall);

                Object issues = feedback.get("grammarIssues");
                if (issues instanceof List<?> list && !list.isEmpty()) {
                    Object first = list.get(0);
                    if (first instanceof Map<?, ?> issue) {
                        Object correction = issue.get("correction");
                        if (correction != null) corrected = String.valueOf(correction);
                    }
                }
            }
        }

        return Map.of(
                "id", message.getId(),
                "createdAt", message.getCreatedAt(),
                "original", message.getContent(),
                "corrected", corrected,
                "explanation", explanation
        );
    }

    private Long resolveUserId(Jwt jwt) {
        String sub = jwt.getSubject();
        User user = userRepository.findByGoogleId(sub)
                .orElseThrow(() -> new UserNotFoundException(-1L));
        return user.getId();
    }
}

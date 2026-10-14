package com.fluento.controller;

import com.fluento.domain.chat.ChatMessage;
import com.fluento.domain.chat.ChatMessageRepository;
import com.fluento.domain.chat.SenderType;
import com.fluento.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWrongAnswers(
            @AuthenticationPrincipal Long userId) {

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
            @AuthenticationPrincipal Long userId,
            @PathVariable String id) {
        ChatMessage message = chatMessageRepository.findByIdAndRoomUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        chatMessageRepository.delete(message);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> toWrongAnswer(ChatMessage message) {
        String corrected = message.getContent();
        String explanation = "";

        Map<String, Object> feedbackJson = message.getFeedbackJson();
        if (feedbackJson != null) {
            Object feedbackObj = feedbackJson.get("feedback");
            if (feedbackObj instanceof Map<?, ?> feedback) {
                Object correctedSentence = feedback.get("correctedSentence");
                if (correctedSentence != null && !String.valueOf(correctedSentence).isBlank()) {
                    corrected = String.valueOf(correctedSentence);
                }

                explanation = buildExplanation(feedback);
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

    // 한 문장에 오류가 여러 개일 수 있으므로 grammarIssues/nuanceIssues를 모두 모아서 설명을 만든다.
    // (기존엔 overallFeedback 한 줄만 노출돼 첫 번째 오류만 보이는 것처럼 보였음)
    private String buildExplanation(Map<?, ?> feedback) {
        List<String> lines = new java.util.ArrayList<>();

        Object grammarIssues = feedback.get("grammarIssues");
        if (grammarIssues instanceof List<?> issues) {
            for (Object item : issues) {
                if (item instanceof Map<?, ?> issue) {
                    String line = formatIssue(
                            issue.get("issue"), issue.get("correction"), issue.get("explanation"));
                    if (!line.isBlank()) lines.add(line);
                }
            }
        }

        Object nuanceIssues = feedback.get("nuanceIssues");
        if (nuanceIssues instanceof List<?> issues) {
            for (Object item : issues) {
                if (item instanceof Map<?, ?> issue) {
                    String line = formatIssue(
                            issue.get("context"), issue.get("suggestion"), null);
                    if (!line.isBlank()) lines.add(line);
                }
            }
        }

        Object overall = feedback.get("overallFeedback");
        if (lines.isEmpty()) {
            return overall != null ? String.valueOf(overall) : "";
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines.size(); i++) {
            if (i > 0) sb.append('\n');
            sb.append(lines.size() > 1 ? (i + 1) + ". " : "").append(lines.get(i));
        }
        if (overall != null && !String.valueOf(overall).isBlank()) {
            sb.append("\n\n").append(overall);
        }
        return sb.toString();
    }

    private String formatIssue(Object subject, Object fix, Object detail) {
        StringBuilder sb = new StringBuilder();
        if (subject != null && !String.valueOf(subject).isBlank()) {
            sb.append(subject);
        }
        if (fix != null && !String.valueOf(fix).isBlank()) {
            if (sb.length() > 0) sb.append(" → ");
            sb.append(fix);
        }
        if (detail != null && !String.valueOf(detail).isBlank()) {
            if (sb.length() > 0) sb.append(": ");
            sb.append(detail);
        }
        return sb.toString();
    }

}

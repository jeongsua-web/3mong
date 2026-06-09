package com.fluento.dto.chat;

import java.util.List;
import java.util.Map;

public record EvaluationDTO(
        boolean isCorrect,
        int score,
        Map<String, Object> feedback
) {
    public static EvaluationDTO fallback() {
        return new EvaluationDTO(true, 70, Map.of(
                "grammarIssues", List.of(),
                "nuanceIssues", List.of(),
                "positivePoints", List.of("Good effort!"),
                "overallFeedback", "Keep practicing!"
        ));
    }
}

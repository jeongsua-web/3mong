package com.fluento.service;

import com.fluento.dto.chat.EvaluationDTO;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * dev 프로필용 가짜 평가기.
 * OpenAI API 없이 메시지 길이 기반으로 점수를 산출해 레벨 조절 로직을 테스트할 수 있게 한다.
 * - 8단어 이상: 95점 (high)
 * - 3단어 이하: 40점 (low)
 * - 그 외: 70점
 */
@Service
@Primary
@Profile("dev")
public class MockEvaluator implements Evaluator {

    @Override
    public EvaluationDTO evaluateUserMessage(String userMessage, String aiResponse) {
        int wordCount = userMessage.trim().isEmpty()
                ? 0
                : userMessage.trim().split("\\s+").length;

        int score;
        if (wordCount >= 8) {
            score = 95;
        } else if (wordCount <= 3) {
            score = 40;
        } else {
            score = 70;
        }

        boolean isCorrect = score >= 60;

        Map<String, Object> feedback = isCorrect
                ? Map.of(
                        "grammarIssues", List.of(),
                        "nuanceIssues", List.of(),
                        "positivePoints", List.of("Good sentence! (" + wordCount + " words)"),
                        "overallFeedback", "Well done! Mock score: " + score)
                : Map.of(
                        "grammarIssues", List.of(Map.of(
                                "type", "length",
                                "issue", userMessage,
                                "correction", "Try writing a longer, more detailed sentence.",
                                "explanation", "문장이 너무 짧습니다. 더 자세히 표현해보세요.")),
                        "nuanceIssues", List.of(),
                        "positivePoints", List.of(),
                        "overallFeedback", "조금 더 길게 표현해보세요. Mock score: " + score);

        return new EvaluationDTO(isCorrect, score, feedback);
    }
}

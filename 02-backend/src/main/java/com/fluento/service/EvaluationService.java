package com.fluento.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fluento.dto.chat.EvaluationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationService implements Evaluator {

    private final OpenAIService openAIService;
    private final ObjectMapper objectMapper;

    @Override
    public EvaluationDTO evaluateUserMessage(String userMessage, String aiResponse) {
        try {
            String userContent = openAIService.buildEvaluationUserContent(userMessage, aiResponse);
            String response = openAIService.callSync(OpenAIService.EVALUATION_SYSTEM_INSTRUCTIONS, userContent);

            String json = openAIService.extractJson(response);
            @SuppressWarnings("unchecked")
            Map<String, Object> result = objectMapper.readValue(json, Map.class);

            boolean isCorrect = Boolean.parseBoolean(
                    String.valueOf(result.getOrDefault("isCorrect", false)));
            int score = Integer.parseInt(
                    String.valueOf(result.getOrDefault("score", 0)));

            @SuppressWarnings("unchecked")
            Map<String, Object> feedback = result.get("feedback") instanceof Map<?, ?> m
                    ? (Map<String, Object>) m
                    : Map.of();

            return new EvaluationDTO(isCorrect, score, feedback);
        } catch (Exception e) {
            log.warn("Evaluation failed: {}", e.getMessage());
            return EvaluationDTO.fallback();
        }
    }
}

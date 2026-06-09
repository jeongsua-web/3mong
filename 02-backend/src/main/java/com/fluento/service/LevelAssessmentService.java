package com.fluento.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fluento.domain.chat.ChatMessage;
import com.fluento.domain.chat.ChatMessageRepository;
import com.fluento.domain.chat.ChatRoom;
import com.fluento.domain.chat.ChatRoomRepository;
import com.fluento.domain.chat.Level;
import com.fluento.domain.chat.LevelAssessment;
import com.fluento.domain.chat.LevelAssessmentRepository;
import com.fluento.dto.chat.LevelAssessmentDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LevelAssessmentService {

    private final BedrockService bedrockService;
    private final LevelAssessmentRepository levelAssessmentRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

    public LevelAssessmentDTO assessUserMessage(
            String content, Level currentLevel, List<String> recentMessages) {
        try {
            String userContent = bedrockService.buildAssessmentUserContent(
                    content, currentLevel.name().toLowerCase(), recentMessages);
            String response = bedrockService.callSync(BedrockService.ASSESSMENT_SYSTEM_INSTRUCTIONS, userContent);

            String json = bedrockService.extractJson(response);
            @SuppressWarnings("unchecked")
            Map<String, Object> result = objectMapper.readValue(json, Map.class);

            String detectedLevelStr = String.valueOf(
                    result.getOrDefault("detectedLevel", currentLevel.name().toLowerCase()));
            Level detectedLevel = Level.valueOf(detectedLevelStr.toUpperCase());
            BigDecimal confidence = new BigDecimal(
                    String.valueOf(result.getOrDefault("confidence", "0.5")));

            @SuppressWarnings("unchecked")
            Map<String, String> indicators = result.get("indicators") instanceof Map<?, ?> m
                    ? (Map<String, String>) m
                    : Map.of();

            return new LevelAssessmentDTO(detectedLevel, confidence, indicators);
        } catch (Exception e) {
            log.warn("Level assessment failed, falling back to current level: {}", e.getMessage());
            return new LevelAssessmentDTO(currentLevel, BigDecimal.valueOf(0.5),
                    Map.of("vocabulary", currentLevel.name().toLowerCase(),
                            "grammar", currentLevel.name().toLowerCase(),
                            "fluency", currentLevel.name().toLowerCase(),
                            "contextAwareness", currentLevel.name().toLowerCase()));
        }
    }

    @Transactional
    public void saveAssessment(String roomId, String messageId, LevelAssessmentDTO dto) {
        ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();
        ChatMessage message = chatMessageRepository.findById(messageId).orElseThrow();
        saveAssessment(room, message, dto);
    }

    @Transactional
    public void saveAssessment(ChatRoom room, ChatMessage message, LevelAssessmentDTO dto) {
        @SuppressWarnings("unchecked")
        Map<String, Object> indicators = (Map<String, Object>) (Map<?, ?>) dto.indicators();

        levelAssessmentRepository.save(LevelAssessment.builder()
                .room(room)
                .message(message)
                .detectedLevel(dto.detectedLevel())
                .confidence(dto.confidence())
                .indicatorsJson(indicators)
                .build());
    }
}

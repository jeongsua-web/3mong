package com.fluento.service;

import com.fluento.domain.chat.*;
import com.fluento.dto.chat.EvaluationDTO;
import com.fluento.dto.chat.LevelAdjustmentDTO;
import com.fluento.dto.chat.LevelAssessmentDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIResponseService {

    private final AIService bedrockService;
    private final LevelAssessmentService levelAssessmentService;
    private final LevelAdjustmentService levelAdjustmentService;
    private final Evaluator evaluationService;
    private final ChatMessageService chatMessageService;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    public Flux<ServerSentEvent<Map<String, Object>>> generateAndStreamResponse(
            String roomId, String userMessageId) {

        return Flux.defer(() -> {
            ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();
            ChatMessage userMessage = chatMessageRepository.findById(userMessageId).orElseThrow();

            List<String> history = chatMessageRepository
                    .findByRoomId(roomId, org.springframework.data.domain.PageRequest.of(0, 5,
                            org.springframework.data.domain.Sort.by("createdAt").descending()))
                    .getContent().stream()
                    .map(ChatMessage::getContent)
                    .toList();

            return streamFullResponse(room, userMessage, history);
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private Flux<ServerSentEvent<Map<String, Object>>> streamFullResponse(
            ChatRoom room, ChatMessage userMessage, List<String> history) {

        StringBuilder aiContentBuffer = new StringBuilder();

        // 1. Emit ai_start immediately — before any blocking OpenAI calls
        Flux<ServerSentEvent<Map<String, Object>>> startEvent = Flux.just(
                sse("ai_start", Map.of("timestamp", Instant.now().toString()))
        );

        // 2. Run blocking assessment on boundedElastic so ai_start is not delayed,
        //    then chain the rest of the stream inside flatMapMany.
        Flux<ServerSentEvent<Map<String, Object>>> remainingStream = Mono
                .fromCallable(() -> levelAssessmentService.assessUserMessage(
                        userMessage.getContent(), room.getCurrentLevel(), history))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMapMany(assessment -> {

                    Flux<ServerSentEvent<Map<String, Object>>> assessmentEvent = Flux.just(
                            sse("level_assessment", Map.of("assessment", Map.of(
                                    "detectedLevel", assessment.detectedLevel().name().toLowerCase(),
                                    "confidence", assessment.confidence(),
                                    "indicators", assessment.indicators()
                            )))
                    );

                    // AI 응답은 현재 레벨로 스트리밍. 레벨 조절은 이번 메시지 평가 점수를 반영해
                    // 응답 완성 후 결정되며 다음 턴부터 적용된다.
                    Level responseLevel = room.getCurrentLevel();

                    Flux<ServerSentEvent<Map<String, Object>>> aiChunks = bedrockService
                            .generateAIResponse(userMessage.getContent(), responseLevel)
                            .doOnNext(aiContentBuffer::append)
                            .map(chunk -> sse("ai_chunk", Map.of("content", chunk)));

                    Flux<ServerSentEvent<Map<String, Object>>> completionEvents = Flux.defer(() -> {
                        String fullAiContent = aiContentBuffer.toString();

                        ChatMessage aiMessage = chatMessageService.saveMessage(
                                ChatMessage.builder()
                                        .room(room)
                                        .senderType(SenderType.AI)
                                        .senderName(room.getCharacterName())
                                        .content(fullAiContent)
                                        .messageType(MessageType.TEXT)
                                        .levelAtTime(responseLevel)
                                        .build()
                        );

                        // Use ID-based overload so saveAssessment reloads managed entities within its own transaction
                        levelAssessmentService.saveAssessment(room.getId(), userMessage.getId(), assessment);

                        // 1. 사용자 메시지 평가 (동기) — 실제 점수 산출
                        EvaluationDTO evaluation = evaluationService.evaluateUserMessage(
                                userMessage.getContent(), fullAiContent);

                        ChatMessage freshMessage = chatMessageRepository.findById(userMessage.getId()).orElseThrow();
                        freshMessage.applyEvaluation(evaluation.isCorrect(), evaluation.score(),
                                Map.of("isCorrect", evaluation.isCorrect(),
                                        "score", evaluation.score(),
                                        "feedback", evaluation.feedback()));
                        chatMessageService.saveMessage(freshMessage);

                        // 2. 실제 점수로 레벨 조절 판단 + Redis 누적
                        LevelAdjustmentDTO adjustment = levelAdjustmentService.shouldAdjustLevel(
                                room.getId(), room.getCurrentLevel(), evaluation.score());
                        levelAdjustmentService.applyAdjustment(room.getId(), adjustment);

                        // 3. 이벤트 방출: evaluation → (level_adjustment) → ai_complete
                        ServerSentEvent<Map<String, Object>> evaluationEvent = sse("evaluation", Map.of(
                                "isCorrect", evaluation.isCorrect(),
                                "score", evaluation.score(),
                                "feedback", evaluation.feedback()
                        ));

                        Flux<ServerSentEvent<Map<String, Object>>> adjustmentEvents = adjustment.shouldAdjust()
                                ? Flux.just(sse("level_adjustment", Map.of(
                                        "from", adjustment.from().name().toLowerCase(),
                                        "to", adjustment.to().name().toLowerCase(),
                                        "reason", adjustment.reason())))
                                : Flux.empty();

                        ServerSentEvent<Map<String, Object>> completeEvent = sse("ai_complete", Map.of(
                                "messageId", aiMessage.getId(),
                                "totalContent", fullAiContent,
                                "timestamp", Instant.now().toString()
                        ));

                        return Flux.concat(
                                Flux.just(evaluationEvent),
                                adjustmentEvents,
                                Flux.just(completeEvent)
                        );
                    });

                    return Flux.concat(assessmentEvent, aiChunks, completionEvents);
                });

        return Flux.concat(startEvent, remainingStream)
                .onErrorResume(e -> {
                    log.error("SSE stream error: {}", e.getMessage());
                    return Flux.just(sse("error", Map.of(
                            "code", "AI_API_ERROR",
                            "message", "AI response failed"
                    )));
                });
    }

    private ServerSentEvent<Map<String, Object>> sse(String type, Map<String, Object> data) {
        Map<String, Object> payload = new java.util.HashMap<>(data);
        payload.put("type", type);
        return ServerSentEvent.<Map<String, Object>>builder()
                .event(type)
                .data(payload)
                .build();
    }
}

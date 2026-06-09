package com.fluento.service;

import com.fluento.domain.chat.Level;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeAsyncClient;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.ContentBlock;
import software.amazon.awssdk.services.bedrockruntime.model.ContentBlockDeltaEvent;
import software.amazon.awssdk.services.bedrockruntime.model.ConversationRole;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseRequest;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseResponse;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseStreamRequest;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseStreamResponseHandler;
import software.amazon.awssdk.services.bedrockruntime.model.InferenceConfiguration;
import software.amazon.awssdk.services.bedrockruntime.model.Message;
import software.amazon.awssdk.services.bedrockruntime.model.SystemContentBlock;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class BedrockService implements AIService {

    @Value("${aws.bedrock.model-id}")
    private String modelId;

    @Value("${aws.bedrock.stream.max-tokens:500}")
    private int streamMaxTokens;

    @Value("${aws.bedrock.stream.temperature:0.8}")
    private float streamTemperature;

    @Value("${aws.bedrock.sync.max-tokens:800}")
    private int syncMaxTokens;

    @Value("${aws.bedrock.sync.temperature:0.3}")
    private float syncTemperature;

    private final BedrockRuntimeClient syncClient;
    private final BedrockRuntimeAsyncClient asyncClient;

    static final String ASSESSMENT_SYSTEM_INSTRUCTIONS = """
            Analyze the English message provided and assess the user's English proficiency level.
            Respond ONLY with a JSON object in this exact format:
            {
              "detectedLevel": "beginner|intermediate|advanced",
              "confidence": 0.0-1.0,
              "indicators": {
                "vocabulary": "beginner|intermediate|advanced",
                "grammar": "beginner|intermediate|advanced",
                "fluency": "beginner|intermediate|advanced",
                "contextAwareness": "beginner|intermediate|advanced"
              }
            }
            """;

    static final String EVALUATION_SYSTEM_INSTRUCTIONS = """
            Evaluate the English message from a language learner and respond ONLY with a JSON object in this exact format:
            {
              "isCorrect": true|false,
              "score": 0-100,
              "feedback": {
                "grammarIssues": [{"type": "...", "issue": "...", "correction": "...", "explanation": "..."}],
                "nuanceIssues": [{"type": "...", "context": "...", "suggestion": "..."}],
                "positivePoints": ["..."],
                "overallFeedback": "..."
              }
            }
            """;

    private static final Map<Level, String> SYSTEM_PROMPTS = Map.of(
            Level.BEGINNER, """
                    You are a friendly English conversation partner for beginners.
                    Rules:
                    - Use only basic vocabulary (most common 1000-2000 words)
                    - Keep sentences short: 5-10 words max
                    - Use simple present tense only
                    - Be encouraging and patient
                    - Never use idioms or complex expressions
                    """,
            Level.INTERMEDIATE, """
                    You are a friendly English conversation partner for intermediate learners.
                    Rules:
                    - Use general vocabulary (3000-5000 words)
                    - Write 10-20 words per sentence
                    - Use various tenses (past, present, future)
                    - Include some common idioms
                    - Keep responses natural and conversational
                    """,
            Level.ADVANCED, """
                    You are a sophisticated English conversation partner for advanced learners.
                    Rules:
                    - Use rich vocabulary including academic and nuanced expressions (5000+ words)
                    - Write complex sentences of 20+ words
                    - Use conditionals, subjunctives, and advanced grammar
                    - Include idiomatic expressions and cultural references
                    - Discuss topics with depth and nuance
                    """
    );

    public Flux<String> generateAIResponse(String userMessage, Level level) {
        String systemPrompt = SYSTEM_PROMPTS.getOrDefault(
                level != null ? level : Level.INTERMEDIATE,
                SYSTEM_PROMPTS.get(Level.INTERMEDIATE));

        ConverseStreamRequest request = ConverseStreamRequest.builder()
                .modelId(modelId)
                .system(List.of(SystemContentBlock.builder().text(systemPrompt).build()))
                .messages(List.of(Message.builder()
                        .role(ConversationRole.USER)
                        .content(List.of(ContentBlock.fromText(userMessage)))
                        .build()))
                .inferenceConfig(InferenceConfiguration.builder()
                        .maxTokens(streamMaxTokens)
                        .temperature(streamTemperature)
                        .build())
                .build();

        return Flux.create(sink -> {
            ConverseStreamResponseHandler handler = ConverseStreamResponseHandler.builder()
                    .subscriber(ConverseStreamResponseHandler.Visitor.builder()
                            .onContentBlockDelta((ContentBlockDeltaEvent delta) -> {
                                if (delta.delta() != null && delta.delta().text() != null) {
                                    sink.next(delta.delta().text());
                                }
                            })
                            .build())
                    .onComplete(sink::complete)
                    .onError(sink::error)
                    .build();
            CompletableFuture<Void> future = asyncClient.converseStream(request, handler);
            sink.onCancel(() -> future.cancel(true));
        }, FluxSink.OverflowStrategy.BUFFER);
    }

    // Blocking call — must be invoked on a non-reactor thread (e.g. Schedulers.boundedElastic()).
    // systemInstructions goes to the system block; userContent (untrusted input) is isolated in the user block.
    public String callSync(String systemInstructions, String userContent) {
        ConverseRequest request = ConverseRequest.builder()
                .modelId(modelId)
                .system(List.of(SystemContentBlock.builder().text(systemInstructions).build()))
                .messages(List.of(Message.builder()
                        .role(ConversationRole.USER)
                        .content(List.of(ContentBlock.fromText(userContent)))
                        .build()))
                .inferenceConfig(InferenceConfiguration.builder()
                        .maxTokens(syncMaxTokens)
                        .temperature(syncTemperature)
                        .build())
                .build();

        ConverseResponse response = syncClient.converse(request);
        List<ContentBlock> content = response.output().message().content();
        if (content == null || content.isEmpty() || content.get(0).text() == null) {
            throw new IllegalStateException("Empty Bedrock response, stopReason=" + response.stopReasonAsString());
        }
        return content.get(0).text();
    }

    public String buildAssessmentUserContent(String userMessage, String currentLevel, List<String> recentMessages) {
        String history = recentMessages.isEmpty() ? "No previous messages"
                : String.join("\n", recentMessages);
        return "Current level: %s\nRecent conversation history:\n%s\n\nUser's message: \"%s\""
                .formatted(currentLevel, history, userMessage);
    }

    public String buildEvaluationUserContent(String userMessage, String aiResponse) {
        return "AI's previous message: \"%s\"\nUser's response: \"%s\""
                .formatted(aiResponse, userMessage);
    }

    public String extractJson(String response) {
        int start = response.indexOf('{');
        int end = response.lastIndexOf('}') + 1;
        if (start >= 0 && end > start) {
            return response.substring(start, end);
        }
        return response;
    }
}

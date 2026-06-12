package com.fluento.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fluento.domain.chat.Level;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OpenAIService implements AIService {

    private static final String API_URL = "https://api.openai.com/v1/chat/completions";

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    @Value("${openai.stream.max-tokens:500}")
    private int streamMaxTokens;

    @Value("${openai.stream.temperature:0.8}")
    private double streamTemperature;

    @Value("${openai.sync.max-tokens:800}")
    private int syncMaxTokens;

    @Value("${openai.sync.temperature:0.3}")
    private double syncTemperature;

    private final ObjectMapper objectMapper;

    // Alpine 컨테이너에서 reactor-netty TLS 초기화가 실패하므로 JDK HttpClient 사용
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

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

    @Override
    public Flux<String> generateAIResponse(String userMessage, Level level) {
        String systemPrompt = SYSTEM_PROMPTS.getOrDefault(
                level != null ? level : Level.INTERMEDIATE,
                SYSTEM_PROMPTS.get(Level.INTERMEDIATE));

        return Flux.<String>create(sink -> {
            try {
                HttpRequest request = buildRequest(systemPrompt, userMessage,
                        streamMaxTokens, streamTemperature, true);
                HttpResponse<InputStream> response = httpClient.send(
                        request, HttpResponse.BodyHandlers.ofInputStream());

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
                    if (response.statusCode() != 200) {
                        String body = reader.lines().collect(Collectors.joining());
                        throw new IllegalStateException(
                                "OpenAI API error " + response.statusCode() + ": " + body);
                    }
                    String line;
                    while (!sink.isCancelled() && (line = reader.readLine()) != null) {
                        if (!line.startsWith("data:")) {
                            continue;
                        }
                        String data = line.substring(5).trim();
                        if ("[DONE]".equals(data)) {
                            break;
                        }
                        JsonNode content = objectMapper.readTree(data)
                                .path("choices").path(0).path("delta").path("content");
                        if (content.isTextual() && !content.asText().isEmpty()) {
                            sink.next(content.asText());
                        }
                    }
                }
                sink.complete();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                sink.error(e);
            } catch (Exception e) {
                sink.error(e);
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    // Blocking call — must be invoked on a non-reactor thread (e.g. Schedulers.boundedElastic()).
    // systemInstructions goes to the system message; userContent (untrusted input) is isolated in the user message.
    public String callSync(String systemInstructions, String userContent) {
        try {
            HttpRequest request = buildRequest(systemInstructions, userContent,
                    syncMaxTokens, syncTemperature, false);
            HttpResponse<String> response = httpClient.send(
                    request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IllegalStateException(
                        "OpenAI API error " + response.statusCode() + ": " + response.body());
            }
            JsonNode content = objectMapper.readTree(response.body())
                    .path("choices").path(0).path("message").path("content");
            if (!content.isTextual() || content.asText().isEmpty()) {
                throw new IllegalStateException("Empty OpenAI response: " + response.body());
            }
            return content.asText();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("OpenAI API call interrupted", e);
        } catch (IOException e) {
            throw new IllegalStateException("OpenAI API call failed: " + e.getMessage(), e);
        }
    }

    private HttpRequest buildRequest(String systemPrompt, String userContent,
                                     int maxTokens, double temperature, boolean stream)
            throws IOException {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userContent)),
                "max_completion_tokens", maxTokens,
                "temperature", temperature,
                "stream", stream);

        return HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();
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

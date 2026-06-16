package com.fluento.service;

import com.fluento.domain.chat.Level;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.List;

@Service
@Primary
@Profile("dev")
public class MockAIService implements AIService {

    private static final List<String> MOCK_RESPONSE_CHUNKS = List.of(
            "Hi! ", "I'm Sarah, ", "your English ", "learning companion. ",
            "How can ", "I help ", "you today? ", "Let's practice ",
            "together and ", "improve your English!"
    );

    private static final List<String> MOCK_OPENING_CHUNKS = List.of(
            "Hi! ", "I'm Sarah. ", "Let's talk ", "about food today. ",
            "What did ", "you eat ", "for breakfast ", "this morning?"
    );

    @Override
    public Flux<String> generateAIResponse(String userMessage, Level level, String persona) {
        return Flux.fromIterable(MOCK_RESPONSE_CHUNKS)
                .delayElements(Duration.ofMillis(80));
    }

    @Override
    public Flux<String> generateOpeningMessage(Level level, String persona) {
        return Flux.fromIterable(MOCK_OPENING_CHUNKS)
                .delayElements(Duration.ofMillis(80));
    }
}

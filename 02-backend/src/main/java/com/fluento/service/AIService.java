package com.fluento.service;

import com.fluento.domain.chat.Level;
import reactor.core.publisher.Flux;

public interface AIService {
    Flux<String> generateAIResponse(String userMessage, Level level);
}

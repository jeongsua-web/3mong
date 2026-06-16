package com.fluento.service;

import com.fluento.domain.chat.Level;
import reactor.core.publisher.Flux;

public interface AIService {
    /**
     * @param persona AI가 연기할 캐릭터 페르소나 프롬프트 (없으면 null)
     */
    Flux<String> generateAIResponse(String userMessage, Level level, String persona);

    /**
     * 대화를 AI가 먼저 시작하는 오프닝 메시지를 스트리밍한다.
     * 사용자 메시지 없이, 레벨·캐릭터에 맞게 인사 + 토픽/질문을 제시해 대화를 주도한다.
     *
     * @param persona AI가 연기할 캐릭터 페르소나 프롬프트 (없으면 null)
     */
    Flux<String> generateOpeningMessage(Level level, String persona);
}

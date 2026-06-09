package com.fluento.service;

import com.fluento.dto.chat.EvaluationDTO;

public interface Evaluator {
    EvaluationDTO evaluateUserMessage(String userMessage, String aiResponse);
}

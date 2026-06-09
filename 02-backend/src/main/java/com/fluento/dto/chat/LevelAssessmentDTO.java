package com.fluento.dto.chat;

import com.fluento.domain.chat.Level;

import java.math.BigDecimal;
import java.util.Map;

public record LevelAssessmentDTO(
        Level detectedLevel,
        BigDecimal confidence,
        Map<String, String> indicators
) {}

package com.fluento.dto.chat;

import com.fluento.domain.chat.Level;

public record LevelAdjustmentDTO(
        boolean shouldAdjust,
        Level from,
        Level to,
        String reason
) {
    public static LevelAdjustmentDTO noChange(Level current) {
        return new LevelAdjustmentDTO(false, current, current, "Level maintained");
    }
}

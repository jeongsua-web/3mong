package com.fluento.service;

import com.fluento.domain.chat.ChatRoomRepository;
import com.fluento.domain.chat.Level;
import com.fluento.dto.chat.LevelAdjustmentDTO;
import com.fluento.dto.chat.LevelAssessmentDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LevelAdjustmentService {

    private final ChatRoomRepository chatRoomRepository;
    private final StringRedisTemplate stringRedisTemplate;

    private static final String SCORE_KEY = "fluento:scores:%s";   // roomId
    private static final int MAX_SCORES = 5;
    private static final int UPGRADE_THRESHOLD = 90;
    private static final int UPGRADE_COUNT = 3;
    private static final int DOWNGRADE_THRESHOLD = 50;
    private static final int DOWNGRADE_COUNT = 2;

    public LevelAdjustmentDTO shouldAdjustLevel(String roomId, Level currentLevel, int latestScore) {
        String key = SCORE_KEY.formatted(roomId);

        // 최근 점수 Redis에 추가
        stringRedisTemplate.opsForList().rightPush(key, String.valueOf(latestScore));
        stringRedisTemplate.opsForList().trim(key, -MAX_SCORES, -1);
        stringRedisTemplate.expire(key, Duration.ofDays(7));

        List<Integer> recentScores = getRecentScores(key);

        // 올리기: 연속 3개 ≥ 90점
        if (recentScores.size() >= UPGRADE_COUNT) {
            List<Integer> last3 = recentScores.subList(recentScores.size() - UPGRADE_COUNT, recentScores.size());
            if (last3.stream().allMatch(s -> s >= UPGRADE_THRESHOLD)) {
                Level next = nextLevel(currentLevel);
                if (next != currentLevel) {
                    return new LevelAdjustmentDTO(true, currentLevel, next,
                            "User showed consistent high accuracy");
                }
            }
        }

        // 내리기: 연속 2개 ≤ 50점
        if (recentScores.size() >= DOWNGRADE_COUNT) {
            List<Integer> last2 = recentScores.subList(recentScores.size() - DOWNGRADE_COUNT, recentScores.size());
            if (last2.stream().allMatch(s -> s <= DOWNGRADE_THRESHOLD)) {
                Level prev = prevLevel(currentLevel);
                if (prev != currentLevel) {
                    return new LevelAdjustmentDTO(true, currentLevel, prev,
                            "User struggled at current level");
                }
            }
        }

        return LevelAdjustmentDTO.noChange(currentLevel);
    }

    @Transactional
    public void applyAdjustment(String roomId, LevelAdjustmentDTO adjustment) {
        if (!adjustment.shouldAdjust()) return;
        chatRoomRepository.findById(roomId).ifPresent(room -> {
            room.updateLevel(adjustment.to());
            // 레벨 변경 시 점수 이력 초기화
            stringRedisTemplate.delete(SCORE_KEY.formatted(roomId));
        });
    }

    private List<Integer> getRecentScores(String key) {
        List<String> raw = stringRedisTemplate.opsForList().range(key, 0, -1);
        if (raw == null) return new ArrayList<>();
        return raw.stream().map(Integer::parseInt).toList();
    }

    private Level nextLevel(Level current) {
        return switch (current) {
            case BEGINNER -> Level.INTERMEDIATE;
            case INTERMEDIATE -> Level.ADVANCED;
            case ADVANCED -> Level.ADVANCED;
        };
    }

    private Level prevLevel(Level current) {
        return switch (current) {
            case BEGINNER -> Level.BEGINNER;
            case INTERMEDIATE -> Level.BEGINNER;
            case ADVANCED -> Level.INTERMEDIATE;
        };
    }
}

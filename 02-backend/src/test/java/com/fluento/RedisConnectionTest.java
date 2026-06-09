package com.fluento;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Redis 연결 테스트")
class RedisConnectionTest {

    @Autowired
    private RedisConnectionFactory redisConnectionFactory;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    private boolean isRedisAvailable() {
        try {
            redisConnectionFactory.getConnection().ping();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Test
    @DisplayName("RedisTemplate Bean 등록 확인")
    void redisTemplateBeanTest() {
        assertThat(redisTemplate).isNotNull();
        assertThat(stringRedisTemplate).isNotNull();
    }

    @Test
    @DisplayName("Redis 연결 및 PING 확인")
    void redisConnectionTest() {
        assumeTrue(isRedisAvailable(), "Redis가 실행 중이지 않아 테스트를 건너뜁니다.");

        String pong = redisConnectionFactory.getConnection().ping();
        assertThat(pong).isEqualTo("PONG");
        System.out.println("Redis PING 응답: " + pong);
    }

    @Test
    @DisplayName("StringRedisTemplate 캐시 쓰기/읽기 테스트")
    void stringRedisTemplateTest() {
        assumeTrue(isRedisAvailable(), "Redis가 실행 중이지 않아 테스트를 건너뜁니다.");

        String key = "test:fluento:hello";
        String value = "world";

        stringRedisTemplate.opsForValue().set(key, value, Duration.ofSeconds(10));
        String result = stringRedisTemplate.opsForValue().get(key);

        assertThat(result).isEqualTo(value);
        stringRedisTemplate.delete(key);  // 테스트 후 정리
    }

    @Test
    @DisplayName("RedisTemplate 객체 캐시 쓰기/읽기 테스트")
    void redisTemplateObjectTest() {
        assumeTrue(isRedisAvailable(), "Redis가 실행 중이지 않아 테스트를 건너뜁니다.");

        String key = "test:fluento:score";
        Integer score = 95;

        redisTemplate.opsForValue().set(key, score, Duration.ofSeconds(10));
        Object result = redisTemplate.opsForValue().get(key);

        assertThat(result).isNotNull();
        stringRedisTemplate.delete(key);  // 테스트 후 정리
    }
}

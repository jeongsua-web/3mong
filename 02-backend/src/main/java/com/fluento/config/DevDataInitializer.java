package com.fluento.config;

import com.fluento.domain.user.User;
import com.fluento.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Slf4j
@Configuration
@Profile("dev")
@RequiredArgsConstructor
public class DevDataInitializer {

    private final UserRepository userRepository;

    @Bean
    public ApplicationRunner initDevUser() {
        return args -> {
            if (userRepository.findByGoogleId("dev-user").isEmpty()) {
                userRepository.save(User.builder()
                        .googleId("dev-user")
                        .email("dev@fluento.com")
                        .name("Dev User")
                        .build());
                log.info("Dev user created: dev@fluento.com");
            }
        };
    }
}

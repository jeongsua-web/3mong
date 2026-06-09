package com.fluento.service;

import com.fluento.domain.user.User;
import com.fluento.domain.user.UserRepository;
import com.fluento.dto.UpdateProfileRequest;
import com.fluento.dto.UserResponse;
import com.fluento.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getCurrentUser(Jwt jwt) {
        Long userId = extractUserId(jwt);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        return UserResponse.from(user);
    }

    @Transactional
    public User getOrCreateUser(String googleId, String email, String name) {
        return userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .orElseGet(() -> userRepository.save(
                                User.builder()
                                        .googleId(googleId)
                                        .email(email)
                                        .name(name)
                                        .build()
                        )));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        user.updateProfile(request.name(), request.profileImageUrl());
        user.updateSettings(request.appLanguage(), request.theme(), request.notificationEnabled());
        return UserResponse.from(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException(userId);
        }
        userRepository.deleteById(userId);
    }

    public Long getUserIdByGoogleId(String googleId) {
        return userRepository.findByGoogleId(googleId)
                .map(User::getId)
                .orElseThrow(() -> new UserNotFoundException(-1L));
    }

    private Long extractUserId(Jwt jwt) {
        return getUserIdByGoogleId(jwt.getSubject());
    }
}

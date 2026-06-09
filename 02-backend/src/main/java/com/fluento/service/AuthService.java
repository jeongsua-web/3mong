package com.fluento.service;

import com.fluento.domain.user.User;
import com.fluento.domain.user.UserRepository;
import com.fluento.dto.auth.LoginResponse;
import com.fluento.exception.DuplicateEmailException;
import com.fluento.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${google.client-id}")
    private String googleClientId;

    @Transactional
    public Map<String, Object> signup(String username, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException("이미 가입된 이메일입니다.");
        }
        User user = userRepository.save(User.builder()
                .email(email)
                .name(username)
                .password(passwordEncoder.encode(password))
                .build());
        return Map.of("email", user.getEmail());
    }

    @Transactional
    public LoginResponse googleLogin(String credential) {
        Map<String, String> tokenInfo;
        try {
            tokenInfo = RestClient.create()
                    .get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token=" + credential)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            throw new UnauthorizedException("유효하지 않은 Google 토큰입니다.");
        }

        if (tokenInfo == null || !googleClientId.equals(tokenInfo.get("aud"))) {
            throw new UnauthorizedException("유효하지 않은 Google 토큰입니다.");
        }

        String googleId = tokenInfo.get("sub");
        String email = tokenInfo.get("email");
        String name = tokenInfo.getOrDefault("name", email);
        String picture = tokenInfo.get("picture");

        User user = userRepository.findByGoogleId(googleId).orElseGet(() -> {
            return userRepository.findByEmail(email)
                    .map(u -> { u.linkGoogleId(googleId); return u; })
                    .orElseGet(() -> userRepository.save(User.builder()
                            .googleId(googleId)
                            .email(email)
                            .name(name)
                            .profileImageUrl(picture)
                            .build()));
        });

        String token = jwtTokenProvider.generate(user.getId());
        return new LoginResponse(token, token, null, (int) jwtTokenProvider.getExpirationSeconds());
    }

    @Transactional(readOnly = true)
    public LoginResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다."));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        String token = jwtTokenProvider.generate(user.getId());
        return new LoginResponse(token, token, null, (int) jwtTokenProvider.getExpirationSeconds());
    }
}

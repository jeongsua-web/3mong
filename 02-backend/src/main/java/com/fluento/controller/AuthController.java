package com.fluento.controller;

import com.fluento.domain.user.User;
import com.fluento.dto.ApiResponse;
import com.fluento.dto.auth.LoginRequest;
import com.fluento.dto.auth.LoginResponse;
import com.fluento.dto.auth.ConfirmSignupRequest;
import com.fluento.dto.auth.SignupRequest;
import com.fluento.service.CognitoService;
import com.fluento.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final CognitoService cognitoService;
    private final Environment environment;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> signup(
            @Valid @RequestBody SignupRequest request) {
        Map<String, Object> result = cognitoService.signup(
                request.username(), request.email(), request.password());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/signup/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmSignup(
            @Valid @RequestBody ConfirmSignupRequest request) {
        cognitoService.confirmSignup(request.email(), request.code());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        if (Arrays.asList(environment.getActiveProfiles()).contains("dev")) {
            return ResponseEntity.ok(ApiResponse.ok(new LoginResponse("dev-token", "dev-token", null, 3600)));
        }
        LoginResponse response = cognitoService.login(request.email(), request.password());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@AuthenticationPrincipal Jwt jwt) {
        String googleId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");

        User user = userService.getOrCreateUser(googleId, email, name);

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "userId", user.getId(),
                "email", user.getEmail(),
                "name", user.getName()
        )));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Map<String, String>>> logout() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Logged out successfully")));
    }
}

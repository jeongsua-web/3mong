package com.fluento.controller;

import com.fluento.dto.ApiResponse;
import com.fluento.dto.auth.GoogleLoginRequest;
import com.fluento.dto.auth.LoginRequest;
import com.fluento.dto.auth.LoginResponse;
import com.fluento.dto.auth.SignupRequest;
import com.fluento.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> signup(
            @Valid @RequestBody SignupRequest request) {
        Map<String, Object> result = authService.signup(
                request.username(), request.email(), request.password());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request.email(), request.password());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<LoginResponse>> googleLogin(
            @Valid @RequestBody GoogleLoginRequest request) {
        LoginResponse response = authService.googleLogin(request.credential());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Map<String, String>>> logout() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Logged out successfully")));
    }
}

package com.fluento.controller;

import com.fluento.dto.ApiResponse;
import com.fluento.dto.character.CharacterResponse;
import com.fluento.service.CharacterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyCharacters(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(characterService.getMyCharacters(userId)));
    }

    @GetMapping("/recommended")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRecommended() {
        return ResponseEntity.ok(ApiResponse.ok(characterService.getRecommendedCharacters()));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<CharacterResponse>> createCharacter(
            @AuthenticationPrincipal Long userId,
            @RequestParam String name,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String personality,
            @RequestParam(required = false) String memo,
            @RequestParam(required = false) MultipartFile profileImage) {
        CharacterResponse response = characterService.createCharacter(
                userId, name, gender, role, personality, memo, profileImage);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCharacter(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        characterService.deleteCharacter(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<CharacterResponse>> toggleFavorite(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean isFavorite = Boolean.TRUE.equals(body.get("isFavorite"));
        return ResponseEntity.ok(ApiResponse.ok(characterService.toggleFavorite(userId, id, isFavorite)));
    }
}

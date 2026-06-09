package com.fluento.service;

import com.fluento.domain.character.Character;
import com.fluento.domain.character.CharacterRepository;
import com.fluento.dto.character.CharacterResponse;
import com.fluento.dto.character.RecommendedCharacter;
import com.fluento.exception.CharacterNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CharacterService {

    private static final List<RecommendedCharacter> RECOMMENDED = List.of(
            new RecommendedCharacter(1, "James", "Boyfriend", "male", "nonchalant, shy"),
            new RecommendedCharacter(2, "Charles", "Colleague", "male", "cool, detached"),
            new RecommendedCharacter(3, "Anna", "Mom", "female", "warm, kind"),
            new RecommendedCharacter(4, "Jenny", "Colleague", "female", "bright, shy"),
            new RecommendedCharacter(5, "Alex", "Professor", "male", "kind, strict"),
            new RecommendedCharacter(6, "Sophie", "Neighbor", "female", "cheerful, talkative")
    );

    private final CharacterRepository characterRepository;

    public Map<String, Object> getMyCharacters(Long userId) {
        List<CharacterResponse> characters = characterRepository
                .findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(CharacterResponse::from).toList();
        return Map.of("characters", characters);
    }

    public Map<String, Object> getRecommendedCharacters() {
        return Map.of("characters", RECOMMENDED);
    }

    @Transactional
    public CharacterResponse createCharacter(Long userId, String name, String gender,
                                             String role, String personality, String memo,
                                             MultipartFile profileImage) {
        Character character = Character.builder()
                .userId(userId)
                .name(name)
                .gender(gender != null ? gender : "male")
                .role(role)
                .personality(personality)
                .memo(memo)
                .build();
        return CharacterResponse.from(characterRepository.save(character));
    }

    @Transactional
    public void deleteCharacter(Long userId, Long characterId) {
        Character character = characterRepository.findByIdAndUserId(characterId, userId)
                .orElseThrow(() -> new CharacterNotFoundException(characterId));
        characterRepository.delete(character);
    }

    @Transactional
    public CharacterResponse toggleFavorite(Long userId, Long characterId, boolean isFavorite) {
        Character character = characterRepository.findByIdAndUserId(characterId, userId)
                .orElseThrow(() -> new CharacterNotFoundException(characterId));
        character.toggleFavorite(isFavorite);
        return CharacterResponse.from(character);
    }
}

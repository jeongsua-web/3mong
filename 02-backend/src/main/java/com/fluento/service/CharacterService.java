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

    /**
     * AI가 연기할 캐릭터 페르소나를 영어 시스템 프롬프트 문장으로 생성한다.
     * 채팅방의 characterId(=DB Character id)로 소유자 캐릭터를 조회한다.
     * 캐릭터를 찾지 못하면 null을 반환해 호출부가 레벨 기본 프롬프트만 쓰도록 한다.
     */
    public String describePersona(Long userId, Long characterId) {
        if (characterId == null) {
            return null;
        }
        // 사용자 소유 캐릭터를 우선 조회하고, 없으면 전역 추천 캐릭터(user_id IS NULL)를 조회한다.
        return characterRepository.findByIdAndUserId(characterId, userId)
                .or(() -> characterRepository.findByIdAndIsRecommendedTrue(characterId))
                .map(this::buildPersona)
                .orElse(null);
    }

    private String buildPersona(Character c) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are role-playing as the character the learner is chatting with. ");
        sb.append("Your name is ").append(c.getName()).append(". ");
        if (c.getGender() != null && !c.getGender().isBlank()) {
            sb.append("Gender: ").append(c.getGender()).append(". ");
        }
        if (c.getRole() != null && !c.getRole().isBlank()) {
            sb.append("Your role/relationship to the learner: ").append(c.getRole()).append(". ");
        }
        if (c.getPersonality() != null && !c.getPersonality().isBlank()) {
            sb.append("Your personality: ").append(c.getPersonality()).append(". ");
        }
        if (c.getMemo() != null && !c.getMemo().isBlank()) {
            sb.append("Extra context about you: ").append(c.getMemo()).append(". ");
        }
        sb.append("Stay fully in character — speak in this persona's voice, ")
          .append("and choose topics and questions that fit who you are.");
        return sb.toString();
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

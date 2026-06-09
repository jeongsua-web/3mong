package com.fluento.domain.character;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CharacterRepository extends JpaRepository<Character, Long> {
    List<Character> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Character> findByIdAndUserId(Long id, Long userId);
}

package com.fluento.domain.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LevelAssessmentRepository extends JpaRepository<LevelAssessment, Long> {

    // Replaces non-standard JPQL LIMIT 1 with a JPA derived query
    Optional<LevelAssessment> findFirstByRoomIdOrderByAssessedAtDesc(String roomId);

    List<LevelAssessment> findByRoomIdOrderByAssessedAtDesc(String roomId);
}

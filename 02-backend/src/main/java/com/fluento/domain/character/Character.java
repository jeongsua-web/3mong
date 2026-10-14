package com.fluento.domain.character;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "characters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Character {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 추천(전역) 캐릭터는 소유자가 없어 null. 일반 캐릭터는 소유 user id.
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private String gender = "male";

    private String role;

    private String personality;

    @Column(columnDefinition = "TEXT")
    private String memo;

    private String profileImageUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isFavorite = false;

    // 전역 추천 캐릭터 여부 (소유자 없는 시드 데이터)
    @Column(nullable = false)
    @Builder.Default
    private Boolean isRecommended = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void toggleFavorite(boolean isFavorite) {
        this.isFavorite = isFavorite;
    }
}

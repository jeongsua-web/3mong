package com.fluento.domain.chat;

import com.fluento.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "chat_rooms",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_chat_rooms_user_character",
                columnNames = {"user_id", "character_id"}
        ),
        indexes = {
                @Index(name = "idx_chat_rooms_user_id", columnList = "user_id"),
                @Index(name = "idx_chat_rooms_character_id", columnList = "character_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ChatRoom {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String characterId;

    @Column(nullable = false)
    private String characterName;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Level currentLevel = Level.BEGINNER;

    @Column(nullable = false)
    @Builder.Default
    private Integer messageCount = 0;

    private LocalDateTime lastMessageAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void updateTitle(String title) {
        this.title = title;
    }

    public void togglePin() {
        this.isPinned = !this.isPinned;
    }

    public void recordMessage() {
        this.messageCount++;
        this.lastMessageAt = LocalDateTime.now();
    }

    public void updateLevel(Level newLevel) {
        this.currentLevel = newLevel;
    }
}

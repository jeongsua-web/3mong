package com.fluento.exception;

public class ChatRoomAlreadyExistsException extends RuntimeException {
    public ChatRoomAlreadyExistsException(String characterId) {
        super("Chat room already exists for character: " + characterId);
    }
}

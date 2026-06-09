package com.fluento.exception;

public class ChatRoomNotFoundException extends RuntimeException {
    public ChatRoomNotFoundException(String roomId) {
        super("Chat room not found: " + roomId);
    }
}

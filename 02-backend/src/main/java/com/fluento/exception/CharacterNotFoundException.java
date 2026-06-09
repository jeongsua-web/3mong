package com.fluento.exception;

public class CharacterNotFoundException extends RuntimeException {
    public CharacterNotFoundException(Long id) {
        super("Character not found: " + id);
    }
}

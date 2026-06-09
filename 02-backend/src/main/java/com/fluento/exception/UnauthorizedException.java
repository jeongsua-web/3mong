package com.fluento.exception;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException() {
        super("Access denied");
    }

    public UnauthorizedException(String message) {
        super(message);
    }
}

package com.example.demoapi.dto;

// Using 'record' for a simple, immutable DTO
public record LoginRequest(String email, String password) {
}
package com.example.demoapi.dto;

// This response only contains the short-lived Access Token
public record AuthResponse(String accessToken) {
}
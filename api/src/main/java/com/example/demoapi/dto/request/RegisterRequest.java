package com.example.demoapi.dto.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String residentCode; // Tương ứng với residentid
    private String phoneNumber;
}
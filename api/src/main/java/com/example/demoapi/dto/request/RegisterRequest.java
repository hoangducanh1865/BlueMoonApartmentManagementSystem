package com.example.demoapi.dto.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String password;
    private String residentCode; // Mã đăng ký do BQL cấp
    private String phoneNumber;
}

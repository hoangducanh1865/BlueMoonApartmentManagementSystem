package com.example.demoapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private String token; // Access Token
    private UserDetail user;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserDetail {
        private Integer id;          // Account ID
        private String email;
        private String fullName;
        private String role;
        private String avatar;
        private Integer householdId; // ID căn hộ
        private Integer residentId;  // ID cư dân
    }
}
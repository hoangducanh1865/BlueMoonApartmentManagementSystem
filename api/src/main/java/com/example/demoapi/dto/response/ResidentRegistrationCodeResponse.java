package com.example.demoapi.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ResidentRegistrationCodeResponse {
    private Long id;
    private String code;
    private Integer residentId;
    private Integer residentCode;
    private String residentName;
    private String residentPhone;
    private String residentEmail;
    private Instant expiresAt;
    private Instant createdAt;
    private Instant usedAt;
    private boolean expired;
    private boolean active;
}

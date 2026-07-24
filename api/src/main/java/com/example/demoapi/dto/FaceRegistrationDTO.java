package com.example.demoapi.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FaceRegistrationDTO {
    private Long id;
    private String userId;
    private String name;
    private String imageUrl;
    private LocalDateTime registeredAt;
}

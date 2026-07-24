package com.example.demoapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingCardResponse {

    private Long id;
    private String cardNumber;
    private Boolean isActive;
    private LocalDateTime issuedAt;
    private LocalDateTime deactivatedAt;

    // Vehicle info
    private Long vehicleId;
    private String licensePlate;
    private String vehicleType;

    // Owner info
    private String ownerName;
    private String householdNumber;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

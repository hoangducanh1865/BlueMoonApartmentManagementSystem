package com.example.demoapi.dto.response;

import com.example.demoapi.entity.SubscriptionType;
import com.example.demoapi.entity.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleResponse {

    private Long id;
    private String licensePlate;
    private VehicleType vehicleType;
    private String brand;
    private String model;
    private String color;

    // Owner info
    private Integer ownerId;
    private String ownerName;
    private String ownerPhone;
    private String householdNumber;

    // Subscription info
    private SubscriptionType subscriptionType;
    private Boolean subscriptionActive;
    private LocalDate subscriptionEndDate;

    // Card info
    private String cardNumber;
    private Boolean cardActive;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package com.example.demoapi.dto.response;

import com.example.demoapi.entity.SubscriptionType;
import com.example.demoapi.entity.VehicleRegistrationStatus;
import com.example.demoapi.entity.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRegistrationResponse {

    private Long id;

    // Resident info
    private Integer residentId;
    private String residentName;
    private String householdNumber;
    private String residentPhone;

    // Vehicle info
    private VehicleType vehicleType;
    private String licensePlate;
    private String brand;
    private String model;
    private String color;
    private SubscriptionType subscriptionType;

    // Status
    private VehicleRegistrationStatus status;

    // Documents
    private String idCardImageUrl;
    private String vehicleRegistrationImageUrl;
    private String vehicleImageUrl;

    // Review info
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String rejectionReason;
    private String adminNotes;

    // Created vehicle and card
    private Long vehicleId;
    private String cardNumber;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package com.example.demoapi.dto.response;

import com.example.demoapi.entity.SubscriptionType;
import com.example.demoapi.entity.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSubscriptionResponse {

    private Long id;
    private SubscriptionType subscriptionType;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal monthlyFee;
    private Boolean isActive;
    private Boolean isValid;

    // Vehicle info
    private Long vehicleId;
    private String licensePlate;
    private VehicleType vehicleType;

    // Owner info
    private String ownerName;
    private String householdNumber;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

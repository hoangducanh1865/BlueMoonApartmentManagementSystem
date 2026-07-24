package com.example.demoapi.dto.response;

import com.example.demoapi.entity.SubscriptionType;
import com.example.demoapi.entity.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleCheckResponse {

    private String licensePlate;
    private Boolean isRegistered;
    private VehicleType vehicleType;
    private SubscriptionType subscriptionType;
    private String subscriptionStatus;
    private String expiryDate;
    private String ownerName;
    private String householdNumber;
    private String cardNumber;
    private Boolean isCurrentlyParked;
}

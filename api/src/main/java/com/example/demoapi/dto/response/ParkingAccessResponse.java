package com.example.demoapi.dto.response;

import com.example.demoapi.entity.AccessType;
import com.example.demoapi.entity.SubscriptionType;
import com.example.demoapi.entity.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingAccessResponse {

    private Long id;
    private String licensePlate;
    private VehicleType vehicleType;
    private AccessType accessType;
    private SubscriptionType subscriptionType;
    private BigDecimal fee;
    private String duration;
    private LocalDateTime timestamp;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private String message;

    // Vehicle info (if registered)
    private VehicleResponse vehicle;

    private String entryImageUrl;
    private String exitImageUrl;
    private String notes;
}

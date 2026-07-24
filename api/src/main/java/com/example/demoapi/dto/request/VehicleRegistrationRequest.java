package com.example.demoapi.dto.request;

import com.example.demoapi.entity.SubscriptionType;
import com.example.demoapi.entity.VehicleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRegistrationRequest {

    @NotNull(message = "ID cư dân không được để trống")
    private Integer residentId;

    @NotNull(message = "Loại xe không được để trống")
    private VehicleType vehicleType;

    @NotBlank(message = "Biển số xe không được để trống")
    private String licensePlate;

    private String brand;
    private String model;
    private String color;

    @NotNull(message = "Loại vé không được để trống")
    private SubscriptionType subscriptionType;

    // Document image URLs
    private String vehicleImageUrl;
    private String vehicleRegistrationImageUrl;
    private String idCardImageUrl;
}

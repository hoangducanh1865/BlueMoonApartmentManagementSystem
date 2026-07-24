package com.example.demoapi.dto.request;

import com.example.demoapi.entity.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingAccessRequest {

    private String licensePlate;
    private String cardNumber;
    private VehicleType vehicleType;
    private String imageUrl;
    private String notes;
}

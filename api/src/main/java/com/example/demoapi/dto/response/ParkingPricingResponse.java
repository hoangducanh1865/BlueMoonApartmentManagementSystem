package com.example.demoapi.dto.response;

import com.example.demoapi.entity.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingPricingResponse {

    private Long id;
    private VehicleType vehicleType;
    private BigDecimal monthlyFee;
    private BigDecimal dailyFee;
    private BigDecimal hourlyFee;
}

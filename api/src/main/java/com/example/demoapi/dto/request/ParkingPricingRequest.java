package com.example.demoapi.dto.request;

import com.example.demoapi.entity.VehicleType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingPricingRequest {

    @NotNull(message = "Loại xe không được để trống")
    private VehicleType vehicleType;

    @NotNull(message = "Phí tháng không được để trống")
    private BigDecimal monthlyFee;

    @NotNull(message = "Phí ngày không được để trống")
    private BigDecimal dailyFee;

    @NotNull(message = "Phí giờ không được để trống")
    private BigDecimal hourlyFee;
}

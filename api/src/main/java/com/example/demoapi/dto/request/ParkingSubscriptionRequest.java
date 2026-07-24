package com.example.demoapi.dto.request;

import com.example.demoapi.entity.SubscriptionType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSubscriptionRequest {

    @NotNull(message = "ID xe không được để trống")
    private Long vehicleId;

    @NotNull(message = "Loại vé không được để trống")
    private SubscriptionType subscriptionType;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    private LocalDate endDate;

    private BigDecimal monthlyFee;
}

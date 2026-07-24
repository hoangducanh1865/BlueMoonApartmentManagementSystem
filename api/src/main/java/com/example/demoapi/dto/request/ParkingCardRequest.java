package com.example.demoapi.dto.request;

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
public class ParkingCardRequest {

    @NotBlank(message = "Số thẻ không được để trống")
    private String cardNumber;

    @NotNull(message = "ID xe không được để trống")
    private Long vehicleId;
}

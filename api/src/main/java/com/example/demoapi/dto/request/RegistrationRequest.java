package com.example.demoapi.dto.request;

import java.time.LocalDate;

import com.example.demoapi.model.RegistrationType;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegistrationRequest {

    @NotNull(message = "Phải chọn cư dân")
    private Integer residentId;

    @NotNull
    private Integer houseId;

    @NotNull
    private RegistrationType type;

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate; // Có thể null nếu chưa biết ngày về

    private String reason;
}

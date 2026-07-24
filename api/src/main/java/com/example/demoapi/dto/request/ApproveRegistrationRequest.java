package com.example.demoapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveRegistrationRequest {

    @NotBlank(message = "Số thẻ không được để trống")
    private String cardNumber;

    private LocalDate startDate;
    private String adminNotes;
}

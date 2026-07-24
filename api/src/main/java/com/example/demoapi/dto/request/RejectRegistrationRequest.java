package com.example.demoapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectRegistrationRequest {

    @NotBlank(message = "Lý do từ chối không được để trống")
    private String rejectionReason;
}

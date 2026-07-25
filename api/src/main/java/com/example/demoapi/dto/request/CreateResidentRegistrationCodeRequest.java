package com.example.demoapi.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class CreateResidentRegistrationCodeRequest {
    @Min(value = 1, message = "Thời gian sống tối thiểu là 1 giờ")
    @Max(value = 24, message = "Thời gian sống tối đa là 24 giờ")
    private Integer ttlHours = 4;
}

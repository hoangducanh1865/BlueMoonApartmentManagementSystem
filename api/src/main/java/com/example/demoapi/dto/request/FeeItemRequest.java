package com.example.demoapi.dto.request;

import lombok.Data;

@Data
public class FeeItemRequest {
    private Integer feeId;
    private Double quantity; // VD: 100 số điện, 1 vé xe...
}
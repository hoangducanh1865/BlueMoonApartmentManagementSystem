package com.example.demoapi.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SimulatePaymentRequest {

    private Integer invoiceId;
    private BigDecimal amount; // (Optional) Nếu null thì mặc định thanh toán hết số nợ còn lại
}

package com.example.demoapi.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class InvoiceDetailResponse {
    private Integer id;
    private String feeName;        // Tên phí (Điện, Nước...)
    private BigDecimal unitPrice;  // Đơn giá lúc tạo
    private String unit;           // Đơn vị
    private Double quantity;       // Số lượng dùng
    private BigDecimal amount;     // Thành tiền
}
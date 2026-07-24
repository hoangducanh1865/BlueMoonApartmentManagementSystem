package com.example.demoapi.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class InvoiceResponse {
    private Integer id;
    private String title;          // VD: Hóa đơn tháng 12/2025 - P1204
    private String roomNumber;
    private Integer month;
    private Integer year;
    private LocalDate dueDate;
    private BigDecimal totalAmount;
    private String status;         // UNPAID, PAID...

    private List<InvoiceDetailResponse> details; // Danh sách các khoản phí bên trong
}
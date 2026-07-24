package com.example.demoapi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateInvoiceRequest {
    @NotNull(message = "Phải chọn căn hộ")
    private Integer houseId;

    @NotNull
    private Integer month;

    @NotNull
    private Integer year;

    private LocalDate dueDate;

    private List<FeeItemRequest> items; // Danh sách các dịch vụ dùng trong tháng
}
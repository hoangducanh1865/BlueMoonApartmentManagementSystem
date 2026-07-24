package com.example.demoapi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApprovalRequest {

    @NotNull(message = "Phải xác định là Duyệt (true) hay Từ chối (false)")
    private Boolean isApproved;

    private String adminNote; // Lý do từ chối hoặc ghi chú thêm
}

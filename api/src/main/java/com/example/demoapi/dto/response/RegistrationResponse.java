package com.example.demoapi.dto.response;

import com.example.demoapi.model.RegistrationStatus;
import com.example.demoapi.model.RegistrationType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class RegistrationResponse {

    private Integer id;
    private String residentName;   // Tên người đăng ký
    private String roomNumber;     // Phòng nào
    private RegistrationType type; // Tạm trú / Tạm vắng
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private RegistrationStatus status;
    private String adminNote;      // Ghi chú của Admin (Lý do từ chối...)
}

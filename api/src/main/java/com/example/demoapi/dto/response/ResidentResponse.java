package com.example.demoapi.dto.response;

import com.example.demoapi.model.ResidentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ResidentResponse {
    private Integer id;
    private String name;
    private LocalDate dob;
    private String phoneNumber;

    private String email;

    private String relationship; // Quan hệ với chủ hộ
    private Boolean isHost;      // Có phải chủ hộ không
    private ResidentStatus status; // Thường trú/Tạm trú...
    private String cccd;         // (Tùy chọn: Nếu muốn hiển thị CCCD)

    private String roomNumber;
    private String building;
}
package com.example.demoapi.dto.request;

import com.example.demoapi.model.ResidentStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MemberRequest {
    private String name;
    private String phoneNumber; // Dùng để định danh
    private String email;
    private LocalDate dob;
    private String cccd;
    private String avatar;

    // Thông tin cư trú
    private String relationship; // Quan hệ với chủ hộ: "Vợ", "Con", "Bố"...
    private ResidentStatus status; // THUONG_TRU, TAM_TRU...
    private String note;
}
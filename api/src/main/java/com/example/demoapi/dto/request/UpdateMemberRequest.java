package com.example.demoapi.dto.request;

import com.example.demoapi.model.ResidentStatus;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateMemberRequest {
    // Thông tin cá nhân
    private String name;
    private String phoneNumber;
    private String email;
    private LocalDate dob;
    private String cccd;
    private String avatar;

    // Thông tin cư trú
    private String relationship;   // Quan hệ với chủ hộ
    private ResidentStatus status; // THUONG_TRU, TAM_TRU...
    private String note;

    // --- QUAN TRỌNG: Dùng để chuyển nhà ---
    private String newRoomNumber;  // Nếu muốn chuyển sang phòng khác thì nhập số phòng mới (VD: P1205)
    private Boolean isHost;        // Có muốn set người này làm chủ hộ luôn không?
}
package com.example.demoapi.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "resident")
public class Resident {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer residentid;

    @ManyToOne
    @JoinColumn(name = "houseid", referencedColumnName = "houseid")
    private Apartment apartment;

    private String name;

    @Column(length = 20, nullable = false)
    private String phonenumber;

    private String email;
    private LocalDate dob;

    // --- PHẦN SỬA ĐỔI QUAN TRỌNG ---

    @Enumerated(EnumType.STRING) // Lưu vào DB dưới dạng chuỗi ("THUONG_TRU",...)
    @Column(length = 20)
    private ResidentStatus state;
    // Nếu bạn muốn giữ kiểu String cũ thì để: private String state; nhưng nhớ validate dữ liệu đầu vào.

    @Column(name = "startdate")
    private LocalDate startDate; // Ngày bắt đầu trạng thái (VD: Ngày chuyển đến, ngày bắt đầu tạm vắng)

    @Column(name = "enddate")
    private LocalDate endDate;   // Ngày kết thúc (VD: Hết hạn tạm trú, ngày về lại)

    @Column(columnDefinition = "TEXT")
    private String note;         // Ghi chú (VD: "Đi công tác Nhật Bản", "Sinh viên thuê trọ")

    private String address; // Quê quán / Địa chỉ thường trú gốc

    @Column(name = "avatar")
    private String avatar;

    private String cccd;

    private String relationship; // Quan hệ với chủ hộ
    private Boolean isHost;
}
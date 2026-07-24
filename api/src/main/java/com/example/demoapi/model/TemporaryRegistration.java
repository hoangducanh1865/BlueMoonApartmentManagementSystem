package com.example.demoapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "temporary_registration")
public class TemporaryRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Liên kết với cư dân (người làm đơn hoặc người được đăng ký)
    @ManyToOne
    @JoinColumn(name = "resident_id", nullable = false)
    private Resident resident;

    // Liên kết với căn hộ
    @ManyToOne
    @JoinColumn(name = "house_id", nullable = false)
    private Apartment apartment;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private RegistrationType type; // Tạm trú hay Tạm vắng

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "reason", length = 500)
    private String reason; // Lý do: Về quê, đi công tác, người nhà lên chơi...

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private RegistrationStatus status; // Mặc định là PENDING

    @Column(name = "note")
    private String note; // Ghi chú của Admin khi duyệt/từ chối
}

package com.example.demoapi.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "request")
public class Request {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer requestid;

    @ManyToOne
    @JoinColumn(name = "residentid", referencedColumnName = "residentid")
    private Resident resident; // Ai là người gửi yêu cầu

    @Column(nullable = false)
    private String title; // Ví dụ: "Sửa tên chủ hộ", "Báo hỏng đèn hành lang"

    @Column(columnDefinition = "TEXT")
    private String content; // Nội dung chi tiết

    @Column(length = 50)
    private String status; // "PENDING" (Chờ duyệt), "APPROVED" (Đã duyệt), "REJECTED" (Từ chối)

    @Column(columnDefinition = "TEXT")
    private String adminresponse; // Lý do từ chối hoặc ghi chú của Admin

    @CreationTimestamp
    @Column(name = "createddate", updatable = false)
    private LocalDateTime createddate;

    @Column(name = "resolveddate")
    private LocalDateTime resolveddate;
}
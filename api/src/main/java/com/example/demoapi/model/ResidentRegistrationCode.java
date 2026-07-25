package com.example.demoapi.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Data
@Entity
@Table(name = "resident_registration_code")
public class ResidentRegistrationCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String code;

    @ManyToOne(optional = false)
    @JoinColumn(name = "residentid", referencedColumnName = "residentid")
    private Resident resident;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant usedAt;

    @Column(length = 255)
    private String createdBy;
}

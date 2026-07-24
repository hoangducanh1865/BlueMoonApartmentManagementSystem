package com.example.demoapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "building_access_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BuildingAccessLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "access_point_id")
    private AccessPoint accessPoint;

    private String userId; // Nullable if unknown person
    private String userName; // Cached name

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    private AccessType accessType; // IN, OUT

    private boolean success; // True if allowed, False if denied/unknown

    private String snapshotUrl; // Image captured during access

    public enum AccessType {
        IN, OUT
    }
}

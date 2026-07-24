package com.example.demoapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "face_registration")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId; // Linking to the User/Resident ID (assuming String or Long, using String for flexibility)

    @Column(nullable = false)
    private String name; // Resident Name

    @Column(nullable = false)
    private String imageUrl; // Path or URL to the stored face image

    private LocalDateTime registeredAt;

    @PrePersist
    protected void onCreate() {
        registeredAt = LocalDateTime.now();
    }
}

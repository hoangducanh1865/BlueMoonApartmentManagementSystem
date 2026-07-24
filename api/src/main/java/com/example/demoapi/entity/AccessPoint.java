package com.example.demoapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "access_point")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccessPoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., "Main Entrance", "Gym", "Library"

    private String location;
    
    private String description;
}

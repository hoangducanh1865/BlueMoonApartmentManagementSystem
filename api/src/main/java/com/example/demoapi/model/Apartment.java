package com.example.demoapi.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "apartment")
public class Apartment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer houseid;

    private String building;
    private Integer floor;

    @Column(nullable = false)
    private Double area;

    @Enumerated(EnumType.STRING)
    private ApartmentStatus status;

    @Enumerated(EnumType.STRING)
    private ApartmentType type;

    @Column(nullable = false, unique = true)
    private String apartmentNumber;

}

package com.example.demoapi.dto.request;

import com.example.demoapi.model.ApartmentStatus;
import com.example.demoapi.model.ApartmentType;
import lombok.Data;

@Data
public class HouseholdRequest {
    private String roomNumber;  // Số phòng (P1204)
    private String ownerName;   // Tên chủ hộ
    private Double area;        // Diện tích
    private String phoneNumber; // SĐT chủ hộ
    private String email;       // Email chủ hộ
    private String building;
    private Integer floor;
    private ApartmentStatus status;
    private ApartmentType type;
}
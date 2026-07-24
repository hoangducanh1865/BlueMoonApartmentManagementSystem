package com.example.demoapi.dto.response;

import com.example.demoapi.model.ApartmentStatus; // Import Enum của bạn
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor // Lombok sẽ tạo Constructor theo đúng thứ tự biến bên dưới
@NoArgsConstructor
public class HouseholdResponse {

    // 1. a.houseid
    private Integer id;

    // 2. a.apartmentNumber
    private String roomNumber;

    // 3. owner.name
    private String ownerName;

    // 4. a.area
    private Double area;

    // 5. COUNT(r) -> Bắt buộc là LONG
    private Long memberCount;

    // 6. owner.phonenumber
    private String phoneNumber;

    // 7. a.building
    private String building;

    // 8. a.status -> Bắt buộc là ENUM (giống trong Model Apartment)
    private ApartmentStatus status;
}
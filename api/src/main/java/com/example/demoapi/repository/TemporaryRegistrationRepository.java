package com.example.demoapi.repository;

import com.example.demoapi.model.RegistrationStatus;
import com.example.demoapi.model.RegistrationType;
import com.example.demoapi.model.TemporaryRegistration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TemporaryRegistrationRepository extends JpaRepository<TemporaryRegistration, Integer> {

    // Lấy danh sách theo căn hộ (cho chủ hộ xem)
    List<TemporaryRegistration> findByApartment_Houseid(Integer houseId);

    // Lấy danh sách theo trạng thái (cho Admin duyệt)
    List<TemporaryRegistration> findByStatus(RegistrationStatus status);

    @Query("""
        SELECT t FROM TemporaryRegistration t
        JOIN FETCH t.resident r
        JOIN FETCH t.apartment a
        WHERE (:houseId IS NULL OR a.houseid = :houseId)
          AND (:status IS NULL OR t.status = :status)
          AND (:type IS NULL OR t.type = :type) 
    """)
    Page<TemporaryRegistration> findAllRequests(
            @Param("houseId") Integer houseId,
            @Param("status") RegistrationStatus status,
            @Param("type") RegistrationType type, // <--- THÊM THAM SỐ NÀY
            Pageable pageable
    );
}

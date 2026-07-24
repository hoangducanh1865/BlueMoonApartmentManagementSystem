package com.example.demoapi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demoapi.entity.VehicleRegistration;
import com.example.demoapi.entity.VehicleRegistrationStatus;

@Repository
public interface VehicleRegistrationRepository extends JpaRepository<VehicleRegistration, Long> {

    List<VehicleRegistration> findByResident_Residentid(Integer residentId);

    List<VehicleRegistration> findByStatus(VehicleRegistrationStatus status);

    @Query("SELECT r FROM VehicleRegistration r WHERE r.status = 'PENDING' ORDER BY r.createdAt ASC")
    List<VehicleRegistration> findPendingRegistrations();

    boolean existsByLicensePlateAndStatusNot(String licensePlate, VehicleRegistrationStatus status);

    @Query("SELECT r FROM VehicleRegistration r "
            + "LEFT JOIN FETCH r.resident res "
            + "LEFT JOIN FETCH res.apartment a "
            + "WHERE r.id = :id")
    Optional<VehicleRegistration> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT r FROM VehicleRegistration r "
            + "LEFT JOIN FETCH r.resident res "
            + "LEFT JOIN FETCH res.apartment a "
            + "WHERE (:search IS NULL OR :search = '' OR "
            + "LOWER(r.licensePlate) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(res.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<VehicleRegistration> findAllWithSearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(r) FROM VehicleRegistration r WHERE r.status = :status")
    long countByStatus(@Param("status") VehicleRegistrationStatus status);
}

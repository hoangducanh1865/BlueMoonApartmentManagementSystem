package com.example.demoapi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demoapi.entity.Vehicle;
import com.example.demoapi.entity.VehicleType;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByLicensePlate(String licensePlate);

    boolean existsByLicensePlate(String licensePlate);

    List<Vehicle> findByOwner_Residentid(Integer residentId);

    @Query("SELECT v FROM Vehicle v WHERE v.owner.apartment.houseid = :householdId")
    List<Vehicle> findByHouseholdId(@Param("householdId") Integer householdId);

    List<Vehicle> findByVehicleType(VehicleType vehicleType);

    @Query("SELECT v FROM Vehicle v "
            + "LEFT JOIN FETCH v.owner o "
            + "LEFT JOIN FETCH v.subscription s "
            + "LEFT JOIN FETCH v.parkingCard c "
            + "WHERE (:search IS NULL OR :search = '' OR "
            + "LOWER(v.licensePlate) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(o.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Vehicle> findAllWithSearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT v FROM Vehicle v "
            + "JOIN v.subscription s "
            + "WHERE s.isActive = true AND s.subscriptionType = 'MONTHLY'")
    List<Vehicle> findAllWithActiveMonthlySubscription();

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.vehicleType = :type")
    long countByVehicleType(@Param("type") VehicleType type);
}

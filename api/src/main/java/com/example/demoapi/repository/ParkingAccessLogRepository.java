package com.example.demoapi.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demoapi.entity.AccessType;
import com.example.demoapi.entity.ParkingAccessLog;
import com.example.demoapi.entity.SubscriptionType;
import com.example.demoapi.entity.VehicleType;

@Repository
public interface ParkingAccessLogRepository extends JpaRepository<ParkingAccessLog, Long> {

    Page<ParkingAccessLog> findByLicensePlate(String licensePlate, Pageable pageable);

    List<ParkingAccessLog> findByVehicle_Id(Long vehicleId);

    @Query("SELECT l FROM ParkingAccessLog l "
            + "WHERE l.createdAt BETWEEN :startTime AND :endTime "
            + "ORDER BY l.createdAt DESC")
    List<ParkingAccessLog> findByDateRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT l FROM ParkingAccessLog l "
            + "WHERE l.createdAt >= :startOfDay AND l.createdAt < :endOfDay "
            + "ORDER BY l.createdAt DESC")
    List<ParkingAccessLog> findTodayLogs(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    // Find the most recent entry without exit for a license plate (currently parked)
    @Query("SELECT l FROM ParkingAccessLog l "
            + "WHERE l.licensePlate = :licensePlate "
            + "AND l.accessType = 'ENTRY' "
            + "AND l.exitTime IS NULL "
            + "ORDER BY l.entryTime DESC")
    Optional<ParkingAccessLog> findActiveEntryByLicensePlate(@Param("licensePlate") String licensePlate);

    // Find all currently parked vehicles
    @Query("SELECT l FROM ParkingAccessLog l "
            + "WHERE l.accessType = 'ENTRY' AND l.exitTime IS NULL "
            + "ORDER BY l.entryTime DESC")
    List<ParkingAccessLog> findCurrentlyParked();

    // Statistics queries
    @Query("SELECT COUNT(l) FROM ParkingAccessLog l "
            + "WHERE l.accessType = :accessType "
            + "AND l.createdAt BETWEEN :startTime AND :endTime")
    long countByAccessTypeAndDateRange(
            @Param("accessType") AccessType accessType,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COALESCE(SUM(l.fee), 0) FROM ParkingAccessLog l "
            + "WHERE l.createdAt BETWEEN :startTime AND :endTime "
            + "AND l.fee IS NOT NULL")
    BigDecimal sumFeeByDateRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(l) FROM ParkingAccessLog l "
            + "WHERE l.vehicleType = :vehicleType "
            + "AND l.accessType = :accessType "
            + "AND l.createdAt BETWEEN :startTime AND :endTime")
    long countByVehicleTypeAndAccessType(
            @Param("vehicleType") VehicleType vehicleType,
            @Param("accessType") AccessType accessType,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(l) FROM ParkingAccessLog l "
            + "WHERE l.subscriptionType = :subscriptionType "
            + "AND l.accessType = :accessType "
            + "AND l.createdAt BETWEEN :startTime AND :endTime")
    long countBySubscriptionTypeAndAccessType(
            @Param("subscriptionType") SubscriptionType subscriptionType,
            @Param("accessType") AccessType accessType,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT l FROM ParkingAccessLog l "
            + "WHERE (:search IS NULL OR :search = '' OR "
            + "LOWER(l.licensePlate) LIKE LOWER(CONCAT('%', :search, '%'))) "
            + "ORDER BY l.createdAt DESC")
    Page<ParkingAccessLog> findAllWithSearch(@Param("search") String search, Pageable pageable);
}

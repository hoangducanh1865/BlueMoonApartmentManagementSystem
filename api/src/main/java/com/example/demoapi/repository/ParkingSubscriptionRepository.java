package com.example.demoapi.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demoapi.entity.ParkingSubscription;
import com.example.demoapi.entity.SubscriptionType;

@Repository
public interface ParkingSubscriptionRepository extends JpaRepository<ParkingSubscription, Long> {

    Optional<ParkingSubscription> findByVehicle_Id(Long vehicleId);

    List<ParkingSubscription> findByIsActiveTrue();

    List<ParkingSubscription> findBySubscriptionType(SubscriptionType type);

    @Query("SELECT s FROM ParkingSubscription s "
            + "WHERE s.isActive = true AND s.subscriptionType = 'MONTHLY' "
            + "AND s.endDate BETWEEN :startDate AND :endDate")
    List<ParkingSubscription> findExpiringSubscriptions(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT s FROM ParkingSubscription s "
            + "JOIN FETCH s.vehicle v "
            + "LEFT JOIN FETCH v.owner o "
            + "WHERE s.isActive = true")
    List<ParkingSubscription> findAllActiveWithDetails();

    @Query("SELECT s FROM ParkingSubscription s "
            + "WHERE s.vehicle.licensePlate = :licensePlate AND s.isActive = true")
    Optional<ParkingSubscription> findActiveByLicensePlate(@Param("licensePlate") String licensePlate);

    @Query("SELECT COUNT(s) FROM ParkingSubscription s "
            + "WHERE s.isActive = true AND s.subscriptionType = :type")
    long countActiveByType(@Param("type") SubscriptionType type);
}

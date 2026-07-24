package com.example.demoapi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demoapi.entity.ParkingCard;

@Repository
public interface ParkingCardRepository extends JpaRepository<ParkingCard, Long> {

    Optional<ParkingCard> findByCardNumber(String cardNumber);

    boolean existsByCardNumber(String cardNumber);

    Optional<ParkingCard> findByVehicle_Id(Long vehicleId);

    List<ParkingCard> findByIsActiveTrue();

    List<ParkingCard> findByIsActiveFalse();

    @Query("SELECT c FROM ParkingCard c "
            + "LEFT JOIN FETCH c.vehicle v "
            + "WHERE c.cardNumber = :cardNumber")
    Optional<ParkingCard> findByCardNumberWithVehicle(@Param("cardNumber") String cardNumber);

    @Query("SELECT c FROM ParkingCard c "
            + "LEFT JOIN FETCH c.vehicle v "
            + "LEFT JOIN FETCH v.owner o "
            + "WHERE c.isActive = true")
    List<ParkingCard> findAllActiveWithDetails();
}

package com.example.demoapi.repository;

import com.example.demoapi.entity.ParkingPricing;
import com.example.demoapi.entity.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParkingPricingRepository extends JpaRepository<ParkingPricing, Long> {

    Optional<ParkingPricing> findByVehicleType(VehicleType vehicleType);

    boolean existsByVehicleType(VehicleType vehicleType);
}

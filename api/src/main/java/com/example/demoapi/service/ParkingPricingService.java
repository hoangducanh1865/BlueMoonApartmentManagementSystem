package com.example.demoapi.service;

import com.example.demoapi.dto.request.ParkingPricingRequest;
import com.example.demoapi.dto.response.ParkingPricingResponse;
import com.example.demoapi.entity.ParkingPricing;
import com.example.demoapi.entity.VehicleType;
import com.example.demoapi.repository.ParkingPricingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingPricingService {

    private final ParkingPricingRepository pricingRepository;

    public List<ParkingPricingResponse> getAllPricing() {
        return pricingRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Map<String, ParkingPricingResponse> getPricingMap() {
        Map<String, ParkingPricingResponse> map = new HashMap<>();
        pricingRepository.findAll().forEach(pricing
                -> map.put(pricing.getVehicleType().name(), mapToResponse(pricing)));
        return map;
    }

    public ParkingPricingResponse getPricingByVehicleType(VehicleType vehicleType) {
        ParkingPricing pricing = pricingRepository.findByVehicleType(vehicleType)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bảng giá cho loại xe: " + vehicleType));
        return mapToResponse(pricing);
    }

    @Transactional
    public ParkingPricingResponse createOrUpdatePricing(ParkingPricingRequest request) {
        ParkingPricing pricing = pricingRepository.findByVehicleType(request.getVehicleType())
                .orElse(ParkingPricing.builder()
                        .vehicleType(request.getVehicleType())
                        .build());

        pricing.setMonthlyFee(request.getMonthlyFee());
        pricing.setDailyFee(request.getDailyFee());
        pricing.setHourlyFee(request.getHourlyFee());

        ParkingPricing savedPricing = pricingRepository.save(pricing);
        return mapToResponse(savedPricing);
    }

    @Transactional
    public void initializeDefaultPricing() {
        // Initialize default pricing if not exists
        if (!pricingRepository.existsByVehicleType(VehicleType.MOTORBIKE)) {
            pricingRepository.save(ParkingPricing.builder()
                    .vehicleType(VehicleType.MOTORBIKE)
                    .monthlyFee(new java.math.BigDecimal("100000"))
                    .dailyFee(new java.math.BigDecimal("5000"))
                    .hourlyFee(new java.math.BigDecimal("3000"))
                    .build());
        }

        if (!pricingRepository.existsByVehicleType(VehicleType.CAR)) {
            pricingRepository.save(ParkingPricing.builder()
                    .vehicleType(VehicleType.CAR)
                    .monthlyFee(new java.math.BigDecimal("1500000"))
                    .dailyFee(new java.math.BigDecimal("50000"))
                    .hourlyFee(new java.math.BigDecimal("20000"))
                    .build());
        }
    }

    private ParkingPricingResponse mapToResponse(ParkingPricing pricing) {
        return ParkingPricingResponse.builder()
                .id(pricing.getId())
                .vehicleType(pricing.getVehicleType())
                .monthlyFee(pricing.getMonthlyFee())
                .dailyFee(pricing.getDailyFee())
                .hourlyFee(pricing.getHourlyFee())
                .build();
    }
}

package com.example.demoapi.controller;

import com.example.demoapi.dto.request.ParkingPricingRequest;
import com.example.demoapi.dto.response.ParkingPricingResponse;
import com.example.demoapi.entity.VehicleType;
import com.example.demoapi.service.ParkingPricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parking-pricing")
@RequiredArgsConstructor
public class ParkingPricingController {

    private final ParkingPricingService pricingService;

    @GetMapping
    public ResponseEntity<Map<String, ParkingPricingResponse>> getAllPricing() {
        return ResponseEntity.ok(pricingService.getPricingMap());
    }

    @GetMapping("/list")
    public ResponseEntity<List<ParkingPricingResponse>> getPricingList() {
        return ResponseEntity.ok(pricingService.getAllPricing());
    }

    @GetMapping("/{vehicleType}")
    public ResponseEntity<ParkingPricingResponse> getPricingByVehicleType(@PathVariable VehicleType vehicleType) {
        return ResponseEntity.ok(pricingService.getPricingByVehicleType(vehicleType));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ParkingPricingResponse> updatePricing(@Valid @RequestBody ParkingPricingRequest request) {
        return ResponseEntity.ok(pricingService.createOrUpdatePricing(request));
    }

    @PostMapping("/initialize")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> initializePricing() {
        pricingService.initializeDefaultPricing();
        return ResponseEntity.ok("Đã khởi tạo bảng giá mặc định");
    }
}

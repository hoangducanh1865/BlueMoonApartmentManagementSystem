package com.example.demoapi.controller;

import com.example.demoapi.dto.request.ParkingSubscriptionRequest;
import com.example.demoapi.dto.response.ParkingSubscriptionResponse;
import com.example.demoapi.service.ParkingSubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parking-subscriptions")
@RequiredArgsConstructor
public class ParkingSubscriptionController {

    private final ParkingSubscriptionService subscriptionService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<ParkingSubscriptionResponse>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions());
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<ParkingSubscriptionResponse>> getActiveSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getActiveSubscriptions());
    }

    @GetMapping("/expiring")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<ParkingSubscriptionResponse>> getExpiringSubscriptions(
            @RequestParam(defaultValue = "7") int daysAhead) {
        return ResponseEntity.ok(subscriptionService.getExpiringSubscriptions(daysAhead));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OWNER')")
    public ResponseEntity<ParkingSubscriptionResponse> getSubscriptionById(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionById(id));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OWNER')")
    public ResponseEntity<ParkingSubscriptionResponse> getSubscriptionByVehicleId(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionByVehicleId(vehicleId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ParkingSubscriptionResponse> createSubscription(
            @Valid @RequestBody ParkingSubscriptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subscriptionService.createSubscription(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ParkingSubscriptionResponse> updateSubscription(
            @PathVariable Long id,
            @Valid @RequestBody ParkingSubscriptionRequest request) {
        return ResponseEntity.ok(subscriptionService.updateSubscription(id, request));
    }

    @PutMapping("/{id}/renew")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ParkingSubscriptionResponse> renewSubscription(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int months) {
        return ResponseEntity.ok(subscriptionService.renewSubscription(id, months));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteSubscription(@PathVariable Long id) {
        subscriptionService.deleteSubscription(id);
        return ResponseEntity.noContent().build();
    }
}

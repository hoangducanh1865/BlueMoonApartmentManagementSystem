package com.example.demoapi.controller;

import com.example.demoapi.dto.request.ParkingCardRequest;
import com.example.demoapi.dto.response.ParkingCardResponse;
import com.example.demoapi.service.ParkingCardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parking-cards")
@RequiredArgsConstructor
public class ParkingCardController {

    private final ParkingCardService parkingCardService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<ParkingCardResponse>> getAllCards() {
        return ResponseEntity.ok(parkingCardService.getAllCards());
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<ParkingCardResponse>> getActiveCards() {
        return ResponseEntity.ok(parkingCardService.getActiveCards());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ParkingCardResponse> getCardById(@PathVariable Long id) {
        return ResponseEntity.ok(parkingCardService.getCardById(id));
    }

    @GetMapping("/card-number/{cardNumber}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<ParkingCardResponse> getCardByCardNumber(@PathVariable String cardNumber) {
        return ResponseEntity.ok(parkingCardService.getCardByCardNumber(cardNumber));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ParkingCardResponse> createCard(@Valid @RequestBody ParkingCardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(parkingCardService.createCard(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ParkingCardResponse> updateCard(
            @PathVariable Long id,
            @Valid @RequestBody ParkingCardRequest request) {
        return ResponseEntity.ok(parkingCardService.updateCard(id, request));
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ParkingCardResponse> deactivateCard(@PathVariable Long id) {
        return ResponseEntity.ok(parkingCardService.deactivateCard(id));
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ParkingCardResponse> activateCard(@PathVariable Long id) {
        return ResponseEntity.ok(parkingCardService.activateCard(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteCard(@PathVariable Long id) {
        parkingCardService.deleteCard(id);
        return ResponseEntity.noContent().build();
    }
}

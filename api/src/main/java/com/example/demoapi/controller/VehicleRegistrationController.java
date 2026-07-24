package com.example.demoapi.controller;

import com.example.demoapi.dto.request.ApproveRegistrationRequest;
import com.example.demoapi.dto.request.RejectRegistrationRequest;
import com.example.demoapi.dto.request.VehicleRegistrationRequest;
import com.example.demoapi.dto.response.VehicleRegistrationResponse;
import com.example.demoapi.entity.VehicleRegistrationStatus;
import com.example.demoapi.model.UserAccount;
import com.example.demoapi.repository.UserAccountRepository;
import com.example.demoapi.service.VehicleRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicle-registrations")
@RequiredArgsConstructor
public class VehicleRegistrationController {

    private final VehicleRegistrationService registrationService;
    private final UserAccountRepository userAccountRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Page<VehicleRegistrationResponse>> getAllRegistrations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order
    ) {
        Sort.Direction direction = order.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        return ResponseEntity.ok(registrationService.getAllRegistrations(search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OWNER', 'ROLE_RESIDENT')")
    public ResponseEntity<VehicleRegistrationResponse> getRegistrationById(@PathVariable Long id) {
        return ResponseEntity.ok(registrationService.getRegistrationById(id));
    }

    @GetMapping("/resident/{residentId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OWNER', 'ROLE_RESIDENT')")
    public ResponseEntity<List<VehicleRegistrationResponse>> getRegistrationsByResidentId(
            @PathVariable Integer residentId) {
        return ResponseEntity.ok(registrationService.getRegistrationsByResidentId(residentId));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<VehicleRegistrationResponse>> getRegistrationsByStatus(
            @PathVariable VehicleRegistrationStatus status) {
        return ResponseEntity.ok(registrationService.getRegistrationsByStatus(status));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<VehicleRegistrationResponse>> getPendingRegistrations() {
        return ResponseEntity.ok(registrationService.getPendingRegistrations());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OWNER', 'ROLE_RESIDENT')")
    public ResponseEntity<VehicleRegistrationResponse> createRegistration(
            @Valid @RequestBody VehicleRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registrationService.createRegistration(request));
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OWNER', 'ROLE_RESIDENT')")
    public ResponseEntity<VehicleRegistrationResponse> uploadDocuments(
            @PathVariable Long id,
            @RequestBody Map<String, String> documents) {
        return ResponseEntity.ok(registrationService.uploadDocuments(
                id,
                documents.get("idCardImageUrl"),
                documents.get("vehicleRegistrationImageUrl"),
                documents.get("vehicleImageUrl")
        ));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<VehicleRegistrationResponse> approveRegistration(
            @PathVariable Long id,
            @Valid @RequestBody ApproveRegistrationRequest request) {
        Integer adminUserId = getCurrentUserId();
        return ResponseEntity.ok(registrationService.approveRegistration(id, request, adminUserId));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<VehicleRegistrationResponse> rejectRegistration(
            @PathVariable Long id,
            @Valid @RequestBody RejectRegistrationRequest request) {
        Integer adminUserId = getCurrentUserId();
        return ResponseEntity.ok(registrationService.rejectRegistration(id, request, adminUserId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteRegistration(@PathVariable Long id) {
        registrationService.deleteRegistration(id);
        return ResponseEntity.noContent().build();
    }

    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userAccountRepository.findByEmail(email)
                .map(UserAccount::getAccountid)
                .orElse(null);
    }
}

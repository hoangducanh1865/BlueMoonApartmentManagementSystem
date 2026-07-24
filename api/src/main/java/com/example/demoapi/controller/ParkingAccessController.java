package com.example.demoapi.controller;

import com.example.demoapi.dto.request.ParkingAccessRequest;
import com.example.demoapi.dto.response.ParkingAccessResponse;
import com.example.demoapi.dto.response.ParkingStatisticsResponse;
import com.example.demoapi.dto.response.VehicleCheckResponse;
import com.example.demoapi.service.ParkingAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/parking-access")
@RequiredArgsConstructor
public class ParkingAccessController {

    private final ParkingAccessService parkingAccessService;

    /**
     * Process vehicle entry
     */
    @PostMapping("/entry")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<ParkingAccessResponse> processEntry(@RequestBody ParkingAccessRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(parkingAccessService.processEntry(request));
    }

    /**
     * Process vehicle exit
     */
    @PostMapping("/exit")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<ParkingAccessResponse> processExit(@RequestBody ParkingAccessRequest request) {
        return ResponseEntity.ok(parkingAccessService.processExit(request));
    }

    /**
     * Check vehicle status by license plate
     */
    @GetMapping("/check/{licensePlate}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<VehicleCheckResponse> checkVehicle(@PathVariable String licensePlate) {
        return ResponseEntity.ok(parkingAccessService.checkVehicle(licensePlate));
    }

    /**
     * Get all access logs with pagination
     */
    @GetMapping("/logs")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Page<ParkingAccessResponse>> getAccessLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order
    ) {
        Sort.Direction direction = order.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        return ResponseEntity.ok(parkingAccessService.getAccessLogs(search, pageable));
    }

    /**
     * Get access logs by vehicle ID
     */
    @GetMapping("/logs/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OWNER')")
    public ResponseEntity<List<ParkingAccessResponse>> getAccessLogsByVehicleId(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(parkingAccessService.getAccessLogsByVehicleId(vehicleId));
    }

    /**
     * Get today's logs
     */
    @GetMapping("/logs/today")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<List<ParkingAccessResponse>> getTodayLogs() {
        return ResponseEntity.ok(parkingAccessService.getTodayLogs());
    }

    /**
     * Get currently parked vehicles
     */
    @GetMapping("/currently-parked")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<List<ParkingAccessResponse>> getCurrentlyParked() {
        return ResponseEntity.ok(parkingAccessService.getCurrentlyParked());
    }

    /**
     * Get daily statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ParkingStatisticsResponse> getDailyStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        return ResponseEntity.ok(parkingAccessService.getDailyStatistics(date));
    }
}

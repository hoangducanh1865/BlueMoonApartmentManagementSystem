package com.example.demoapi.controller;

import com.example.demoapi.dto.request.ParkingAccessRequest;
import com.example.demoapi.dto.response.ParkingAccessResponse;
import com.example.demoapi.dto.response.VehicleCheckResponse;
import com.example.demoapi.service.LicensePlateRecognitionService;
import com.example.demoapi.service.ParkingAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for License Plate Recognition integrated with Parking Access This
 * controller uses the Python LP Recognition service to automatically detect
 * license plates and process parking entry/exit.
 */
@Slf4j
@RestController
@RequestMapping("/api/lpr")
@RequiredArgsConstructor
public class LicensePlateController {

    private final LicensePlateRecognitionService lprService;
    private final ParkingAccessService parkingAccessService;

    /**
     * Health check for LP Recognition service
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        boolean healthy = lprService.isServiceHealthy();
        response.put("service", "license-plate-recognition");
        response.put("status", healthy ? "healthy" : "unavailable");
        return ResponseEntity.ok(response);
    }

    /**
     * Recognize license plate from uploaded image
     */
    @PostMapping("/recognize")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<?> recognizePlate(@RequestParam("image") MultipartFile image) {
        try {
            LicensePlateRecognitionService.LicensePlateResult result = lprService.recognizeFromFile(image);

            if (!result.isSuccess()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of(
                                "success", false,
                                "error", result.getError()
                        ));
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "plates", result.getPlates(),
                    "count", result.getPlates().size()
            ));

        } catch (Exception e) {
            log.error("Error in LP recognition", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }

    /**
     * Recognize license plate from base64 image
     */
    @PostMapping("/recognize/base64")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<?> recognizePlateBase64(@RequestBody Map<String, String> request) {
        try {
            String base64Image = request.get("image");
            if (base64Image == null || base64Image.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "No image provided"));
            }

            LicensePlateRecognitionService.LicensePlateResult result = lprService.recognizeFromBase64(base64Image);

            if (!result.isSuccess()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of(
                                "success", false,
                                "error", result.getError()
                        ));
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "plates", result.getPlates(),
                    "count", result.getPlates().size()
            ));

        } catch (Exception e) {
            log.error("Error in LP recognition", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }

    /**
     * Auto Entry: Recognize plate from image and process entry automatically
     */
    @PostMapping("/auto-entry")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<?> autoEntry(@RequestParam("image") MultipartFile image) {
        try {
            // Step 1: Recognize license plate
            LicensePlateRecognitionService.LicensePlateResult result = lprService.recognizeFromFile(image);

            if (!result.isSuccess() || result.getPlates().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "error", "Không nhận diện được biển số xe",
                                "recognized", false
                        ));
            }

            // Step 2: Get the first recognized plate
            String licensePlate = result.getFirstPlate().orElse(null);
            if (licensePlate == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "error", "Không nhận diện được biển số xe",
                                "recognized", false
                        ));
            }

            // Step 3: Process entry
            ParkingAccessRequest accessRequest = ParkingAccessRequest.builder()
                    .licensePlate(licensePlate)
                    .build();

            ParkingAccessResponse accessResponse = parkingAccessService.processEntry(accessRequest);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "recognized", true,
                    "licensePlate", licensePlate,
                    "confidence", result.getPlates().get(0).getConfidence(),
                    "accessResult", accessResponse
            ));

        } catch (RuntimeException e) {
            // Handle business logic exceptions (e.g., vehicle already parked)
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        } catch (Exception e) {
            log.error("Error in auto entry", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }

    /**
     * Auto Exit: Recognize plate from image and process exit automatically
     */
    @PostMapping("/auto-exit")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<?> autoExit(@RequestParam("image") MultipartFile image) {
        try {
            // Step 1: Recognize license plate
            LicensePlateRecognitionService.LicensePlateResult result = lprService.recognizeFromFile(image);

            if (!result.isSuccess() || result.getPlates().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "error", "Không nhận diện được biển số xe",
                                "recognized", false
                        ));
            }

            // Step 2: Get the first recognized plate
            String licensePlate = result.getFirstPlate().orElse(null);
            if (licensePlate == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "error", "Không nhận diện được biển số xe",
                                "recognized", false
                        ));
            }

            // Step 3: Process exit
            ParkingAccessRequest accessRequest = ParkingAccessRequest.builder()
                    .licensePlate(licensePlate)
                    .build();

            ParkingAccessResponse accessResponse = parkingAccessService.processExit(accessRequest);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "recognized", true,
                    "licensePlate", licensePlate,
                    "confidence", result.getPlates().get(0).getConfidence(),
                    "accessResult", accessResponse
            ));

        } catch (RuntimeException e) {
            // Handle business logic exceptions (e.g., vehicle not found in parking)
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        } catch (Exception e) {
            log.error("Error in auto exit", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }

    /**
     * Auto Check: Recognize plate from image and check vehicle status
     */
    @PostMapping("/auto-check")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<?> autoCheck(@RequestParam("image") MultipartFile image) {
        try {
            // Step 1: Recognize license plate
            LicensePlateRecognitionService.LicensePlateResult result = lprService.recognizeFromFile(image);

            if (!result.isSuccess() || result.getPlates().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "error", "Không nhận diện được biển số xe",
                                "recognized", false
                        ));
            }

            // Step 2: Get the first recognized plate
            String licensePlate = result.getFirstPlate().orElse(null);
            if (licensePlate == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "error", "Không nhận diện được biển số xe",
                                "recognized", false
                        ));
            }

            // Step 3: Check vehicle status
            VehicleCheckResponse checkResponse = parkingAccessService.checkVehicle(licensePlate);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "recognized", true,
                    "licensePlate", licensePlate,
                    "confidence", result.getPlates().get(0).getConfidence(),
                    "vehicleInfo", checkResponse
            ));

        } catch (Exception e) {
            log.error("Error in auto check", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }
}

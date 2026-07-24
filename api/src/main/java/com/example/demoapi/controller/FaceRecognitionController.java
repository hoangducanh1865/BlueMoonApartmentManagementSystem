package com.example.demoapi.controller;

import com.example.demoapi.dto.BuildingAccessLogDTO;
import com.example.demoapi.dto.FaceRegistrationDTO;
import com.example.demoapi.service.FaceRecognitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/face-access")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FaceRecognitionController {

    private final FaceRecognitionService faceRecognitionService;

    @PostMapping("/register")
    public ResponseEntity<FaceRegistrationDTO> registerFace(
            @RequestParam("userId") String userId,
            @RequestParam("name") String name,
            @RequestParam("image") MultipartFile image) throws IOException {
        return ResponseEntity.ok(faceRecognitionService.registerFace(userId, name, image));
    }

    @GetMapping("/users")
    public ResponseEntity<List<FaceRegistrationDTO>> getAllRegisteredFaces() {
        return ResponseEntity.ok(faceRecognitionService.getAllRegisteredFaces());
    }

    @PostMapping("/log")
    public ResponseEntity<BuildingAccessLogDTO> logAccess(
            @RequestParam("accessPointName") String accessPointName,
            @RequestParam(value = "userId", required = false) String userId,
            @RequestParam("accessType") String accessType,
            @RequestParam(value = "snapshot", required = false) MultipartFile snapshot) throws IOException {
        return ResponseEntity.ok(faceRecognitionService.logAccess(accessPointName, userId, accessType, snapshot));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SECURITY')")
    public ResponseEntity<Page<BuildingAccessLogDTO>> getAccessLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String order
    ) {
        Sort.Direction direction = order.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        return ResponseEntity.ok(faceRecognitionService.getAccessLogs(search, startDate, endDate, pageable));
    }
}

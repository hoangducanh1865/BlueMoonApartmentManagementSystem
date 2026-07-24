package com.example.demoapi.service;

import com.example.demoapi.dto.BuildingAccessLogDTO;
import com.example.demoapi.dto.FaceRegistrationDTO;
import com.example.demoapi.entity.AccessPoint;
import com.example.demoapi.entity.BuildingAccessLog;
import com.example.demoapi.entity.FaceRegistration;
import com.example.demoapi.repository.AccessPointRepository;
import com.example.demoapi.repository.BuildingAccessLogRepository;
import com.example.demoapi.repository.FaceRegistrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaceRecognitionService {

    private final FaceRegistrationRepository faceRegistrationRepository;
    private final BuildingAccessLogRepository buildingAccessLogRepository;
    private final AccessPointRepository accessPointRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public FaceRegistrationDTO registerFace(String userId, String name, MultipartFile image) throws IOException {
        // Save image
        String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
        Path uploadPath = Paths.get(uploadDir, "faces");
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Save entity
        FaceRegistration registration = new FaceRegistration();
        registration.setUserId(userId);
        registration.setName(name);
        registration.setImageUrl("/uploads/faces/" + fileName); // Relative URL
        
        FaceRegistration saved = faceRegistrationRepository.save(registration);
        return mapToDTO(saved);
    }

    public List<FaceRegistrationDTO> getAllRegisteredFaces() {
        return faceRegistrationRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public BuildingAccessLogDTO logAccess(String accessPointName, String userId, String accessType, MultipartFile snapshot) throws IOException {
        AccessPoint accessPoint = accessPointRepository.findByName(accessPointName)
                .orElseGet(() -> {
                    AccessPoint newAp = new AccessPoint();
                    newAp.setName(accessPointName);
                    return accessPointRepository.save(newAp);
                });

        BuildingAccessLog logEntry = new BuildingAccessLog();
        logEntry.setAccessPoint(accessPoint);
        logEntry.setUserId(userId);
        logEntry.setTimestamp(LocalDateTime.now());
        logEntry.setAccessType(BuildingAccessLog.AccessType.valueOf(accessType));
        
        if (userId != null) {
            faceRegistrationRepository.findByUserId(userId).ifPresent(user -> {
                logEntry.setUserName(user.getName());
                logEntry.setSuccess(true);
            });
        } else {
            logEntry.setSuccess(false);
        }

        if (snapshot != null && !snapshot.isEmpty()) {
            String fileName = UUID.randomUUID().toString() + "_snapshot.jpg";
            Path uploadPath = Paths.get(uploadDir, "snapshots");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(snapshot.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            logEntry.setSnapshotUrl("/uploads/snapshots/" + fileName);
        }

        BuildingAccessLog saved = buildingAccessLogRepository.save(logEntry);
        return mapToDTO(saved);
    }

    public Page<BuildingAccessLogDTO> getAccessLogs(String search, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return buildingAccessLogRepository.searchLogs(search, startDate, endDate, pageable)
                .map(this::mapToDTO);
    }

    public List<BuildingAccessLogDTO> getAccessLogs() {
        return buildingAccessLogRepository.findByOrderByTimestampDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private FaceRegistrationDTO mapToDTO(FaceRegistration entity) {
        FaceRegistrationDTO dto = new FaceRegistrationDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setName(entity.getName());
        dto.setImageUrl(entity.getImageUrl());
        dto.setRegisteredAt(entity.getRegisteredAt());
        return dto;
    }

    private BuildingAccessLogDTO mapToDTO(BuildingAccessLog entity) {
        BuildingAccessLogDTO dto = new BuildingAccessLogDTO();
        dto.setId(entity.getId());
        dto.setAccessPointName(entity.getAccessPoint().getName());
        dto.setUserId(entity.getUserId());
        dto.setUserName(entity.getUserName());
        dto.setTimestamp(entity.getTimestamp());
        dto.setAccessType(entity.getAccessType().name());
        dto.setSuccess(entity.isSuccess());
        dto.setSnapshotUrl(entity.getSnapshotUrl());
        return dto;
    }
}

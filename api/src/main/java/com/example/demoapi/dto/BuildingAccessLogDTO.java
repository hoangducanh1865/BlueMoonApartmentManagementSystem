package com.example.demoapi.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BuildingAccessLogDTO {
    private Long id;
    private String accessPointName;
    private String userId;
    private String userName;
    private LocalDateTime timestamp;
    private String accessType;
    private boolean success;
    private String snapshotUrl;
}

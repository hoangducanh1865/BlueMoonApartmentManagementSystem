package com.example.demoapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingStatisticsResponse {

    private LocalDate date;
    private Long totalEntries;
    private Long totalExits;
    private Long currentlyParked;

    private RevenueStats revenue;
    private Map<String, AccessStats> byVehicleType;
    private Map<String, AccessStats> bySubscriptionType;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueStats {

        private BigDecimal monthly;
        private BigDecimal visitor;
        private BigDecimal total;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccessStats {

        private Long entries;
        private Long exits;
    }
}

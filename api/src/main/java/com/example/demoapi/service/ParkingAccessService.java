package com.example.demoapi.service;

import com.example.demoapi.dto.request.ParkingAccessRequest;
import com.example.demoapi.dto.response.*;
import com.example.demoapi.entity.*;
import com.example.demoapi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingAccessService {

    private final ParkingAccessLogRepository accessLogRepository;
    private final VehicleRepository vehicleRepository;
    private final ParkingCardRepository parkingCardRepository;
    private final ParkingSubscriptionRepository subscriptionRepository;
    private final ParkingPricingRepository pricingRepository;

    /**
     * Process vehicle entry
     */
    @Transactional
    public ParkingAccessResponse processEntry(ParkingAccessRequest request) {
        String licensePlate = request.getLicensePlate().toUpperCase().trim();

        // Check if vehicle is already parked
        Optional<ParkingAccessLog> activeEntry = accessLogRepository.findActiveEntryByLicensePlate(licensePlate);
        if (activeEntry.isPresent()) {
            throw new RuntimeException("Xe với biển số " + licensePlate + " đang ở trong bãi đỗ.");
        }

        // Try to find registered vehicle
        Optional<Vehicle> vehicleOpt = vehicleRepository.findByLicensePlate(licensePlate);
        Vehicle vehicle = vehicleOpt.orElse(null);

        // Determine vehicle type
        VehicleType vehicleType = vehicle != null ? vehicle.getVehicleType()
                : (request.getVehicleType() != null ? request.getVehicleType() : VehicleType.MOTORBIKE);

        // Determine subscription type
        SubscriptionType subscriptionType = SubscriptionType.VISITOR;
        String message = "Xe khách. Chào mừng!";

        if (vehicle != null) {
            Optional<ParkingSubscription> subscriptionOpt = subscriptionRepository.findByVehicle_Id(vehicle.getId());
            if (subscriptionOpt.isPresent() && subscriptionOpt.get().isValid()) {
                subscriptionType = subscriptionOpt.get().getSubscriptionType();
                if (subscriptionType == SubscriptionType.MONTHLY) {
                    message = "Xe đã đăng ký vé tháng. Chào mừng!";
                }
            }
        }

        // Create access log
        ParkingAccessLog accessLog = ParkingAccessLog.builder()
                .licensePlate(licensePlate)
                .vehicleType(vehicleType)
                .accessType(AccessType.ENTRY)
                .subscriptionType(subscriptionType)
                .vehicle(vehicle)
                .cardNumber(request.getCardNumber())
                .entryTime(LocalDateTime.now())
                .entryImageUrl(request.getImageUrl())
                .notes(request.getNotes())
                .build();

        ParkingAccessLog savedLog = accessLogRepository.save(accessLog);

        return ParkingAccessResponse.builder()
                .id(savedLog.getId())
                .licensePlate(savedLog.getLicensePlate())
                .vehicleType(savedLog.getVehicleType())
                .accessType(AccessType.ENTRY)
                .subscriptionType(subscriptionType)
                .fee(BigDecimal.ZERO)
                .timestamp(savedLog.getEntryTime())
                .entryTime(savedLog.getEntryTime())
                .message(message)
                .vehicle(vehicle != null ? mapVehicleToResponse(vehicle) : null)
                .entryImageUrl(savedLog.getEntryImageUrl())
                .notes(savedLog.getNotes())
                .build();
    }

    /**
     * Process vehicle exit
     */
    @Transactional
    public ParkingAccessResponse processExit(ParkingAccessRequest request) {
        String licensePlate = request.getLicensePlate().toUpperCase().trim();

        // Find active entry
        ParkingAccessLog entryLog = accessLogRepository.findActiveEntryByLicensePlate(licensePlate)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe với biển số " + licensePlate + " trong bãi đỗ."));

        LocalDateTime exitTime = LocalDateTime.now();
        Duration duration = Duration.between(entryLog.getEntryTime(), exitTime);

        // Calculate fee
        BigDecimal fee = BigDecimal.ZERO;
        String message = "Cảm ơn quý khách!";

        if (entryLog.getSubscriptionType() == SubscriptionType.VISITOR) {
            fee = calculateVisitorFee(entryLog.getVehicleType(), duration);
            message = String.format("Phí gửi xe: %,.0f VNĐ", fee);
        }

        // Update entry log with exit info
        entryLog.setExitTime(exitTime);
        entryLog.setExitImageUrl(request.getImageUrl());
        entryLog.setFee(fee);
        accessLogRepository.save(entryLog);

        // Create exit log
        ParkingAccessLog exitLog = ParkingAccessLog.builder()
                .licensePlate(licensePlate)
                .vehicleType(entryLog.getVehicleType())
                .accessType(AccessType.EXIT)
                .subscriptionType(entryLog.getSubscriptionType())
                .vehicle(entryLog.getVehicle())
                .cardNumber(request.getCardNumber())
                .entryTime(entryLog.getEntryTime())
                .exitTime(exitTime)
                .exitImageUrl(request.getImageUrl())
                .fee(fee)
                .notes(request.getNotes())
                .build();

        ParkingAccessLog savedExitLog = accessLogRepository.save(exitLog);

        String durationStr = formatDuration(duration);

        return ParkingAccessResponse.builder()
                .id(savedExitLog.getId())
                .licensePlate(savedExitLog.getLicensePlate())
                .vehicleType(savedExitLog.getVehicleType())
                .accessType(AccessType.EXIT)
                .subscriptionType(savedExitLog.getSubscriptionType())
                .fee(fee)
                .duration(durationStr)
                .timestamp(exitTime)
                .entryTime(entryLog.getEntryTime())
                .exitTime(exitTime)
                .message(message)
                .vehicle(entryLog.getVehicle() != null ? mapVehicleToResponse(entryLog.getVehicle()) : null)
                .exitImageUrl(savedExitLog.getExitImageUrl())
                .notes(savedExitLog.getNotes())
                .build();
    }

    /**
     * Check vehicle status
     */
    public VehicleCheckResponse checkVehicle(String licensePlate) {
        licensePlate = licensePlate.toUpperCase().trim();

        VehicleCheckResponse.VehicleCheckResponseBuilder builder = VehicleCheckResponse.builder()
                .licensePlate(licensePlate);

        // Check if registered
        Optional<Vehicle> vehicleOpt = vehicleRepository.findByLicensePlate(licensePlate);

        if (vehicleOpt.isEmpty()) {
            builder.isRegistered(false)
                    .subscriptionType(SubscriptionType.VISITOR)
                    .subscriptionStatus("NOT_REGISTERED");
        } else {
            Vehicle vehicle = vehicleOpt.get();
            builder.isRegistered(true)
                    .vehicleType(vehicle.getVehicleType());

            if (vehicle.getOwner() != null) {
                builder.ownerName(vehicle.getOwner().getName());
                if (vehicle.getOwner().getApartment() != null) {
                    builder.householdNumber(vehicle.getOwner().getApartment().getApartmentNumber());
                }
            }

            if (vehicle.getParkingCard() != null) {
                builder.cardNumber(vehicle.getParkingCard().getCardNumber());
            }

            // Check subscription
            Optional<ParkingSubscription> subscriptionOpt = subscriptionRepository.findByVehicle_Id(vehicle.getId());
            if (subscriptionOpt.isPresent()) {
                ParkingSubscription subscription = subscriptionOpt.get();
                builder.subscriptionType(subscription.getSubscriptionType());
                if (subscription.getEndDate() != null) {
                    builder.expiryDate(subscription.getEndDate().toString());
                }
                if (subscription.isValid()) {
                    builder.subscriptionStatus("ACTIVE");
                } else {
                    builder.subscriptionStatus("EXPIRED");
                }
            } else {
                builder.subscriptionType(SubscriptionType.VISITOR)
                        .subscriptionStatus("NO_SUBSCRIPTION");
            }
        }

        // Check if currently parked
        boolean isParked = accessLogRepository.findActiveEntryByLicensePlate(licensePlate).isPresent();
        builder.isCurrentlyParked(isParked);

        return builder.build();
    }

    /**
     * Get access logs with pagination and search
     */
    public Page<ParkingAccessResponse> getAccessLogs(String search, Pageable pageable) {
        return accessLogRepository.findAllWithSearch(search, pageable)
                .map(this::mapToAccessResponse);
    }

    /**
     * Get access logs by vehicle ID
     */
    public List<ParkingAccessResponse> getAccessLogsByVehicleId(Long vehicleId) {
        return accessLogRepository.findByVehicle_Id(vehicleId)
                .stream()
                .map(this::mapToAccessResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get today's logs
     */
    public List<ParkingAccessResponse> getTodayLogs() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return accessLogRepository.findTodayLogs(startOfDay, endOfDay)
                .stream()
                .map(this::mapToAccessResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get currently parked vehicles
     */
    public List<ParkingAccessResponse> getCurrentlyParked() {
        return accessLogRepository.findCurrentlyParked()
                .stream()
                .map(this::mapToAccessResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get daily statistics
     */
    public ParkingStatisticsResponse getDailyStatistics(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        // Count entries and exits
        long totalEntries = accessLogRepository.countByAccessTypeAndDateRange(AccessType.ENTRY, startOfDay, endOfDay);
        long totalExits = accessLogRepository.countByAccessTypeAndDateRange(AccessType.EXIT, startOfDay, endOfDay);
        long currentlyParked = accessLogRepository.findCurrentlyParked().size();

        // Revenue
        BigDecimal totalRevenue = accessLogRepository.sumFeeByDateRange(startOfDay, endOfDay);

        // By vehicle type
        Map<String, ParkingStatisticsResponse.AccessStats> byVehicleType = new HashMap<>();
        for (VehicleType type : VehicleType.values()) {
            long entries = accessLogRepository.countByVehicleTypeAndAccessType(type, AccessType.ENTRY, startOfDay, endOfDay);
            long exits = accessLogRepository.countByVehicleTypeAndAccessType(type, AccessType.EXIT, startOfDay, endOfDay);
            byVehicleType.put(type.name(), ParkingStatisticsResponse.AccessStats.builder()
                    .entries(entries)
                    .exits(exits)
                    .build());
        }

        // By subscription type
        Map<String, ParkingStatisticsResponse.AccessStats> bySubscriptionType = new HashMap<>();
        for (SubscriptionType type : SubscriptionType.values()) {
            long entries = accessLogRepository.countBySubscriptionTypeAndAccessType(type, AccessType.ENTRY, startOfDay, endOfDay);
            long exits = accessLogRepository.countBySubscriptionTypeAndAccessType(type, AccessType.EXIT, startOfDay, endOfDay);
            bySubscriptionType.put(type.name(), ParkingStatisticsResponse.AccessStats.builder()
                    .entries(entries)
                    .exits(exits)
                    .build());
        }

        return ParkingStatisticsResponse.builder()
                .date(date)
                .totalEntries(totalEntries)
                .totalExits(totalExits)
                .currentlyParked(currentlyParked)
                .revenue(ParkingStatisticsResponse.RevenueStats.builder()
                        .monthly(BigDecimal.ZERO)
                        .visitor(totalRevenue)
                        .total(totalRevenue)
                        .build())
                .byVehicleType(byVehicleType)
                .bySubscriptionType(bySubscriptionType)
                .build();
    }

    // Helper methods
    private BigDecimal calculateVisitorFee(VehicleType vehicleType, Duration duration) {
        Optional<ParkingPricing> pricingOpt = pricingRepository.findByVehicleType(vehicleType);

        if (pricingOpt.isEmpty()) {
            // Default pricing
            return vehicleType == VehicleType.CAR
                    ? BigDecimal.valueOf(20000) : BigDecimal.valueOf(5000);
        }

        ParkingPricing pricing = pricingOpt.get();
        long hours = duration.toHours();
        if (hours == 0) {
            hours = 1; // Minimum 1 hour
        }
        // If more than 24 hours, charge daily rate
        if (hours >= 24) {
            long days = hours / 24;
            long remainingHours = hours % 24;
            return pricing.getDailyFee().multiply(BigDecimal.valueOf(days))
                    .add(pricing.getHourlyFee().multiply(BigDecimal.valueOf(remainingHours)));
        }

        return pricing.getHourlyFee().multiply(BigDecimal.valueOf(hours));
    }

    private String formatDuration(Duration duration) {
        long hours = duration.toHours();
        long minutes = duration.toMinutesPart();
        if (hours > 0) {
            return String.format("%d giờ %d phút", hours, minutes);
        }
        return String.format("%d phút", minutes);
    }

    private ParkingAccessResponse mapToAccessResponse(ParkingAccessLog log) {
        return ParkingAccessResponse.builder()
                .id(log.getId())
                .licensePlate(log.getLicensePlate())
                .vehicleType(log.getVehicleType())
                .accessType(log.getAccessType())
                .subscriptionType(log.getSubscriptionType())
                .fee(log.getFee())
                .timestamp(log.getAccessType() == AccessType.ENTRY ? log.getEntryTime() : log.getExitTime())
                .entryTime(log.getEntryTime())
                .exitTime(log.getExitTime())
                .vehicle(log.getVehicle() != null ? mapVehicleToResponse(log.getVehicle()) : null)
                .entryImageUrl(log.getEntryImageUrl())
                .exitImageUrl(log.getExitImageUrl())
                .notes(log.getNotes())
                .build();
    }

    private VehicleResponse mapVehicleToResponse(Vehicle vehicle) {
        VehicleResponse.VehicleResponseBuilder builder = VehicleResponse.builder()
                .id(vehicle.getId())
                .licensePlate(vehicle.getLicensePlate())
                .vehicleType(vehicle.getVehicleType())
                .brand(vehicle.getBrand())
                .model(vehicle.getModel())
                .color(vehicle.getColor());

        if (vehicle.getOwner() != null) {
            builder.ownerId(vehicle.getOwner().getResidentid())
                    .ownerName(vehicle.getOwner().getName())
                    .ownerPhone(vehicle.getOwner().getPhonenumber());
            if (vehicle.getOwner().getApartment() != null) {
                builder.householdNumber(vehicle.getOwner().getApartment().getApartmentNumber());
            }
        }

        return builder.build();
    }
}

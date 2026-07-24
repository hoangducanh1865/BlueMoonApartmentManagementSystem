package com.example.demoapi.service;

import com.example.demoapi.dto.request.ParkingSubscriptionRequest;
import com.example.demoapi.dto.response.ParkingSubscriptionResponse;
import com.example.demoapi.entity.ParkingSubscription;
import com.example.demoapi.entity.SubscriptionType;
import com.example.demoapi.entity.Vehicle;
import com.example.demoapi.repository.ParkingSubscriptionRepository;
import com.example.demoapi.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingSubscriptionService {

    private final ParkingSubscriptionRepository subscriptionRepository;
    private final VehicleRepository vehicleRepository;

    public List<ParkingSubscriptionResponse> getAllSubscriptions() {
        return subscriptionRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ParkingSubscriptionResponse> getActiveSubscriptions() {
        return subscriptionRepository.findAllActiveWithDetails()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ParkingSubscriptionResponse getSubscriptionById(Long id) {
        ParkingSubscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vé với ID: " + id));
        return mapToResponse(subscription);
    }

    public ParkingSubscriptionResponse getSubscriptionByVehicleId(Long vehicleId) {
        ParkingSubscription subscription = subscriptionRepository.findByVehicle_Id(vehicleId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vé cho xe với ID: " + vehicleId));
        return mapToResponse(subscription);
    }

    public List<ParkingSubscriptionResponse> getExpiringSubscriptions(int daysAhead) {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(daysAhead);
        return subscriptionRepository.findExpiringSubscriptions(startDate, endDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ParkingSubscriptionResponse createSubscription(ParkingSubscriptionRequest request) {
        // Find vehicle
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe với ID: " + request.getVehicleId()));

        // Check if vehicle already has an active subscription
        if (subscriptionRepository.findByVehicle_Id(request.getVehicleId()).isPresent()) {
            throw new RuntimeException("Xe này đã có vé đăng ký. Vui lòng hủy vé cũ trước.");
        }

        // Calculate end date for monthly subscription
        LocalDate endDate = request.getEndDate();
        if (request.getSubscriptionType() == SubscriptionType.MONTHLY && endDate == null) {
            endDate = request.getStartDate().plusMonths(1);
        }

        ParkingSubscription subscription = ParkingSubscription.builder()
                .vehicle(vehicle)
                .subscriptionType(request.getSubscriptionType())
                .startDate(request.getStartDate())
                .endDate(endDate)
                .monthlyFee(request.getMonthlyFee())
                .isActive(true)
                .build();

        ParkingSubscription savedSubscription = subscriptionRepository.save(subscription);
        return mapToResponse(savedSubscription);
    }

    @Transactional
    public ParkingSubscriptionResponse updateSubscription(Long id, ParkingSubscriptionRequest request) {
        ParkingSubscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vé với ID: " + id));

        subscription.setSubscriptionType(request.getSubscriptionType());
        subscription.setStartDate(request.getStartDate());
        subscription.setEndDate(request.getEndDate());
        subscription.setMonthlyFee(request.getMonthlyFee());

        ParkingSubscription savedSubscription = subscriptionRepository.save(subscription);
        return mapToResponse(savedSubscription);
    }

    @Transactional
    public ParkingSubscriptionResponse renewSubscription(Long id, int months) {
        ParkingSubscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vé với ID: " + id));

        if (subscription.getSubscriptionType() != SubscriptionType.MONTHLY) {
            throw new RuntimeException("Chỉ có thể gia hạn vé tháng");
        }

        // Extend from current end date or from today if expired
        LocalDate currentEndDate = subscription.getEndDate();
        LocalDate newStartDate = currentEndDate.isBefore(LocalDate.now()) ? LocalDate.now() : currentEndDate;
        LocalDate newEndDate = newStartDate.plusMonths(months);

        subscription.setEndDate(newEndDate);
        subscription.setIsActive(true);

        ParkingSubscription savedSubscription = subscriptionRepository.save(subscription);
        return mapToResponse(savedSubscription);
    }

    @Transactional
    public void deleteSubscription(Long id) {
        ParkingSubscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vé với ID: " + id));
        subscriptionRepository.delete(subscription);
    }

    private ParkingSubscriptionResponse mapToResponse(ParkingSubscription subscription) {
        ParkingSubscriptionResponse.ParkingSubscriptionResponseBuilder builder = ParkingSubscriptionResponse.builder()
                .id(subscription.getId())
                .subscriptionType(subscription.getSubscriptionType())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .monthlyFee(subscription.getMonthlyFee())
                .isActive(subscription.getIsActive())
                .isValid(subscription.isValid())
                .createdAt(subscription.getCreatedAt())
                .updatedAt(subscription.getUpdatedAt());

        if (subscription.getVehicle() != null) {
            builder.vehicleId(subscription.getVehicle().getId())
                    .licensePlate(subscription.getVehicle().getLicensePlate())
                    .vehicleType(subscription.getVehicle().getVehicleType());

            if (subscription.getVehicle().getOwner() != null) {
                builder.ownerName(subscription.getVehicle().getOwner().getName());
                if (subscription.getVehicle().getOwner().getApartment() != null) {
                    builder.householdNumber(subscription.getVehicle().getOwner().getApartment().getApartmentNumber());
                }
            }
        }

        return builder.build();
    }
}

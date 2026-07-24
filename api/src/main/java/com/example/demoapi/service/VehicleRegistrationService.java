package com.example.demoapi.service;

import com.example.demoapi.dto.request.ApproveRegistrationRequest;
import com.example.demoapi.dto.request.RejectRegistrationRequest;
import com.example.demoapi.dto.request.VehicleRegistrationRequest;
import com.example.demoapi.dto.response.VehicleRegistrationResponse;
import com.example.demoapi.entity.*;
import com.example.demoapi.model.Resident;
import com.example.demoapi.model.UserAccount;
import com.example.demoapi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleRegistrationService {

    private final VehicleRegistrationRepository registrationRepository;
    private final VehicleRepository vehicleRepository;
    private final ParkingCardRepository parkingCardRepository;
    private final ParkingSubscriptionRepository subscriptionRepository;
    private final ParkingPricingRepository pricingRepository;
    private final ResidentRepository residentRepository;
    private final UserAccountRepository userAccountRepository;

    public Page<VehicleRegistrationResponse> getAllRegistrations(String search, Pageable pageable) {
        return registrationRepository.findAllWithSearch(search, pageable)
                .map(this::mapToResponse);
    }

    public VehicleRegistrationResponse getRegistrationById(Long id) {
        VehicleRegistration registration = registrationRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký với ID: " + id));
        return mapToResponse(registration);
    }

    public List<VehicleRegistrationResponse> getRegistrationsByResidentId(Integer residentId) {
        return registrationRepository.findByResident_Residentid(residentId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<VehicleRegistrationResponse> getRegistrationsByStatus(VehicleRegistrationStatus status) {
        return registrationRepository.findByStatus(status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<VehicleRegistrationResponse> getPendingRegistrations() {
        return registrationRepository.findPendingRegistrations()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VehicleRegistrationResponse createRegistration(VehicleRegistrationRequest request) {
        // Validate resident
        Resident resident = residentRepository.findById(request.getResidentId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cư dân với ID: " + request.getResidentId()));

        // Check if license plate is already registered or pending
        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new RuntimeException("Biển số xe đã được đăng ký trong hệ thống: " + request.getLicensePlate());
        }

        if (registrationRepository.existsByLicensePlateAndStatusNot(
                request.getLicensePlate(), VehicleRegistrationStatus.REJECTED)) {
            throw new RuntimeException("Đã có đăng ký đang chờ xử lý cho biển số này: " + request.getLicensePlate());
        }

        VehicleRegistration registration = VehicleRegistration.builder()
                .resident(resident)
                .vehicleType(request.getVehicleType())
                .licensePlate(request.getLicensePlate().toUpperCase().trim())
                .brand(request.getBrand())
                .model(request.getModel())
                .color(request.getColor())
                .subscriptionType(request.getSubscriptionType())
                .status(VehicleRegistrationStatus.PENDING)
                .build();

        VehicleRegistration savedRegistration = registrationRepository.save(registration);
        return mapToResponse(savedRegistration);
    }

    @Transactional
    public VehicleRegistrationResponse uploadDocuments(Long id,
            String idCardImageUrl,
            String vehicleRegistrationImageUrl,
            String vehicleImageUrl) {
        VehicleRegistration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký với ID: " + id));

        if (registration.getStatus() != VehicleRegistrationStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể cập nhật giấy tờ cho đăng ký đang chờ duyệt");
        }

        if (idCardImageUrl != null) {
            registration.setIdCardImageUrl(idCardImageUrl);
        }
        if (vehicleRegistrationImageUrl != null) {
            registration.setVehicleRegistrationImageUrl(vehicleRegistrationImageUrl);
        }
        if (vehicleImageUrl != null) {
            registration.setVehicleImageUrl(vehicleImageUrl);
        }

        VehicleRegistration savedRegistration = registrationRepository.save(registration);
        return mapToResponse(savedRegistration);
    }

    @Transactional
    public VehicleRegistrationResponse approveRegistration(Long id, ApproveRegistrationRequest request, Integer adminUserId) {
        VehicleRegistration registration = registrationRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký với ID: " + id));

        if (registration.getStatus() != VehicleRegistrationStatus.PENDING) {
            throw new RuntimeException("Đăng ký này đã được xử lý trước đó");
        }

        // Validate documents
        if (registration.getIdCardImageUrl() == null
                || registration.getVehicleRegistrationImageUrl() == null
                || registration.getVehicleImageUrl() == null) {
            throw new RuntimeException("Cư dân chưa upload đầy đủ giấy tờ");
        }

        // Check if card number exists
        if (parkingCardRepository.existsByCardNumber(request.getCardNumber())) {
            throw new RuntimeException("Số thẻ đã tồn tại: " + request.getCardNumber());
        }

        // Create Vehicle
        Vehicle vehicle = Vehicle.builder()
                .licensePlate(registration.getLicensePlate())
                .vehicleType(registration.getVehicleType())
                .brand(registration.getBrand())
                .model(registration.getModel())
                .color(registration.getColor())
                .owner(registration.getResident())
                .build();

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        // Create Parking Card
        ParkingCard parkingCard = ParkingCard.builder()
                .cardNumber(request.getCardNumber().toUpperCase().trim())
                .vehicle(savedVehicle)
                .isActive(true)
                .issuedAt(LocalDateTime.now())
                .build();

        ParkingCard savedCard = parkingCardRepository.save(parkingCard);

        // Create Subscription
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate endDate = startDate.plusMonths(1);

        // Get monthly fee from pricing
        BigDecimal monthlyFee = pricingRepository.findByVehicleType(registration.getVehicleType())
                .map(ParkingPricing::getMonthlyFee)
                .orElse(registration.getVehicleType() == VehicleType.CAR
                        ? BigDecimal.valueOf(1500000) : BigDecimal.valueOf(100000));

        ParkingSubscription subscription = ParkingSubscription.builder()
                .vehicle(savedVehicle)
                .subscriptionType(registration.getSubscriptionType())
                .startDate(startDate)
                .endDate(endDate)
                .monthlyFee(monthlyFee)
                .isActive(true)
                .build();

        subscriptionRepository.save(subscription);

        // Update registration
        Optional<UserAccount> adminOpt = userAccountRepository.findById(adminUserId);
        registration.setStatus(VehicleRegistrationStatus.APPROVED);
        registration.setVehicle(savedVehicle);
        registration.setParkingCard(savedCard);
        registration.setReviewedAt(LocalDateTime.now());
        registration.setAdminNotes(request.getAdminNotes());
        adminOpt.ifPresent(registration::setReviewedBy);

        VehicleRegistration savedRegistration = registrationRepository.save(registration);
        return mapToResponse(savedRegistration);
    }

    @Transactional
    public VehicleRegistrationResponse rejectRegistration(Long id, RejectRegistrationRequest request, Integer adminUserId) {
        VehicleRegistration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký với ID: " + id));

        if (registration.getStatus() != VehicleRegistrationStatus.PENDING) {
            throw new RuntimeException("Đăng ký này đã được xử lý trước đó");
        }

        Optional<UserAccount> adminOpt = userAccountRepository.findById(adminUserId);
        registration.setStatus(VehicleRegistrationStatus.REJECTED);
        registration.setRejectionReason(request.getRejectionReason());
        registration.setReviewedAt(LocalDateTime.now());
        adminOpt.ifPresent(registration::setReviewedBy);

        VehicleRegistration savedRegistration = registrationRepository.save(registration);
        return mapToResponse(savedRegistration);
    }

    @Transactional
    public void deleteRegistration(Long id) {
        VehicleRegistration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký với ID: " + id));

        if (registration.getStatus() == VehicleRegistrationStatus.APPROVED) {
            throw new RuntimeException("Không thể xóa đăng ký đã được duyệt");
        }

        registrationRepository.delete(registration);
    }

    private VehicleRegistrationResponse mapToResponse(VehicleRegistration registration) {
        VehicleRegistrationResponse.VehicleRegistrationResponseBuilder builder = VehicleRegistrationResponse.builder()
                .id(registration.getId())
                .vehicleType(registration.getVehicleType())
                .licensePlate(registration.getLicensePlate())
                .brand(registration.getBrand())
                .model(registration.getModel())
                .color(registration.getColor())
                .subscriptionType(registration.getSubscriptionType())
                .status(registration.getStatus())
                .idCardImageUrl(registration.getIdCardImageUrl())
                .vehicleRegistrationImageUrl(registration.getVehicleRegistrationImageUrl())
                .vehicleImageUrl(registration.getVehicleImageUrl())
                .reviewedAt(registration.getReviewedAt())
                .rejectionReason(registration.getRejectionReason())
                .adminNotes(registration.getAdminNotes())
                .createdAt(registration.getCreatedAt())
                .updatedAt(registration.getUpdatedAt());

        if (registration.getResident() != null) {
            builder.residentId(registration.getResident().getResidentid())
                    .residentName(registration.getResident().getName())
                    .residentPhone(registration.getResident().getPhonenumber());
            if (registration.getResident().getApartment() != null) {
                builder.householdNumber(registration.getResident().getApartment().getApartmentNumber());
            }
        }

        if (registration.getReviewedBy() != null) {
            builder.reviewedByName(registration.getReviewedBy().getEmail());
        }

        if (registration.getVehicle() != null) {
            builder.vehicleId(registration.getVehicle().getId());
        }

        if (registration.getParkingCard() != null) {
            builder.cardNumber(registration.getParkingCard().getCardNumber());
        }

        return builder.build();
    }
}

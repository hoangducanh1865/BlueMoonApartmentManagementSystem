package com.example.demoapi.service;

import com.example.demoapi.dto.request.VehicleRequest;
import com.example.demoapi.dto.response.VehicleResponse;
import com.example.demoapi.entity.Vehicle;
import com.example.demoapi.model.Resident;
import com.example.demoapi.repository.ResidentRepository;
import com.example.demoapi.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final ResidentRepository residentRepository;

    public Page<VehicleResponse> getAllVehicles(String search, Pageable pageable) {
        return vehicleRepository.findAllWithSearch(search, pageable)
                .map(this::mapToResponse);
    }

    public VehicleResponse getVehicleById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe với ID: " + id));
        return mapToResponse(vehicle);
    }

    public VehicleResponse getVehicleByLicensePlate(String licensePlate) {
        Vehicle vehicle = vehicleRepository.findByLicensePlate(licensePlate)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe với biển số: " + licensePlate));
        return mapToResponse(vehicle);
    }

    public List<VehicleResponse> getVehiclesByResidentId(Integer residentId) {
        return vehicleRepository.findByOwner_Residentid(residentId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<VehicleResponse> getVehiclesByHouseholdId(Integer householdId) {
        return vehicleRepository.findByHouseholdId(householdId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VehicleResponse createVehicle(VehicleRequest request) {
        // Check if license plate already exists
        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new RuntimeException("Biển số xe đã tồn tại trong hệ thống: " + request.getLicensePlate());
        }

        // Find owner
        Resident owner = residentRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cư dân với ID: " + request.getOwnerId()));

        Vehicle vehicle = Vehicle.builder()
                .licensePlate(request.getLicensePlate().toUpperCase().trim())
                .vehicleType(request.getVehicleType())
                .brand(request.getBrand())
                .model(request.getModel())
                .color(request.getColor())
                .owner(owner)
                .build();

        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return mapToResponse(savedVehicle);
    }

    @Transactional
    public VehicleResponse updateVehicle(Long id, VehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe với ID: " + id));

        // Check if new license plate already exists (for different vehicle)
        if (!vehicle.getLicensePlate().equals(request.getLicensePlate())
                && vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new RuntimeException("Biển số xe đã tồn tại trong hệ thống: " + request.getLicensePlate());
        }

        // Update owner if changed
        if (!vehicle.getOwner().getResidentid().equals(request.getOwnerId())) {
            Resident newOwner = residentRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy cư dân với ID: " + request.getOwnerId()));
            vehicle.setOwner(newOwner);
        }

        vehicle.setLicensePlate(request.getLicensePlate().toUpperCase().trim());
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());
        vehicle.setColor(request.getColor());

        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return mapToResponse(savedVehicle);
    }

    @Transactional
    public void deleteVehicle(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe với ID: " + id));
        vehicleRepository.delete(vehicle);
    }

    private VehicleResponse mapToResponse(Vehicle vehicle) {
        VehicleResponse.VehicleResponseBuilder builder = VehicleResponse.builder()
                .id(vehicle.getId())
                .licensePlate(vehicle.getLicensePlate())
                .vehicleType(vehicle.getVehicleType())
                .brand(vehicle.getBrand())
                .model(vehicle.getModel())
                .color(vehicle.getColor())
                .createdAt(vehicle.getCreatedAt())
                .updatedAt(vehicle.getUpdatedAt());

        // Owner info
        if (vehicle.getOwner() != null) {
            builder.ownerId(vehicle.getOwner().getResidentid())
                    .ownerName(vehicle.getOwner().getName())
                    .ownerPhone(vehicle.getOwner().getPhonenumber());
            if (vehicle.getOwner().getApartment() != null) {
                builder.householdNumber(vehicle.getOwner().getApartment().getApartmentNumber());
            }
        }

        // Subscription info
        if (vehicle.getSubscription() != null) {
            builder.subscriptionType(vehicle.getSubscription().getSubscriptionType())
                    .subscriptionActive(vehicle.getSubscription().getIsActive())
                    .subscriptionEndDate(vehicle.getSubscription().getEndDate());
        }

        // Card info
        if (vehicle.getParkingCard() != null) {
            builder.cardNumber(vehicle.getParkingCard().getCardNumber())
                    .cardActive(vehicle.getParkingCard().getIsActive());
        }

        return builder.build();
    }
}

package com.example.demoapi.service;

import com.example.demoapi.dto.request.ParkingCardRequest;
import com.example.demoapi.dto.response.ParkingCardResponse;
import com.example.demoapi.entity.ParkingCard;
import com.example.demoapi.entity.Vehicle;
import com.example.demoapi.repository.ParkingCardRepository;
import com.example.demoapi.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingCardService {

    private final ParkingCardRepository parkingCardRepository;
    private final VehicleRepository vehicleRepository;

    public List<ParkingCardResponse> getAllCards() {
        return parkingCardRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ParkingCardResponse> getActiveCards() {
        return parkingCardRepository.findAllActiveWithDetails()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ParkingCardResponse getCardById(Long id) {
        ParkingCard card = parkingCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thẻ với ID: " + id));
        return mapToResponse(card);
    }

    public ParkingCardResponse getCardByCardNumber(String cardNumber) {
        ParkingCard card = parkingCardRepository.findByCardNumberWithVehicle(cardNumber)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thẻ với số: " + cardNumber));
        return mapToResponse(card);
    }

    @Transactional
    public ParkingCardResponse createCard(ParkingCardRequest request) {
        // Check if card number already exists
        if (parkingCardRepository.existsByCardNumber(request.getCardNumber())) {
            throw new RuntimeException("Số thẻ đã tồn tại: " + request.getCardNumber());
        }

        // Find vehicle
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe với ID: " + request.getVehicleId()));

        // Check if vehicle already has a card
        if (parkingCardRepository.findByVehicle_Id(request.getVehicleId()).isPresent()) {
            throw new RuntimeException("Xe này đã được cấp thẻ. Vui lòng vô hiệu hóa thẻ cũ trước.");
        }

        ParkingCard card = ParkingCard.builder()
                .cardNumber(request.getCardNumber().toUpperCase().trim())
                .vehicle(vehicle)
                .isActive(true)
                .issuedAt(LocalDateTime.now())
                .build();

        ParkingCard savedCard = parkingCardRepository.save(card);
        return mapToResponse(savedCard);
    }

    @Transactional
    public ParkingCardResponse updateCard(Long id, ParkingCardRequest request) {
        ParkingCard card = parkingCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thẻ với ID: " + id));

        // Check if new card number already exists (for different card)
        if (!card.getCardNumber().equals(request.getCardNumber())
                && parkingCardRepository.existsByCardNumber(request.getCardNumber())) {
            throw new RuntimeException("Số thẻ đã tồn tại: " + request.getCardNumber());
        }

        card.setCardNumber(request.getCardNumber().toUpperCase().trim());

        ParkingCard savedCard = parkingCardRepository.save(card);
        return mapToResponse(savedCard);
    }

    @Transactional
    public ParkingCardResponse deactivateCard(Long id) {
        ParkingCard card = parkingCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thẻ với ID: " + id));

        card.setIsActive(false);
        card.setDeactivatedAt(LocalDateTime.now());

        ParkingCard savedCard = parkingCardRepository.save(card);
        return mapToResponse(savedCard);
    }

    @Transactional
    public ParkingCardResponse activateCard(Long id) {
        ParkingCard card = parkingCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thẻ với ID: " + id));

        card.setIsActive(true);
        card.setDeactivatedAt(null);

        ParkingCard savedCard = parkingCardRepository.save(card);
        return mapToResponse(savedCard);
    }

    @Transactional
    public void deleteCard(Long id) {
        ParkingCard card = parkingCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thẻ với ID: " + id));
        parkingCardRepository.delete(card);
    }

    private ParkingCardResponse mapToResponse(ParkingCard card) {
        ParkingCardResponse.ParkingCardResponseBuilder builder = ParkingCardResponse.builder()
                .id(card.getId())
                .cardNumber(card.getCardNumber())
                .isActive(card.getIsActive())
                .issuedAt(card.getIssuedAt())
                .deactivatedAt(card.getDeactivatedAt())
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt());

        if (card.getVehicle() != null) {
            builder.vehicleId(card.getVehicle().getId())
                    .licensePlate(card.getVehicle().getLicensePlate())
                    .vehicleType(card.getVehicle().getVehicleType().name());

            if (card.getVehicle().getOwner() != null) {
                builder.ownerName(card.getVehicle().getOwner().getName());
                if (card.getVehicle().getOwner().getApartment() != null) {
                    builder.householdNumber(card.getVehicle().getOwner().getApartment().getApartmentNumber());
                }
            }
        }

        return builder.build();
    }
}

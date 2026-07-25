package com.example.demoapi.service;

import com.example.demoapi.dto.request.CreateResidentRegistrationCodeRequest;
import com.example.demoapi.dto.response.ResidentRegistrationCodeResponse;
import com.example.demoapi.model.Resident;
import com.example.demoapi.model.ResidentRegistrationCode;
import com.example.demoapi.repository.ResidentRegistrationCodeRepository;
import com.example.demoapi.repository.ResidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResidentRegistrationCodeService {
    private static final int CODE_BYTES = 24;

    private final ResidentRegistrationCodeRepository codeRepository;
    private final ResidentRepository residentRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public ResidentRegistrationCodeResponse createCode(CreateResidentRegistrationCodeRequest request, String createdBy) {
        Resident resident = residentRepository.findById(request.getResidentId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cư dân với mã: " + request.getResidentId()));

        int ttlHours = request.getTtlHours() == null ? 4 : request.getTtlHours();
        Instant now = Instant.now();

        ResidentRegistrationCode registrationCode = new ResidentRegistrationCode();
        registrationCode.setResident(resident);
        registrationCode.setCode(generateUniqueCode());
        registrationCode.setCreatedAt(now);
        registrationCode.setExpiresAt(now.plusSeconds(ttlHours * 3600L));
        registrationCode.setCreatedBy(createdBy);

        return mapToResponse(codeRepository.save(registrationCode));
    }

    public List<ResidentRegistrationCodeResponse> getRecentCodes() {
        return codeRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public ResidentRegistrationCode getUsableCode(String rawCode) {
        String normalizedCode = normalizeCode(rawCode);
        ResidentRegistrationCode registrationCode = codeRepository.findByCode(normalizedCode)
                .orElseThrow(() -> new RuntimeException("Mã đăng ký không hợp lệ"));

        if (registrationCode.getUsedAt() != null) {
            throw new RuntimeException("Mã đăng ký đã được sử dụng");
        }

        if (registrationCode.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Mã đăng ký đã hết hạn");
        }

        return registrationCode;
    }

    public void markCodeUsed(ResidentRegistrationCode registrationCode) {
        registrationCode.setUsedAt(Instant.now());
        codeRepository.save(registrationCode);
    }

    private String generateUniqueCode() {
        String code;
        do {
            byte[] bytes = new byte[CODE_BYTES];
            secureRandom.nextBytes(bytes);
            code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        } while (codeRepository.existsByCode(code));
        return code;
    }

    private String normalizeCode(String rawCode) {
        if (rawCode == null || rawCode.trim().isEmpty()) {
            throw new RuntimeException("Mã đăng ký không được để trống");
        }
        return rawCode.trim();
    }

    private ResidentRegistrationCodeResponse mapToResponse(ResidentRegistrationCode code) {
        Instant now = Instant.now();
        boolean expired = code.getExpiresAt().isBefore(now);
        boolean active = code.getUsedAt() == null && !expired;
        Resident resident = code.getResident();

        return ResidentRegistrationCodeResponse.builder()
                .id(code.getId())
                .code(code.getCode())
                .residentId(resident.getResidentid())
                .residentCode(resident.getResidentCode())
                .residentName(resident.getName())
                .residentPhone(resident.getPhonenumber())
                .residentEmail(resident.getEmail())
                .expiresAt(code.getExpiresAt())
                .createdAt(code.getCreatedAt())
                .usedAt(code.getUsedAt())
                .expired(expired)
                .active(active)
                .build();
    }
}

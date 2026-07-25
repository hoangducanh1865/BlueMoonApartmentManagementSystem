package com.example.demoapi.controller;

import com.example.demoapi.dto.request.CreateResidentRegistrationCodeRequest;
import com.example.demoapi.dto.response.ResidentRegistrationCodeResponse;
import com.example.demoapi.service.ResidentRegistrationCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resident-registration-codes")
@RequiredArgsConstructor
public class ResidentRegistrationCodeController {
    private final ResidentRegistrationCodeService codeService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<ResidentRegistrationCodeResponse>> getRecentCodes() {
        return ResponseEntity.ok(codeService.getRecentCodes());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ResidentRegistrationCodeResponse> createCode(
            @Valid @RequestBody CreateResidentRegistrationCodeRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(codeService.createCode(request, authentication.getName()));
    }
}

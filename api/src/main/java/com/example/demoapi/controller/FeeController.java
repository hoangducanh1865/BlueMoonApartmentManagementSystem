package com.example.demoapi.controller;

import com.example.demoapi.dto.request.FeeRequest;
import com.example.demoapi.model.Fee;
import com.example.demoapi.repository.FeeRepository;
import com.example.demoapi.service.FeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fees")
@RequiredArgsConstructor
public class FeeController {

    private final FeeService feeService;
    private final FeeRepository feeRepository;
    // Endpoint: POST /api/fees
    // Chỉ Admin mới được tạo phí
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> createFee(@Valid @RequestBody FeeRequest request) {
        try {
            Fee newFee = feeService.createFee(request);
            return ResponseEntity.ok(newFee);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API xem danh sách phí để test
    @GetMapping
    public ResponseEntity<List<Fee>> getAllFees() {
         return ResponseEntity.ok(feeRepository.findAll());
    }

    // Sửa phí (Admin)
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> updateFee(@PathVariable Integer id, @Valid @RequestBody FeeRequest request) {
        try {
            Fee updatedFee = feeService.updateFee(id, request);
            return ResponseEntity.ok(updatedFee);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Xóa phí (Admin)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> deleteFee(@PathVariable Integer id) {
        try {
            feeService.deleteFee(id);
            return ResponseEntity.ok("Đã xóa loại phí thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
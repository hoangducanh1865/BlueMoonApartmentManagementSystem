package com.example.demoapi.controller;

import com.example.demoapi.dto.response.ResidentResponse;
import com.example.demoapi.service.HouseholdService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/residents") // Endpoint gốc mới
@RequiredArgsConstructor
public class ResidentController {

    private final HouseholdService householdService; // Hoặc ResidentService nếu bạn đã tách

    // Endpoint: GET /api/residents
    // Params: ?page=0&size=10&search=Nguyen
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") // Chỉ Admin được xem danh sách tổng
    public ResponseEntity<Page<ResidentResponse>> getAllResidents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "residentid") String sortBy,
            @RequestParam(defaultValue = "desc") String order
    ) {
        // Tạo đối tượng Pageable (Spring Data)
        Sort.Direction direction = order.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<ResidentResponse> result = householdService.getAllResidents(search, pageable);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") // Chỉ Admin được xóa
    public ResponseEntity<?> deleteResident(@PathVariable Integer id) {
        try {
            householdService.deleteResident(id);
            return ResponseEntity.ok("Đã xóa cư dân thành công.");
        } catch (RuntimeException e) {
            // Trả về lỗi 400 nếu vi phạm logic nợ nần
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
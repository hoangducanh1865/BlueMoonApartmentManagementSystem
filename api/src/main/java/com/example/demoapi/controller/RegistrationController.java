package com.example.demoapi.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demoapi.dto.request.ApprovalRequest;
import com.example.demoapi.dto.request.RegistrationRequest;
import com.example.demoapi.dto.response.RegistrationResponse;
import com.example.demoapi.model.RegistrationStatus;
import com.example.demoapi.model.RegistrationType;
import com.example.demoapi.model.UserAccount;
import com.example.demoapi.repository.UserAccountRepository;
import com.example.demoapi.service.RegistrationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;
    private final UserAccountRepository userAccountRepository;

    // Gửi yêu cầu (Cư dân/Admin)
    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody RegistrationRequest request) {
        return ResponseEntity.ok(registrationService.createRequest(request));
    }

    // Duyệt yêu cầu (Chỉ Admin)
    @PutMapping("/{id}/approval")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") // Chỉ Admin được gọi
    public ResponseEntity<?> approveRequest(
            @PathVariable Integer id,
            @RequestBody ApprovalRequest request
    ) {
        try {
            registrationService.approveRequest(id, request.getIsApproved(), request.getAdminNote());

            String message = request.getIsApproved() ? "Đã DUYỆT đơn đăng ký thành công." : "Đã TỪ CHỐI đơn đăng ký.";
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Lấy danh sách (Có thể filter theo param)
    @GetMapping
    public ResponseEntity<Page<RegistrationResponse>> getList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) RegistrationStatus status, // Tự động convert string "PENDING" sang Enum
            @RequestParam(required = false) RegistrationType type,
            @RequestParam(required = false) Integer houseId // Admin có thể lọc theo nhà
    ) {
        // 1. Lấy thông tin người đang đăng nhập
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Integer filterHouseId = houseId;

        // 2. Phân quyền: Nếu không phải Admin -> Bắt buộc chỉ xem nhà mình
        if (!isAdmin) {
            String email = auth.getName();
            UserAccount user = userAccountRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getResident() == null || user.getResident().getApartment() == null) {
                return ResponseEntity.ok(Page.empty());
            }

            // Ép buộc filter theo ID nhà của user
            filterHouseId = user.getResident().getApartment().getHouseid();
        }

        // 3. Gọi Service
        // Sắp xếp: Mới nhất lên đầu (giảm dần theo ID)
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Page<RegistrationResponse> result = registrationService.getAllRequests(filterHouseId, status, type, pageable);

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRequest(@PathVariable Integer id, @RequestBody RegistrationRequest request) {
        try {
            return ResponseEntity.ok(registrationService.updateRequest(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Xóa đơn đăng ký (Hủy yêu cầu)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable Integer id) {
        try {
            registrationService.deleteRequest(id);
            return ResponseEntity.ok("Đã xóa yêu cầu đăng ký thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

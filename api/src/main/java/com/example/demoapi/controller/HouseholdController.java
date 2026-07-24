package com.example.demoapi.controller;

import com.example.demoapi.dto.request.HouseholdRequest;
import com.example.demoapi.dto.request.MemberRequest;
import com.example.demoapi.dto.request.UpdateMemberRequest;
import com.example.demoapi.dto.response.HouseholdResponse;
import com.example.demoapi.dto.response.ResidentResponse;
import com.example.demoapi.model.UserAccount;
import com.example.demoapi.repository.UserAccountRepository;
import com.example.demoapi.service.HouseholdService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/households") // Endpoint gốc
@RequiredArgsConstructor
public class HouseholdController {

    private final HouseholdService householdService;
    private final UserAccountRepository userAccountRepository;

    // Endpoint: GET /api/households?search=...
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<HouseholdResponse>> getHouseholds(
            @RequestParam(required = false) String search
    ) {
        List<HouseholdResponse> result = householdService.getHouseholds(search);
        return ResponseEntity.ok(result);
    }

    // Endpoint: GET /api/households/{id}
    @GetMapping("/{id}")
    public ResponseEntity<HouseholdResponse> getHouseholdDetail(@PathVariable Integer id) {

        // 1. Lấy thông tin người đang đăng nhập từ Security Context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName(); // Email user đang đăng nhập

        // 2. Kiểm tra quyền hạn
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            // A. Nếu là ADMIN: Cho phép xem mọi ID
            return ResponseEntity.ok(householdService.getHouseholdById(id));
        } else {
            // B. Nếu là RESIDENT: Phải kiểm tra xem ID này có phải nhà của họ không
            UserAccount currentUser = userAccountRepository.findByEmail(currentEmail)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

            // Lấy houseId của user hiện tại
            Integer myHouseId = null;
            if (currentUser.getResident() != null && currentUser.getResident().getApartment() != null) {
                myHouseId = currentUser.getResident().getApartment().getHouseid();
            }

            // So sánh ID yêu cầu (id) vs ID nhà mình (myHouseId)
            if (myHouseId != null && myHouseId.equals(id)) {
                return ResponseEntity.ok(householdService.getHouseholdById(id));
            } else {
                // Nếu không khớp -> Chặn (403 Forbidden)
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem thông tin hộ khác!");
            }
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") // Chỉ Admin được thêm nhà
    public ResponseEntity<HouseholdResponse> createHousehold(@RequestBody HouseholdRequest request) {
        HouseholdResponse newHousehold = householdService.createHousehold(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(newHousehold);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") // Chỉ Admin được sửa
    public ResponseEntity<HouseholdResponse> updateHousehold(
            @PathVariable Integer id,
            @RequestBody HouseholdRequest request
    ) {
        HouseholdResponse updatedHousehold = householdService.updateHousehold(id, request);
        return ResponseEntity.ok(updatedHousehold);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> deleteHousehold(@PathVariable Integer id) {
        try {
            householdService.deleteHousehold(id);
            return ResponseEntity.ok("Đã xóa hộ khẩu và các dữ liệu liên quan thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<ResidentResponse>> getHouseholdMembers(@PathVariable Integer id) {

        // 1. Lấy thông tin người đang đăng nhập
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = authentication.getName();

        // 2. Kiểm tra quyền Admin
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            // Admin được xem hết
            return ResponseEntity.ok(householdService.getHouseholdMembers(id));
        } else {
            // 3. Nếu là Resident: Kiểm tra xem có đúng nhà mình không
            UserAccount currentUser = userAccountRepository.findByEmail(currentEmail)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

            // Lấy ID nhà của user hiện tại
            Integer myHouseId = null;
            if (currentUser.getResident() != null && currentUser.getResident().getApartment() != null) {
                myHouseId = currentUser.getResident().getApartment().getHouseid();
            }

            // So sánh
            if (myHouseId != null && myHouseId.equals(id)) {
                return ResponseEntity.ok(householdService.getHouseholdMembers(id));
            } else {
                // Nếu id trên URL khác id nhà mình -> CHẶN
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chỉ được xem thành viên của hộ gia đình mình!");
            }
        }
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") // Chỉ Admin được thêm người
    public ResponseEntity<ResidentResponse> addMember(
            @PathVariable Integer id,
            @RequestBody MemberRequest request
    ) {
        ResidentResponse response = householdService.addMemberToHousehold(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/members/{memberId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") // Chỉ Admin được sửa
    public ResponseEntity<ResidentResponse> updateMember(
            @PathVariable Integer memberId,
            @RequestBody UpdateMemberRequest request
    ) {
        ResidentResponse response = householdService.updateMember(memberId, request);
        return ResponseEntity.ok(response);
    }
}
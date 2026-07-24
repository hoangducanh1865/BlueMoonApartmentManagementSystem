package com.example.demoapi.controller;

import com.example.demoapi.dto.request.CreateInvoiceRequest;
import com.example.demoapi.dto.response.InvoiceResponse;
import com.example.demoapi.model.UserAccount;
import com.example.demoapi.repository.InvoiceRepository;
import com.example.demoapi.repository.UserAccountRepository;
import com.example.demoapi.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;
    private final UserAccountRepository userAccountRepository;

    // 1. Tạo hóa đơn (Admin only)
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        return ResponseEntity.ok(invoiceService.createInvoice(request));
    }

    // 2. Xem chi tiết hóa đơn (Ai cũng xem được nếu có ID - Cần bảo mật thêm sau này)
    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }


    @PutMapping("/details/{detailId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> updateDetail(@PathVariable Integer detailId, @RequestParam Double quantity) {
        invoiceService.updateInvoiceDetail(detailId, quantity);
        return ResponseEntity.ok("Cập nhật thành công");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> deleteInvoice(@PathVariable Integer id) {
        try {
            invoiceService.deleteInvoice(id);
            return ResponseEntity.ok("Đã xóa hóa đơn thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. Cập nhật ngày hết hạn (Admin only)
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<InvoiceResponse> updateInvoice(
            @PathVariable Integer id,
            @RequestParam LocalDate dueDate // Truyền ?dueDate=2025-12-31
    ) {
        return ResponseEntity.ok(invoiceService.updateInvoiceInfo(id, dueDate));
    }

    // 3. Xóa một dòng phí trong hóa đơn (Admin only)
    @DeleteMapping("/details/{detailId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> deleteInvoiceDetail(@PathVariable Integer detailId) {
        try {
            invoiceService.deleteInvoiceDetail(detailId);
            return ResponseEntity.ok("Đã xóa khoản phí khỏi hóa đơn và cập nhật lại tổng tiền.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<Page<InvoiceResponse>> getAllInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword, // Tìm theo số phòng
            @RequestParam(required = false) String status,  // unpaid, paid
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer houseId // Admin có thể lọc theo nhà cụ thể
    ) {
        // 1. Lấy User hiện tại
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Integer filterHouseId = houseId;

        // 2. Logic phân quyền dữ liệu
        if (!isAdmin) {
            // Nếu là Cư dân -> Tìm nhà của họ và ÉP BUỘC lọc theo nhà đó
            String email = auth.getName();
            UserAccount user = userAccountRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getResident() == null || user.getResident().getApartment() == null) {
                // Trường hợp user chưa được gán vào căn hộ nào -> Trả về danh sách rỗng
                return ResponseEntity.ok(Page.empty());
            }

            // Gán cứng ID nhà của user đang login
            filterHouseId = user.getResident().getApartment().getHouseid();
        }

        // 3. Gọi Service
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "year", "month")); // Mới nhất lên đầu
        Page<InvoiceResponse> result = invoiceService.getAllInvoices(filterHouseId, month, year, status, keyword, pageable);

        return ResponseEntity.ok(result);
    }

}
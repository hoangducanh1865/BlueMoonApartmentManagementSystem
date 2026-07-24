package com.example.demoapi.service;

import com.example.demoapi.dto.request.FeeRequest;
import com.example.demoapi.model.Fee;
import com.example.demoapi.repository.FeeRepository;
import com.example.demoapi.repository.InvoiceDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeeService {

    private final FeeRepository feeRepository;
    private final InvoiceDetailRepository invoiceDetailRepository;

    @Transactional
    public Fee createFee(FeeRequest request) {
        // 1. Validate trùng tên
        if (feeRepository.existsByFeename(request.getFeeName())) {
            throw new RuntimeException("Loại phí '" + request.getFeeName() + "' đã tồn tại!");
        }

        // 2. Map DTO -> Entity
        Fee fee = new Fee();
        fee.setFeename(request.getFeeName());
        fee.setDescription(request.getDescription());
        fee.setUnitprice(request.getUnitPrice());
        fee.setUnit(request.getUnit());
        fee.setBillingcycle(request.getBillingCycle());
        fee.set_mandatory(request.getIsMandatory()); // Lưu ý: Getter/Setter của boolean trong Lombok có thể là setIsMandatory hoặc set_mandatory tùy config

        // 3. Lưu
        return feeRepository.save(fee);
    }

    // --- 1. SỬA KHOẢN PHÍ ---
    @Transactional
    public Fee updateFee(Integer id, FeeRequest request) {
        // Tìm phí cũ
        Fee fee = feeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loại phí không tồn tại"));

        // Validate: Tên mới có bị trùng với loại phí KHÁC không?
        if (feeRepository.existsByFeenameAndIdNot(request.getFeeName(), id)) {
            throw new RuntimeException("Tên phí '" + request.getFeeName() + "' đã được sử dụng bởi loại phí khác!");
        }

        // Cập nhật thông tin
        fee.setFeename(request.getFeeName());
        fee.setDescription(request.getDescription());
        fee.setUnitprice(request.getUnitPrice()); // Giá mới sẽ áp dụng cho hóa đơn tương lai
        fee.setUnit(request.getUnit());
        fee.setBillingcycle(request.getBillingCycle());
        fee.set_mandatory(request.getIsMandatory());

        return feeRepository.save(fee);
    }

    // --- 2. XÓA KHOẢN PHÍ ---
    @Transactional
    public void deleteFee(Integer id) {
        Fee fee = feeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loại phí không tồn tại"));

        // CHECK QUAN TRỌNG: Phí này đã từng thu chưa?
        if (invoiceDetailRepository.existsByFeeid_Id(id)) {
            // Nếu đã dùng -> Không cho xóa -> Gợi ý Admin đổi tên thành "Ngừng thu" hoặc thêm cột Active
            throw new RuntimeException("Không thể xóa loại phí này vì đã có hóa đơn sử dụng nó. Hãy đổi tên hoặc tắt trạng thái hoạt động thay vì xóa!");
        }

        feeRepository.delete(fee);
    }
}
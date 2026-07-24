package com.example.demoapi.service;

import com.example.demoapi.dto.request.CreateInvoiceRequest;
import com.example.demoapi.dto.request.FeeItemRequest;
import com.example.demoapi.dto.response.InvoiceDetailResponse;
import com.example.demoapi.dto.response.InvoiceResponse;
import com.example.demoapi.model.*;
import com.example.demoapi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceDetailRepository invoiceDetailRepository; // Đổi tên repo của bạn cho khớp
    private final FeeRepository feeRepository;
    private final ApartmentRepository apartmentRepository;
    private final PaymentRepository paymentRepository;

    // 1. TẠO HÓA ĐƠN MỚI
    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        // Check trùng
        if (invoiceRepository.existsByHouseid_HouseidAndMonthAndYear(
                request.getHouseId(), request.getMonth(), request.getYear())) {
            throw new RuntimeException("Hóa đơn tháng " + request.getMonth() + "/" + request.getYear() + " của căn hộ này đã tồn tại!");
        }

        Apartment apartment = apartmentRepository.findById(request.getHouseId())
                .orElseThrow(() -> new RuntimeException("Căn hộ không tồn tại"));

        // Tạo Invoice Master
        Invoice invoice = new Invoice();
        invoice.setHouseid(apartment);
        invoice.setMonth(request.getMonth());
        invoice.setYear(request.getYear());
        invoice.setDuedate(request.getDueDate());
        invoice.setStatus("unpaid");
        invoice.setTotalamount(BigDecimal.ZERO); // Tạm thời 0

        Invoice savedInvoice = invoiceRepository.save(invoice);

        BigDecimal grandTotal = BigDecimal.ZERO;

        // Tạo các InvoiceDetail
        List<Invoicedetail> detailsEntities = new ArrayList<>();
        if (request.getItems() != null) {
            for (FeeItemRequest item : request.getItems()) {
                Fee fee = feeRepository.findById(item.getFeeId())
                        .orElseThrow(() -> new RuntimeException("Phí ID " + item.getFeeId() + " không tồn tại"));

                BigDecimal amount = fee.getUnitprice().multiply(BigDecimal.valueOf(item.getQuantity()));

                Invoicedetail detail = new Invoicedetail();
                detail.setInvoiceid(savedInvoice);
                detail.setFeeid(fee);
                detail.setQuantity(item.getQuantity());
                detail.setAmount(amount);

                invoiceDetailRepository.save(detail);
                detailsEntities.add(detail);

                grandTotal = grandTotal.add(amount);
            }
        }

        // Update lại tổng tiền
        savedInvoice.setTotalamount(grandTotal);
        invoiceRepository.save(savedInvoice);

        return mapToResponse(savedInvoice, detailsEntities);
    }

    // 2. LẤY CHI TIẾT HÓA ĐƠN
    public InvoiceResponse getInvoiceById(Integer id) {
        Invoice invoice = invoiceRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new RuntimeException("Hóa đơn không tồn tại"));

        // Lấy list detail từ DB
        List<Invoicedetail> details = invoiceDetailRepository.findByInvoiceid(invoice);

        return mapToResponse(invoice, details);
    }

    // Helper: Map Entity -> Response
    private InvoiceResponse mapToResponse(Invoice invoice, List<Invoicedetail> details) {
        List<InvoiceDetailResponse> detailResponses = details.stream()
                .map(d -> InvoiceDetailResponse.builder()
                        .id(d.getId()) // Lưu ý: Entity của bạn đặt tên ID là paymentid
                        .feeName(d.getFeeid().getFeename())
                        .unitPrice(d.getFeeid().getUnitprice())
                        .unit(d.getFeeid().getUnit())
                        .quantity(d.getQuantity())
                        .amount(d.getAmount())
                        .build())
                .collect(Collectors.toList());

        return InvoiceResponse.builder()
                .id(invoice.getInvoiceid())
                .title("Hóa đơn T" + invoice.getMonth() + "/" + invoice.getYear())
                .roomNumber(invoice.getHouseid().getApartmentNumber())
                .month(invoice.getMonth())
                .year(invoice.getYear())
                .dueDate(invoice.getDuedate())
                .status(invoice.getStatus())
                .totalAmount(invoice.getTotalamount())
                .details(detailResponses)
                .build();
    }

    @Transactional
    public void updateInvoiceDetail(Integer detailId, Double newQuantity) {
        // 1. Tìm chi tiết cần sửa
        Invoicedetail detail = invoiceDetailRepository.findById(detailId)
                .orElseThrow(() -> new RuntimeException("Chi tiết không tồn tại"));

        // 2. Tính lại tiền của dòng này
        BigDecimal price = detail.getFeeid().getUnitprice();
        BigDecimal newAmount = price.multiply(BigDecimal.valueOf(newQuantity));

        detail.setQuantity(newQuantity);
        detail.setAmount(newAmount);
        invoiceDetailRepository.save(detail);

        // 3. --- QUAN TRỌNG: TÍNH LẠI TỔNG TIỀN HÓA ĐƠN CHA ---
        Invoice invoice = detail.getInvoiceid();

        // Query DB để tính tổng lại toàn bộ các detail của hóa đơn này
        BigDecimal newTotal = invoiceDetailRepository.sumAmountByInvoiceId(invoice.getInvoiceid());

        invoice.setTotalamount(newTotal);
        invoiceRepository.save(invoice);
    }

    @Transactional
    public void deleteInvoice(Integer invoiceId) {
        // Tìm hóa đơn
        Invoice invoice = invoiceRepository.findById(Long.valueOf(invoiceId))
                .orElseThrow(() -> new RuntimeException("Hóa đơn không tồn tại"));

        // CHECK 1: Nếu trạng thái không phải UNPAID -> Cấm xóa
        if (!"unpaid".equalsIgnoreCase(invoice.getStatus())) {
            throw new RuntimeException("Không thể xóa hóa đơn đã thanh toán (hoặc thanh toán một phần)!");
        }

        // CHECK 2: Kiểm tra kỹ hơn trong bảng Payment (đề phòng trạng thái sai lệch)
        if (paymentRepository.existsByInvoiceid_Invoiceid(invoiceId)) {
            throw new RuntimeException("Hóa đơn này đã có lịch sử giao dịch thanh toán, không thể xóa!");
        }

        // Xóa (Do CascadeType.ALL ở Entity Invoice chưa cấu hình rõ ràng trong code bạn gửi,
        // nên an toàn nhất là xóa chi tiết trước rồi xóa invoice cha)
        List<Invoicedetail> details = invoiceDetailRepository.findByInvoiceid(invoice);
        invoiceDetailRepository.deleteAll(details);

        invoiceRepository.delete(invoice);
    }

    @Transactional
    public InvoiceResponse updateInvoiceInfo(Integer invoiceId, LocalDate newDueDate) {
        Invoice invoice = invoiceRepository.findById(Long.valueOf(invoiceId))
                .orElseThrow(() -> new RuntimeException("Hóa đơn không tồn tại"));

        if (newDueDate != null) {
            invoice.setDuedate(newDueDate);
        }

        Invoice saved = invoiceRepository.save(invoice);
        return getInvoiceById(saved.getInvoiceid());
    }

    @Transactional
    public void deleteInvoiceDetail(Integer detailId) {
        // Tìm chi tiết
        Invoicedetail detail = invoiceDetailRepository.findById(detailId) // Nhớ là tên entity của bạn ID là paymentid hay id check lại nhé
                .orElseThrow(() -> new RuntimeException("Chi tiết phí không tồn tại"));

        Invoice invoice = detail.getInvoiceid();

        // Chỉ cho phép xóa chi tiết nếu hóa đơn chưa đóng xong (tùy nghiệp vụ)
        if ("paid".equalsIgnoreCase(invoice.getStatus())) {
            throw new RuntimeException("Hóa đơn đã chốt và thanh toán xong, không được sửa đổi!");
        }

        // Xóa dòng đó
        invoiceDetailRepository.delete(detail);

        // --- TÍNH LẠI TỔNG TIỀN (QUAN TRỌNG) ---
        BigDecimal newTotal = invoiceDetailRepository.sumAmountByInvoiceId(invoice.getInvoiceid());
        if (newTotal == null) newTotal = BigDecimal.ZERO;

        invoice.setTotalamount(newTotal);
        invoiceRepository.save(invoice);
    }

    public Page<InvoiceResponse> getAllInvoices(
            Integer houseId, Integer month, Integer year, String status, String keyword, Pageable pageable
    ) {
        // 1. Gọi Repo
        Page<Invoice> invoicePage = invoiceRepository.findAllInvoices(houseId, month, year, status, keyword, pageable);

        // 2. Map Entity sang DTO
        return invoicePage.map(invoice -> {
            // (Tùy chọn) Nếu list view không cần hiện chi tiết từng dòng phí thì để details = null cho nhẹ
            // Hoặc gọi invoiceDetailRepository.findByInvoiceid(invoice) nếu muốn hiện full
            return InvoiceResponse.builder()
                    .id(invoice.getInvoiceid())
                    .title("Hóa đơn T" + invoice.getMonth() + "/" + invoice.getYear())
                    .roomNumber(invoice.getHouseid().getApartmentNumber())
                    .month(invoice.getMonth())
                    .year(invoice.getYear())
                    .dueDate(invoice.getDuedate())
                    .status(invoice.getStatus())
                    .totalAmount(invoice.getTotalamount())
                    // .details(...) // Có thể để null ở màn hình danh sách tổng để tăng tốc độ
                    .build();
        });
    }
}
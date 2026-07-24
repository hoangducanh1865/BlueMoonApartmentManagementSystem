package com.example.demoapi.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demoapi.dto.request.SimulatePaymentRequest;
import com.example.demoapi.model.Invoice;
import com.example.demoapi.model.Payment;
import com.example.demoapi.repository.InvoiceRepository;
import com.example.demoapi.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional
    public Payment simulatePayment(SimulatePaymentRequest request, String userEmail) {
        // 1. Tìm hóa đơn
        Invoice invoice = invoiceRepository.findById(Long.valueOf(request.getInvoiceId()))
                .orElseThrow(() -> new RuntimeException("Hóa đơn không tồn tại"));

        // 2. CHECK BẢO MẬT: Người đang login có phải chủ nhà/thành viên của hóa đơn này không?
        // (Bạn cần inject UserAccountRepository để tìm user theo email)
        /*
        UserAccount currentUser = userAccountRepository.findByEmail(userEmail).orElseThrow(...);
        if (!currentUser.getResident().getApartment().getHouseid().equals(invoice.getHouseid().getHouseid())) {
            throw new RuntimeException("Bạn không có quyền thanh toán cho hóa đơn của nhà khác!");
        }
         */
        // 3. Kiểm tra xem hóa đơn đã trả hết chưa
        if ("paid".equalsIgnoreCase(invoice.getStatus())) {
            throw new RuntimeException("Hóa đơn này đã được thanh toán hoàn tất!");
        }

        // 4. Tính toán số tiền cần trả
        BigDecimal totalAmount = invoice.getTotalamount();
        BigDecimal paidAmount = paymentRepository.sumAmountPaidByInvoiceId(invoice.getInvoiceid());

        // Xử lý trường hợp chưa có giao dịch nào (SQL SUM trả về null)
        if (paidAmount == null) {
            paidAmount = BigDecimal.ZERO;
        }

        BigDecimal remainingAmount = totalAmount.subtract(paidAmount);

        BigDecimal amountToPay;
        if (request.getAmount() == null) {
            // Nếu không nhập số tiền -> Mặc định trả hết phần còn lại
            amountToPay = remainingAmount;
        } else {
            // Nếu nhập số tiền -> Validate không được trả thừa
            if (request.getAmount().compareTo(remainingAmount) > 0) {
                throw new RuntimeException("Số tiền thanh toán vượt quá dư nợ còn lại (" + remainingAmount + ")");
            }
            amountToPay = request.getAmount();
        }

        // 5. Tạo giao dịch Payment (Giả lập thành công ngay)
        Payment payment = new Payment();
        payment.setInvoiceid(invoice);
        payment.setAmountpaid(amountToPay);
        payment.setPaymentdate(Instant.now());
        payment.setPaymentmethod("MOCK_BANKING"); // Ghi chú là giả lập
        payment.setTransactionstatus("SUCCESS");  // Luôn thành công
        payment.setOnlinetransactionid("MOCK-" + UUID.randomUUID().toString()); // Mã giao dịch giả

        Payment savedPayment = paymentRepository.save(payment);

        // 6. Cập nhật lại trạng thái hóa đơn (Logic cũ)
        updateInvoiceStatus(invoice);

        return savedPayment;
    }

    private void updateInvoiceStatus(Invoice invoice) {
        // 1. Tính tổng số tiền đã đóng (chỉ tính giao dịch SUCCESS)
        BigDecimal totalPaid = paymentRepository.sumAmountPaidByInvoiceId(invoice.getInvoiceid());

        // Xử lý trường hợp chưa có giao dịch nào (SQL SUM trả về null)
        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }

        BigDecimal totalBill = invoice.getTotalamount();

        // 2. So sánh tiền đã đóng vs Tổng hóa đơn
        // Trường hợp 1: Đã đóng đủ (hoặc đóng dư)
        // totalPaid >= totalBill
        if (totalPaid.compareTo(totalBill) >= 0) {
            invoice.setStatus("paid");
        } // Trường hợp 2: Đã đóng một phần (Lớn hơn 0 nhưng nhỏ hơn tổng tiền)
        // totalPaid > 0
        else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            invoice.setStatus("partial");
        } // Trường hợp 3: Chưa đóng đồng nào
        else {
            invoice.setStatus("unpaid");
        }

        // 3. Lưu cập nhật vào Database
        invoiceRepository.save(invoice);
    }
}

package com.example.demoapi.repository;

import com.example.demoapi.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    // Kiểm tra xem hóa đơn này đã phát sinh giao dịch nào chưa
    boolean existsByInvoiceid_Invoiceid(Integer invoiceId);

    @Query("SELECT SUM(p.amountpaid) FROM Payment p WHERE p.invoiceid.invoiceid = :invoiceId AND p.transactionstatus = 'SUCCESS'")
    BigDecimal sumAmountPaidByInvoiceId(@Param("invoiceId") Integer invoiceId);
}
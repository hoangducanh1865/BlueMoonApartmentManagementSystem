package com.example.demoapi.repository;

import com.example.demoapi.model.Invoice;
import com.example.demoapi.model.Invoicedetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface InvoiceDetailRepository extends JpaRepository<Invoicedetail, Integer> {

    // 1. Tìm danh sách chi tiết theo Hóa đơn cha (Dùng để hiển thị)
    // Spring Data JPA sẽ tự parse theo tên biến: findBy + Invoiceid (biến trong Invoicedetail)
    List<Invoicedetail> findByInvoiceid(Invoice invoice);

    // 2. Tính tổng tiền của các chi tiết thuộc về 1 hóa đơn
    // Hàm này cực kỳ quan trọng khi bạn Update/Xóa 1 khoản phí, cần gọi hàm này để tính lại tổng tiền cho Invoice cha
    @Query("SELECT SUM(d.amount) FROM Invoicedetail d WHERE d.invoiceid.invoiceid = :invoiceId")
    BigDecimal sumAmountByInvoiceId(@Param("invoiceId") Integer invoiceId);

    // Thêm hàm này
    boolean existsByFeeid_Id(Integer id);
}
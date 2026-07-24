package com.example.demoapi.repository;

import com.example.demoapi.model.Invoice;
import com.example.demoapi.model.RefreshToken;
import com.example.demoapi.model.UserAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    boolean existsByHouseid_Houseid(Integer houseId); // Kiểm tra xem nhà này có hóa đơn nào không

    @Query("SELECT COUNT(i) > 0 FROM Invoice i WHERE i.houseid.houseid = :houseId AND lower(i.status) = 'unpaid'")
    boolean existsUnpaidInvoiceByHouseId(@Param("houseId") Integer houseId);

    // Check xem tháng này nhà này có hóa đơn chưa
    boolean existsByHouseid_HouseidAndMonthAndYear(Integer houseId, Integer month, Integer year);

    // Lấy danh sách hóa đơn của 1 nhà
    List<Invoice> findByHouseid_HouseidOrderByYearDescMonthDesc(Integer houseId);

    @Query("""
        SELECT i FROM Invoice i
        LEFT JOIN FETCH i.houseid h
        WHERE (:houseId IS NULL OR h.houseid = :houseId)
          AND (:month IS NULL OR i.month = :month)
          AND (:year IS NULL OR i.year = :year)
          AND (:status IS NULL OR i.status = :status)
          AND (:keyword IS NULL OR :keyword = '' OR h.apartmentNumber LIKE %:keyword%)
    """)
    Page<Invoice> findAllInvoices(
            @Param("houseId") Integer houseId,
            @Param("month") Integer month,
            @Param("year") Integer year,
            @Param("status") String status,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
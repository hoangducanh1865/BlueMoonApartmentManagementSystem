package com.example.demoapi.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "invoice")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer invoiceid;

    private Integer month;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseid")
    private Apartment houseid;

    @Column(name = "year")
    private Integer year;

    @Column(name = "duedate")
    private LocalDate duedate;

    @ColumnDefault("0.00")
    @Column(name = "totalamount", precision = 12, scale = 2)
    private BigDecimal totalamount;

    @ColumnDefault("'unpaid'")
    @Column(name = "status", length = 50)
    private String status;

}

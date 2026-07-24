package com.example.demoapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
@Getter
@Setter
@Entity
@Table(name = "invoicedetail")
public class Invoicedetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoiceid")
    private Invoice invoiceid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feeid")
    private Fee feeid;

    @Column(name = "quantity")
    private Double quantity;

    @Column(name = "amount", precision = 12, scale = 2)
    private BigDecimal amount;

}
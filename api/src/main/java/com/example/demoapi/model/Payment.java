package com.example.demoapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "payment")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer paymentid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoiceid")
    private Invoice invoiceid;

    @Column(name = "paymentdate")
    private Instant paymentdate;

    @Column(name = "amountpaid", precision = 12, scale = 2)
    private BigDecimal amountpaid;

    @Column(name = "paymentmethod", length = 100)
    private String paymentmethod;

    @Column(name = "transactionstatus", length = 100)
    private String transactionstatus;

    @Column(name = "onlinetransactionid")
    private String onlinetransactionid;

}
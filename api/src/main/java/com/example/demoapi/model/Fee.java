package com.example.demoapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "fee")
public class Fee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feeid")
    private Integer id;

    @Column(name = "feename", nullable = false)
    private String feename;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Column(name = "unitprice", precision = 10, scale = 2)
    private BigDecimal unitprice;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "billingcycle", length = 50)
    private String billingcycle;

    @Column(name = "is_mandatory")
    private boolean is_mandatory;

}
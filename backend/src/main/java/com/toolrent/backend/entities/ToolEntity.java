package com.toolrent.backend.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "tools")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToolEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private CategoryEntity category;

    @Column(nullable = false)
    private Integer initialStock;

    @Column(nullable = false)
    private Integer currentStock;

    @Column(nullable = false)
    private BigDecimal replacementValue;

    @Column(name = "rental_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal rentalRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ToolStatus status;

    public enum ToolStatus {
        AVAILABLE, LOANED, UNDER_REPAIR, DECOMMISSIONED
    }
}

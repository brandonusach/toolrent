package com.toolrent.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "rates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RateType type;

    @Column(name = "daily_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyAmount;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;


    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum RateType {
        RENTAL_RATE,      // Tarifa diaria de arriendo
        LATE_FEE_RATE,    // Tarifa diaria de multa por atraso
        REPAIR_RATE       // Tarifa de reparación (porcentaje del valor de reposición)
    }

    // Business methods
    public boolean isCurrentlyActive() {
        LocalDate today = LocalDate.now();
        return active &&
                !today.isBefore(effectiveFrom) &&
                (effectiveTo == null || !today.isAfter(effectiveTo));
    }

    public boolean overlapsWith(LocalDate startDate, LocalDate endDate) {
        if (effectiveTo == null) {
            return !startDate.isBefore(effectiveFrom);
        }
        return !startDate.isAfter(effectiveTo) && !endDate.isBefore(effectiveFrom);
    }
}
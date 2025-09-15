package com.toolrent.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FineEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private LoanEntity loan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FineType type;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Boolean paid = false;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private UserEntity createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum FineType {
        LATE_RETURN,        // devolución tardía
        DAMAGE_REPAIR,      // daño leve (reparación)
        TOOL_REPLACEMENT    // reposición de herramienta
    }

    // Business methods
    public void markAsPaid() {
        this.paid = true;
        this.paidDate = LocalDate.now();
    }

    public boolean isOverdue() {
        return !paid && LocalDate.now().isAfter(dueDate);
    }

    public long getDaysOverdue() {
        if (paid || !LocalDate.now().isAfter(dueDate)) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(dueDate, LocalDate.now());
    }
}
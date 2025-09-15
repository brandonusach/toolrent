package com.toolrent.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.math.BigDecimal;

@Entity
@Table(name = "loans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tool_id", nullable = false)
    private ToolEntity tool;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "loan_date", nullable = false)
    private LocalDate loanDate;

    @Column(name = "agreed_return_date", nullable = false)
    private LocalDate agreedReturnDate;

    @Column(name = "actual_return_date")
    private LocalDate actualReturnDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private UserEntity createdBy;

    @Column(name = "daily_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyRate;

    @Column(length = 500)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status;

    public enum LoanStatus {
        ACTIVE,      // Préstamo activo
        RETURNED,    // Devuelto a tiempo
        OVERDUE,     // Devuelto con retraso
        DAMAGED      // Devuelto con daños
    }
}
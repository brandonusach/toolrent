package com.toolrent.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FineEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER) // Cambiar a EAGER para evitar problemas de lazy loading
    @JoinColumn(name = "client_id", nullable = false)
    @JsonManagedReference
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.EAGER) // Cambiar a EAGER para evitar problemas de lazy loading
    @JoinColumn(name = "loan_id", nullable = false)
    @JsonManagedReference
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
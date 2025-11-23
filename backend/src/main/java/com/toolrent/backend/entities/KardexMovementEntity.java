package com.toolrent.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Entity
@Table(name = "kardex_movements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class KardexMovementEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tool_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ToolEntity tool;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tool_instance_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ToolInstanceEntity toolInstance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementType type;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "stock_before", nullable = false)
    private Integer stockBefore;

    @Column(name = "stock_after", nullable = false)
    private Integer stockAfter;

    @Column(length = 500)
    private String description;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_loan_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private LoanEntity relatedLoan;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public enum MovementType {
        INITIAL_STOCK,  // Initial stock registration
        LOAN,           // Tool loaned out (-quantity)
        RETURN,         // Tool returned (+quantity)
        REPAIR,         // Tool sent to repair
        DECOMMISSION,   // Tool decommissioned (-quantity)
        RESTOCK         // Additional stock added (+quantity)
    }

    // Business methods
    public int calculateStockChange() {
        switch (type) {
            case INITIAL_STOCK:
            case RETURN:
            case RESTOCK:
                return quantity; // Positive change (increases stock)
            case LOAN:
            case DECOMMISSION:
                return -quantity; // Negative change (decreases stock)
            case REPAIR:
                return 0; // No stock change for repair movements
            default:
                return 0;
        }
    }

    public boolean isStockIncreasing() {
        return calculateStockChange() > 0;
    }

    public boolean isStockDecreasing() {
        return calculateStockChange() < 0;
    }

    // Constructor for creating movements with tool instance
    public KardexMovementEntity(ToolEntity tool, ToolInstanceEntity toolInstance, MovementType type, Integer quantity,
                                Integer stockBefore, Integer stockAfter, String description, LoanEntity relatedLoan) {
        this.tool = tool;
        this.toolInstance = toolInstance;
        this.type = type;
        this.quantity = quantity;
        this.stockBefore = stockBefore;
        this.stockAfter = stockAfter;
        this.description = description;
        this.relatedLoan = relatedLoan;
        this.createdAt = LocalDateTime.now();
    }

    // Constructor for creating movements
    public KardexMovementEntity(ToolEntity tool, MovementType type, Integer quantity,
                                Integer stockBefore, Integer stockAfter, String description, LoanEntity relatedLoan) {
        this(tool, null, type, quantity, stockBefore, stockAfter, description, relatedLoan);
    }

    // Constructor without loan relation
    public KardexMovementEntity(ToolEntity tool, MovementType type, Integer quantity,
                                Integer stockBefore, Integer stockAfter, String description) {
        this(tool, null, type, quantity, stockBefore, stockAfter, description, null);
    }
}
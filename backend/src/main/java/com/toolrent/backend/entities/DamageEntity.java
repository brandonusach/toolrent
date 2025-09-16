package com.toolrent.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "damages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DamageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private LoanEntity loan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tool_instance_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ToolInstanceEntity toolInstance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DamageType type;

    @Column(length = 1000)
    private String description;

    @Column(name = "repair_cost", precision = 10, scale = 2)
    private BigDecimal repairCost;

    @Column(name = "is_repairable", nullable = false)
    private Boolean isRepairable;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DamageStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessed_by", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private UserEntity assessedBy;

    @Column(name = "reported_at", nullable = false)
    private LocalDateTime reportedAt;

    @Column(name = "assessed_at")
    private LocalDateTime assessedAt;

    @Column(name = "repair_completed_at")
    private LocalDateTime repairCompletedAt;

    @PrePersist
    protected void onCreate() {
        if (reportedAt == null) {
            reportedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = DamageStatus.REPORTED;
        }
    }

    public enum DamageType {
        MINOR,        // Daño menor - reparación simple
        MAJOR,        // Daño mayor - reparación compleja
        IRREPARABLE   // Daño irreparable - herramienta debe darse de baja
    }

    public enum DamageStatus {
        REPORTED,           // Daño reportado, pendiente de evaluación
        ASSESSED,           // Daño evaluado, plan de acción definido
        REPAIR_IN_PROGRESS, // Reparación en progreso
        REPAIRED,           // Reparación completada
        IRREPARABLE         // Confirmado como irreparable, herramienta dada de baja
    }

    // Business methods
    public void assessDamage(DamageType type, String description, BigDecimal repairCost,
                             Boolean isRepairable, UserEntity assessor) {
        this.type = type;
        this.description = description;
        this.repairCost = repairCost;
        this.isRepairable = isRepairable;
        this.assessedBy = assessor;
        this.assessedAt = LocalDateTime.now();
        this.status = DamageStatus.ASSESSED;
    }

    public BigDecimal calculateCost() {
        if (!isRepairable) {
            // Si es irreparable, el costo es el valor de reposición de la herramienta
            return toolInstance.getTool().getReplacementValue();
        }
        return repairCost != null ? repairCost : BigDecimal.ZERO;
    }

    public void markAsRepairInProgress() {
        if (status != DamageStatus.ASSESSED) {
            throw new RuntimeException("Damage must be assessed before starting repair");
        }
        if (!isRepairable) {
            throw new RuntimeException("Cannot repair irreparable damage");
        }
        this.status = DamageStatus.REPAIR_IN_PROGRESS;
    }

    public void markAsRepaired() {
        if (status != DamageStatus.REPAIR_IN_PROGRESS) {
            throw new RuntimeException("Repair must be in progress before marking as repaired");
        }
        this.status = DamageStatus.REPAIRED;
        this.repairCompletedAt = LocalDateTime.now();
    }

    public void markAsIrreparable() {
        this.isRepairable = false;
        this.type = DamageType.IRREPARABLE;
        this.status = DamageStatus.IRREPARABLE;
        this.assessedAt = LocalDateTime.now();
    }

    public boolean isPendingAssessment() {
        return status == DamageStatus.REPORTED;
    }

    public boolean isUnderRepair() {
        return status == DamageStatus.REPAIR_IN_PROGRESS;
    }

    public boolean isRepaired() {
        return status == DamageStatus.REPAIRED;
    }

    public boolean isIrreparable() {
        return !isRepairable || status == DamageStatus.IRREPARABLE;
    }

    // Constructor for initial damage report
    public DamageEntity(LoanEntity loan, ToolInstanceEntity toolInstance, String description, UserEntity reportedBy) {
        this.loan = loan;
        this.toolInstance = toolInstance;
        this.description = description;
        this.assessedBy = reportedBy;
        this.status = DamageStatus.REPORTED;
        this.reportedAt = LocalDateTime.now();
        this.isRepairable = true; // Default to repairable until assessed
    }
}
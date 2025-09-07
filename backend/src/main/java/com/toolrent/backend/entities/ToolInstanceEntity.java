package com.toolrent.backend.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;

@Entity
@Table(name = "tool_instances")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToolInstanceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tool_id", nullable = false)
    private ToolEntity tool;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ToolInstanceStatus status;

    // Constructor for creating instances automatically
    public ToolInstanceEntity(ToolEntity tool) {
        this.tool = tool;
        this.status = ToolInstanceStatus.AVAILABLE;
    }

    public enum ToolInstanceStatus {
        AVAILABLE,      // Available for loan
        LOANED,         // Currently loaned
        UNDER_REPAIR,   // Under repair
        DECOMMISSIONED  // Decommissioned
    }

    // Helper methods
    public boolean isAvailable() {
        return this.status == ToolInstanceStatus.AVAILABLE;
    }

    public boolean isLoaned() {
        return this.status == ToolInstanceStatus.LOANED;
    }

    public boolean isUnderRepair() {
        return this.status == ToolInstanceStatus.UNDER_REPAIR;
    }

    public boolean isDecommissioned() {
        return this.status == ToolInstanceStatus.DECOMMISSIONED;
    }
}
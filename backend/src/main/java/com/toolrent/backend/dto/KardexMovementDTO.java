package com.toolrent.backend.dto;

import com.toolrent.backend.entities.KardexMovementEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KardexMovementDTO {
    private Long id;
    private Long toolId;
    private Long toolInstanceId;
    private String toolName;
    private String categoryName;
    private String type;
    private Integer quantity;
    private Integer stockBefore;
    private Integer stockAfter;
    private String description;
    private Long relatedLoanId;
    private String clientName;
    private LocalDateTime createdAt;

    // Nuevos campos para mejor tracking
    private String toolStatus;  // Estado actual de la herramienta: AVAILABLE, LOANED, IN_REPAIR, DECOMMISSIONED
    private String instanceStatus;  // Estado de las instancias afectadas (para DECOMMISSION, REPAIR, etc)
    private String statusReason;  // Razón del estado (ej: "Daño irreparable", "Pérdida", etc)

    // Constructor desde KardexMovementEntity
    public static KardexMovementDTO fromEntity(KardexMovementEntity entity) {
        KardexMovementDTO dto = new KardexMovementDTO();
        dto.setId(entity.getId());

        // Tool information (safely handle lazy loading)
        if (entity.getTool() != null) {
            dto.setToolId(entity.getTool().getId());
            dto.setToolName(entity.getTool().getName());
            dto.setToolStatus(entity.getTool().getStatus() != null ?
                entity.getTool().getStatus().toString() : null);

            if (entity.getTool().getCategory() != null) {
                dto.setCategoryName(entity.getTool().getCategory().getName());
            }
        }

        // Tool instance information (safely handle lazy loading)
        if (entity.getToolInstance() != null) {
            dto.setToolInstanceId(entity.getToolInstance().getId());
        }

        dto.setType(entity.getType().toString());
        dto.setQuantity(entity.getQuantity());
        dto.setStockBefore(entity.getStockBefore());
        dto.setStockAfter(entity.getStockAfter());
        dto.setDescription(entity.getDescription());

        // Loan information (safely handle lazy loading)
        if (entity.getRelatedLoan() != null) {
            dto.setRelatedLoanId(entity.getRelatedLoan().getId());
            if (entity.getRelatedLoan().getClient() != null) {
                dto.setClientName(entity.getRelatedLoan().getClient().getName());
            }
        }

        dto.setCreatedAt(entity.getCreatedAt());

        // Determinar estado de instancia y razón según el tipo de movimiento
        switch (entity.getType()) {
            case DECOMMISSION:
                dto.setInstanceStatus("DECOMMISSIONED");
                // Extraer razón de la descripción si existe
                if (entity.getDescription() != null) {
                    dto.setStatusReason(entity.getDescription());
                }
                break;
            case REPAIR:
                dto.setInstanceStatus("IN_REPAIR");
                break;
            case LOAN:
                dto.setInstanceStatus("LOANED");
                break;
            case RETURN:
                dto.setInstanceStatus("AVAILABLE");
                break;
            default:
                dto.setInstanceStatus("AVAILABLE");
                break;
        }

        return dto;
    }
}

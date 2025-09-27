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

    // Constructor desde KardexMovementEntity
    public static KardexMovementDTO fromEntity(KardexMovementEntity entity) {
        KardexMovementDTO dto = new KardexMovementDTO();
        dto.setId(entity.getId());

        // Tool information (safely handle lazy loading)
        if (entity.getTool() != null) {
            dto.setToolId(entity.getTool().getId());
            dto.setToolName(entity.getTool().getName());
            if (entity.getTool().getCategory() != null) {
                dto.setCategoryName(entity.getTool().getCategory().getName());
            }
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

        return dto;
    }
}

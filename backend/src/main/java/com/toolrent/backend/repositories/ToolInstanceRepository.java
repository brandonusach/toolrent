package com.toolrent.backend.repositories;

import com.toolrent.backend.entities.ToolInstanceEntity;
import com.toolrent.backend.entities.ToolInstanceEntity.ToolInstanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ToolInstanceRepository extends JpaRepository<ToolInstanceEntity, Long> {

    // Find all instances of a specific tool
    List<ToolInstanceEntity> findByToolId(Long toolId);

    // Find instances by status
    List<ToolInstanceEntity> findByStatus(ToolInstanceStatus status);

    // Find instances by tool and status
    List<ToolInstanceEntity> findByToolIdAndStatus(Long toolId, ToolInstanceStatus status);

    // Count instances by tool and status
    Long countByToolIdAndStatus(Long toolId, ToolInstanceStatus status);

    // Count available instances for a tool
    @Query("SELECT COUNT(ti) FROM ToolInstanceEntity ti WHERE ti.tool.id = :toolId AND ti.status = 'AVAILABLE'")
    Long countAvailableByToolId(@Param("toolId") Long toolId);

    // Get first available instance of a tool
    @Query("SELECT ti FROM ToolInstanceEntity ti WHERE ti.tool.id = :toolId AND ti.status = 'AVAILABLE' ORDER BY ti.id ASC")
    Optional<ToolInstanceEntity> findFirstAvailableByToolId(@Param("toolId") Long toolId);

    // Get all available instances
    List<ToolInstanceEntity> findByStatusOrderByToolIdAsc(ToolInstanceStatus status);

    // Get instances that need attention (under repair)
    @Query("SELECT ti FROM ToolInstanceEntity ti WHERE ti.status = 'UNDER_REPAIR' ORDER BY ti.id ASC")
    List<ToolInstanceEntity> findInstancesUnderRepair();

    // Count total instances by tool
    Long countByToolId(Long toolId);

    // Get loaned instances (for tracking active loans)
    @Query("SELECT ti FROM ToolInstanceEntity ti WHERE ti.status = 'LOANED' ORDER BY ti.tool.name ASC")
    List<ToolInstanceEntity> findLoanedInstances();

    // Statistics query - count by status for a tool
    @Query("SELECT ti.status, COUNT(ti) FROM ToolInstanceEntity ti WHERE ti.tool.id = :toolId GROUP BY ti.status")
    List<Object[]> getStatusCountsByTool(@Param("toolId") Long toolId);

    // Delete all instances of a tool (cascade when tool is deleted)
    void deleteByToolId(Long toolId);

    // Get available instances by tool (for reservation)
    @Query("SELECT ti FROM ToolInstanceEntity ti WHERE ti.tool.id = :toolId AND ti.status = 'AVAILABLE'")
    List<ToolInstanceEntity> findAvailableInstancesByToolId(@Param("toolId") Long toolId);

    // Get loaned instances by tool (for returning loans)
    @Query("SELECT ti FROM ToolInstanceEntity ti WHERE ti.tool.id = :toolId AND ti.status = 'LOANED'")
    List<ToolInstanceEntity> findLoanedInstancesByToolId(@Param("toolId") Long toolId);

    // Count instances by multiple statuses
    @Query("SELECT COUNT(ti) FROM ToolInstanceEntity ti WHERE ti.tool.id = :toolId AND ti.status IN :statuses")
    Long countByToolIdAndStatusIn(@Param("toolId") Long toolId, @Param("statuses") List<ToolInstanceStatus> statuses);

    // Find instances by tool ordered by status
    @Query("SELECT ti FROM ToolInstanceEntity ti WHERE ti.tool.id = :toolId ORDER BY ti.status ASC, ti.id ASC")
    List<ToolInstanceEntity> findByToolIdOrderByStatus(@Param("toolId") Long toolId);
}
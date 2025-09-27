package com.toolrent.backend.repositories;

import com.toolrent.backend.entities.KardexMovementEntity;
import com.toolrent.backend.entities.ToolEntity;
import com.toolrent.backend.entities.LoanEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface KardexMovementRepository extends JpaRepository<KardexMovementEntity, Long> {

    // RF5.2: Query movement history by tool
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.tool = :tool ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findByToolOrderByCreatedAtDesc(@Param("tool") ToolEntity tool);

    // RF5.2: Query movement history by tool ID
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.tool.id = :toolId ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findByToolIdOrderByCreatedAtDesc(@Param("toolId") Long toolId);

    // RF5.3: Query movements by date range
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.createdAt >= :startDate AND k.createdAt <= :endDate ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findByDateRangeOrderByCreatedAtDesc(@Param("startDate") LocalDateTime startDate,
                                                                   @Param("endDate") LocalDateTime endDate);

    // Query movements by tool and date range
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.tool = :tool AND k.createdAt >= :startDate AND k.createdAt <= :endDate ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findByToolAndDateRangeOrderByCreatedAtDesc(@Param("tool") ToolEntity tool,
                                                                          @Param("startDate") LocalDateTime startDate,
                                                                          @Param("endDate") LocalDateTime endDate);

    // Query movements by tool ID and date range
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.tool.id = :toolId AND k.createdAt >= :startDate AND k.createdAt <= :endDate ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findByToolIdAndDateRangeOrderByCreatedAtDesc(@Param("toolId") Long toolId,
                                                                            @Param("startDate") LocalDateTime startDate,
                                                                            @Param("endDate") LocalDateTime endDate);

    // Query movements by type
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.type = :type ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findByTypeOrderByCreatedAtDesc(@Param("type") KardexMovementEntity.MovementType type);

    // Query movements by related loan
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.relatedLoan = :loan ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findByRelatedLoanOrderByCreatedAtDesc(@Param("loan") LoanEntity loan);

    // Query movements by related loan ID
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.relatedLoan.id = :loanId ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findByRelatedLoanIdOrderByCreatedAtDesc(@Param("loanId") Long loanId);

    // Query latest movements (for dashboard)
    @Query("SELECT k FROM KardexMovementEntity k ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findLatestMovements(org.springframework.data.domain.Pageable pageable);

    // Statistics: Count movements by type
    @Query("SELECT k.type, COUNT(k) FROM KardexMovementEntity k GROUP BY k.type")
    List<Object[]> countMovementsByType();

    // Statistics: Count movements by tool
    @Query("SELECT k.tool.name, COUNT(k) FROM KardexMovementEntity k GROUP BY k.tool.name ORDER BY COUNT(k) DESC")
    List<Object[]> countMovementsByTool();

    // Statistics: Movement summary for date range
    @Query("SELECT k.type, COUNT(k), SUM(k.quantity) FROM KardexMovementEntity k WHERE k.createdAt >= :startDate AND k.createdAt <= :endDate GROUP BY k.type")
    List<Object[]> getMovementSummaryByDateRange(@Param("startDate") LocalDateTime startDate,
                                                 @Param("endDate") LocalDateTime endDate);

    // Get stock movements (movements that affect stock)
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.type IN ('INITIAL_STOCK', 'LOAN', 'RETURN', 'DECOMMISSION', 'RESTOCK') ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findStockMovements();

    // Get stock movements by tool
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.tool.id = :toolId AND k.type IN ('INITIAL_STOCK', 'LOAN', 'RETURN', 'DECOMMISSION', 'RESTOCK') ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findStockMovementsByTool(@Param("toolId") Long toolId);

    // Get last movement for a tool (to check stock consistency) - CORREGIDO para JPA estándar
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.tool.id = :toolId ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findLastMovementByTool(@Param("toolId") Long toolId);

    // Verify stock consistency for a tool - CORREGIDO para JPA estándar
    @Query("SELECT k.stockAfter FROM KardexMovementEntity k WHERE k.tool.id = :toolId ORDER BY k.createdAt DESC")
    List<Integer> getLastStockByToolList(@Param("toolId") Long toolId);

    // Get movements that increased stock
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.type IN ('INITIAL_STOCK', 'RETURN', 'RESTOCK') ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findStockIncreasingMovements();

    // Get movements that decreased stock
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.type IN ('LOAN', 'DECOMMISSION') ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findStockDecreasingMovements();

    // Count total movements by tool
    @Query("SELECT COUNT(k) FROM KardexMovementEntity k WHERE k.tool.id = :toolId")
    long countMovementsByTool(@Param("toolId") Long toolId);

    // Count movements by type for a specific tool
    @Query("SELECT COUNT(k) FROM KardexMovementEntity k WHERE k.tool.id = :toolId AND k.type = :type")
    long countMovementsByToolAndType(@Param("toolId") Long toolId, @Param("type") KardexMovementEntity.MovementType type);

    // Check if a tool has any movements (before allowing deletion)
    @Query("SELECT COUNT(k) > 0 FROM KardexMovementEntity k WHERE k.tool.id = :toolId")
    boolean existsByToolId(@Param("toolId") Long toolId);

    // Get movements between specific dates for a tool (inclusive)
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.tool.id = :toolId AND DATE(k.createdAt) >= :startDate AND DATE(k.createdAt) <= :endDate ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findByToolIdAndDateRange(@Param("toolId") Long toolId,
                                                        @Param("startDate") java.time.LocalDate startDate,
                                                        @Param("endDate") java.time.LocalDate endDate);


    // Get this week's movements
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.createdAt >= :startOfWeek ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findThisWeekMovements(@Param("startOfWeek") LocalDateTime startOfWeek);

    // Get this month's movements
    @Query("SELECT k FROM KardexMovementEntity k WHERE k.createdAt >= :startOfMonth ORDER BY k.createdAt DESC")
    List<KardexMovementEntity> findThisMonthMovements(@Param("startOfMonth") LocalDateTime startOfMonth);
}
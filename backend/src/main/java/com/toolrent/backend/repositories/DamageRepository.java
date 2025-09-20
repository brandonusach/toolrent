package com.toolrent.backend.repositories;

import com.toolrent.backend.entities.DamageEntity;
import com.toolrent.backend.entities.LoanEntity;
import com.toolrent.backend.entities.ToolInstanceEntity;
import com.toolrent.backend.entities.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DamageRepository extends JpaRepository<DamageEntity, Long> {

    // Find damages by loan
    List<DamageEntity> findByLoanOrderByReportedAtDesc(LoanEntity loan);

    // Find damages by loan ID
    @Query("SELECT d FROM DamageEntity d WHERE d.loan.id = :loanId ORDER BY d.reportedAt DESC")
    List<DamageEntity> findByLoanIdOrderByReportedAtDesc(@Param("loanId") Long loanId);

    // Find damages by tool instance
    List<DamageEntity> findByToolInstanceOrderByReportedAtDesc(ToolInstanceEntity toolInstance);

    // Find damages by tool instance ID
    @Query("SELECT d FROM DamageEntity d WHERE d.toolInstance.id = :toolInstanceId ORDER BY d.reportedAt DESC")
    List<DamageEntity> findByToolInstanceIdOrderByReportedAtDesc(@Param("toolInstanceId") Long toolInstanceId);

    // Find damages by status
    List<DamageEntity> findByStatusOrderByReportedAtDesc(DamageEntity.DamageStatus status);

    // Find damages by damage type
    List<DamageEntity> findByTypeOrderByReportedAtDesc(DamageEntity.DamageType type);

    // Find damages by client (through loan relationship)
    @Query("SELECT d FROM DamageEntity d WHERE d.loan.client = :client ORDER BY d.reportedAt DESC")
    List<DamageEntity> findByClientOrderByReportedAtDesc(@Param("client") ClientEntity client);

    // Find damages by client ID
    @Query("SELECT d FROM DamageEntity d WHERE d.loan.client.id = :clientId ORDER BY d.reportedAt DESC")
    List<DamageEntity> findByClientIdOrderByReportedAtDesc(@Param("clientId") Long clientId);

    // Find pending assessment damages (REPORTED status)
    @Query("SELECT d FROM DamageEntity d WHERE d.status = 'REPORTED' ORDER BY d.reportedAt ASC")
    List<DamageEntity> findPendingAssessments();

    // Find damages under repair (REPAIR_IN_PROGRESS status)
    @Query("SELECT d FROM DamageEntity d WHERE d.status = 'REPAIR_IN_PROGRESS' ORDER BY d.reportedAt ASC")
    List<DamageEntity> findDamagesUnderRepair();

    // Find irreparable damages
    @Query("SELECT d FROM DamageEntity d WHERE d.isRepairable = false OR d.status = 'IRREPARABLE' ORDER BY d.reportedAt DESC")
    List<DamageEntity> findIrreparableDamages();

    // Find damages by date range
    @Query("SELECT d FROM DamageEntity d WHERE d.reportedAt >= :startDate AND d.reportedAt <= :endDate ORDER BY d.reportedAt DESC")
    List<DamageEntity> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);

    // Find damages by tool (through tool instance)
    @Query("SELECT d FROM DamageEntity d WHERE d.toolInstance.tool.id = :toolId ORDER BY d.reportedAt DESC")
    List<DamageEntity> findByToolIdOrderByReportedAtDesc(@Param("toolId") Long toolId);

    // Count damages by status
    long countByStatus(DamageEntity.DamageStatus status);

    // Count damages by type
    long countByType(DamageEntity.DamageType type);

    // Count damages by client
    @Query("SELECT COUNT(d) FROM DamageEntity d WHERE d.loan.client.id = :clientId")
    long countByClientId(@Param("clientId") Long clientId);

    // Count irreparable damages by client (for customer evaluation)
    @Query("SELECT COUNT(d) FROM DamageEntity d WHERE d.loan.client.id = :clientId AND (d.isRepairable = false OR d.status = 'IRREPARABLE')")
    long countIrreparableDamagesByClientId(@Param("clientId") Long clientId);

    // Find most recent damage for a tool instance
    @Query("SELECT d FROM DamageEntity d WHERE d.toolInstance.id = :toolInstanceId ORDER BY d.reportedAt DESC LIMIT 1")
    Optional<DamageEntity> findMostRecentByToolInstanceId(@Param("toolInstanceId") Long toolInstanceId);

    // Check if tool instance has pending damages (not repaired or assessed as irreparable)
    @Query("SELECT COUNT(d) > 0 FROM DamageEntity d WHERE d.toolInstance.id = :toolInstanceId AND d.status NOT IN ('REPAIRED', 'IRREPARABLE')")
    boolean hasPendingDamages(@Param("toolInstanceId") Long toolInstanceId);

    // Statistics: Damage report by tool
    @Query("SELECT d.toolInstance.tool.name, COUNT(d), SUM(CASE WHEN d.isRepairable = false THEN 1 ELSE 0 END) FROM DamageEntity d GROUP BY d.toolInstance.tool.name ORDER BY COUNT(d) DESC")
    List<Object[]> getDamageStatsByTool();

    // Statistics: Damage report by client
    @Query("SELECT d.loan.client.name, COUNT(d), SUM(CASE WHEN d.isRepairable = false THEN 1 ELSE 0 END) FROM DamageEntity d GROUP BY d.loan.client.name ORDER BY COUNT(d) DESC")
    List<Object[]> getDamageStatsByClient();

    // Statistics: Monthly damage trend
    @Query("SELECT YEAR(d.reportedAt), MONTH(d.reportedAt), COUNT(d) FROM DamageEntity d GROUP BY YEAR(d.reportedAt), MONTH(d.reportedAt) ORDER BY YEAR(d.reportedAt) DESC, MONTH(d.reportedAt) DESC")
    List<Object[]> getMonthlyDamageTrend();

    // Find damages that need follow-up (assessed but not progressing)
    @Query("SELECT d FROM DamageEntity d WHERE d.status = 'ASSESSED' AND d.assessedAt < :cutoffDate ORDER BY d.assessedAt ASC")
    List<DamageEntity> findStagnantAssessments(@Param("cutoffDate") LocalDateTime cutoffDate);

    // Find overdue repairs (repair in progress for too long)
    @Query("SELECT d FROM DamageEntity d WHERE d.status = 'REPAIR_IN_PROGRESS' AND d.assessedAt < :cutoffDate ORDER BY d.assessedAt ASC")
    List<DamageEntity> findOverdueRepairs(@Param("cutoffDate") LocalDateTime cutoffDate);

    // Check if loan has damages
    @Query("SELECT COUNT(d) > 0 FROM DamageEntity d WHERE d.loan.id = :loanId")
    boolean existsByLoanId(@Param("loanId") Long loanId);

    // Find active damages (not repaired or irreparable) for a tool instance
    @Query("SELECT d FROM DamageEntity d WHERE d.toolInstance.id = :toolInstanceId AND d.status NOT IN ('REPAIRED', 'IRREPARABLE') ORDER BY d.reportedAt DESC")
    List<DamageEntity> findActiveDamagesByToolInstanceId(@Param("toolInstanceId") Long toolInstanceId);

    // Calculate total repair cost for a period
    @Query("SELECT COALESCE(SUM(d.repairCost), 0) FROM DamageEntity d WHERE d.repairCost IS NOT NULL AND d.reportedAt >= :startDate AND d.reportedAt <= :endDate")
    java.math.BigDecimal calculateTotalRepairCostInPeriod(@Param("startDate") LocalDateTime startDate,
                                                          @Param("endDate") LocalDateTime endDate);

    // Find damages requiring immediate attention (high priority)
    @Query("SELECT d FROM DamageEntity d WHERE (d.status = 'REPORTED' AND d.reportedAt < :urgentDate) OR (d.status = 'ASSESSED' AND d.isRepairable = true AND d.assessedAt < :urgentDate) ORDER BY d.reportedAt ASC")
    List<DamageEntity> findUrgentDamages(@Param("urgentDate") LocalDateTime urgentDate);
}
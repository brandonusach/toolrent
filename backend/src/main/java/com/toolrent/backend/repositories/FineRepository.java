package com.toolrent.backend.repositories;

import com.toolrent.backend.entities.FineEntity;
import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.entities.LoanEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface FineRepository extends JpaRepository<FineEntity, Long> {

    // RF2.5: Find unpaid fines by client to block new loans
    List<FineEntity> findByClientAndPaidFalse(ClientEntity client);

    // Check if client has unpaid fines
    @Query("SELECT COUNT(f) FROM FineEntity f WHERE f.client = :client AND f.paid = false")
    long countUnpaidFinesByClient(@Param("client") ClientEntity client);

    // Get total unpaid amount for a client
    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FineEntity f WHERE f.client = :client AND f.paid = false")
    BigDecimal getTotalUnpaidAmountByClient(@Param("client") ClientEntity client);

    // Find fines by loan
    List<FineEntity> findByLoan(LoanEntity loan);

    // Find fines by type
    List<FineEntity> findByType(FineEntity.FineType type);

    // Find paid fines by client
    List<FineEntity> findByClientAndPaidTrue(ClientEntity client);

    // Find overdue fines (unpaid and past due date)
    @Query("SELECT f FROM FineEntity f WHERE f.paid = false AND f.dueDate < :currentDate")
    List<FineEntity> findOverdueFines(@Param("currentDate") LocalDate currentDate);

    // Find fines by client and type
    List<FineEntity> findByClientAndType(ClientEntity client, FineEntity.FineType type);

    // Find fines by date range
    @Query("SELECT f FROM FineEntity f WHERE f.createdAt >= :startDate AND f.createdAt < :endDate")
    List<FineEntity> findByDateRange(@Param("startDate") java.time.LocalDateTime startDate,
                                     @Param("endDate") java.time.LocalDateTime endDate);

    // Find fines by client in date range
    @Query("SELECT f FROM FineEntity f WHERE f.client = :client AND f.createdAt >= :startDate AND f.createdAt < :endDate")
    List<FineEntity> findByClientAndDateRange(@Param("client") ClientEntity client,
                                              @Param("startDate") java.time.LocalDateTime startDate,
                                              @Param("endDate") java.time.LocalDateTime endDate);

    // Statistics: Total fines collected in date range
    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FineEntity f WHERE f.paid = true AND f.paidDate >= :startDate AND f.paidDate <= :endDate")
    BigDecimal getTotalPaidAmountInDateRange(@Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate);

    // Statistics: Count fines by type
    @Query("SELECT f.type, COUNT(f) FROM FineEntity f GROUP BY f.type")
    List<Object[]> getFineCountsByType();

    // Check if client has replacement fines (tool loss)
    @Query("SELECT COUNT(f) > 0 FROM FineEntity f WHERE f.client = :client AND f.type = 'TOOL_REPLACEMENT' AND f.paid = false")
    boolean hasUnpaidReplacementFines(@Param("client") ClientEntity client);

    // Get latest fines (for dashboard/reports)
    @Query("SELECT f FROM FineEntity f ORDER BY f.createdAt DESC")
    List<FineEntity> findLatestFines(org.springframework.data.domain.Pageable pageable);
}
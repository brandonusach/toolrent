package com.toolrent.backend.repositories;

import com.toolrent.backend.entities.LoanEntity;
import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.entities.ToolEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<LoanEntity, Long> {

    // RF2.5: Bloquear préstamos - buscar préstamos vencidos del cliente
    @Query("SELECT l FROM LoanEntity l WHERE l.client = :client AND l.status = 'ACTIVE' AND l.agreedReturnDate < :currentDate")
    List<LoanEntity> findOverdueLoansByClient(@Param("client") ClientEntity client, @Param("currentDate") LocalDate currentDate);

    // RF2.5: Verificar si cliente tiene préstamos activos de la misma herramienta
    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.client = :client AND l.tool = :tool AND l.status = 'ACTIVE'")
    long countActiveLoansByClientAndTool(@Param("client") ClientEntity client, @Param("tool") ToolEntity tool);

    // RF2.5: Verificar si existe préstamo activo por cliente y herramienta (método booleano)
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM LoanEntity l WHERE l.client = :client AND l.tool = :tool AND l.status = 'ACTIVE'")
    boolean existsActiveLoanByClientAndTool(@Param("client") ClientEntity client, @Param("tool") ToolEntity tool);

    // RF2.5: Contar préstamos activos del cliente (máximo 5)
    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.client = :client AND l.status = 'ACTIVE'")
    long countActiveLoansByClient(@Param("client") ClientEntity client);

    // Consultas para reportes - RF6.1, RF6.2, RF6.3
    @Query("SELECT l FROM LoanEntity l WHERE l.loanDate BETWEEN :startDate AND :endDate")
    List<LoanEntity> findByLoanDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT l FROM LoanEntity l WHERE l.loanDate >= :startDate")
    List<LoanEntity> findByLoanDateGreaterThanEqual(@Param("startDate") LocalDate startDate);

    @Query("SELECT l FROM LoanEntity l WHERE l.loanDate <= :endDate")
    List<LoanEntity> findByLoanDateLessThanEqual(@Param("endDate") LocalDate endDate);

    // Consulta para préstamos activos (sin fecha de devolución real)
    @Query("SELECT l FROM LoanEntity l WHERE l.actualReturnDate IS NULL")
    List<LoanEntity> findActiveLoans();

    // Consulta para préstamos atrasados
    @Query("SELECT l FROM LoanEntity l WHERE l.actualReturnDate IS NULL AND l.agreedReturnDate < :currentDate")
    List<LoanEntity> findOverdueLoans(@Param("currentDate") LocalDate currentDate);

    // Buscar préstamos por cliente
    List<LoanEntity> findByClient(ClientEntity client);

    // Buscar préstamos por herramienta
    List<LoanEntity> findByTool(ToolEntity tool);

    // Buscar préstamos por estado - MÉTODO REQUERIDO POR LOANSERVICE
    List<LoanEntity> findByStatus(LoanEntity.LoanStatus status);
}
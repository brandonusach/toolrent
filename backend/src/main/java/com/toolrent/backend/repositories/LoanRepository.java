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

    // RF2.5: Sumar cantidad total de unidades prestadas por cliente (alternativa más precisa)
    @Query("SELECT COALESCE(SUM(l.quantity), 0) FROM LoanEntity l WHERE l.client = :client AND l.status = 'ACTIVE'")
    long sumActiveQuantityByClient(@Param("client") ClientEntity client);

    // RF6.1: Listar préstamos activos (para reportes)
    @Query("SELECT l FROM LoanEntity l WHERE l.status = 'ACTIVE'")
    List<LoanEntity> findActiveLoans();

    // RF6.1: Listar préstamos atrasados
    @Query("SELECT l FROM LoanEntity l WHERE l.status = 'ACTIVE' AND l.agreedReturnDate < :currentDate")
    List<LoanEntity> findOverdueLoans(@Param("currentDate") LocalDate currentDate);

    // Buscar préstamos por cliente
    List<LoanEntity> findByClient(ClientEntity client);

    // Buscar préstamos por herramienta
    List<LoanEntity> findByTool(ToolEntity tool);

    // Buscar préstamos por estado
    List<LoanEntity> findByStatus(LoanEntity.LoanStatus status);

    // Buscar préstamos en un rango de fechas
    @Query("SELECT l FROM LoanEntity l WHERE l.loanDate BETWEEN :startDate AND :endDate")
    List<LoanEntity> findByLoanDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Buscar préstamos por fecha de devolución acordada
    @Query("SELECT l FROM LoanEntity l WHERE l.agreedReturnDate BETWEEN :startDate AND :endDate")
    List<LoanEntity> findByAgreedReturnDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Estadísticas para reportes
    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.loanDate BETWEEN :startDate AND :endDate")
    long countLoansByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.status = :status")
    long countLoansByStatus(@Param("status") LoanEntity.LoanStatus status);
}
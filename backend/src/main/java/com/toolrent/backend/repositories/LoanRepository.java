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

    // Buscar préstamos que deberían haberse devuelto en un rango de fechas
    @Query("SELECT l FROM LoanEntity l WHERE l.agreedReturnDate BETWEEN :startDate AND :endDate")
    List<LoanEntity> findByAgreedReturnDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Verificar si existe un préstamo activo específico
    @Query("SELECT COUNT(l) > 0 FROM LoanEntity l WHERE l.client = :client AND l.tool = :tool AND l.status = 'ACTIVE'")
    boolean existsActiveLoanByClientAndTool(@Param("client") ClientEntity client, @Param("tool") ToolEntity tool);

    // Obtener préstamos ordenados por fecha de devolución acordada (más urgentes primero)
    @Query("SELECT l FROM LoanEntity l WHERE l.status = 'ACTIVE' ORDER BY l.agreedReturnDate ASC")
    List<LoanEntity> findActiveLoansByReturnDateAsc();

    // Contar préstamos por cliente en un periodo específico
    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.client = :client AND l.loanDate BETWEEN :startDate AND :endDate")
    long countLoansByClientInPeriod(@Param("client") ClientEntity client,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate);

    // MÉTODOS ESPECÍFICOS PARA EL MODELO DE INSTANCIAS:

    // Obtener préstamos de un cliente con herramientas específicas
    @Query("SELECT l FROM LoanEntity l WHERE l.client = :client AND l.tool.id IN :toolIds")
    List<LoanEntity> findByClientAndToolIdIn(@Param("client") ClientEntity client, @Param("toolIds") List<Long> toolIds);

    // Estadísticas de préstamos por herramienta
    @Query("SELECT l.tool.name, COUNT(l), SUM(l.quantity) FROM LoanEntity l GROUP BY l.tool.name ORDER BY COUNT(l) DESC")
    List<Object[]> findMostLoanedTools();

    // Préstamos por cliente con información de la herramienta
    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.client JOIN FETCH l.tool WHERE l.client = :client ORDER BY l.loanDate DESC")
    List<LoanEntity> findByClientWithDetails(@Param("client") ClientEntity client);

    // Préstamos activos con detalles completos (para reportes)
    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.client JOIN FETCH l.tool JOIN FETCH l.createdBy WHERE l.status = 'ACTIVE'")
    List<LoanEntity> findActiveLoansWithDetails();

    // Préstamos que vencen en un rango de fechas (para alertas)
    @Query("SELECT l FROM LoanEntity l WHERE l.status = 'ACTIVE' AND l.agreedReturnDate BETWEEN :startDate AND :endDate ORDER BY l.agreedReturnDate ASC")
    List<LoanEntity> findLoansDueInPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Top clientes con más préstamos
    @Query("SELECT l.client.name, COUNT(l), SUM(l.quantity) FROM LoanEntity l GROUP BY l.client.name ORDER BY COUNT(l) DESC")
    List<Object[]> findTopClientsByLoanCount();

    // Duración promedio de préstamos por herramienta
    @Query("SELECT l.tool.name, AVG(DATEDIFF(l.actualReturnDate, l.loanDate)) FROM LoanEntity l WHERE l.actualReturnDate IS NOT NULL GROUP BY l.tool.name")
    List<Object[]> findAverageLoanDurationByTool();
}
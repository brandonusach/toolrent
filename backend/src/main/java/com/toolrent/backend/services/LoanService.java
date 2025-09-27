// LoanService.java - VERSION CORREGIDA para manejar errores 500
package com.toolrent.backend.services;

import com.toolrent.backend.entities.*;
import com.toolrent.backend.repositories.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private ToolService toolService;

    @Autowired
    private ClientService clientService;

    @Autowired
    private FineService fineService;

    @Autowired
    private RateService rateService;

    @Autowired(required = false) // Hacer opcional en caso de que no esté implementado
    private KardexMovementService kardexMovementService;

    // RF2.5: Check client restrictions - VERSIÓN MEJORADA Y SEGURA
    public Map<String, Object> checkClientRestrictions(Long clientId) {
        Map<String, Object> restrictions = new HashMap<>();

        try {
            if (clientId == null || clientId <= 0) {
                restrictions.put("eligible", false);
                restrictions.put("canRequestLoan", false);
                restrictions.put("restriction", "ID de cliente inválido");
                restrictions.put("clientStatus", "INVALID");
                return restrictions;
            }

            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                restrictions.put("eligible", false);
                restrictions.put("canRequestLoan", false);
                restrictions.put("restriction", "Cliente no encontrado");
                restrictions.put("clientStatus", "NOT_FOUND");
                return restrictions;
            }

            // Verificar estado del cliente
            boolean clientActive = client.getStatus() == ClientEntity.ClientStatus.ACTIVE;

            // Contar préstamos activos
            long activeLoans = loanRepository.countActiveLoansByClient(client);

            // Verificar préstamos vencidos
            List<LoanEntity> overdueLoans = loanRepository.findOverdueLoansByClient(client, LocalDate.now());
            boolean hasOverdueLoans = !overdueLoans.isEmpty();

            // Verificar multas impagas (con manejo de errores)
            boolean hasUnpaidFines = false;
            BigDecimal unpaidAmount = BigDecimal.ZERO;
            try {
                hasUnpaidFines = fineService.clientHasUnpaidFines(client);
                unpaidAmount = fineService.getTotalUnpaidAmount(client);
            } catch (Exception e) {
                // Si hay error con multas, asumir que no hay multas
                System.err.println("Error checking fines for client " + clientId + ": " + e.getMessage());
            }

            // Determinar elegibilidad
            boolean eligible = clientActive &&
                    !hasOverdueLoans &&
                    !hasUnpaidFines &&
                    activeLoans < 5;

            restrictions.put("eligible", eligible);
            restrictions.put("canRequestLoan", eligible);
            restrictions.put("currentActiveLoans", activeLoans);
            restrictions.put("maxAllowed", 5);
            restrictions.put("remainingLoanSlots", Math.max(0, 5 - activeLoans));
            restrictions.put("clientStatus", client.getStatus().toString());

            // Agregar detalles de restricciones
            if (!eligible) {
                StringBuilder restrictionReason = new StringBuilder();

                if (!clientActive) {
                    restrictionReason.append("Cliente no está activo. ");
                }
                if (hasOverdueLoans) {
                    restrictionReason.append("Cliente tiene ").append(overdueLoans.size()).append(" préstamo(s) vencido(s). ");
                }
                if (hasUnpaidFines) {
                    restrictionReason.append("Cliente tiene multas impagas por $").append(unpaidAmount).append(". ");
                }
                if (activeLoans >= 5) {
                    restrictionReason.append("Cliente ha alcanzado el límite de 5 préstamos activos. ");
                }

                restrictions.put("restriction", restrictionReason.toString().trim());
            } else {
                restrictions.put("message", "Cliente elegible para nuevos préstamos");
            }

            // Información adicional
            restrictions.put("overdueLoansCount", overdueLoans.size());
            restrictions.put("unpaidFinesAmount", unpaidAmount);
            restrictions.put("hasUnpaidFines", hasUnpaidFines);
            restrictions.put("hasOverdueLoans", hasOverdueLoans);

        } catch (Exception e) {
            System.err.println("Error in checkClientRestrictions: " + e.getMessage());
            e.printStackTrace();

            // Respuesta de error segura
            restrictions.put("eligible", false);
            restrictions.put("canRequestLoan", false);
            restrictions.put("restriction", "Error al verificar restricciones: " + e.getMessage());
            restrictions.put("clientStatus", "ERROR");
            restrictions.put("error", true);
        }

        return restrictions;
    }

    // Check tool availability - VERSIÓN MEJORADA
    public Map<String, Object> checkToolAvailability(ToolEntity tool, Integer quantity) {
        Map<String, Object> availability = new HashMap<>();

        try {
            if (tool == null) {
                availability.put("available", false);
                availability.put("issue", "Herramienta no encontrada");
                availability.put("toolStatus", "NOT_FOUND");
                availability.put("currentStock", 0);
                return availability;
            }

            if (quantity == null || quantity <= 0) {
                availability.put("available", false);
                availability.put("issue", "Cantidad debe ser mayor a 0");
                availability.put("toolStatus", tool.getStatus().toString());
                availability.put("currentStock", tool.getCurrentStock());
                return availability;
            }

            // Verificar estado de la herramienta
            boolean toolAvailable = tool.getStatus() == ToolEntity.ToolStatus.AVAILABLE;

            // Verificar stock
            boolean hasStock = tool.getCurrentStock() >= quantity;

            availability.put("available", toolAvailable && hasStock);
            availability.put("currentStock", tool.getCurrentStock());
            availability.put("requestedQuantity", quantity);
            availability.put("toolName", tool.getName());
            availability.put("toolStatus", tool.getStatus().toString());
            availability.put("maxAvailableQuantity", tool.getCurrentStock());

            if (!toolAvailable) {
                availability.put("issue", "Herramienta no está disponible. Estado actual: " + tool.getStatus());
                availability.put("issueType", "TOOL_STATUS");
            } else if (!hasStock) {
                availability.put("issue", "Stock insuficiente. Solicitado: " + quantity + ", Disponible: " + tool.getCurrentStock());
                availability.put("issueType", "INSUFFICIENT_STOCK");
            } else {
                availability.put("message", "Herramienta disponible para préstamo");
            }

        } catch (Exception e) {
            System.err.println("Error in checkToolAvailability: " + e.getMessage());
            availability.put("available", false);
            availability.put("issue", "Error al verificar disponibilidad: " + e.getMessage());
            availability.put("error", true);
        }

        return availability;
    }

    // RF6.1: Get active loans - VERSIÓN SEGURA
    public List<LoanEntity> getActiveLoans() {
        try {
            return loanRepository.findActiveLoans();
        } catch (Exception e) {
            System.err.println("Error getting active loans: " + e.getMessage());
            // Fallback: buscar por status
            try {
                return loanRepository.findByStatus(LoanEntity.LoanStatus.ACTIVE);
            } catch (Exception fallbackError) {
                System.err.println("Fallback also failed: " + fallbackError.getMessage());
                return List.of(); // Retornar lista vacía en caso de error
            }
        }
    }

    // RF6.1: Get overdue loans - VERSIÓN SEGURA
    public List<LoanEntity> getOverdueLoans() {
        try {
            return loanRepository.findOverdueLoans(LocalDate.now());
        } catch (Exception e) {
            System.err.println("Error getting overdue loans: " + e.getMessage());
            // Fallback: filtrar manualmente
            try {
                List<LoanEntity> activeLoans = getActiveLoans();
                LocalDate today = LocalDate.now();
                return activeLoans.stream()
                        .filter(loan -> loan.getAgreedReturnDate().isBefore(today))
                        .collect(Collectors.toList());
            } catch (Exception fallbackError) {
                System.err.println("Fallback for overdue loans failed: " + fallbackError.getMessage());
                return List.of();
            }
        }
    }

    // Get loans by client - VERSIÓN SEGURA
    public List<LoanEntity> getLoansByClient(ClientEntity client) {
        try {
            if (client == null) {
                return List.of();
            }
            return loanRepository.findByClient(client);
        } catch (Exception e) {
            System.err.println("Error getting loans by client: " + e.getMessage());
            return List.of();
        }
    }

    // Check if client has active loan for specific tool - VERSIÓN MEJORADA
    public Map<String, Object> checkClientToolLoan(ClientEntity client, ToolEntity tool) {
        Map<String, Object> check = new HashMap<>();

        try {
            if (client == null) {
                check.put("hasActiveLoanForTool", false);
                check.put("canLoanThisTool", false);
                check.put("error", "Cliente no encontrado");
                check.put("message", "Cliente no válido");
                return check;
            }

            if (tool == null) {
                check.put("hasActiveLoanForTool", false);
                check.put("canLoanThisTool", false);
                check.put("error", "Herramienta no encontrada");
                check.put("message", "Herramienta no válida");
                return check;
            }

            boolean hasActiveLoan = loanRepository.existsActiveLoanByClientAndTool(client, tool);

            check.put("hasActiveLoanForTool", hasActiveLoan);
            check.put("canLoanThisTool", !hasActiveLoan);
            check.put("clientId", client.getId());
            check.put("clientName", client.getName());
            check.put("toolId", tool.getId());
            check.put("toolName", tool.getName());

            if (hasActiveLoan) {
                // Buscar el préstamo activo específico
                List<LoanEntity> activeLoans = loanRepository.findByClient(client).stream()
                        .filter(l -> l.getStatus() == LoanEntity.LoanStatus.ACTIVE &&
                                l.getTool().getId().equals(tool.getId()))
                        .collect(Collectors.toList());

                if (!activeLoans.isEmpty()) {
                    LoanEntity activeLoan = activeLoans.get(0);
                    check.put("activeLoanId", activeLoan.getId());
                    check.put("loanDate", activeLoan.getLoanDate());
                    check.put("agreedReturnDate", activeLoan.getAgreedReturnDate());
                    check.put("quantity", activeLoan.getQuantity());
                }
                check.put("message", "Cliente ya tiene un préstamo activo de esta herramienta");
            } else {
                check.put("message", "Cliente puede solicitar un préstamo de esta herramienta");
            }

        } catch (Exception e) {
            System.err.println("Error checking client tool loan: " + e.getMessage());
            check.put("hasActiveLoanForTool", false);
            check.put("canLoanThisTool", false);
            check.put("error", "Error al verificar préstamo: " + e.getMessage());
            check.put("message", "Error en la verificación");
        }

        return check;
    }

    // Get active loan count for client - VERSIÓN SEGURA
    public Map<String, Object> getActiveLoanCount(Long clientId) {
        Map<String, Object> result = new HashMap<>();

        try {
            if (clientId == null || clientId <= 0) {
                result.put("clientId", clientId);
                result.put("activeLoanCount", 0);
                result.put("maxAllowed", 5);
                result.put("canRequestMore", false);
                result.put("error", "ID de cliente inválido");
                return result;
            }

            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                result.put("clientId", clientId);
                result.put("activeLoanCount", 0);
                result.put("maxAllowed", 5);
                result.put("canRequestMore", false);
                result.put("error", "Cliente no encontrado");
                return result;
            }

            long count = loanRepository.countActiveLoansByClient(client);

            result.put("clientId", clientId);
            result.put("activeLoanCount", count);
            result.put("maxAllowed", 5);
            result.put("canRequestMore", count < 5);

        } catch (Exception e) {
            System.err.println("Error getting active loan count: " + e.getMessage());
            result.put("clientId", clientId);
            result.put("activeLoanCount", 0);
            result.put("maxAllowed", 5);
            result.put("canRequestMore", false);
            result.put("error", "Error al contar préstamos activos: " + e.getMessage());
        }

        return result;
    }

    // Get current rates - VERSIÓN SEGURA
    public Map<String, Object> getCurrentRates() {
        Map<String, Object> rates = new HashMap<>();
        try {
            rates.put("rentalRate", rateService.getCurrentRentalRate());
            rates.put("lateFeeRate", rateService.getCurrentLateFeeRate());
            rates.put("repairRate", rateService.getCurrentRepairRate());
        } catch (Exception e) {
            System.err.println("Error getting current rates: " + e.getMessage());
            // Valores por defecto
            rates.put("rentalRate", BigDecimal.valueOf(100.0));
            rates.put("lateFeeRate", BigDecimal.valueOf(10.0));
            rates.put("repairRate", BigDecimal.valueOf(0.2));
            rates.put("error", "Usando valores por defecto");
        }
        return rates;
    }

    // Métodos básicos - VERSIONES SEGURAS
    public List<LoanEntity> getAllLoans() {
        try {
            return loanRepository.findAll();
        } catch (Exception e) {
            System.err.println("Error getting all loans: " + e.getMessage());
            return List.of();
        }
    }

    public LoanEntity getLoanById(Long id) {
        try {
            return loanRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Loan not found with ID: " + id));
        } catch (Exception e) {
            throw new RuntimeException("Error getting loan by ID: " + e.getMessage());
        }
    }

    // RF2.1: Create new loan - VERSIÓN MEJORADA
    @Transactional
    public LoanEntity createLoan(LoanEntity loan) {
        try {
            validateLoanCreation(loan);

            if (loan.getLoanDate() == null) {
                loan.setLoanDate(LocalDate.now());
            }

            // Get current rental rate
            BigDecimal dailyRate;
            try {
                dailyRate = rateService.getCurrentRentalRate();
            } catch (Exception e) {
                System.err.println("Error getting rental rate, using default: " + e.getMessage());
                dailyRate = BigDecimal.valueOf(100.0); // Valor por defecto
            }

            loan.setDailyRate(dailyRate);
            loan.setStatus(LoanEntity.LoanStatus.ACTIVE);

            // Update tool stock
            ToolEntity tool = loan.getTool();
            int newStock = tool.getCurrentStock() - loan.getQuantity();
            tool.setCurrentStock(newStock);
            toolService.updateTool(tool.getId(), tool);

            LoanEntity savedLoan = loanRepository.save(loan);

            // Create Kardex movement (opcional)
            if (kardexMovementService != null) {
                try {
                    kardexMovementService.createMovement(
                            loan.getTool(),
                            KardexMovementEntity.MovementType.LOAN,
                            loan.getQuantity(),
                            "Loan #" + savedLoan.getId() + " - Client: " + loan.getClient().getName(),
                            savedLoan
                    );
                } catch (Exception e) {
                    System.err.println("Error creating kardex movement: " + e.getMessage());
                    // No fallar el préstamo por esto
                }
            }

            return savedLoan;
        } catch (Exception e) {
            System.err.println("Error creating loan: " + e.getMessage());
            throw new RuntimeException("Error al crear préstamo: " + e.getMessage());
        }
    }

    // Validate loan creation - VERSIÓN MEJORADA
    private void validateLoanCreation(LoanEntity loan) {
        if (loan == null) {
            throw new RuntimeException("Datos del préstamo son requeridos");
        }
        if (loan.getClient() == null) {
            throw new RuntimeException("Cliente es requerido para el préstamo");
        }
        if (loan.getTool() == null) {
            throw new RuntimeException("Herramienta es requerida para el préstamo");
        }
        if (loan.getQuantity() == null || loan.getQuantity() <= 0) {
            throw new RuntimeException("La cantidad debe ser mayor a 0");
        }
        if (loan.getAgreedReturnDate() == null) {
            throw new RuntimeException("Fecha acordada de devolución es requerida");
        }

        // Verificar estado del cliente
        if (loan.getClient().getStatus() != ClientEntity.ClientStatus.ACTIVE) {
            throw new RuntimeException("Cliente está restringido y no puede solicitar préstamos");
        }

        // Verificar préstamos vencidos
        List<LoanEntity> overdueLoans = loanRepository.findOverdueLoansByClient(
                loan.getClient(), LocalDate.now());
        if (!overdueLoans.isEmpty()) {
            throw new RuntimeException("Cliente tiene préstamos vencidos y no puede solicitar nuevos préstamos");
        }

        // Verificar multas impagas (con manejo de errores)
        try {
            if (fineService.clientHasUnpaidFines(loan.getClient())) {
                throw new RuntimeException("Cliente tiene multas impagas y no puede solicitar préstamos");
            }
        } catch (Exception e) {
            System.err.println("Error checking unpaid fines, allowing loan: " + e.getMessage());
        }

        // Verificar estado de herramienta
        if (loan.getTool().getStatus() != ToolEntity.ToolStatus.AVAILABLE) {
            throw new RuntimeException("Herramienta no está disponible para préstamo");
        }

        // Verificar stock
        if (loan.getQuantity() > loan.getTool().getCurrentStock()) {
            throw new RuntimeException("Stock insuficiente. Solicitado: " + loan.getQuantity() +
                    ", Disponible: " + loan.getTool().getCurrentStock());
        }

        // Verificar límite de préstamos
        long activeLoanCount = loanRepository.countActiveLoansByClient(loan.getClient());
        if (activeLoanCount >= 5) {
            throw new RuntimeException("Cliente ha alcanzado el máximo de 5 préstamos activos");
        }

        // Verificar préstamo existente de la misma herramienta
        boolean hasActiveLoanForTool = loanRepository.existsActiveLoanByClientAndTool(
                loan.getClient(), loan.getTool());
        if (hasActiveLoanForTool) {
            throw new RuntimeException("Cliente ya tiene un préstamo activo de esta herramienta");
        }

        // Verificar fecha
        LocalDate loanDate = loan.getLoanDate() != null ? loan.getLoanDate() : LocalDate.now();
        if (loan.getAgreedReturnDate().isBefore(loanDate) ||
                loan.getAgreedReturnDate().isEqual(loanDate)) {
            throw new RuntimeException("La fecha de devolución debe ser posterior a la fecha del préstamo");
        }
    }

    // MÉTODOS FALTANTES QUE NECESITA EL CONTROLADOR:

    // Update loan - NUEVO MÉTODO REQUERIDO
    @Transactional
    public LoanEntity updateLoan(Long id, LoanEntity updatedLoan) {
        try {
            LoanEntity existingLoan = loanRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Loan not found with ID: " + id));

            if (existingLoan.getStatus() != LoanEntity.LoanStatus.ACTIVE) {
                throw new RuntimeException("Can only update active loans");
            }

            // Solo permitir actualizar fecha acordada y notas
            if (updatedLoan.getAgreedReturnDate() != null) {
                if (updatedLoan.getAgreedReturnDate().isBefore(LocalDate.now())) {
                    throw new RuntimeException("Agreed return date cannot be in the past");
                }
                existingLoan.setAgreedReturnDate(updatedLoan.getAgreedReturnDate());
            }

            if (updatedLoan.getNotes() != null) {
                existingLoan.setNotes(updatedLoan.getNotes());
            }

            return loanRepository.save(existingLoan);
        } catch (Exception e) {
            System.err.println("Error updating loan: " + e.getMessage());
            throw new RuntimeException("Error al actualizar préstamo: " + e.getMessage());
        }
    }

    // Delete loan - NUEVO MÉTODO REQUERIDO
    @Transactional
    public void deleteLoan(Long id) {
        try {
            LoanEntity loan = loanRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Loan not found with ID: " + id));

            if (loan.getStatus() == LoanEntity.LoanStatus.ACTIVE) {
                throw new RuntimeException("Cannot delete active loan. Please return the tool first.");
            }

            // Verificar si hay multas asociadas
            try {
                List<FineEntity> associatedFines = fineService.getFinesByLoan(loan);
                if (!associatedFines.isEmpty()) {
                    throw new RuntimeException("Cannot delete loan with associated fines.");
                }
            } catch (Exception e) {
                System.err.println("Error checking associated fines: " + e.getMessage());
                // Continuar con la eliminación si no se pueden verificar las multas
            }

            // Eliminar movimientos de kardex si existe el servicio
            if (kardexMovementService != null) {
                try {
                    kardexMovementService.deleteMovementsByLoan(id);
                } catch (Exception e) {
                    System.err.println("Error deleting kardex movements: " + e.getMessage());
                }
            }

            loanRepository.deleteById(id);
        } catch (Exception e) {
            System.err.println("Error deleting loan: " + e.getMessage());
            throw new RuntimeException("Error al eliminar préstamo: " + e.getMessage());
        }
    }

    // Return tool - NUEVO MÉTODO REQUERIDO
    @Transactional
    public LoanEntity returnTool(Long loanId, Boolean damaged, String notes) {
        try {
            LoanEntity loan = loanRepository.findById(loanId)
                    .orElseThrow(() -> new RuntimeException("Loan not found with ID: " + loanId));

            if (loan.getStatus() != LoanEntity.LoanStatus.ACTIVE) {
                throw new RuntimeException("Loan is not active and cannot be returned");
            }

            loan.setActualReturnDate(LocalDate.now());

            // Agregar notas si se proporcionan
            if (notes != null && !notes.trim().isEmpty()) {
                String existingNotes = loan.getNotes() != null ? loan.getNotes() : "";
                loan.setNotes(existingNotes.isEmpty() ? notes : existingNotes + "\n" + notes);
            }

            // Actualizar stock de herramienta
            ToolEntity tool = loan.getTool();
            if (damaged != null && damaged) {
                // Herramienta dañada - cambiar estado a reparación
                tool.setStatus(ToolEntity.ToolStatus.UNDER_REPAIR);
                // No devolver stock aún, se devolverá cuando termine la reparación
            } else {
                // Devolución normal - restaurar stock
                int newStock = tool.getCurrentStock() + loan.getQuantity();
                tool.setCurrentStock(newStock);
            }

            try {
                toolService.updateTool(tool.getId(), tool);
            } catch (Exception e) {
                System.err.println("Error updating tool stock: " + e.getMessage());
                // No fallar la devolución por esto
            }

            // Calcular y crear multas automáticamente si es necesario
            try {
                calculateAndCreateFinesAutomatically(loan, damaged != null && damaged);
            } catch (Exception e) {
                System.err.println("Error calculating fines: " + e.getMessage());
                // No fallar la devolución por esto
            }

            // Actualizar estado del préstamo
            if (damaged != null && damaged) {
                loan.setStatus(LoanEntity.LoanStatus.DAMAGED);
            } else if (isOverdue(loan)) {
                loan.setStatus(LoanEntity.LoanStatus.OVERDUE);
            } else {
                loan.setStatus(LoanEntity.LoanStatus.RETURNED);
            }

            // Crear movimiento de kardex para devolución
            if (kardexMovementService != null) {
                try {
                    kardexMovementService.createMovement(
                            loan.getTool(),
                            KardexMovementEntity.MovementType.RETURN,
                            loan.getQuantity(),
                            "Return loan #" + loan.getId() + " - " + ((damaged != null && damaged) ? "With damage" : "Good condition"),
                            loan
                    );
                } catch (Exception e) {
                    System.err.println("Error creating kardex movement: " + e.getMessage());
                }
            }

            return loanRepository.save(loan);
        } catch (Exception e) {
            System.err.println("Error returning tool: " + e.getMessage());
            throw new RuntimeException("Error al procesar devolución: " + e.getMessage());
        }
    }

    // Get loans by tool - NUEVO MÉTODO REQUERIDO
    public List<LoanEntity> getLoansByTool(ToolEntity tool) {
        try {
            if (tool == null) {
                return List.of();
            }
            return loanRepository.findByTool(tool);
        } catch (Exception e) {
            System.err.println("Error getting loans by tool: " + e.getMessage());
            return List.of();
        }
    }

    // Get loan summary - NUEVO MÉTODO REQUERIDO
    public Map<String, Object> getLoanSummary() {
        try {
            List<LoanEntity> allLoans = getAllLoans();
            List<LoanEntity> activeLoans = getActiveLoans();
            List<LoanEntity> overdueLoans = getOverdueLoans();

            Map<String, Object> summary = new HashMap<>();

            summary.put("totalLoans", allLoans.size());
            summary.put("activeLoans", activeLoans.size());
            summary.put("overdueLoans", overdueLoans.size());

            long returnedLoans = allLoans.stream()
                    .filter(loan -> loan.getStatus() == LoanEntity.LoanStatus.RETURNED)
                    .count();

            long damagedLoans = allLoans.stream()
                    .filter(loan -> loan.getStatus() == LoanEntity.LoanStatus.DAMAGED)
                    .count();

            summary.put("returnedLoans", returnedLoans);
            summary.put("damagedLoans", damagedLoans);

            // Estadísticas del mes actual
            LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
            LocalDate endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

            long loansThisMonth = allLoans.stream()
                    .filter(loan -> loan.getLoanDate() != null &&
                            loan.getLoanDate().isAfter(startOfMonth.minusDays(1)) &&
                            loan.getLoanDate().isBefore(endOfMonth.plusDays(1)))
                    .count();

            summary.put("loansThisMonth", loansThisMonth);

            // Clientes activos únicos
            long uniqueActiveClients = activeLoans.stream()
                    .map(loan -> loan.getClient().getId())
                    .distinct()
                    .count();

            summary.put("uniqueActiveClients", uniqueActiveClients);

            return summary;
        } catch (Exception e) {
            System.err.println("Error getting loan summary: " + e.getMessage());
            Map<String, Object> errorSummary = new HashMap<>();
            errorSummary.put("error", "Error al obtener resumen de préstamos");
            errorSummary.put("totalLoans", 0);
            errorSummary.put("activeLoans", 0);
            errorSummary.put("overdueLoans", 0);
            return errorSummary;
        }
    }

    // Get validation summary - NUEVO MÉTODO REQUERIDO
    public LoanValidationSummary getLoanValidationSummary(ClientEntity client, ToolEntity tool, Integer quantity) {
        try {
            LoanValidationSummary summary = new LoanValidationSummary();

            // Validar cliente
            try {
                validateClientEligibility(client);
                summary.setClientEligible(true);
            } catch (RuntimeException e) {
                summary.setClientEligible(false);
                summary.setClientIssue(e.getMessage());
            }

            // Validar herramienta
            try {
                validateToolAvailability(tool, quantity);
                summary.setToolAvailable(true);
            } catch (RuntimeException e) {
                summary.setToolAvailable(false);
                summary.setToolIssue(e.getMessage());
            }

            summary.setHasExistingLoanForTool(clientHasActiveLoanForTool(client, tool));

            // Obtener tarifas actuales
            try {
                summary.setCurrentDailyRate(rateService.getCurrentRentalRate());
                summary.setCurrentLateFeeRate(rateService.getCurrentLateFeeRate());
            } catch (Exception e) {
                summary.setCurrentDailyRate(BigDecimal.valueOf(100.0));
                summary.setCurrentLateFeeRate(BigDecimal.valueOf(10.0));
            }

            return summary;
        } catch (Exception e) {
            System.err.println("Error getting loan validation summary: " + e.getMessage());
            LoanValidationSummary errorSummary = new LoanValidationSummary();
            errorSummary.setClientEligible(false);
            errorSummary.setToolAvailable(false);
            errorSummary.setClientIssue("Error en validación: " + e.getMessage());
            return errorSummary;
        }
    }

    // MÉTODOS AUXILIARES PRIVADOS:

    private void validateClientEligibility(ClientEntity client) {
        if (client == null) {
            throw new RuntimeException("Cliente es requerido");
        }
        if (client.getStatus() != ClientEntity.ClientStatus.ACTIVE) {
            throw new RuntimeException("Cliente no está activo y no puede solicitar préstamos");
        }

        List<LoanEntity> overdueLoans = loanRepository.findOverdueLoansByClient(client, LocalDate.now());
        if (!overdueLoans.isEmpty()) {
            throw new RuntimeException("Cliente tiene " + overdueLoans.size() + " préstamo(s) vencido(s)");
        }

        try {
            if (fineService.clientHasUnpaidFines(client)) {
                BigDecimal totalUnpaid = fineService.getTotalUnpaidAmount(client);
                throw new RuntimeException("Cliente tiene multas impagas por: $" + totalUnpaid);
            }
        } catch (Exception e) {
            System.err.println("Error checking fines, allowing loan: " + e.getMessage());
        }

        long activeLoanCount = loanRepository.countActiveLoansByClient(client);
        if (activeLoanCount >= 5) {
            throw new RuntimeException("Cliente ha alcanzado el máximo de 5 préstamos activos");
        }
    }

    private void validateToolAvailability(ToolEntity tool, Integer quantity) {
        if (tool == null) {
            throw new RuntimeException("Herramienta es requerida");
        }
        if (tool.getStatus() != ToolEntity.ToolStatus.AVAILABLE) {
            throw new RuntimeException("Herramienta no está disponible para préstamo. Estado actual: " + tool.getStatus());
        }
        if (quantity == null || quantity <= 0) {
            throw new RuntimeException("Cantidad debe ser mayor a 0");
        }
        if (quantity > tool.getCurrentStock()) {
            throw new RuntimeException("Stock insuficiente. Solicitado: " + quantity +
                    ", Disponible: " + tool.getCurrentStock());
        }
    }

    private boolean clientHasActiveLoanForTool(ClientEntity client, ToolEntity tool) {
        if (client == null || tool == null) {
            return false;
        }
        try {
            return loanRepository.existsActiveLoanByClientAndTool(client, tool);
        } catch (Exception e) {
            System.err.println("Error checking active loan for tool: " + e.getMessage());
            return false;
        }
    }

    private boolean isOverdue(LoanEntity loan) {
        return loan.getActualReturnDate() != null &&
                loan.getActualReturnDate().isAfter(loan.getAgreedReturnDate());
    }

    private void calculateAndCreateFinesAutomatically(LoanEntity loan, boolean damaged) {
        try {
            LocalDate returnDate = loan.getActualReturnDate();
            if (returnDate == null) return;

            // Multa por atraso
            if (returnDate.isAfter(loan.getAgreedReturnDate())) {
                long daysLate = ChronoUnit.DAYS.between(loan.getAgreedReturnDate(), returnDate);
                BigDecimal lateFeeRate = rateService.getCurrentLateFeeRate();
                fineService.createLateFine(loan, daysLate, lateFeeRate);
            }

            // Multa por daño
            if (damaged && loan.getTool().getReplacementValue() != null) {
                BigDecimal repairCost = loan.getTool().getReplacementValue().multiply(BigDecimal.valueOf(0.2)); // 20% del valor
                fineService.createDamageFine(loan, repairCost, "Tool returned with damage - repair cost calculated");
            }
        } catch (Exception e) {
            System.err.println("Error creating automatic fines: " + e.getMessage());
        }
    }

    // CLASE INTERNA PARA VALIDACIÓN - REQUERIDA POR EL CONTROLADOR
    public static class LoanValidationSummary {
        private boolean clientEligible;
        private String clientIssue;
        private boolean toolAvailable;
        private String toolIssue;
        private boolean hasExistingLoanForTool;
        private BigDecimal currentDailyRate;
        private BigDecimal currentLateFeeRate;

        // Getters y setters
        public boolean isClientEligible() { return clientEligible; }
        public void setClientEligible(boolean clientEligible) { this.clientEligible = clientEligible; }

        public String getClientIssue() { return clientIssue; }
        public void setClientIssue(String clientIssue) { this.clientIssue = clientIssue; }

        public boolean isToolAvailable() { return toolAvailable; }
        public void setToolAvailable(boolean toolAvailable) { this.toolAvailable = toolAvailable; }

        public String getToolIssue() { return toolIssue; }
        public void setToolIssue(String toolIssue) { this.toolIssue = toolIssue; }

        public boolean isHasExistingLoanForTool() { return hasExistingLoanForTool; }
        public void setHasExistingLoanForTool(boolean hasExistingLoanForTool) {
            this.hasExistingLoanForTool = hasExistingLoanForTool;
        }

        public BigDecimal getCurrentDailyRate() { return currentDailyRate; }
        public void setCurrentDailyRate(BigDecimal currentDailyRate) {
            this.currentDailyRate = currentDailyRate;
        }

        public BigDecimal getCurrentLateFeeRate() { return currentLateFeeRate; }
        public void setCurrentLateFeeRate(BigDecimal currentLateFeeRate) {
            this.currentLateFeeRate = currentLateFeeRate;
        }

        public boolean canCreateLoan() {
            return clientEligible && toolAvailable && !hasExistingLoanForTool;
        }
    }
}

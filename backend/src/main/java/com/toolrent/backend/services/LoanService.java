package com.toolrent.backend.services;

import com.toolrent.backend.entities.*;
import com.toolrent.backend.repositories.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private ToolInstanceService toolInstanceService;

    @Autowired
    private ClientService clientService;

    @Autowired
    private FineService fineService;

    // *** PUNTO 1: INTEGRACIÓN CON RATESERVICE ***
    @Autowired
    private RateService rateService; // NUEVA INTEGRACIÓN

    @Autowired
    private KardexMovementService kardexMovementService;

    // RF2.1: Create new loan with COMPLETE validations
    @Transactional
    public LoanEntity createLoan(LoanEntity loan) throws Exception {
        // *** PUNTO 3: VALIDACIONES COMPLETAS DE REGLAS DE NEGOCIO ***
        validateLoanCreation(loan);

        // Set loan date to current date if not provided
        if (loan.getLoanDate() == null) {
            loan.setLoanDate(LocalDate.now());
        }

        // *** PUNTO 1: USAR RATESERVICE PARA OBTENER TARIFA ACTUAL ***
        BigDecimal dailyRate = rateService.getCurrentRentalRate();
        loan.setDailyRate(dailyRate);

        // Set status to ACTIVE
        loan.setStatus(LoanEntity.LoanStatus.ACTIVE);

        // Reserve tool instances for the loan
        try {
            toolInstanceService.reserveMultipleInstances(loan.getTool().getId(), loan.getQuantity());
        } catch (Exception e) {
            throw new Exception("Failed to reserve tool instances: " + e.getMessage());
        }

        // Save the loan
        LoanEntity savedLoan = loanRepository.save(loan);

        // Create Kardex movement for loan
        try {
            kardexMovementService.createMovement(
                    loan.getTool(),
                    KardexMovementEntity.MovementType.LOAN,
                    loan.getQuantity(),
                    "Préstamo #" + savedLoan.getId() + " - Cliente: " + loan.getClient().getName(),
                    savedLoan
            );
        } catch (Exception e) {
            throw new Exception("Failed to create kardex movement: " + e.getMessage());
        }

        return savedLoan;
    }

    // *** PUNTO 2: CÁLCULO AUTOMÁTICO DE MULTAS EN DEVOLUCIÓN ***
    @Transactional
    public LoanEntity returnTool(Long loanId, boolean damaged, String notes) throws Exception {
        LoanEntity loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new Exception("Loan not found with ID: " + loanId));

        // Validate that loan is active
        if (loan.getStatus() != LoanEntity.LoanStatus.ACTIVE) {
            throw new Exception("Loan is not active and cannot be returned");
        }

        // Set actual return date
        loan.setActualReturnDate(LocalDate.now());

        // Update notes if provided
        if (notes != null && !notes.trim().isEmpty()) {
            loan.setNotes(loan.getNotes() != null ? loan.getNotes() + "\n" + notes : notes);
        }

        // Return tool instances
        List<ToolInstanceEntity> loanedInstances = toolInstanceService.getInstancesByTool(loan.getTool().getId())
                .stream()
                .filter(instance -> instance.getStatus() == ToolInstanceEntity.ToolInstanceStatus.LOANED)
                .limit(loan.getQuantity())
                .toList();

        for (ToolInstanceEntity instance : loanedInstances) {
            toolInstanceService.returnInstanceFromLoan(instance.getId(), damaged);
        }

        // *** PUNTO 2: CÁLCULO AUTOMÁTICO DE MULTAS USANDO RATESERVICE ***
        calculateAndCreateFinesAutomatically(loan, damaged);

        // Update loan status
        if (damaged) {
            loan.setStatus(LoanEntity.LoanStatus.DAMAGED);
        } else if (isOverdue(loan)) {
            loan.setStatus(LoanEntity.LoanStatus.OVERDUE);
        } else {
            loan.setStatus(LoanEntity.LoanStatus.RETURNED);
        }

        // Create Kardex movement for return
        try {
            kardexMovementService.createMovement(
                    loan.getTool(),
                    KardexMovementEntity.MovementType.RETURN,
                    loan.getQuantity(),
                    "Devolución préstamo #" + loan.getId() + " - " +
                            (damaged ? "Con daños" : "En buen estado"),
                    loan
            );
        } catch (Exception e) {
            throw new Exception("Failed to create return kardex movement: " + e.getMessage());
        }

        // Update client status if necessary
        updateClientStatusAfterReturn(loan.getClient());

        return loanRepository.save(loan);
    }

    // *** PUNTO 3: VALIDACIONES COMPLETAS DE REGLAS DE NEGOCIO ***
    private void validateLoanCreation(LoanEntity loan) throws Exception {
        // Validate required fields
        if (loan.getClient() == null) {
            throw new Exception("Client is required for loan");
        }
        if (loan.getTool() == null) {
            throw new Exception("Tool is required for loan");
        }
        if (loan.getQuantity() == null || loan.getQuantity() <= 0) {
            throw new Exception("Quantity must be greater than 0");
        }
        if (loan.getAgreedReturnDate() == null) {
            throw new Exception("Agreed return date is required");
        }

        // BR: Client must be ACTIVE (not restricted)
        if (loan.getClient().getStatus() != ClientEntity.ClientStatus.ACTIVE) {
            throw new Exception("Client is restricted and cannot request loans");
        }

        // BR: Client cannot have overdue loans
        List<LoanEntity> overdueLoans = loanRepository.findOverdueLoansByClient(
                loan.getClient(), LocalDate.now());
        if (!overdueLoans.isEmpty()) {
            throw new Exception("Client has overdue loans and cannot request new loans");
        }

        // BR: Client cannot have unpaid fines
        if (fineService.clientHasUnpaidFines(loan.getClient())) {
            throw new Exception("Client has unpaid fines and cannot request new loans");
        }

        // BR: Tool must be AVAILABLE
        if (loan.getTool().getStatus() != ToolEntity.ToolStatus.AVAILABLE) {
            throw new Exception("Tool is not available for loan");
        }

        // BR: Check tool availability (RF2.2)
        if (!toolInstanceService.isAvailable(loan.getTool().getId(), loan.getQuantity())) {
            throw new Exception("Not enough tool instances available");
        }

        // *** BR: Client cannot have more than 5 ACTIVE loans ***
        long activeLoanCount = loanRepository.countActiveLoansByClient(loan.getClient());
        if (activeLoanCount >= 5) {
            throw new Exception("Client has reached maximum of 5 active loans");
        }

        // *** BR: Client cannot have more than one unit of same tool ***
        boolean hasActiveLoanForTool = loanRepository.existsActiveLoanByClientAndTool(
                loan.getClient(), loan.getTool());
        if (hasActiveLoanForTool) {
            throw new Exception("Client already has an active loan for this tool");
        }

        // BR: Return date must be after loan date
        LocalDate loanDate = loan.getLoanDate() != null ? loan.getLoanDate() : LocalDate.now();
        if (loan.getAgreedReturnDate().isBefore(loanDate) ||
                loan.getAgreedReturnDate().isEqual(loanDate)) {
            throw new Exception("Return date must be after loan date");
        }

        // *** BR: Additional business rule - prevent excessive quantity ***
        if (loan.getQuantity() > loan.getTool().getCurrentStock()) {
            throw new Exception("Cannot loan more units than available in stock. Available: "
                    + loan.getTool().getCurrentStock());
        }
    }

    // *** PUNTO 2: CÁLCULO AUTOMÁTICO DE MULTAS USANDO RATESERVICE ***
    private void calculateAndCreateFinesAutomatically(LoanEntity loan, boolean damaged) throws Exception {
        LocalDate returnDate = loan.getActualReturnDate();

        // RF2.4: Calculate late return fine using RateService
        if (returnDate.isAfter(loan.getAgreedReturnDate())) {
            long daysLate = ChronoUnit.DAYS.between(loan.getAgreedReturnDate(), returnDate);
            BigDecimal lateFeeRate = rateService.getCurrentLateFeeRate();
            BigDecimal totalLateFine = lateFeeRate.multiply(BigDecimal.valueOf(daysLate));

            fineService.createLateFine(loan, daysLate, lateFeeRate);
        }

        // Create damage fine if tool was returned damaged
        if (damaged) {
            // Calculate repair cost using RateService
            BigDecimal repairPercentage = rateService.getCurrentRepairRate(); // Should return percentage like 30%
            BigDecimal repairCost = rateService.calculateRepairCost(loan.getTool().getReplacementValue());

            fineService.createDamageFine(loan, repairCost,
                    "Herramienta devuelta con daños - Costo de reparación calculado");

            // If damage is severe (this would need business logic to determine),
            // you could create a replacement fine instead:
            // fineService.createReplacementFine(loan, loan.getTool().getReplacementValue());
        }
    }

    // *** MÉTODO PARA VALIDAR RESTRICCIONES DE CLIENTE ANTES DE PRÉSTAMO ***
    public void validateClientEligibility(ClientEntity client) throws Exception {
        // Check client status
        if (client.getStatus() != ClientEntity.ClientStatus.ACTIVE) {
            throw new Exception("Client is not active and cannot request loans");
        }

        // Check for overdue loans
        List<LoanEntity> overdueLoans = loanRepository.findOverdueLoansByClient(client, LocalDate.now());
        if (!overdueLoans.isEmpty()) {
            throw new Exception("Client has " + overdueLoans.size() + " overdue loan(s)");
        }

        // Check for unpaid fines
        if (fineService.clientHasUnpaidFines(client)) {
            BigDecimal totalUnpaid = fineService.getTotalUnpaidAmount(client);
            throw new Exception("Client has unpaid fines totaling: $" + totalUnpaid);
        }

        // Check active loan limit
        long activeLoanCount = loanRepository.countActiveLoansByClient(client);
        if (activeLoanCount >= 5) {
            throw new Exception("Client has reached the maximum of 5 active loans");
        }
    }

    // *** MÉTODO PARA VERIFICAR DISPONIBILIDAD DE HERRAMIENTA ***
    public void validateToolAvailability(ToolEntity tool, int quantity) throws Exception {
        // Check tool status
        if (tool.getStatus() != ToolEntity.ToolStatus.AVAILABLE) {
            throw new Exception("Tool is not available for loan. Current status: " + tool.getStatus());
        }

        // Check stock availability
        if (quantity > tool.getCurrentStock()) {
            throw new Exception("Insufficient stock. Requested: " + quantity +
                    ", Available: " + tool.getCurrentStock());
        }

        // Check if enough instances are available
        if (!toolInstanceService.isAvailable(tool.getId(), quantity)) {
            throw new Exception("Not enough tool instances available for loan");
        }
    }

    // *** MÉTODO PARA VERIFICAR SI CLIENTE YA TIENE PRÉSTAMO DE LA MISMA HERRAMIENTA ***
    public boolean clientHasActiveLoanForTool(ClientEntity client, ToolEntity tool) {
        return loanRepository.existsActiveLoanByClientAndTool(client, tool);
    }

    // Update client status after return
    private void updateClientStatusAfterReturn(ClientEntity client) throws Exception {
        // Check if client still has restrictions
        boolean hasUnpaidFines = fineService.clientHasUnpaidFines(client);
        boolean hasOverdueLoans = !loanRepository.findOverdueLoansByClient(client, LocalDate.now()).isEmpty();

        if (hasUnpaidFines || hasOverdueLoans) {
            if (client.getStatus() == ClientEntity.ClientStatus.ACTIVE) {
                client.setStatus(ClientEntity.ClientStatus.RESTRICTED);
                clientService.updateClient(client);
            }
        } else {
            // Client can be reactivated if no restrictions remain
            if (client.getStatus() == ClientEntity.ClientStatus.RESTRICTED) {
                client.setStatus(ClientEntity.ClientStatus.ACTIVE);
                clientService.updateClient(client);
            }
        }
    }

    private boolean isOverdue(LoanEntity loan) {
        return loan.getActualReturnDate() != null &&
                loan.getActualReturnDate().isAfter(loan.getAgreedReturnDate());
    }

    // Existing methods remain the same...
    public List<LoanEntity> getActiveLoans() {
        return loanRepository.findActiveLoans();
    }

    public List<LoanEntity> getOverdueLoans() {
        return loanRepository.findOverdueLoans(LocalDate.now());
    }

    public List<LoanEntity> getLoansByClient(ClientEntity client) {
        return loanRepository.findByClient(client);
    }

    public List<LoanEntity> getLoansByTool(ToolEntity tool) {
        return loanRepository.findByTool(tool);
    }

    public LoanEntity getLoanById(Long id) throws Exception {
        return loanRepository.findById(id)
                .orElseThrow(() -> new Exception("Loan not found with ID: " + id));
    }

    public List<LoanEntity> getAllLoans() {
        return loanRepository.findAll();
    }

    // *** MÉTODO ADICIONAL PARA OBTENER ESTADÍSTICAS DE VALIDACIÓN ***
    public LoanValidationSummary getLoanValidationSummary(ClientEntity client, ToolEntity tool, int quantity) {
        LoanValidationSummary summary = new LoanValidationSummary();

        try {
            // Check client eligibility
            validateClientEligibility(client);
            summary.setClientEligible(true);
        } catch (Exception e) {
            summary.setClientEligible(false);
            summary.setClientIssue(e.getMessage());
        }

        try {
            // Check tool availability
            validateToolAvailability(tool, quantity);
            summary.setToolAvailable(true);
        } catch (Exception e) {
            summary.setToolAvailable(false);
            summary.setToolIssue(e.getMessage());
        }

        // Check for existing loan of same tool
        summary.setHasExistingLoanForTool(clientHasActiveLoanForTool(client, tool));

        // Get current rates
        summary.setCurrentDailyRate(rateService.getCurrentRentalRate());
        summary.setCurrentLateFeeRate(rateService.getCurrentLateFeeRate());

        return summary;
    }

    // Helper class for validation summary
    public static class LoanValidationSummary {
        private boolean clientEligible;
        private String clientIssue;
        private boolean toolAvailable;
        private String toolIssue;
        private boolean hasExistingLoanForTool;
        private BigDecimal currentDailyRate;
        private BigDecimal currentLateFeeRate;

        // Getters and setters
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
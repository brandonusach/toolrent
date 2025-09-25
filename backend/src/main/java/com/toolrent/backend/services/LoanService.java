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

    @Autowired
    private KardexMovementService kardexMovementService;

    // RF2.1: Create new loan with complete validations
    @Transactional
    public LoanEntity createLoan(LoanEntity loan) {
        validateLoanCreation(loan);

        if (loan.getLoanDate() == null) {
            loan.setLoanDate(LocalDate.now());
        }

        // Get current rental rate from RateService - RF4.1
        BigDecimal dailyRate = rateService.getCurrentRentalRate();
        loan.setDailyRate(dailyRate);

        loan.setStatus(LoanEntity.LoanStatus.ACTIVE);

        // Update tool stock - RF2.1
        ToolEntity tool = loan.getTool();
        int newStock = tool.getCurrentStock() - loan.getQuantity();
        tool.setCurrentStock(newStock);
        toolService.updateTool(tool.getId(), tool);

        LoanEntity savedLoan = loanRepository.save(loan);

        // Create Kardex movement - RF5.1
        kardexMovementService.createMovement(
                loan.getTool(),
                KardexMovementEntity.MovementType.LOAN,
                loan.getQuantity(),
                "Loan #" + savedLoan.getId() + " - Client: " + loan.getClient().getName(),
                savedLoan
        );

        return savedLoan;
    }

    // RF2.3: Return tool with automatic fine calculation
    @Transactional
    public LoanEntity returnTool(Long loanId, boolean damaged, String notes) {
        LoanEntity loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found with ID: " + loanId));

        if (loan.getStatus() != LoanEntity.LoanStatus.ACTIVE) {
            throw new RuntimeException("Loan is not active and cannot be returned");
        }

        loan.setActualReturnDate(LocalDate.now());

        if (notes != null && !notes.trim().isEmpty()) {
            loan.setNotes(loan.getNotes() != null ? loan.getNotes() + "\n" + notes : notes);
        }

        // Update tool stock - RF2.3
        ToolEntity tool = loan.getTool();

        if (damaged) {
            // Tool damaged - change status to repair
            tool.setStatus(ToolEntity.ToolStatus.UNDER_REPAIR);
            // Don't return stock yet, it will return when repair is complete
        } else {
            // Normal return - restore stock
            int newStock = tool.getCurrentStock() + loan.getQuantity();
            tool.setCurrentStock(newStock);
        }

        toolService.updateTool(tool.getId(), tool);

        // Calculate and create fines automatically - RF2.4, RF2.5
        calculateAndCreateFinesAutomatically(loan, damaged);

        // Update loan status
        if (damaged) {
            loan.setStatus(LoanEntity.LoanStatus.DAMAGED);
        } else if (isOverdue(loan)) {
            loan.setStatus(LoanEntity.LoanStatus.OVERDUE);
        } else {
            loan.setStatus(LoanEntity.LoanStatus.RETURNED);
        }

        // Create Kardex movement for return - RF5.1
        kardexMovementService.createMovement(
                loan.getTool(),
                KardexMovementEntity.MovementType.RETURN,
                loan.getQuantity(),
                "Return loan #" + loan.getId() + " - " + (damaged ? "With damage" : "Good condition"),
                loan
        );

        // Update client status if necessary - RF2.5
        updateClientStatusAfterReturn(loan.getClient());

        return loanRepository.save(loan);
    }

    // Complete loan validation for creation - All RF2 business rules
    private void validateLoanCreation(LoanEntity loan) {
        if (loan.getClient() == null) {
            throw new RuntimeException("Client is required for loan");
        }
        if (loan.getTool() == null) {
            throw new RuntimeException("Tool is required for loan");
        }
        if (loan.getQuantity() == null || loan.getQuantity() <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }
        if (loan.getAgreedReturnDate() == null) {
            throw new RuntimeException("Agreed return date is required");
        }

        // RF2.5: Client must be ACTIVE (not restricted)
        if (loan.getClient().getStatus() != ClientEntity.ClientStatus.ACTIVE) {
            throw new RuntimeException("Client is restricted and cannot request loans");
        }

        // RF2.5: Client cannot have overdue loans
        List<LoanEntity> overdueLoans = loanRepository.findOverdueLoansByClient(
                loan.getClient(), LocalDate.now());
        if (!overdueLoans.isEmpty()) {
            throw new RuntimeException("Client has overdue loans and cannot request new loans");
        }

        // RF2.5: Client cannot have unpaid fines
        if (fineService.clientHasUnpaidFines(loan.getClient())) {
            throw new RuntimeException("Client has unpaid fines and cannot request new loans");
        }

        // RF2.2: Tool must be AVAILABLE
        if (loan.getTool().getStatus() != ToolEntity.ToolStatus.AVAILABLE) {
            throw new RuntimeException("Tool is not available for loan");
        }

        // RF2.2: Check tool stock availability
        if (loan.getQuantity() > loan.getTool().getCurrentStock()) {
            throw new RuntimeException("Insufficient stock. Requested: " + loan.getQuantity() +
                    ", Available: " + loan.getTool().getCurrentStock());
        }

        // RF2.5: Client cannot have more than 5 ACTIVE loans
        long activeLoanCount = loanRepository.countActiveLoansByClient(loan.getClient());
        if (activeLoanCount >= 5) {
            throw new RuntimeException("Client has reached maximum of 5 active loans");
        }

        // RF2.5: Client cannot have more than one unit of same tool
        boolean hasActiveLoanForTool = loanRepository.existsActiveLoanByClientAndTool(
                loan.getClient(), loan.getTool());
        if (hasActiveLoanForTool) {
            throw new RuntimeException("Client already has an active loan for this tool");
        }

        // Return date must be after loan date
        LocalDate loanDate = loan.getLoanDate() != null ? loan.getLoanDate() : LocalDate.now();
        if (loan.getAgreedReturnDate().isBefore(loanDate) ||
                loan.getAgreedReturnDate().isEqual(loanDate)) {
            throw new RuntimeException("Return date must be after loan date");
        }
    }

    // RF2.4: Calculate automatic fines using RateService
    private void calculateAndCreateFinesAutomatically(LoanEntity loan, boolean damaged) {
        LocalDate returnDate = loan.getActualReturnDate();

        // Late return fine
        if (returnDate.isAfter(loan.getAgreedReturnDate())) {
            long daysLate = ChronoUnit.DAYS.between(loan.getAgreedReturnDate(), returnDate);
            BigDecimal lateFeeRate = rateService.getCurrentLateFeeRate();

            fineService.createLateFine(loan, daysLate, lateFeeRate);
        }

        // Damage fine
        if (damaged) {
            BigDecimal repairCost = rateService.calculateRepairCost(loan.getTool().getReplacementValue());
            fineService.createDamageFine(loan, repairCost, "Tool returned with damage - repair cost calculated");
        }
    }

    // Update loan (limited to agreed return date and notes only)
    @Transactional
    public LoanEntity updateLoan(Long id, LoanEntity updatedLoan) {
        LoanEntity existingLoan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found with ID: " + id));

        if (existingLoan.getStatus() != LoanEntity.LoanStatus.ACTIVE) {
            throw new RuntimeException("Can only update active loans");
        }

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
    }

    // Delete loan (only non-active loans without fines)
    @Transactional
    public void deleteLoan(Long id) {
        LoanEntity loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found with ID: " + id));

        if (loan.getStatus() == LoanEntity.LoanStatus.ACTIVE) {
            throw new RuntimeException("Cannot delete active loan. Please return the tool first.");
        }

        List<FineEntity> associatedFines = fineService.getFinesByLoan(loan);
        if (!associatedFines.isEmpty()) {
            throw new RuntimeException("Cannot delete loan with associated fines.");
        }

        kardexMovementService.deleteMovementsByLoan(loan.getId());
        loanRepository.deleteById(id);
    }

    // RF2.5: Check client restrictions for loan eligibility
    public Map<String, Object> checkClientRestrictions(Long clientId) {
        ClientEntity client = clientService.getClientById(clientId);
        Map<String, Object> restrictions = new HashMap<>();

        try {
            validateClientEligibility(client);

            restrictions.put("eligible", true);
            restrictions.put("canRequestLoan", true);
            restrictions.put("message", "Client is eligible for new loans");

            long activeLoans = loanRepository.countActiveLoansByClient(client);
            restrictions.put("currentActiveLoans", activeLoans);
            restrictions.put("maxAllowedLoans", 5);
            restrictions.put("remainingLoanSlots", 5 - activeLoans);

        } catch (RuntimeException e) {
            restrictions.put("eligible", false);
            restrictions.put("canRequestLoan", false);
            restrictions.put("restriction", e.getMessage());

            if (e.getMessage().contains("overdue")) {
                List<LoanEntity> overdueLoans = loanRepository.findOverdueLoansByClient(client, LocalDate.now());
                restrictions.put("overdueLoansCount", overdueLoans.size());
                restrictions.put("restrictionType", "OVERDUE_LOANS");
            } else if (e.getMessage().contains("unpaid fines")) {
                BigDecimal unpaidAmount = fineService.getTotalUnpaidAmount(client);
                restrictions.put("unpaidFinesAmount", unpaidAmount);
                restrictions.put("restrictionType", "UNPAID_FINES");
            } else if (e.getMessage().contains("maximum")) {
                restrictions.put("restrictionType", "MAX_LOANS_REACHED");
            } else if (e.getMessage().contains("restricted")) {
                restrictions.put("restrictionType", "CLIENT_RESTRICTED");
            }
        }

        return restrictions;
    }

    // Check tool availability
    public Map<String, Object> checkToolAvailability(ToolEntity tool, Integer quantity) {
        Map<String, Object> availability = new HashMap<>();

        if (tool == null) {
            availability.put("available", false);
            availability.put("issue", "Tool not found");
            return availability;
        }

        try {
            validateToolAvailability(tool, quantity);

            availability.put("available", true);
            availability.put("currentStock", tool.getCurrentStock());
            availability.put("requestedQuantity", quantity);
            availability.put("message", "Tool is available for loan");
            availability.put("toolName", tool.getName());
            availability.put("toolStatus", tool.getStatus().toString());
            availability.put("maxAvailableQuantity", tool.getCurrentStock());

        } catch (RuntimeException e) {
            availability.put("available", false);
            availability.put("currentStock", tool.getCurrentStock());
            availability.put("requestedQuantity", quantity);
            availability.put("issue", e.getMessage());

            if (e.getMessage().contains("not available for loan")) {
                availability.put("issueType", "TOOL_STATUS");
            } else if (e.getMessage().contains("Insufficient stock")) {
                availability.put("issueType", "INSUFFICIENT_STOCK");
            }
        }

        return availability;
    }

    // Check if client has active loan for specific tool
    public Map<String, Object> checkClientToolLoan(ClientEntity client, ToolEntity tool) {
        Map<String, Object> check = new HashMap<>();

        if (client == null) {
            check.put("error", "Client not found");
            return check;
        }

        if (tool == null) {
            check.put("error", "Tool not found");
            return check;
        }

        boolean hasActiveLoan = clientHasActiveLoanForTool(client, tool);

        check.put("hasActiveLoanForTool", hasActiveLoan);
        check.put("canLoanThisTool", !hasActiveLoan);
        check.put("clientId", client.getId());
        check.put("clientName", client.getName());
        check.put("toolId", tool.getId());
        check.put("toolName", tool.getName());

        if (hasActiveLoan) {
            List<LoanEntity> activeLoans = loanRepository.findByClient(client).stream()
                    .filter(l -> l.getStatus() == LoanEntity.LoanStatus.ACTIVE &&
                            l.getTool().getId().equals(tool.getId()))
                    .toList();

            if (!activeLoans.isEmpty()) {
                LoanEntity activeLoan = activeLoans.get(0);
                check.put("activeLoanId", activeLoan.getId());
                check.put("loanDate", activeLoan.getLoanDate());
                check.put("agreedReturnDate", activeLoan.getAgreedReturnDate());
                check.put("quantity", activeLoan.getQuantity());
            }
            check.put("message", "Client already has an active loan for this tool");
        } else {
            check.put("message", "Client can request a loan for this tool");
        }

        return check;
    }

    // Get active loan count for client
    public Map<String, Object> getActiveLoanCount(Long clientId) {
        ClientEntity client = clientService.getClientById(clientId);
        long count = loanRepository.countActiveLoansByClient(client);

        Map<String, Object> result = new HashMap<>();
        result.put("clientId", clientId);
        result.put("activeLoanCount", count);
        result.put("maxAllowed", 5);
        result.put("canRequestMore", count < 5);

        return result;
    }

    // Get current rates for loan information
    public Map<String, Object> getCurrentRates() {
        Map<String, Object> rates = new HashMap<>();
        rates.put("rentalRate", rateService.getCurrentRentalRate());
        rates.put("lateFeeRate", rateService.getCurrentLateFeeRate());
        rates.put("repairRate", rateService.getCurrentRepairRate());
        return rates;
    }

    // RF6.1: Get comprehensive loan summary for reports
    public Map<String, Object> getLoanSummary() {
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

        // Current month statistics
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        long loansThisMonth = allLoans.stream()
                .filter(loan -> loan.getLoanDate().isAfter(startOfMonth.minusDays(1)) &&
                        loan.getLoanDate().isBefore(endOfMonth.plusDays(1)))
                .count();

        summary.put("loansThisMonth", loansThisMonth);

        // Unique active clients
        long uniqueActiveClients = activeLoans.stream()
                .map(loan -> loan.getClient().getId())
                .distinct()
                .count();

        summary.put("uniqueActiveClients", uniqueActiveClients);

        // RF6.3: Top 5 most loaned tools
        Map<String, Long> topTools = allLoans.stream()
                .collect(Collectors.groupingBy(
                        loan -> loan.getTool().getName(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));

        summary.put("topTools", topTools);

        return summary;
    }

    // Get validation summary for comprehensive loan checks
    public LoanValidationSummary getLoanValidationSummary(ClientEntity client, ToolEntity tool, int quantity) {
        LoanValidationSummary summary = new LoanValidationSummary();

        try {
            validateClientEligibility(client);
            summary.setClientEligible(true);
        } catch (RuntimeException e) {
            summary.setClientEligible(false);
            summary.setClientIssue(e.getMessage());
        }

        try {
            validateToolAvailability(tool, quantity);
            summary.setToolAvailable(true);
        } catch (RuntimeException e) {
            summary.setToolAvailable(false);
            summary.setToolIssue(e.getMessage());
        }

        summary.setHasExistingLoanForTool(clientHasActiveLoanForTool(client, tool));
        summary.setCurrentDailyRate(rateService.getCurrentRentalRate());
        summary.setCurrentLateFeeRate(rateService.getCurrentLateFeeRate());

        return summary;
    }

    // Basic CRUD methods
    public List<LoanEntity> getAllLoans() {
        return loanRepository.findAll();
    }

    public LoanEntity getLoanById(Long id) {
        return loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found with ID: " + id));
    }

    // RF6.1: Get active loans for reports
    public List<LoanEntity> getActiveLoans() {
        return loanRepository.findActiveLoans();
    }

    // RF6.1: Get overdue loans for reports
    public List<LoanEntity> getOverdueLoans() {
        return loanRepository.findOverdueLoans(LocalDate.now());
    }

    public List<LoanEntity> getLoansByClient(ClientEntity client) {
        return loanRepository.findByClient(client);
    }

    public List<LoanEntity> getLoansByTool(ToolEntity tool) {
        return loanRepository.findByTool(tool);
    }

    // Helper methods
    private void validateClientEligibility(ClientEntity client) {
        if (client.getStatus() != ClientEntity.ClientStatus.ACTIVE) {
            throw new RuntimeException("Client is not active and cannot request loans");
        }

        List<LoanEntity> overdueLoans = loanRepository.findOverdueLoansByClient(client, LocalDate.now());
        if (!overdueLoans.isEmpty()) {
            throw new RuntimeException("Client has " + overdueLoans.size() + " overdue loan(s)");
        }

        if (fineService.clientHasUnpaidFines(client)) {
            BigDecimal totalUnpaid = fineService.getTotalUnpaidAmount(client);
            throw new RuntimeException("Client has unpaid fines totaling: $" + totalUnpaid);
        }

        long activeLoanCount = loanRepository.countActiveLoansByClient(client);
        if (activeLoanCount >= 5) {
            throw new RuntimeException("Client has reached the maximum of 5 active loans");
        }
    }

    private void validateToolAvailability(ToolEntity tool, int quantity) {
        if (tool.getStatus() != ToolEntity.ToolStatus.AVAILABLE) {
            throw new RuntimeException("Tool is not available for loan. Current status: " + tool.getStatus());
        }

        if (quantity > tool.getCurrentStock()) {
            throw new RuntimeException("Insufficient stock. Requested: " + quantity +
                    ", Available: " + tool.getCurrentStock());
        }
    }

    private boolean clientHasActiveLoanForTool(ClientEntity client, ToolEntity tool) {
        return loanRepository.existsActiveLoanByClientAndTool(client, tool);
    }

    private boolean isOverdue(LoanEntity loan) {
        return loan.getActualReturnDate() != null &&
                loan.getActualReturnDate().isAfter(loan.getAgreedReturnDate());
    }

    private void updateClientStatusAfterReturn(ClientEntity client) {
        boolean hasUnpaidFines = fineService.clientHasUnpaidFines(client);
        boolean hasOverdueLoans = !loanRepository.findOverdueLoansByClient(client, LocalDate.now()).isEmpty();

        if (hasUnpaidFines || hasOverdueLoans) {
            if (client.getStatus() == ClientEntity.ClientStatus.ACTIVE) {
                client.setStatus(ClientEntity.ClientStatus.RESTRICTED);
                try {
                    clientService.updateClient(client);
                } catch (Exception e) {
                    throw new RuntimeException("Error updating client status: " + e.getMessage());
                }
            }
        } else {
            if (client.getStatus() == ClientEntity.ClientStatus.RESTRICTED) {
                client.setStatus(ClientEntity.ClientStatus.ACTIVE);
                try {
                    clientService.updateClient(client);
                } catch (Exception e) {
                    throw new RuntimeException("Error updating client status: " + e.getMessage());
                }
            }
        }
    }

    // Helper class for loan validation summary
    public static class LoanValidationSummary {
        private boolean clientEligible;
        private String clientIssue;
        private boolean toolAvailable;
        private String toolIssue;
        private boolean hasExistingLoanForTool;
        private BigDecimal currentDailyRate;
        private BigDecimal currentLateFeeRate;

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
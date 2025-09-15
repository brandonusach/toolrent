package com.toolrent.backend.services;

import com.toolrent.backend.entities.*;
import com.toolrent.backend.repositories.LoanRepository;
import com.toolrent.backend.repositories.FineRepository;
import com.toolrent.backend.repositories.RateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
public class LoanService {

    private final LoanRepository loanRepository;
    private final FineRepository fineRepository;
    private final RateRepository rateRepository;
    private final ToolInstanceService toolInstanceService;
    private final ClientService clientService;
    private final KardexMovementService kardexMovementService;

    public LoanService(LoanRepository loanRepository,
                       FineRepository fineRepository,
                       RateRepository rateRepository,
                       ToolInstanceService toolInstanceService,
                       ClientService clientService,
                       KardexMovementService kardexMovementService) {
        this.loanRepository = loanRepository;
        this.fineRepository = fineRepository;
        this.rateRepository = rateRepository;
        this.toolInstanceService = toolInstanceService;
        this.clientService = clientService;
        this.kardexMovementService = kardexMovementService;
    }

    // RF2.1: Create new loan with validations
    @Transactional
    public LoanEntity createLoan(LoanEntity loan) {
        // Validate loan preconditions
        validateLoanCreation(loan);

        // Set loan date to current date if not provided
        if (loan.getLoanDate() == null) {
            loan.setLoanDate(LocalDate.now());
        }

        // Get current rental rate
        BigDecimal dailyRate = getCurrentRentalRate();
        loan.setDailyRate(dailyRate);

        // Set status to ACTIVE
        loan.setStatus(LoanEntity.LoanStatus.ACTIVE);

        // Reserve tool instances for the loan
        try {
            toolInstanceService.reserveMultipleInstances(loan.getTool().getId(), loan.getQuantity());
        } catch (Exception e) {
            throw new RuntimeException("Failed to reserve tool instances: " + e.getMessage());
        }

        // Save the loan
        LoanEntity savedLoan = loanRepository.save(loan);

        // Create Kardex movement for loan (RF2.1)
        try {
            kardexMovementService.createMovement(
                    loan.getTool(),
                    KardexMovementEntity.MovementType.LOAN,
                    loan.getQuantity(),
                    "Préstamo #" + savedLoan.getId() + " - Cliente: " + loan.getClient().getName(),
                    loan.getCreatedBy(),
                    savedLoan
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to create kardex movement: " + e.getMessage());
        }

        return savedLoan;
    }

    // RF2.3: Return tool and calculate fines if necessary
    @Transactional
    public LoanEntity returnTool(Long loanId, boolean damaged, String notes) {
        LoanEntity loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found with ID: " + loanId));

        // Validate that loan is active
        if (loan.getStatus() != LoanEntity.LoanStatus.ACTIVE) {
            throw new RuntimeException("Loan is not active and cannot be returned");
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

        // Calculate and create fines if necessary
        createFinesIfNecessary(loan, damaged);

        // Update loan status
        if (damaged) {
            loan.setStatus(LoanEntity.LoanStatus.DAMAGED);
        } else if (isOverdue(loan)) {
            loan.setStatus(LoanEntity.LoanStatus.OVERDUE);
        } else {
            loan.setStatus(LoanEntity.LoanStatus.RETURNED);
        }

        // Create Kardex movement for return (RF2.3)
        try {
            kardexMovementService.createMovement(
                    loan.getTool(),
                    KardexMovementEntity.MovementType.RETURN,
                    loan.getQuantity(),
                    "Devolución préstamo #" + loan.getId() + " - " +
                            (damaged ? "Con daños" : "En buen estado"),
                    loan.getCreatedBy(),
                    loan
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to create return kardex movement: " + e.getMessage());
        }

        // Update client status if necessary
        updateClientStatusIfNecessary(loan.getClient());

        return loanRepository.save(loan);
    }

    // RF6.1: Get active loans
    public List<LoanEntity> getActiveLoans() {
        return loanRepository.findActiveLoans();
    }

    // RF6.1: Get overdue loans
    public List<LoanEntity> getOverdueLoans() {
        return loanRepository.findOverdueLoans(LocalDate.now());
    }

    // Get loans by client
    public List<LoanEntity> getLoansByClient(ClientEntity client) {
        return loanRepository.findByClient(client);
    }

    // Get loans by tool
    public List<LoanEntity> getLoansByTool(ToolEntity tool) {
        return loanRepository.findByTool(tool);
    }

    // Get loan by ID
    public LoanEntity getLoanById(Long id) {
        return loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found with ID: " + id));
    }

    // Get all loans
    public List<LoanEntity> getAllLoans() {
        return loanRepository.findAll();
    }

    // Business validation methods
    private void validateLoanCreation(LoanEntity loan) {
        // Validate required fields
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
        if (loan.getCreatedBy() == null) {
            throw new RuntimeException("User creating loan is required");
        }

        // BR: Client must be ACTIVE (not restricted)
        if (loan.getClient().getStatus() != ClientEntity.ClientStatus.ACTIVE) {
            throw new RuntimeException("Client is restricted and cannot request loans");
        }

        // BR: Client cannot have overdue loans
        List<LoanEntity> overdueLoans = loanRepository.findOverdueLoansByClient(
                loan.getClient(), LocalDate.now());
        if (!overdueLoans.isEmpty()) {
            throw new RuntimeException("Client has overdue loans and cannot request new loans");
        }

        // BR: Client cannot have unpaid fines
        if (hasUnpaidFines(loan.getClient())) {
            throw new RuntimeException("Client has unpaid fines and cannot request new loans");
        }

        // BR: Tool must be AVAILABLE
        if (loan.getTool().getStatus() != ToolEntity.ToolStatus.AVAILABLE) {
            throw new RuntimeException("Tool is not available for loan");
        }

        // BR: Check tool availability (RF2.2)
        if (!toolInstanceService.isAvailable(loan.getTool().getId(), loan.getQuantity())) {
            throw new RuntimeException("Not enough tool instances available");
        }

        // BR: Client cannot have more than 5 active loans
        long activeLoanCount = loanRepository.countActiveLoansByClient(loan.getClient());
        if (activeLoanCount >= 5) {
            throw new RuntimeException("Client has reached maximum of 5 active loans");
        }

        // BR: Client cannot have more than one unit of same tool
        long existingLoanCount = loanRepository.countActiveLoansByClientAndTool(
                loan.getClient(), loan.getTool());
        if (existingLoanCount > 0) {
            throw new RuntimeException("Client already has an active loan for this tool");
        }

        // BR: Return date must be after loan date
        LocalDate loanDate = loan.getLoanDate() != null ? loan.getLoanDate() : LocalDate.now();
        if (loan.getAgreedReturnDate().isBefore(loanDate) ||
                loan.getAgreedReturnDate().isEqual(loanDate)) {
            throw new RuntimeException("Return date must be after loan date");
        }
    }

    private boolean hasUnpaidFines(ClientEntity client) {
        return fineRepository.countUnpaidFinesByClient(client) > 0;
    }

    private boolean isOverdue(LoanEntity loan) {
        return loan.getActualReturnDate() != null &&
                loan.getActualReturnDate().isAfter(loan.getAgreedReturnDate());
    }

    private void createFinesIfNecessary(LoanEntity loan, boolean damaged) {
        LocalDate returnDate = loan.getActualReturnDate();

        // RF2.4: Calculate late return fine
        if (returnDate.isAfter(loan.getAgreedReturnDate())) {
            long daysLate = ChronoUnit.DAYS.between(loan.getAgreedReturnDate(), returnDate);
            BigDecimal lateFeeRate = getCurrentLateFeeRate();
            BigDecimal lateFine = lateFeeRate.multiply(BigDecimal.valueOf(daysLate));

            createFine(loan, FineEntity.FineType.LATE_RETURN, lateFine,
                    "Multa por devolución tardía: " + daysLate + " días");
        }

        // Create damage fine if tool was returned damaged
        if (damaged) {
            // This would typically require assessment, for now create a basic repair fine
            BigDecimal repairCost = getRepairCost(loan.getTool());
            createFine(loan, FineEntity.FineType.DAMAGE_REPAIR, repairCost,
                    "Multa por daño en herramienta");
        }
    }

    private FineEntity createFine(LoanEntity loan, FineEntity.FineType type,
                                  BigDecimal amount, String description) {
        FineEntity fine = new FineEntity();
        fine.setClient(loan.getClient());
        fine.setLoan(loan);
        fine.setType(type);
        fine.setAmount(amount);
        fine.setDescription(description);
        fine.setPaid(false);
        fine.setDueDate(LocalDate.now().plusDays(30)); // 30 days to pay
        fine.setCreatedBy(loan.getCreatedBy());

        return fineRepository.save(fine);
    }

    private BigDecimal getCurrentRentalRate() {
        // Implementation would get current rental rate from RateService
        return new BigDecimal("1000.00"); // Default rate
    }

    private BigDecimal getCurrentLateFeeRate() {
        // Implementation would get current late fee rate from RateService
        return new BigDecimal("500.00"); // Default late fee rate
    }

    private BigDecimal getRepairCost(ToolEntity tool) {
        // For now, use a percentage of replacement value
        return tool.getReplacementValue().multiply(new BigDecimal("0.1")); // 10%
    }

    private void updateClientStatusIfNecessary(ClientEntity client) {
        // Check if client still has unpaid fines or overdue loans
        boolean hasUnpaidFines = fineRepository.countUnpaidFinesByClient(client) > 0;
        boolean hasOverdueLoans = !loanRepository.findOverdueLoansByClient(client, LocalDate.now()).isEmpty();

        if (hasUnpaidFines || hasOverdueLoans) {
            if (client.getStatus() == ClientEntity.ClientStatus.ACTIVE) {
                client.setStatus(ClientEntity.ClientStatus.RESTRICTED);
                clientService.saveClient(client);
            }
        } else {
            if (client.getStatus() == ClientEntity.ClientStatus.RESTRICTED) {
                client.setStatus(ClientEntity.ClientStatus.ACTIVE);
                clientService.saveClient(client);
            }
        }
    }
}
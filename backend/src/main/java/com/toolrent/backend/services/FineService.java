package com.toolrent.backend.services;

import com.toolrent.backend.entities.*;
import com.toolrent.backend.repositories.FineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class FineService {

    private final FineRepository fineRepository;
    private final ClientService clientService;

    public FineService(FineRepository fineRepository, ClientService clientService) {
        this.fineRepository = fineRepository;
        this.clientService = clientService;
    }

    // Create a new fine
    public FineEntity createFine(FineEntity fine) {
        validateFineCreation(fine);

        // Set creation timestamp
        if (fine.getCreatedAt() == null) {
            fine.setCreatedAt(LocalDateTime.now());
        }

        // Set due date if not provided (default: 30 days)
        if (fine.getDueDate() == null) {
            fine.setDueDate(LocalDate.now().plusDays(30));
        }

        // Ensure fine is not paid initially
        fine.setPaid(false);
        fine.setPaidDate(null);

        FineEntity savedFine = fineRepository.save(fine);

        // Update client status to RESTRICTED if they now have unpaid fines
        updateClientStatus(fine.getClient());

        return savedFine;
    }

    // Mark fine as paid
    @Transactional
    public FineEntity payFine(Long fineId, UserEntity paidBy) {
        FineEntity fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new RuntimeException("Fine not found with ID: " + fineId));

        if (fine.getPaid()) {
            throw new RuntimeException("Fine is already paid");
        }

        fine.markAsPaid();
        FineEntity savedFine = fineRepository.save(fine);

        // Check if client can be activated again
        updateClientStatus(fine.getClient());

        return savedFine;
    }

    // Create late return fine
    public FineEntity createLateFine(LoanEntity loan, long daysLate, BigDecimal dailyLateFee, UserEntity createdBy) {
        BigDecimal totalAmount = dailyLateFee.multiply(BigDecimal.valueOf(daysLate));

        FineEntity fine = new FineEntity();
        fine.setClient(loan.getClient());
        fine.setLoan(loan);
        fine.setType(FineEntity.FineType.LATE_RETURN);
        fine.setAmount(totalAmount);
        fine.setDescription("Multa por devolución tardía: " + daysLate + " días × $" + dailyLateFee + " = $" + totalAmount);
        fine.setCreatedBy(createdBy);

        return createFine(fine);
    }

    // Create damage repair fine
    public FineEntity createDamageFine(LoanEntity loan, BigDecimal repairCost, String damageDescription, UserEntity createdBy) {
        FineEntity fine = new FineEntity();
        fine.setClient(loan.getClient());
        fine.setLoan(loan);
        fine.setType(FineEntity.FineType.DAMAGE_REPAIR);
        fine.setAmount(repairCost);
        fine.setDescription("Multa por daño en herramienta: " + damageDescription);
        fine.setCreatedBy(createdBy);

        return createFine(fine);
    }

    // Create tool replacement fine
    public FineEntity createReplacementFine(LoanEntity loan, BigDecimal replacementValue, UserEntity createdBy) {
        FineEntity fine = new FineEntity();
        fine.setClient(loan.getClient());
        fine.setLoan(loan);
        fine.setType(FineEntity.FineType.TOOL_REPLACEMENT);
        fine.setAmount(replacementValue);
        fine.setDescription("Costo de reposición por herramienta dañada irreparablemente: " + loan.getTool().getName());
        fine.setCreatedBy(createdBy);

        return createFine(fine);
    }

    // Get all fines
    public List<FineEntity> getAllFines() {
        return fineRepository.findAll();
    }

    // Get fine by ID
    public FineEntity getFineById(Long id) {
        return fineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fine not found with ID: " + id));
    }

    // Get unpaid fines by client
    public List<FineEntity> getUnpaidFinesByClient(ClientEntity client) {
        return fineRepository.findByClientAndPaidFalse(client);
    }

    // Get paid fines by client
    public List<FineEntity> getPaidFinesByClient(ClientEntity client) {
        return fineRepository.findByClientAndPaidTrue(client);
    }

    // Get all fines by client
    public List<FineEntity> getFinesByClient(ClientEntity client) {
        return fineRepository.findAll().stream()
                .filter(fine -> fine.getClient().getId().equals(client.getId()))
                .toList();
    }

    // Get fines by loan
    public List<FineEntity> getFinesByLoan(LoanEntity loan) {
        return fineRepository.findByLoan(loan);
    }

    // Get fines by type
    public List<FineEntity> getFinesByType(FineEntity.FineType type) {
        return fineRepository.findByType(type);
    }

    // Get overdue fines
    public List<FineEntity> getOverdueFines() {
        return fineRepository.findOverdueFines(LocalDate.now());
    }

    // Get total unpaid amount for client
    public BigDecimal getTotalUnpaidAmount(ClientEntity client) {
        return fineRepository.getTotalUnpaidAmountByClient(client);
    }

    // Check if client has unpaid fines
    public boolean clientHasUnpaidFines(ClientEntity client) {
        return fineRepository.countUnpaidFinesByClient(client) > 0;
    }

    // Get fines in date range
    public List<FineEntity> getFinesInDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return fineRepository.findByDateRange(startDate, endDate);
    }

    // Get client fines in date range
    public List<FineEntity> getClientFinesInDateRange(ClientEntity client, LocalDateTime startDate, LocalDateTime endDate) {
        return fineRepository.findByClientAndDateRange(client, startDate, endDate);
    }

    // Get fine statistics by type
    public List<Object[]> getFineStatsByType() {
        return fineRepository.getFineCountsByType();
    }

    // Get total paid amount in date range
    public BigDecimal getTotalPaidInDateRange(LocalDate startDate, LocalDate endDate) {
        return fineRepository.getTotalPaidAmountInDateRange(startDate, endDate);
    }

    // Update fine (limited fields)
    public FineEntity updateFine(Long fineId, String description, LocalDate dueDate) {
        FineEntity fine = getFineById(fineId);

        if (fine.getPaid()) {
            throw new RuntimeException("Cannot modify paid fines");
        }

        if (description != null && !description.trim().isEmpty()) {
            fine.setDescription(description);
        }

        if (dueDate != null) {
            if (dueDate.isBefore(LocalDate.now())) {
                throw new RuntimeException("Due date cannot be in the past");
            }
            fine.setDueDate(dueDate);
        }

        return fineRepository.save(fine);
    }

    // Cancel unpaid fine (admin only)
    @Transactional
    public void cancelFine(Long fineId, UserEntity cancelledBy) {
        FineEntity fine = getFineById(fineId);

        if (fine.getPaid()) {
            throw new RuntimeException("Cannot cancel a paid fine");
        }

        // Instead of deleting, mark as paid with $0 to maintain audit trail
        fine.setAmount(BigDecimal.ZERO);
        fine.setPaid(true);
        fine.setPaidDate(LocalDate.now());
        fine.setDescription(fine.getDescription() + " - CANCELADA por " + cancelledBy.getUsername());

        fineRepository.save(fine);

        // Update client status
        updateClientStatus(fine.getClient());
    }

    // Get latest fines for dashboard
    public List<FineEntity> getLatestFines(int limit) {
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(0, limit);
        return fineRepository.findLatestFines(pageable);
    }

    // Private helper methods
    private void validateFineCreation(FineEntity fine) {
        if (fine.getClient() == null) {
            throw new RuntimeException("Client is required for fine");
        }

        if (fine.getLoan() == null) {
            throw new RuntimeException("Loan is required for fine");
        }

        if (fine.getType() == null) {
            throw new RuntimeException("Fine type is required");
        }

        if (fine.getAmount() == null || fine.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Fine amount must be greater than 0");
        }

        if (fine.getDescription() == null || fine.getDescription().trim().isEmpty()) {
            throw new RuntimeException("Fine description is required");
        }

        if (fine.getCreatedBy() == null) {
            throw new RuntimeException("CreatedBy user is required for fine");
        }
    }

    // Update client status based on unpaid fines
    private void updateClientStatus(ClientEntity client) {
        boolean hasUnpaidFines = clientHasUnpaidFines(client);

        if (hasUnpaidFines && client.getStatus() == ClientEntity.ClientStatus.ACTIVE) {
            client.setStatus(ClientEntity.ClientStatus.RESTRICTED);
            clientService.saveClient(client);
        } else if (!hasUnpaidFines && client.getStatus() == ClientEntity.ClientStatus.RESTRICTED) {
            // Only reactivate if restriction was due to fines (not other reasons)
            client.setStatus(ClientEntity.ClientStatus.ACTIVE);
            clientService.saveClient(client);
        }
    }

    // Check if fine is overdue
    public boolean isFineOverdue(FineEntity fine) {
        return !fine.getPaid() && fine.getDueDate().isBefore(LocalDate.now());
    }

    // Get fine summary for client
    public Object getClientFineSummary(ClientEntity client) {
        List<FineEntity> unpaidFines = getUnpaidFinesByClient(client);
        BigDecimal totalUnpaid = getTotalUnpaidAmount(client);
        long overdueCount = unpaidFines.stream()
                .filter(this::isFineOverdue)
                .count();

        return new Object() {
            public final int unpaidCount = unpaidFines.size();
            public final BigDecimal totalUnpaidAmount = totalUnpaid != null ? totalUnpaid : BigDecimal.ZERO;
            public final long overdueCount = overdueCount;
            public final List<FineEntity> unpaidFines = unpaidFines;
        };
    }

    // Delete fine (only for unpaid fines and admin use)
    @Transactional
    public void deleteFine(Long fineId, UserEntity deletedBy) {
        FineEntity fine = getFineById(fineId);

        if (fine.getPaid()) {
            throw new RuntimeException("Cannot delete a paid fine. Use cancel instead.");
        }

        ClientEntity client = fine.getClient();
        fineRepository.delete(fine);

        // Update client status after deletion
        updateClientStatus(client);
    }
}
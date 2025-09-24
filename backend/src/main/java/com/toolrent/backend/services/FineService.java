package com.toolrent.backend.services;

import com.toolrent.backend.entities.*;
import com.toolrent.backend.repositories.FineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class FineService {

    @Autowired
    private FineRepository fineRepository;

    @Autowired
    private ClientService clientService;

    // Create a new fine
    public FineEntity createFine(FineEntity fine) throws Exception {
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
    public FineEntity payFine(Long fineId) throws Exception {
        FineEntity fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new Exception("Fine not found with ID: " + fineId));

        if (fine.getPaid()) {
            throw new Exception("Fine is already paid");
        }

        fine.markAsPaid();
        FineEntity savedFine = fineRepository.save(fine);

        // Check if client can be activated again
        updateClientStatus(fine.getClient());

        return savedFine;
    }

    // Create late return fine
    public FineEntity createLateFine(LoanEntity loan, long daysLate, BigDecimal dailyLateFee) throws Exception {
        BigDecimal totalAmount = dailyLateFee.multiply(BigDecimal.valueOf(daysLate));

        FineEntity fine = new FineEntity();
        fine.setClient(loan.getClient());
        fine.setLoan(loan);
        fine.setType(FineEntity.FineType.LATE_RETURN);
        fine.setAmount(totalAmount);
        fine.setDescription("Multa por devolución tardía: " + daysLate + " días × $" + dailyLateFee + " = $" + totalAmount);

        return createFine(fine);
    }

    // Create damage repair fine
    public FineEntity createDamageFine(LoanEntity loan, BigDecimal repairCost, String damageDescription) throws Exception {
        FineEntity fine = new FineEntity();
        fine.setClient(loan.getClient());
        fine.setLoan(loan);
        fine.setType(FineEntity.FineType.DAMAGE_REPAIR);
        fine.setAmount(repairCost);
        fine.setDescription("Multa por daño en herramienta: " + damageDescription);

        return createFine(fine);
    }

    // Create tool replacement fine
    public FineEntity createReplacementFine(LoanEntity loan, BigDecimal replacementValue) throws Exception {
        FineEntity fine = new FineEntity();
        fine.setClient(loan.getClient());
        fine.setLoan(loan);
        fine.setType(FineEntity.FineType.TOOL_REPLACEMENT);
        fine.setAmount(replacementValue);
        fine.setDescription("Costo de reposición por herramienta dañada irreparablemente: " + loan.getTool().getName());

        return createFine(fine);
    }

    // Get all fines
    public List<FineEntity> getAllFines() {
        return fineRepository.findAll();
    }

    // Get fine by ID
    public FineEntity getFineById(Long id) throws Exception {
        return fineRepository.findById(id)
                .orElseThrow(() -> new Exception("Fine not found with ID: " + id));
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
    public FineEntity updateFine(Long fineId, String description, LocalDate dueDate) throws Exception {
        FineEntity fine = getFineById(fineId);

        if (fine.getPaid()) {
            throw new Exception("Cannot modify paid fines");
        }

        if (description != null && !description.trim().isEmpty()) {
            fine.setDescription(description);
        }

        if (dueDate != null) {
            if (dueDate.isBefore(LocalDate.now())) {
                throw new Exception("Due date cannot be in the past");
            }
            fine.setDueDate(dueDate);
        }

        return fineRepository.save(fine);
    }

    // Cancel unpaid fine (admin only)
    @Transactional
    public void cancelFine(Long fineId) throws Exception {
        FineEntity fine = getFineById(fineId);

        if (fine.getPaid()) {
            throw new Exception("Cannot cancel a paid fine");
        }

        // Instead of deleting, mark as paid with $0 to maintain audit trail
        fine.setAmount(BigDecimal.ZERO);
        fine.setPaid(true);
        fine.setPaidDate(LocalDate.now());

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

    // *** MISSING METHODS ADDED BELOW ***

    // Get all unpaid fines (not filtered by client)
    public List<FineEntity> getAllUnpaidFines() {
        return fineRepository.findAll().stream()
                .filter(fine -> !fine.getPaid())
                .toList();
    }

    // Get comprehensive fine statistics
    public Map<String, Object> getFineStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Basic counts
        long totalFines = fineRepository.count();
        List<FineEntity> allFines = fineRepository.findAll();
        long unpaidFines = allFines.stream().filter(f -> !f.getPaid()).count();
        long paidFines = allFines.stream().filter(f -> f.getPaid()).count();
        long overdueFines = fineRepository.findOverdueFines(LocalDate.now()).size();

        // Calculate amounts
        BigDecimal totalUnpaidAmount = allFines.stream()
                .filter(f -> !f.getPaid())
                .map(FineEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaidAmount = allFines.stream()
                .filter(f -> f.getPaid())
                .map(FineEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // By type statistics
        List<Object[]> typeStats = fineRepository.getFineCountsByType();
        Map<String, Long> finesByType = new HashMap<>();
        for (Object[] stat : typeStats) {
            finesByType.put(stat[0].toString(), ((Number) stat[1]).longValue());
        }

        stats.put("totalFines", totalFines);
        stats.put("unpaidFines", unpaidFines);
        stats.put("paidFines", paidFines);
        stats.put("overdueFines", overdueFines);
        stats.put("totalUnpaidAmount", totalUnpaidAmount);
        stats.put("totalPaidAmount", totalPaidAmount);
        stats.put("finesByType", finesByType);

        return stats;
    }

    // Check client restrictions for loan eligibility
    public Map<String, Object> checkClientRestrictions(Long clientId) {
        Map<String, Object> restrictions = new HashMap<>();

        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                restrictions.put("error", "Client not found");
                return restrictions;
            }

            // Check if client has unpaid fines
            boolean hasUnpaidFines = clientHasUnpaidFines(client);
            BigDecimal totalUnpaidAmount = getTotalUnpaidAmount(client);
            List<FineEntity> unpaidFines = getUnpaidFinesByClient(client);
            List<FineEntity> overdueFines = unpaidFines.stream()
                    .filter(this::isFineOverdue)
                    .toList();

            // Check client status
            boolean isRestricted = client.getStatus() == ClientEntity.ClientStatus.RESTRICTED;

            restrictions.put("clientId", clientId);
            restrictions.put("clientName", client.getName());
            restrictions.put("clientStatus", client.getStatus().toString());
            restrictions.put("isRestricted", isRestricted);
            restrictions.put("hasUnpaidFines", hasUnpaidFines);
            restrictions.put("totalUnpaidAmount", totalUnpaidAmount != null ? totalUnpaidAmount : BigDecimal.ZERO);
            restrictions.put("unpaidFinesCount", unpaidFines.size());
            restrictions.put("overdueFinesCount", overdueFines.size());
            restrictions.put("canRequestLoan", !isRestricted && !hasUnpaidFines);
            restrictions.put("restrictionReason", getRestrictionReason(client, hasUnpaidFines, !overdueFines.isEmpty()));

            if (hasUnpaidFines) {
                restrictions.put("unpaidFines", unpaidFines);
            }

        } catch (Exception e) {
            restrictions.put("error", "Error checking client restrictions: " + e.getMessage());
        }

        return restrictions;
    }

    // Helper method to determine restriction reason
    private String getRestrictionReason(ClientEntity client, boolean hasUnpaidFines, boolean hasOverdueFines) {
        if (client.getStatus() == ClientEntity.ClientStatus.RESTRICTED) {
            if (hasUnpaidFines) {
                if (hasOverdueFines) {
                    return "Client has overdue unpaid fines";
                } else {
                    return "Client has unpaid fines";
                }
            } else {
                return "Client is restricted for administrative reasons";
            }
        }
        return "No restrictions";
    }

    // Private helper methods
    private void validateFineCreation(FineEntity fine) throws Exception {
        if (fine.getClient() == null) {
            throw new Exception("Client is required for fine");
        }

        if (fine.getLoan() == null) {
            throw new Exception("Loan is required for fine");
        }

        if (fine.getType() == null) {
            throw new Exception("Fine type is required");
        }

        if (fine.getAmount() == null || fine.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new Exception("Fine amount must be greater than 0");
        }

        if (fine.getDescription() == null || fine.getDescription().trim().isEmpty()) {
            throw new Exception("Fine description is required");
        }
    }

    // Update client status based on unpaid fines
    private void updateClientStatus(ClientEntity client) throws Exception {
        boolean hasUnpaidFines = clientHasUnpaidFines(client);

        if (hasUnpaidFines && client.getStatus() == ClientEntity.ClientStatus.ACTIVE) {
            client.setStatus(ClientEntity.ClientStatus.RESTRICTED);
            clientService.updateClient(client);
        } else if (!hasUnpaidFines && client.getStatus() == ClientEntity.ClientStatus.RESTRICTED) {
            // Only reactivate if restriction was due to fines (not other reasons)
            client.setStatus(ClientEntity.ClientStatus.ACTIVE);
            clientService.updateClient(client);
        }
    }

    // Check if fine is overdue
    public boolean isFineOverdue(FineEntity fine) {
        return !fine.getPaid() && fine.getDueDate().isBefore(LocalDate.now());
    }

    // Delete fine (only for unpaid fines and admin use)
    @Transactional
    public void deleteFine(Long fineId) throws Exception {
        FineEntity fine = getFineById(fineId);

        if (fine.getPaid()) {
            throw new Exception("Cannot delete a paid fine. Use cancel instead.");
        }

        ClientEntity client = fine.getClient();
        fineRepository.delete(fine);

        // Update client status after deletion
        updateClientStatus(client);
    }
}
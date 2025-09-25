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
    public FineEntity createFine(FineEntity fine) {
        validateFineCreation(fine);

        if (fine.getCreatedAt() == null) {
            fine.setCreatedAt(LocalDateTime.now());
        }

        if (fine.getDueDate() == null) {
            fine.setDueDate(LocalDate.now().plusDays(30));
        }

        fine.setPaid(false);
        fine.setPaidDate(null);

        FineEntity savedFine = fineRepository.save(fine);
        updateClientStatus(fine.getClient());

        return savedFine;
    }

    // Mark fine as paid - RF2.5
    @Transactional
    public FineEntity payFine(Long fineId) {
        FineEntity fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new RuntimeException("Fine not found with ID: " + fineId));

        if (fine.getPaid()) {
            throw new RuntimeException("Fine is already paid");
        }

        fine.markAsPaid();
        FineEntity savedFine = fineRepository.save(fine);
        updateClientStatus(fine.getClient());

        return savedFine;
    }

    // Create late return fine - RF2.4
    public FineEntity createLateFine(LoanEntity loan, long daysLate, BigDecimal dailyLateFee) {
        BigDecimal totalAmount = dailyLateFee.multiply(BigDecimal.valueOf(daysLate));

        FineEntity fine = new FineEntity();
        fine.setClient(loan.getClient());
        fine.setLoan(loan);
        fine.setType(FineEntity.FineType.LATE_RETURN);
        fine.setAmount(totalAmount);
        fine.setDescription("Late return fine: " + daysLate + " days × $" + dailyLateFee + " = $" + totalAmount);

        return createFine(fine);
    }

    // Create damage repair fine
    public FineEntity createDamageFine(LoanEntity loan, BigDecimal repairCost, String damageDescription) {
        FineEntity fine = new FineEntity();
        fine.setClient(loan.getClient());
        fine.setLoan(loan);
        fine.setType(FineEntity.FineType.DAMAGE_REPAIR);
        fine.setAmount(repairCost);
        fine.setDescription("Tool damage fine: " + damageDescription);

        return createFine(fine);
    }

    // Create tool replacement fine
    public FineEntity createReplacementFine(LoanEntity loan, BigDecimal replacementValue) {
        FineEntity fine = new FineEntity();
        fine.setClient(loan.getClient());
        fine.setLoan(loan);
        fine.setType(FineEntity.FineType.TOOL_REPLACEMENT);
        fine.setAmount(replacementValue);
        fine.setDescription("Tool replacement cost for irreparable damage: " + loan.getTool().getName());

        return createFine(fine);
    }

    public List<FineEntity> getAllFines() {
        return fineRepository.findAll();
    }

    public FineEntity getFineById(Long id) {
        return fineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fine not found with ID: " + id));
    }

    public List<FineEntity> getUnpaidFinesByClient(ClientEntity client) {
        return fineRepository.findByClientAndPaidFalse(client);
    }

    public List<FineEntity> getAllUnpaidFines() {
        return fineRepository.findByPaidFalse();
    }

    public List<FineEntity> getFinesByClient(ClientEntity client) {
        return fineRepository.findAll().stream()
                .filter(fine -> fine.getClient().getId().equals(client.getId()))
                .toList();
    }

    public List<FineEntity> getFinesByLoan(LoanEntity loan) {
        return fineRepository.findByLoan(loan);
    }

    public List<FineEntity> getFinesByType(FineEntity.FineType type) {
        return fineRepository.findByType(type);
    }

    public List<FineEntity> getOverdueFines() {
        return fineRepository.findOverdueFines(LocalDate.now());
    }

    public BigDecimal getTotalUnpaidAmount(ClientEntity client) {
        return fineRepository.getTotalUnpaidAmountByClient(client);
    }

    // RF2.5: Check if client has unpaid fines (blocks loans)
    public boolean clientHasUnpaidFines(ClientEntity client) {
        return fineRepository.countUnpaidFinesByClient(client) > 0;
    }

    public List<FineEntity> getFinesInDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return fineRepository.findByDateRange(startDate, endDate);
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
    public void cancelFine(Long fineId) {
        FineEntity fine = getFineById(fineId);

        if (fine.getPaid()) {
            throw new RuntimeException("Cannot cancel a paid fine");
        }

        fine.setAmount(BigDecimal.ZERO);
        fine.setPaid(true);
        fine.setPaidDate(LocalDate.now());

        fineRepository.save(fine);
        updateClientStatus(fine.getClient());
    }

    // Delete fine (only for unpaid fines)
    @Transactional
    public void deleteFine(Long fineId) {
        FineEntity fine = getFineById(fineId);

        if (fine.getPaid()) {
            throw new RuntimeException("Cannot delete a paid fine");
        }

        ClientEntity client = fine.getClient();
        fineRepository.delete(fine);
        updateClientStatus(client);
    }

    // Get comprehensive fine statistics - RF6
    public Map<String, Object> getFineStatistics() {
        Map<String, Object> stats = new HashMap<>();

        long totalFines = fineRepository.count();
        List<FineEntity> allFines = fineRepository.findAll();
        long unpaidFines = allFines.stream().filter(f -> !f.getPaid()).count();
        long paidFines = allFines.stream().filter(f -> f.getPaid()).count();
        long overdueFines = fineRepository.findOverdueFines(LocalDate.now()).size();

        BigDecimal totalUnpaidAmount = allFines.stream()
                .filter(f -> !f.getPaid())
                .map(FineEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaidAmount = allFines.stream()
                .filter(f -> f.getPaid())
                .map(FineEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

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

    // Check client restrictions for loan eligibility - RF2.5
    public Map<String, Object> checkClientRestrictions(Long clientId) {
        Map<String, Object> restrictions = new HashMap<>();

        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                restrictions.put("error", "Client not found");
                return restrictions;
            }

            boolean hasUnpaidFines = clientHasUnpaidFines(client);
            BigDecimal totalUnpaidAmount = getTotalUnpaidAmount(client);
            List<FineEntity> unpaidFines = getUnpaidFinesByClient(client);
            List<FineEntity> overdueFines = unpaidFines.stream()
                    .filter(this::isFineOverdue)
                    .toList();

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
    }

    // Update client status based on unpaid fines - RF2.5
    private void updateClientStatus(ClientEntity client) {
        boolean hasUnpaidFines = clientHasUnpaidFines(client);

        if (hasUnpaidFines && client.getStatus() == ClientEntity.ClientStatus.ACTIVE) {
            client.setStatus(ClientEntity.ClientStatus.RESTRICTED);
            try {
                clientService.updateClient(client);
            } catch (Exception e) {
                throw new RuntimeException("Error updating client status: " + e.getMessage());
            }
        } else if (!hasUnpaidFines && client.getStatus() == ClientEntity.ClientStatus.RESTRICTED) {
            client.setStatus(ClientEntity.ClientStatus.ACTIVE);
            try {
                clientService.updateClient(client);
            } catch (Exception e) {
                throw new RuntimeException("Error updating client status: " + e.getMessage());
            }
        }
    }

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

    private boolean isFineOverdue(FineEntity fine) {
        return !fine.getPaid() && fine.getDueDate().isBefore(LocalDate.now());
    }
}
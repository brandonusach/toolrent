// FineService.java - VERSION CORREGIDA
package com.toolrent.backend.services;

import com.toolrent.backend.entities.FineEntity;
import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.entities.LoanEntity;
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

    // Verificar si el cliente tiene multas impagas - VERSIÓN SEGURA
    public boolean clientHasUnpaidFines(ClientEntity client) {
        try {
            if (client == null) {
                return false;
            }
            long unpaidCount = fineRepository.countUnpaidFinesByClient(client);
            return unpaidCount > 0;
        } catch (Exception e) {
            System.err.println("Error checking unpaid fines for client: " + e.getMessage());
            return false; // En caso de error, permitir el préstamo
        }
    }

    // Obtener total de multas impagas - VERSIÓN SEGURA
    public BigDecimal getTotalUnpaidAmount(ClientEntity client) {
        try {
            if (client == null) {
                return BigDecimal.ZERO;
            }
            BigDecimal total = fineRepository.getTotalUnpaidAmountByClient(client);
            return total != null ? total : BigDecimal.ZERO;
        } catch (Exception e) {
            System.err.println("Error getting total unpaid amount for client: " + e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    // Verificar restricciones del cliente - NUEVO MÉTODO REQUERIDO POR EL FRONTEND
    public Map<String, Object> checkClientRestrictions(Long clientId) {
        Map<String, Object> restrictions = new HashMap<>();

        try {
            if (clientId == null || clientId <= 0) {
                restrictions.put("canRequestLoan", false);
                restrictions.put("isRestricted", true);
                restrictions.put("restrictionReason", "ID de cliente inválido");
                restrictions.put("clientStatus", "INVALID");
                return restrictions;
            }

            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                restrictions.put("canRequestLoan", false);
                restrictions.put("isRestricted", true);
                restrictions.put("restrictionReason", "Cliente no encontrado");
                restrictions.put("clientStatus", "NOT_FOUND");
                return restrictions;
            }

            // Obtener multas impagas
            List<FineEntity> unpaidFines = getUnpaidFinesByClient(client);
            BigDecimal totalUnpaidAmount = getTotalUnpaidAmount(client);

            // Contar multas vencidas
            long overdueFinesCount = unpaidFines.stream()
                    .filter(fine -> fine.getDueDate().isBefore(LocalDate.now()))
                    .count();

            boolean canRequestLoan = unpaidFines.isEmpty();
            boolean isRestricted = !unpaidFines.isEmpty();

            restrictions.put("canRequestLoan", canRequestLoan);
            restrictions.put("isRestricted", isRestricted);
            restrictions.put("hasUnpaidFines", !unpaidFines.isEmpty());
            restrictions.put("unpaidFinesCount", unpaidFines.size());
            restrictions.put("totalUnpaidAmount", totalUnpaidAmount);
            restrictions.put("overdueFinesCount", overdueFinesCount);
            restrictions.put("clientStatus", isRestricted ? "RESTRICTED" : "ACTIVE");

            if (isRestricted) {
                restrictions.put("restrictionReason",
                        "Cliente tiene " + unpaidFines.size() + " multa(s) impaga(s) por $" + totalUnpaidAmount);
            } else {
                restrictions.put("message", "Cliente no tiene restricciones de multas");
            }

            // Agregar detalles de multas impagas
            if (!unpaidFines.isEmpty()) {
                restrictions.put("unpaidFines", unpaidFines);
            }

        } catch (Exception e) {
            System.err.println("Error checking client restrictions: " + e.getMessage());
            // En caso de error, no restringir al cliente
            restrictions.put("canRequestLoan", true);
            restrictions.put("isRestricted", false);
            restrictions.put("error", "Error al verificar restricciones: " + e.getMessage());
            restrictions.put("clientStatus", "ERROR");
        }

        return restrictions;
    }

    // Obtener multas por cliente - VERSIÓN CORREGIDA
    public List<FineEntity> getFinesByClient(ClientEntity client) {
        try {
            if (client == null) {
                System.out.println("Client is null, returning empty list");
                return List.of();
            }

            System.out.println("Getting fines for client ID: " + client.getId());

            // Usar consulta directa del repositorio en lugar de filtrar en memoria
            List<FineEntity> fines = fineRepository.findByClient(client);
            System.out.println("Found " + fines.size() + " fines for client " + client.getId());

            return fines;
        } catch (Exception e) {
            System.err.println("Error getting fines by client: " + e.getMessage());
            e.printStackTrace();
            return List.of();
        }
    }

    // Obtener multas impagas por cliente
    public List<FineEntity> getUnpaidFinesByClient(ClientEntity client) {
        try {
            if (client == null) {
                return List.of();
            }
            return fineRepository.findByClientAndPaidFalse(client);
        } catch (Exception e) {
            System.err.println("Error getting unpaid fines by client: " + e.getMessage());
            return List.of();
        }
    }

    // Obtener multas por préstamo
    public List<FineEntity> getFinesByLoan(LoanEntity loan) {
        try {
            if (loan == null) {
                return List.of();
            }
            return fineRepository.findByLoan(loan);
        } catch (Exception e) {
            System.err.println("Error getting fines by loan: " + e.getMessage());
            return List.of();
        }
    }

    // Pagar multa
    @Transactional
    public FineEntity payFine(Long fineId) {
        try {
            FineEntity fine = fineRepository.findById(fineId)
                    .orElseThrow(() -> new RuntimeException("Multa no encontrada con ID: " + fineId));

            if (fine.getPaid()) {
                throw new RuntimeException("La multa ya ha sido pagada");
            }

            fine.markAsPaid();
            return fineRepository.save(fine);
        } catch (Exception e) {
            System.err.println("Error paying fine: " + e.getMessage());
            throw new RuntimeException("Error al pagar la multa: " + e.getMessage());
        }
    }

    // Cancelar multa (solo admin)
    @Transactional
    public void cancelFine(Long fineId) {
        try {
            FineEntity fine = fineRepository.findById(fineId)
                    .orElseThrow(() -> new RuntimeException("Multa no encontrada con ID: " + fineId));

            fineRepository.delete(fine);
        } catch (Exception e) {
            System.err.println("Error cancelling fine: " + e.getMessage());
            throw new RuntimeException("Error al cancelar la multa: " + e.getMessage());
        }
    }

    // Crear multa
    @Transactional
    public FineEntity createFine(FineEntity fine) {
        try {
            if (fine.getCreatedAt() == null) {
                fine.setCreatedAt(LocalDateTime.now());
            }
            return fineRepository.save(fine);
        } catch (Exception e) {
            System.err.println("Error creating fine: " + e.getMessage());
            throw new RuntimeException("Error al crear la multa: " + e.getMessage());
        }
    }

    // Actualizar multa
    @Transactional
    public FineEntity updateFine(Long id, String description, LocalDate dueDate) {
        try {
            FineEntity fine = fineRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Multa no encontrada con ID: " + id));

            if (description != null) {
                fine.setDescription(description);
            }
            if (dueDate != null) {
                fine.setDueDate(dueDate);
            }

            return fineRepository.save(fine);
        } catch (Exception e) {
            System.err.println("Error updating fine: " + e.getMessage());
            throw new RuntimeException("Error al actualizar la multa: " + e.getMessage());
        }
    }

    // Eliminar multa
    @Transactional
    public void deleteFine(Long id) {
        try {
            FineEntity fine = fineRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Multa no encontrada con ID: " + id));

            if (fine.getPaid()) {
                throw new RuntimeException("No se puede eliminar una multa que ya ha sido pagada");
            }

            fineRepository.delete(fine);
        } catch (Exception e) {
            System.err.println("Error deleting fine: " + e.getMessage());
            throw new RuntimeException("Error al eliminar la multa: " + e.getMessage());
        }
    }

    // Obtener todas las multas - VERSIÓN MEJORADA PARA EVITAR ERROR 500
    @Transactional(readOnly = true)
    public List<FineEntity> getAllFines() {
        try {
            System.out.println("Attempting to get all fines from repository...");
            List<FineEntity> fines = fineRepository.findAll();
            System.out.println("Successfully retrieved " + fines.size() + " fines");
            return fines;
        } catch (Exception e) {
            System.err.println("Error getting all fines: " + e.getMessage());
            e.printStackTrace();
            return List.of(); // Retornar lista vacía en caso de error
        }
    }

    // Obtener multa por ID
    public FineEntity getFineById(Long id) {
        try {
            return fineRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Multa no encontrada con ID: " + id));
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener la multa: " + e.getMessage());
        }
    }

    // Obtener todas las multas impagas
    public List<FineEntity> getAllUnpaidFines() {
        try {
            return fineRepository.findByPaidFalse();
        } catch (Exception e) {
            System.err.println("Error getting all unpaid fines: " + e.getMessage());
            return List.of();
        }
    }

    // Obtener multas vencidas
    public List<FineEntity> getOverdueFines() {
        try {
            return fineRepository.findOverdueFines(LocalDate.now());
        } catch (Exception e) {
            System.err.println("Error getting overdue fines: " + e.getMessage());
            return List.of();
        }
    }

    // Obtener multas por tipo
    public List<FineEntity> getFinesByType(FineEntity.FineType type) {
        try {
            if (type == null) {
                return List.of();
            }
            return fineRepository.findByType(type);
        } catch (Exception e) {
            System.err.println("Error getting fines by type: " + e.getMessage());
            return List.of();
        }
    }

    // Obtener estadísticas de multas
    public Map<String, Object> getFineStatistics() {
        Map<String, Object> statistics = new HashMap<>();

        try {
            long totalFines = fineRepository.count();
            long unpaidFines = fineRepository.countByPaidFalse();
            long paidFines = fineRepository.countByPaidTrue();
            long overdueFines = fineRepository.countOverdueFines(LocalDate.now());

            BigDecimal totalUnpaidAmount = fineRepository.getTotalUnpaidAmount();
            BigDecimal totalPaidAmount = fineRepository.getTotalPaidAmount();

            statistics.put("totalFines", totalFines);
            statistics.put("unpaidFines", unpaidFines);
            statistics.put("paidFines", paidFines);
            statistics.put("overdueFines", overdueFines);
            statistics.put("totalUnpaidAmount", totalUnpaidAmount != null ? totalUnpaidAmount : BigDecimal.ZERO);
            statistics.put("totalPaidAmount", totalPaidAmount != null ? totalPaidAmount : BigDecimal.ZERO);

        } catch (Exception e) {
            System.err.println("Error getting fine statistics: " + e.getMessage());
            statistics.put("error", "Error al obtener estadísticas de multas");
            statistics.put("totalFines", 0);
            statistics.put("unpaidFines", 0);
            statistics.put("paidFines", 0);
            statistics.put("overdueFines", 0);
            statistics.put("totalUnpaidAmount", BigDecimal.ZERO);
            statistics.put("totalPaidAmount", BigDecimal.ZERO);
        }

        return statistics;
    }

    // Obtener multas en rango de fechas
    public List<FineEntity> getFinesInDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            if (startDate == null || endDate == null) {
                return List.of();
            }
            return fineRepository.findByDateRange(startDate, endDate);
        } catch (Exception e) {
            System.err.println("Error getting fines in date range: " + e.getMessage());
            return List.of();
        }
    }

    // Crear multa por atraso - método auxiliar para el LoanService
    public FineEntity createLateFine(LoanEntity loan, long daysLate, BigDecimal lateFeeRate) {
        try {
            if (loan == null || daysLate <= 0 || lateFeeRate == null) {
                throw new RuntimeException("Parámetros inválidos para crear multa por atraso");
            }

            BigDecimal fineAmount = lateFeeRate.multiply(BigDecimal.valueOf(daysLate));

            FineEntity fine = new FineEntity();
            fine.setClient(loan.getClient());
            fine.setLoan(loan);
            fine.setType(FineEntity.FineType.LATE_RETURN);
            fine.setAmount(fineAmount);
            fine.setDescription("Multa por devolución tardía - " + daysLate + " día(s) de atraso");
            fine.setDueDate(LocalDate.now().plusDays(30)); // 30 días para pagar
            fine.setPaid(false);

            return createFine(fine);
        } catch (Exception e) {
            System.err.println("Error creating late fine: " + e.getMessage());
            throw new RuntimeException("Error al crear multa por atraso: " + e.getMessage());
        }
    }

    // Crear multa por daño - método auxiliar para el LoanService
    public FineEntity createDamageFine(LoanEntity loan, BigDecimal repairCost, String description) {
        try {
            if (loan == null || repairCost == null || repairCost.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Parámetros inválidos para crear multa por daño");
            }

            FineEntity fine = new FineEntity();
            fine.setClient(loan.getClient());
            fine.setLoan(loan);
            fine.setType(FineEntity.FineType.DAMAGE_REPAIR);
            fine.setAmount(repairCost);
            fine.setDescription(description != null ? description : "Multa por daño a herramienta");
            fine.setDueDate(LocalDate.now().plusDays(30)); // 30 días para pagar
            fine.setPaid(false);

            return createFine(fine);
        } catch (Exception e) {
            System.err.println("Error creating damage fine: " + e.getMessage());
            throw new RuntimeException("Error al crear multa por daño: " + e.getMessage());
        }
    }
}
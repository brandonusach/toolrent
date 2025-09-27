// FineController.java - VERSION CORREGIDA
package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.FineEntity;
import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.services.FineService;
import com.toolrent.backend.services.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/fines")
@CrossOrigin("*")
public class FineController {

    @Autowired
    private FineService fineService;

    @Autowired
    private ClientService clientService;

    @GetMapping("/")
    public ResponseEntity<List<FineEntity>> listFines() {
        try {
            List<FineEntity> fines = fineService.getAllFines();
            return ResponseEntity.ok(fines);
        } catch (Exception e) {
            System.err.println("Error listing fines: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<FineEntity> getFineById(@PathVariable Long id) {
        try {
            FineEntity fine = fineService.getFineById(id);
            return ResponseEntity.ok(fine);
        } catch (Exception e) {
            System.err.println("Error getting fine by ID: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @PostMapping("/")
    public ResponseEntity<FineEntity> saveFine(@RequestBody FineEntity fine) {
        try {
            FineEntity newFine = fineService.createFine(fine);
            return ResponseEntity.ok(newFine);
        } catch (Exception e) {
            System.err.println("Error creating fine: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/")
    public ResponseEntity<FineEntity> updateFine(@RequestBody Map<String, Object> updates) {
        try {
            Long id = Long.valueOf(updates.get("id").toString());
            String description = (String) updates.get("description");
            LocalDate dueDate = updates.get("dueDate") != null ?
                    LocalDate.parse(updates.get("dueDate").toString()) : null;

            FineEntity updatedFine = fineService.updateFine(id, description, dueDate);
            return ResponseEntity.ok(updatedFine);
        } catch (Exception e) {
            System.err.println("Error updating fine: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFineById(@PathVariable Long id) {
        try {
            fineService.deleteFine(id);
            return ResponseEntity.ok("Fine deleted successfully");
        } catch (Exception e) {
            System.err.println("Error deleting fine: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting fine: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<FineEntity> payFine(@PathVariable Long id) {
        try {
            FineEntity paidFine = fineService.payFine(id);
            return ResponseEntity.ok(paidFine);
        } catch (Exception e) {
            System.err.println("Error paying fine: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<String> cancelFine(@PathVariable Long id) {
        try {
            fineService.cancelFine(id);
            return ResponseEntity.ok("Fine cancelled successfully");
        } catch (Exception e) {
            System.err.println("Error cancelling fine: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error cancelling fine: " + e.getMessage());
        }
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<FineEntity>> getFinesByClient(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(List.of());
            }
            List<FineEntity> fines = fineService.getFinesByClient(client);
            return ResponseEntity.ok(fines);
        } catch (Exception e) {
            System.err.println("Error getting fines by client: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/client/{clientId}/unpaid")
    public ResponseEntity<List<FineEntity>> getUnpaidFinesByClient(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(List.of());
            }
            List<FineEntity> unpaidFines = fineService.getUnpaidFinesByClient(client);
            return ResponseEntity.ok(unpaidFines);
        } catch (Exception e) {
            System.err.println("Error getting unpaid fines by client: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/client/{clientId}/total-unpaid")
    public ResponseEntity<Map<String, BigDecimal>> getTotalUnpaidAmount(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                return ResponseEntity.ok(Map.of("totalUnpaid", BigDecimal.ZERO));
            }
            BigDecimal totalUnpaid = fineService.getTotalUnpaidAmount(client);
            return ResponseEntity.ok(Map.of("totalUnpaid", totalUnpaid));
        } catch (Exception e) {
            System.err.println("Error getting total unpaid amount: " + e.getMessage());
            return ResponseEntity.ok(Map.of("totalUnpaid", BigDecimal.ZERO));
        }
    }

    @GetMapping("/unpaid")
    public ResponseEntity<List<FineEntity>> getAllUnpaidFines() {
        try {
            List<FineEntity> unpaidFines = fineService.getAllUnpaidFines();
            return ResponseEntity.ok(unpaidFines);
        } catch (Exception e) {
            System.err.println("Error getting all unpaid fines: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<FineEntity>> getOverdueFines() {
        try {
            List<FineEntity> overdueFines = fineService.getOverdueFines();
            return ResponseEntity.ok(overdueFines);
        } catch (Exception e) {
            System.err.println("Error getting overdue fines: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<FineEntity>> getFinesByType(@PathVariable String type) {
        try {
            FineEntity.FineType fineType = FineEntity.FineType.valueOf(type.toUpperCase());
            List<FineEntity> fines = fineService.getFinesByType(fineType);
            return ResponseEntity.ok(fines);
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid fine type: " + type);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(List.of());
        } catch (Exception e) {
            System.err.println("Error getting fines by type: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getFineStatistics() {
        try {
            Map<String, Object> statistics = fineService.getFineStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            System.err.println("Error getting fine statistics: " + e.getMessage());
            Map<String, Object> errorStats = new HashMap<>();
            errorStats.put("error", "Error getting statistics");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorStats);
        }
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<FineEntity>> getFinesInDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
            LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);
            List<FineEntity> fines = fineService.getFinesInDateRange(start, end);
            return ResponseEntity.ok(fines);
        } catch (Exception e) {
            System.err.println("Error getting fines in date range: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    // MÉTODO MUY IMPORTANTE - Este era el que faltaba y causaba errores 500
    @PostMapping("/{clientId}/check-restrictions")
    public ResponseEntity<Map<String, Object>> checkClientRestrictions(@PathVariable Long clientId) {
        try {
            Map<String, Object> restrictions = fineService.checkClientRestrictions(clientId);
            return ResponseEntity.ok(restrictions);
        } catch (Exception e) {
            System.err.println("Error checking client restrictions: " + e.getMessage());

            // Respuesta de error estructurada
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("canRequestLoan", false);
            errorResponse.put("isRestricted", true);
            errorResponse.put("restrictionReason", "Error al verificar restricciones: " + e.getMessage());
            errorResponse.put("clientStatus", "ERROR");
            errorResponse.put("error", true);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
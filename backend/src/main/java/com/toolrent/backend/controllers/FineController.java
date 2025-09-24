package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.FineEntity;
import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.services.FineService;
import com.toolrent.backend.services.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/fines")
@CrossOrigin("*")
public class FineController {

    @Autowired
    FineService fineService;

    @Autowired
    ClientService clientService;

    @GetMapping("/")
    public ResponseEntity<List<FineEntity>> listFines() {
        List<FineEntity> fines = fineService.getAllFines();
        return ResponseEntity.ok(fines);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FineEntity> getFineById(@PathVariable Long id) {
        try {
            FineEntity fine = fineService.getFineById(id);
            return ResponseEntity.ok(fine);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/")
    public ResponseEntity<?> saveFine(@RequestBody FineEntity fine) {
        try {
            FineEntity newFine = fineService.createFine(fine);
            return ResponseEntity.ok(newFine);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Patrón del profesor - PUT sin ID en la URL, enviando objeto completo con ID
    @PutMapping("/")
    public ResponseEntity<?> updateFine(@RequestBody Map<String, Object> updates) {
        try {
            Long id = Long.valueOf(updates.get("id").toString());
            String description = (String) updates.get("description");
            LocalDate dueDate = updates.get("dueDate") != null ?
                    LocalDate.parse(updates.get("dueDate").toString()) : null;

            FineEntity updatedFine = fineService.updateFine(id, description, dueDate);
            return ResponseEntity.ok(updatedFine);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFineById(@PathVariable Long id) {
        try {
            fineService.deleteFine(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Endpoints específicos del negocio
    @PutMapping("/{id}/pay")
    public ResponseEntity<?> payFine(@PathVariable Long id) {
        try {
            FineEntity paidFine = fineService.payFine(id);
            return ResponseEntity.ok(paidFine);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelFine(@PathVariable Long id) {
        try {
            fineService.cancelFine(id);
            return ResponseEntity.ok("Fine cancelled successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getFinesByClient(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                return ResponseEntity.notFound().build();
            }
            List<FineEntity> fines = fineService.getFinesByClient(client);
            return ResponseEntity.ok(fines);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/client/{clientId}/unpaid")
    public ResponseEntity<?> getUnpaidFinesByClient(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                return ResponseEntity.notFound().build();
            }
            List<FineEntity> unpaidFines = fineService.getUnpaidFinesByClient(client);
            return ResponseEntity.ok(unpaidFines);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/client/{clientId}/total-unpaid")
    public ResponseEntity<?> getTotalUnpaidAmount(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                return ResponseEntity.notFound().build();
            }
            BigDecimal totalUnpaid = fineService.getTotalUnpaidAmount(client);
            return ResponseEntity.ok(Map.of("totalUnpaid", totalUnpaid));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/unpaid")
    public ResponseEntity<List<FineEntity>> getAllUnpaidFines() {
        List<FineEntity> unpaidFines = fineService.getAllUnpaidFines();
        return ResponseEntity.ok(unpaidFines);
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<FineEntity>> getOverdueFines() {
        List<FineEntity> overdueFines = fineService.getOverdueFines();
        return ResponseEntity.ok(overdueFines);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<FineEntity>> getFinesByType(@PathVariable String type) {
        FineEntity.FineType fineType = FineEntity.FineType.valueOf(type.toUpperCase());
        List<FineEntity> fines = fineService.getFinesByType(fineType);
        return ResponseEntity.ok(fines);
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getFineStatistics() {
        Map<String, Object> statistics = fineService.getFineStatistics();
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<FineEntity>> getFinesInDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);
        List<FineEntity> fines = fineService.getFinesInDateRange(start, end);
        return ResponseEntity.ok(fines);
    }

    @PostMapping("/{clientId}/check-restrictions")
    public ResponseEntity<Map<String, Object>> checkClientRestrictions(@PathVariable Long clientId) {
        Map<String, Object> restrictions = fineService.checkClientRestrictions(clientId);
        return ResponseEntity.ok(restrictions);
    }
}
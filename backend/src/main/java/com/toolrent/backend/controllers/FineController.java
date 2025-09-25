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
    private FineService fineService;

    @Autowired
    private ClientService clientService;

    @GetMapping("/")
    public ResponseEntity<List<FineEntity>> listFines() {
        List<FineEntity> fines = fineService.getAllFines();
        return ResponseEntity.ok(fines);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FineEntity> getFineById(@PathVariable Long id) {
        FineEntity fine = fineService.getFineById(id);
        return ResponseEntity.ok(fine);
    }

    @PostMapping("/")
    public ResponseEntity<FineEntity> saveFine(@RequestBody FineEntity fine) {
        FineEntity newFine = fineService.createFine(fine);
        return ResponseEntity.ok(newFine);
    }

    // Patrón del profesor - PUT sin ID en la URL, enviando objeto completo con ID
    @PutMapping("/")
    public ResponseEntity<FineEntity> updateFine(@RequestBody Map<String, Object> updates) throws Exception {
        Long id = Long.valueOf(updates.get("id").toString());
        String description = (String) updates.get("description");
        LocalDate dueDate = updates.get("dueDate") != null ?
                LocalDate.parse(updates.get("dueDate").toString()) : null;

        FineEntity updatedFine = fineService.updateFine(id, description, dueDate);
        return ResponseEntity.ok(updatedFine);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFineById(@PathVariable Long id) {
        fineService.deleteFine(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoints específicos del negocio
    @PutMapping("/{id}/pay")
    public ResponseEntity<FineEntity> payFine(@PathVariable Long id) {
        FineEntity paidFine = fineService.payFine(id);
        return ResponseEntity.ok(paidFine);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<String> cancelFine(@PathVariable Long id) {
        fineService.cancelFine(id);
        return ResponseEntity.ok("Fine cancelled successfully");
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<FineEntity>> getFinesByClient(@PathVariable Long clientId) {
        ClientEntity client = clientService.getClientById(clientId);
        List<FineEntity> fines = fineService.getFinesByClient(client);
        return ResponseEntity.ok(fines);
    }

    @GetMapping("/client/{clientId}/unpaid")
    public ResponseEntity<List<FineEntity>> getUnpaidFinesByClient(@PathVariable Long clientId) {
        ClientEntity client = clientService.getClientById(clientId);
        List<FineEntity> unpaidFines = fineService.getUnpaidFinesByClient(client);
        return ResponseEntity.ok(unpaidFines);
    }

    @GetMapping("/client/{clientId}/total-unpaid")
    public ResponseEntity<Map<String, BigDecimal>> getTotalUnpaidAmount(@PathVariable Long clientId) {
        ClientEntity client = clientService.getClientById(clientId);
        BigDecimal totalUnpaid = fineService.getTotalUnpaidAmount(client);
        return ResponseEntity.ok(Map.of("totalUnpaid", totalUnpaid));
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
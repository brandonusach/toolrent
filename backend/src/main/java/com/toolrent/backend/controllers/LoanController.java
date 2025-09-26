package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.LoanEntity;
import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.entities.ToolEntity;
import com.toolrent.backend.services.LoanService;
import com.toolrent.backend.services.ClientService;
import com.toolrent.backend.services.ToolService;
import com.toolrent.backend.services.RateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/loans")
@CrossOrigin("*")
public class LoanController {

    @Autowired
    private LoanService loanService;

    @Autowired
    private ClientService clientService;

    @Autowired
    private ToolService toolService;

    @Autowired
    private RateService rateService;

    @GetMapping("/")
    public ResponseEntity<List<LoanEntity>> getAllLoans() {
        List<LoanEntity> loans = loanService.getAllLoans();
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanEntity> getLoanById(@PathVariable Long id) {
        LoanEntity loan = loanService.getLoanById(id);
        return ResponseEntity.ok(loan);
    }

    @PostMapping("/")
    public ResponseEntity<LoanEntity> createLoan(@RequestBody Map<String, Object> request) {
        try {
            // Validar que los datos requeridos estén presentes
            if (!request.containsKey("clientId") || !request.containsKey("toolId") ||
                    !request.containsKey("quantity") || !request.containsKey("agreedReturnDate")) {
                throw new RuntimeException("Datos requeridos faltantes: clientId, toolId, quantity, agreedReturnDate");
            }

            // Manejo robusto de tipos
            Object clientIdObj = request.get("clientId");
            Object toolIdObj = request.get("toolId");
            Object quantityObj = request.get("quantity");

            Long clientId;
            Long toolId;
            Integer quantity;

            try {
                clientId = clientIdObj instanceof Number ?
                        ((Number) clientIdObj).longValue() :
                        Long.valueOf(clientIdObj.toString());

                toolId = toolIdObj instanceof Number ?
                        ((Number) toolIdObj).longValue() :
                        Long.valueOf(toolIdObj.toString());

                quantity = quantityObj instanceof Number ?
                        ((Number) quantityObj).intValue() :
                        Integer.valueOf(quantityObj.toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Error en formato de números: " + e.getMessage());
            }

            // Validar valores
            if (clientId <= 0 || toolId <= 0 || quantity <= 0) {
                throw new RuntimeException("Los valores deben ser mayores a 0");
            }

            String returnDate = request.get("agreedReturnDate").toString();
            String notes = request.get("notes") != null ? request.get("notes").toString() : "";

            // Validar fecha
            try {
                java.time.LocalDate.parse(returnDate);
            } catch (Exception e) {
                throw new RuntimeException("Formato de fecha inválido: " + returnDate);
            }

            // Obtener entidades
            ClientEntity client;
            ToolEntity tool;

            try {
                client = clientService.getClientById(clientId);
                if (client == null) {
                    throw new RuntimeException("Cliente no encontrado con ID: " + clientId);
                }
            } catch (Exception e) {
                throw new RuntimeException("Error al obtener cliente: " + e.getMessage());
            }

            try {
                tool = toolService.getToolById(toolId).orElse(null);
                if (tool == null) {
                    throw new RuntimeException("Herramienta no encontrada con ID: " + toolId);
                }
            } catch (Exception e) {
                throw new RuntimeException("Error al obtener herramienta: " + e.getMessage());
            }

            // Crear préstamo
            LoanEntity loan = new LoanEntity();
            loan.setClient(client);
            loan.setTool(tool);
            loan.setQuantity(quantity);
            loan.setAgreedReturnDate(java.time.LocalDate.parse(returnDate));
            loan.setNotes(notes.trim());

            LoanEntity createdLoan = loanService.createLoan(loan);
            return ResponseEntity.ok(createdLoan);

        } catch (Exception e) {
            // Log detallado del error
            System.err.println("Error creating loan: " + e.getMessage());
            e.printStackTrace();

            // Respuesta de error estructurada
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", java.time.LocalDateTime.now());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null); // O crear una entidad de error específica
        }
    }

    // Patrón del profesor - PUT sin ID en la URL
    @PutMapping("/")
    public ResponseEntity<LoanEntity> updateLoan(@RequestBody LoanEntity loan) {
        LoanEntity updatedLoan = loanService.updateLoan(loan.getId(), loan);
        return ResponseEntity.ok(updatedLoan);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLoan(@PathVariable Long id) {
        loanService.deleteLoan(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoints específicos del negocio
    @PutMapping("/{id}/return")
    public ResponseEntity<LoanEntity> returnTool(@PathVariable Long id,
                                                 @RequestParam(required = false, defaultValue = "false") Boolean damaged,
                                                 @RequestParam(required = false, defaultValue = "") String notes) {
        LoanEntity returnedLoan = loanService.returnTool(id, damaged, notes);
        return ResponseEntity.ok(returnedLoan);
    }

    @PostMapping("/validate-comprehensive")
    public ResponseEntity<LoanService.LoanValidationSummary> validateLoanComprehensive(@RequestBody Map<String, Object> request) {
        Long clientId = Long.valueOf(request.get("clientId").toString());
        Long toolId = Long.valueOf(request.get("toolId").toString());
        Integer quantity = Integer.valueOf(request.get("quantity").toString());

        ClientEntity client = clientService.getClientById(clientId);
        ToolEntity tool = toolService.getToolById(toolId).orElse(null);

        LoanService.LoanValidationSummary summary = loanService.getLoanValidationSummary(client, tool, quantity);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/client/{clientId}/restrictions")
    public ResponseEntity<Map<String, Object>> checkClientRestrictions(@PathVariable Long clientId) {
        Map<String, Object> restrictions = loanService.checkClientRestrictions(clientId);
        return ResponseEntity.ok(restrictions);
    }

    @GetMapping("/tool/{toolId}/availability")
    public ResponseEntity<Map<String, Object>> checkToolAvailability(@PathVariable Long toolId,
                                                                     @RequestParam(defaultValue = "1") Integer quantity) {
        ToolEntity tool = toolService.getToolById(toolId).orElse(null);
        Map<String, Object> availability = loanService.checkToolAvailability(tool, quantity);
        return ResponseEntity.ok(availability);
    }

    @GetMapping("/active")
    public ResponseEntity<List<LoanEntity>> getActiveLoans() {
        List<LoanEntity> activeLoans = loanService.getActiveLoans();
        return ResponseEntity.ok(activeLoans);
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<LoanEntity>> getOverdueLoans() {
        List<LoanEntity> overdueLoans = loanService.getOverdueLoans();
        return ResponseEntity.ok(overdueLoans);
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<LoanEntity>> getLoansByClient(@PathVariable Long clientId) {
        ClientEntity client = clientService.getClientById(clientId);
        List<LoanEntity> loans = loanService.getLoansByClient(client);
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/client/{clientId}/active-count")
    public ResponseEntity<Map<String, Object>> getActiveLoanCount(@PathVariable Long clientId) {
        Map<String, Object> count = loanService.getActiveLoanCount(clientId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/client/{clientId}/tool/{toolId}/check")
    public ResponseEntity<Map<String, Object>> checkClientToolLoan(@PathVariable Long clientId, @PathVariable Long toolId) {
        ClientEntity client = clientService.getClientById(clientId);
        ToolEntity tool = toolService.getToolById(toolId).orElse(null);
        Map<String, Object> check = loanService.checkClientToolLoan(client, tool);
        return ResponseEntity.ok(check);
    }

    @GetMapping("/rates/current")
    public ResponseEntity<Map<String, Object>> getCurrentRates() {
        Map<String, Object> rates = loanService.getCurrentRates();
        return ResponseEntity.ok(rates);
    }

    @GetMapping("/tool/{toolId}")
    public ResponseEntity<List<LoanEntity>> getLoansByTool(@PathVariable Long toolId) {
        ToolEntity tool = toolService.getToolById(toolId).orElse(null);
        List<LoanEntity> loans = loanService.getLoansByTool(tool);
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/reports/summary")
    public ResponseEntity<Map<String, Object>> getLoanSummary() {
        Map<String, Object> summary = loanService.getLoanSummary();
        return ResponseEntity.ok(summary);
    }
}
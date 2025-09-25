package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.LoanEntity;
import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.entities.ToolEntity;
import com.toolrent.backend.services.LoanService;
import com.toolrent.backend.services.ClientService;
import com.toolrent.backend.services.ToolService;
import com.toolrent.backend.services.RateService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/loans")
@CrossOrigin("*")
public class LoanController {

    private final LoanService loanService;
    private final ClientService clientService;
    private final ToolService toolService;
    private final RateService rateService;

    public LoanController(LoanService loanService, ClientService clientService,
                          ToolService toolService, RateService rateService) {
        this.loanService = loanService;
        this.clientService = clientService;
        this.toolService = toolService;
        this.rateService = rateService;
    }

    // GET /api/v1/loans - Get all loans
    @GetMapping("/")
    public ResponseEntity<List<LoanEntity>> getAllLoans() {
        try {
            List<LoanEntity> loans = loanService.getAllLoans();
            return ResponseEntity.ok(loans);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // GET /api/v1/loans/{id} - Get loan by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getLoanById(@PathVariable Long id) {
        try {
            LoanEntity loan = loanService.getLoanById(id);
            return ResponseEntity.ok(loan);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Loan not found with ID: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    // POST /api/v1/loans - Create new loan with COMPLETE validations (RF2.1)
    @PostMapping("/")
    public ResponseEntity<?> createLoan(@RequestBody Map<String, Object> request) {
        try {
            // Extract request data
            Long clientId = Long.valueOf(request.get("clientId").toString());
            Long toolId = Long.valueOf(request.get("toolId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            String returnDate = request.get("agreedReturnDate").toString();
            String notes = request.get("notes") != null ? request.get("notes").toString() : "";

            // Fetch entities
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Client not found with ID: " + clientId);
                return ResponseEntity.badRequest().body(error);
            }

            ToolEntity tool = toolService.getToolById(toolId).orElse(null);
            if (tool == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Tool not found with ID: " + toolId);
                return ResponseEntity.badRequest().body(error);
            }

            // Create loan entity
            LoanEntity loan = new LoanEntity();
            loan.setClient(client);
            loan.setTool(tool);
            loan.setQuantity(quantity);
            loan.setAgreedReturnDate(java.time.LocalDate.parse(returnDate));
            loan.setNotes(notes);

            // Create loan (all validations are done in service)
            LoanEntity createdLoan = loanService.createLoan(loan);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("loan", createdLoan);
            response.put("message", "Loan created successfully");
            response.put("dailyRate", createdLoan.getDailyRate());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // PUT /api/v1/loans/{id}/return - Return tool with automatic fine calculation (RF2.3)
    @PutMapping("/{id}/return")
    public ResponseEntity<?> returnTool(@PathVariable Long id,
                                        @RequestParam(required = false, defaultValue = "false") Boolean damaged,
                                        @RequestParam(required = false, defaultValue = "") String notes) {
        try {
            LoanEntity returnedLoan = loanService.returnTool(id, damaged, notes);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("loan", returnedLoan);
            response.put("message", "Tool returned successfully");
            response.put("wasDamaged", damaged);
            response.put("wasOverdue", returnedLoan.getStatus() == LoanEntity.LoanStatus.OVERDUE);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // POST /api/v1/loans/validate-comprehensive - Comprehensive loan validation
    @PostMapping("/validate-comprehensive")
    public ResponseEntity<?> validateLoanComprehensive(@RequestBody Map<String, Object> request) {
        try {
            Long clientId = Long.valueOf(request.get("clientId").toString());
            Long toolId = Long.valueOf(request.get("toolId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());

            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("valid", false);
                error.put("error", "Client not found");
                return ResponseEntity.badRequest().body(error);
            }

            ToolEntity tool = toolService.getToolById(toolId).orElse(null);
            if (tool == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("valid", false);
                error.put("error", "Tool not found");
                return ResponseEntity.badRequest().body(error);
            }

            // Get comprehensive validation summary
            LoanService.LoanValidationSummary summary =
                    loanService.getLoanValidationSummary(client, tool, quantity);

            Map<String, Object> response = new HashMap<>();
            response.put("valid", summary.canCreateLoan());
            response.put("clientEligible", summary.isClientEligible());
            response.put("clientIssue", summary.getClientIssue());
            response.put("toolAvailable", summary.isToolAvailable());
            response.put("toolIssue", summary.getToolIssue());
            response.put("hasExistingLoanForTool", summary.isHasExistingLoanForTool());
            response.put("currentDailyRate", summary.getCurrentDailyRate());
            response.put("currentLateFeeRate", summary.getCurrentLateFeeRate());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("valid", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // GET /api/v1/loans/client/{clientId}/restrictions - Check client restrictions
    @GetMapping("/client/{clientId}/restrictions")
    public ResponseEntity<?> checkClientRestrictions(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                return ResponseEntity.notFound().build();
            }

            loanService.validateClientEligibility(client);

            Map<String, String> response = new HashMap<>();
            response.put("eligible", "true");
            response.put("message", "Client is eligible for loans");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("eligible", "false");
            response.put("restriction", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    // GET /api/v1/loans/tool/{toolId}/availability - Check tool availability
    @GetMapping("/tool/{toolId}/availability")
    public ResponseEntity<?> checkToolAvailability(@PathVariable Long toolId,
                                                   @RequestParam(defaultValue = "1") Integer quantity) {
        try {
            ToolEntity tool = toolService.getToolById(toolId).orElse(null);
            if (tool == null) {
                return ResponseEntity.notFound().build();
            }

            loanService.validateToolAvailability(tool, quantity);

            Map<String, Object> response = new HashMap<>();
            response.put("available", true);
            response.put("currentStock", tool.getCurrentStock());
            response.put("requestedQuantity", quantity);
            response.put("message", "Tool is available for loan");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("available", false);
            response.put("currentStock", toolService.getToolById(toolId).map(ToolEntity::getCurrentStock).orElse(0));
            response.put("requestedQuantity", quantity);
            response.put("issue", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    // GET /api/v1/loans/active - Get active loans (RF6.1)
    @GetMapping("/active")
    public ResponseEntity<List<LoanEntity>> getActiveLoans() {
        try {
            List<LoanEntity> activeLoans = loanService.getActiveLoans();
            return ResponseEntity.ok(activeLoans);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // GET /api/v1/loans/overdue - Get overdue loans (RF6.1)
    @GetMapping("/overdue")
    public ResponseEntity<List<LoanEntity>> getOverdueLoans() {
        try {
            List<LoanEntity> overdueLoans = loanService.getOverdueLoans();
            return ResponseEntity.ok(overdueLoans);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // GET /api/v1/loans/client/{clientId} - Get loans by client
    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getLoansByClient(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Client not found with ID: " + clientId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            List<LoanEntity> loans = loanService.getLoansByClient(client);
            return ResponseEntity.ok(loans);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error fetching loans: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // GET /api/v1/loans/client/{clientId}/active-count - Get active loan count
    @GetMapping("/client/{clientId}/active-count")
    public ResponseEntity<?> getActiveLoanCount(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Client not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            List<LoanEntity> activeLoans = loanService.getLoansByClient(client)
                    .stream()
                    .filter(loan -> loan.getStatus() == LoanEntity.LoanStatus.ACTIVE)
                    .toList();

            Map<String, Object> response = new HashMap<>();
            response.put("count", activeLoans.size());
            response.put("maxAllowed", 5);
            response.put("canRequestMore", activeLoans.size() < 5);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // GET /api/v1/loans/client/{clientId}/tool/{toolId}/check - Check if client has active loan for tool
    @GetMapping("/client/{clientId}/tool/{toolId}/check")
    public ResponseEntity<?> checkClientToolLoan(@PathVariable Long clientId, @PathVariable Long toolId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            if (client == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Client not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            ToolEntity tool = toolService.getToolById(toolId).orElse(null);
            if (tool == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Tool not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            boolean hasActiveLoan = loanService.clientHasActiveLoanForTool(client, tool);

            Map<String, Object> response = new HashMap<>();
            response.put("hasActiveLoanForTool", hasActiveLoan);
            response.put("canLoanThisTool", !hasActiveLoan);
            response.put("message", hasActiveLoan ?
                    "Client already has an active loan for this tool" :
                    "Client can request a loan for this tool");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // GET /api/v1/loans/rates/current - Get current rates for loan calculation
    @GetMapping("/rates/current")
    public ResponseEntity<?> getCurrentRates() {
        try {
            Map<String, Object> rates = new HashMap<>();
            rates.put("dailyRentalRate", rateService.getCurrentRentalRate());
            rates.put("dailyLateFeeRate", rateService.getCurrentLateFeeRate());
            rates.put("repairRatePercentage", rateService.getCurrentRepairRate());

            return ResponseEntity.ok(rates);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error fetching current rates: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // GET /api/v1/loans/tool/{toolId} - Get loans by tool
    @GetMapping("/tool/{toolId}")
    public ResponseEntity<?> getLoansByTool(@PathVariable Long toolId) {
        try {
            ToolEntity tool = toolService.getToolById(toolId).orElse(null);
            if (tool == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Tool not found with ID: " + toolId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            List<LoanEntity> loans = loanService.getLoansByTool(tool);
            return ResponseEntity.ok(loans);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error fetching loans: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // GET /api/v1/loans/reports/summary - Get loan summary statistics
    @GetMapping("/reports/summary")
    public ResponseEntity<?> getLoanSummary() {
        try {
            List<LoanEntity> allLoans = loanService.getAllLoans();
            List<LoanEntity> activeLoans = loanService.getActiveLoans();
            List<LoanEntity> overdueLoans = loanService.getOverdueLoans();

            Map<String, Object> summary = new HashMap<>();
            summary.put("totalLoans", allLoans.size());
            summary.put("activeLoans", activeLoans.size());
            summary.put("overdueLoans", overdueLoans.size());
            summary.put("returnedLoans", allLoans.stream()
                    .filter(loan -> loan.getStatus() == LoanEntity.LoanStatus.RETURNED)
                    .count());
            summary.put("damagedLoans", allLoans.stream()
                    .filter(loan -> loan.getStatus() == LoanEntity.LoanStatus.DAMAGED)
                    .count());
            summary.put("currentRentalRate", rateService.getCurrentRentalRate());
            summary.put("currentLateFeeRate", rateService.getCurrentLateFeeRate());

            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error generating summary: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
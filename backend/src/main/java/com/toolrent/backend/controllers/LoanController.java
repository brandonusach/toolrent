package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.LoanEntity;
import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.entities.ToolEntity;
import com.toolrent.backend.services.LoanService;
import com.toolrent.backend.services.ClientService;
import com.toolrent.backend.services.ToolService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/loans")
@CrossOrigin(origins = "*")
public class LoanController {

    private final LoanService loanService;
    private final ClientService clientService;
    private final ToolService toolService;

    public LoanController(LoanService loanService, ClientService clientService, ToolService toolService) {
        this.loanService = loanService;
        this.clientService = clientService;
        this.toolService = toolService;
    }

    // GET /api/loans - Get all loans
    @GetMapping
    public ResponseEntity<List<LoanEntity>> getAllLoans() {
        try {
            List<LoanEntity> loans = loanService.getAllLoans();
            return new ResponseEntity<>(loans, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/loans/{id} - Get loan by ID
    @GetMapping("/{id}")
    public ResponseEntity<LoanEntity> getLoanById(@PathVariable Long id) {
        try {
            LoanEntity loan = loanService.getLoanById(id);
            return new ResponseEntity<>(loan, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/loans - Create new loan (RF2.1)
    @PostMapping
    public ResponseEntity<?> createLoan(@RequestBody LoanEntity loan) {
        try {
            // Validate and fetch client and tool entities
            if (loan.getClient() == null || loan.getClient().getId() == null) {
                return new ResponseEntity<>("Client ID is required", HttpStatus.BAD_REQUEST);
            }
            if (loan.getTool() == null || loan.getTool().getId() == null) {
                return new ResponseEntity<>("Tool ID is required", HttpStatus.BAD_REQUEST);
            }

            // Fetch complete entities from database
            ClientEntity client = clientService.getClientById(loan.getClient().getId());
            ToolEntity tool = toolService.getToolById(loan.getTool().getId())
                    .orElseThrow(() -> new RuntimeException("Tool not found"));

            loan.setClient(client);
            loan.setTool(tool);

            LoanEntity createdLoan = loanService.createLoan(loan);
            return new ResponseEntity<>(createdLoan, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error creating loan: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/loans/{id}/return - Return tool (RF2.3)
    @PutMapping("/{id}/return")
    public ResponseEntity<?> returnTool(@PathVariable Long id,
                                        @RequestParam(required = false, defaultValue = "false") Boolean damaged,
                                        @RequestParam(required = false) String notes) {
        try {
            LoanEntity returnedLoan = loanService.returnTool(id, damaged, notes);
            return new ResponseEntity<>(returnedLoan, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error returning tool: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/loans/active - Get active loans (RF6.1)
    @GetMapping("/active")
    public ResponseEntity<List<LoanEntity>> getActiveLoans() {
        try {
            List<LoanEntity> activeLoans = loanService.getActiveLoans();
            return new ResponseEntity<>(activeLoans, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/loans/overdue - Get overdue loans (RF6.1)
    @GetMapping("/overdue")
    public ResponseEntity<List<LoanEntity>> getOverdueLoans() {
        try {
            List<LoanEntity> overdueLoans = loanService.getOverdueLoans();
            return new ResponseEntity<>(overdueLoans, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/loans/client/{clientId} - Get loans by client
    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getLoansByClient(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            List<LoanEntity> loans = loanService.getLoansByClient(client);
            return new ResponseEntity<>(loans, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching loans", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/loans/tool/{toolId} - Get loans by tool
    @GetMapping("/tool/{toolId}")
    public ResponseEntity<?> getLoansByTool(@PathVariable Long toolId) {
        try {
            Optional<ToolEntity> toolOpt = toolService.getToolById(toolId);
            if (toolOpt.isEmpty()) {
                return new ResponseEntity<>("Tool not found", HttpStatus.NOT_FOUND);
            }

            List<LoanEntity> loans = loanService.getLoansByTool(toolOpt.get());
            return new ResponseEntity<>(loans, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching loans", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/loans/status/{status} - Get loans by status
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getLoansByStatus(@PathVariable String status) {
        try {
            LoanEntity.LoanStatus loanStatus = LoanEntity.LoanStatus.valueOf(status.toUpperCase());
            List<LoanEntity> loans = loanService.getAllLoans().stream()
                    .filter(loan -> loan.getStatus() == loanStatus)
                    .toList();
            return new ResponseEntity<>(loans, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>("Invalid status: " + status, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching loans", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/loans/validate - Validate loan creation without creating (RF2.2)
    @PostMapping("/validate")
    public ResponseEntity<?> validateLoan(@RequestBody LoanEntity loan) {
        try {
            // Validate client exists and is active
            if (loan.getClient() == null || loan.getClient().getId() == null) {
                return new ResponseEntity<>(Map.of("valid", false, "message", "Client ID is required"),
                        HttpStatus.BAD_REQUEST);
            }

            ClientEntity client = clientService.getClientById(loan.getClient().getId());
            if (client.getStatus() != ClientEntity.ClientStatus.ACTIVE) {
                return new ResponseEntity<>(Map.of("valid", false, "message", "Client is restricted"),
                        HttpStatus.OK);
            }

            // Validate tool exists and is available
            if (loan.getTool() == null || loan.getTool().getId() == null) {
                return new ResponseEntity<>(Map.of("valid", false, "message", "Tool ID is required"),
                        HttpStatus.BAD_REQUEST);
            }

            Optional<ToolEntity> toolOpt = toolService.getToolById(loan.getTool().getId());
            if (toolOpt.isEmpty()) {
                return new ResponseEntity<>(Map.of("valid", false, "message", "Tool not found"),
                        HttpStatus.OK);
            }

            ToolEntity tool = toolOpt.get();
            if (tool.getStatus() != ToolEntity.ToolStatus.AVAILABLE) {
                return new ResponseEntity<>(Map.of("valid", false, "message", "Tool is not available"),
                        HttpStatus.OK);
            }

            // Check stock availability
            if (loan.getQuantity() != null && loan.getQuantity() > tool.getCurrentStock()) {
                return new ResponseEntity<>(Map.of("valid", false,
                        "message", "Not enough stock available. Current stock: " + tool.getCurrentStock()),
                        HttpStatus.OK);
            }

            return new ResponseEntity<>(Map.of("valid", true, "message", "Loan can be created"),
                    HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(Map.of("valid", false, "message", e.getMessage()),
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error validating loan", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/loans/client/{clientId}/active-count - Get active loan count for client
    @GetMapping("/client/{clientId}/active-count")
    public ResponseEntity<?> getActiveLoanCount(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            List<LoanEntity> activeLoans = loanService.getLoansByClient(client).stream()
                    .filter(loan -> loan.getStatus() == LoanEntity.LoanStatus.ACTIVE)
                    .toList();

            return new ResponseEntity<>(Map.of("count", activeLoans.size(), "maxAllowed", 5),
                    HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error counting active loans", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/loans/reports/summary - Get loan summary statistics
    @GetMapping("/reports/summary")
    public ResponseEntity<?> getLoanSummary() {
        try {
            List<LoanEntity> allLoans = loanService.getAllLoans();
            List<LoanEntity> activeLoans = loanService.getActiveLoans();
            List<LoanEntity> overdueLoans = loanService.getOverdueLoans();

            Map<String, Object> summary = Map.of(
                    "totalLoans", allLoans.size(),
                    "activeLoans", activeLoans.size(),
                    "overdueLoans", overdueLoans.size(),
                    "returnedLoans", allLoans.stream()
                            .filter(loan -> loan.getStatus() == LoanEntity.LoanStatus.RETURNED)
                            .count(),
                    "damagedLoans", allLoans.stream()
                            .filter(loan -> loan.getStatus() == LoanEntity.LoanStatus.DAMAGED)
                            .count()
            );

            return new ResponseEntity<>(summary, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error generating summary", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/loans/{id}/notes - Update loan notes
    @PutMapping("/{id}/notes")
    public ResponseEntity<?> updateLoanNotes(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            LoanEntity loan = loanService.getLoanById(id);
            String notes = request.get("notes");

            if (notes != null) {
                loan.setNotes(notes);
                // Note: You would need to add an update method to LoanService
                // LoanEntity updatedLoan = loanService.updateLoan(loan);
                return new ResponseEntity<>(loan, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("Notes field is required", HttpStatus.BAD_REQUEST);
            }
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error updating notes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.FineEntity;
import com.toolrent.backend.entities.ClientEntity;
import com.toolrent.backend.entities.UserEntity;
import com.toolrent.backend.services.FineService;
import com.toolrent.backend.services.ClientService;
import com.toolrent.backend.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fines")
@CrossOrigin(origins = "*")
public class FineController {

    private final FineService fineService;
    private final ClientService clientService;
    private final UserService userService;

    public FineController(FineService fineService, ClientService clientService, UserService userService) {
        this.fineService = fineService;
        this.clientService = clientService;
        this.userService = userService;
    }

    // GET /api/fines - Get all fines
    @GetMapping
    public ResponseEntity<List<FineEntity>> getAllFines() {
        try {
            List<FineEntity> fines = fineService.getAllFines();
            return new ResponseEntity<>(fines, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/fines/{id} - Get fine by ID
    @GetMapping("/{id}")
    public ResponseEntity<FineEntity> getFineById(@PathVariable Long id) {
        try {
            FineEntity fine = fineService.getFineById(id);
            return new ResponseEntity<>(fine, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/fines - Create new fine (Manual creation - Admin only)
    @PostMapping
    public ResponseEntity<?> createFine(@RequestBody FineEntity fine) {
        try {
            // Validate and fetch entities
            if (fine.getClient() == null || fine.getClient().getId() == null) {
                return new ResponseEntity<>("Client ID is required", HttpStatus.BAD_REQUEST);
            }
            if (fine.getCreatedBy() == null || fine.getCreatedBy().getId() == null) {
                return new ResponseEntity<>("CreatedBy user ID is required", HttpStatus.BAD_REQUEST);
            }

            ClientEntity client = clientService.getClientById(fine.getClient().getId());
            UserEntity createdBy = userService.getUserById(fine.getCreatedBy().getId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + fine.getCreatedBy().getId()));

            fine.setClient(client);
            fine.setCreatedBy(createdBy);

            FineEntity createdFine = fineService.createFine(fine);
            return new ResponseEntity<>(createdFine, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error creating fine: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/fines/{id}/pay - Pay fine (RF2.5 - Remove client restriction)
    @PutMapping("/{id}/pay")
    public ResponseEntity<?> payFine(@PathVariable Long id,
                                     @RequestParam(required = false) Long paidByUserId) {
        try {
            UserEntity paidBy = null;
            if (paidByUserId != null) {
                paidBy = userService.getUserById(paidByUserId)
                        .orElseThrow(() -> new RuntimeException("User not found with ID: " + paidByUserId));
            }

            FineEntity paidFine = fineService.payFine(id, paidBy);
            return new ResponseEntity<>(paidFine, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error paying fine: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/fines/{id}/cancel - Cancel fine (Admin only)
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelFine(@PathVariable Long id, @RequestParam Long cancelledByUserId) {
        try {
            UserEntity cancelledBy = userService.getUserById(cancelledByUserId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + cancelledByUserId));
            fineService.cancelFine(id, cancelledBy);
            return new ResponseEntity<>("Fine cancelled successfully", HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error cancelling fine: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/fines/client/{clientId} - Get all fines for a client
    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getFinesByClient(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            List<FineEntity> fines = fineService.getFinesByClient(client);
            return new ResponseEntity<>(fines, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching client fines", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/fines/client/{clientId}/unpaid - Get unpaid fines for client (RF6.2)
    @GetMapping("/client/{clientId}/unpaid")
    public ResponseEntity<?> getUnpaidFinesByClient(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            List<FineEntity> unpaidFines = fineService.getUnpaidFinesByClient(client);
            return new ResponseEntity<>(unpaidFines, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching unpaid fines", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/fines/client/{clientId}/summary - Get client fine summary
    @GetMapping("/client/{clientId}/summary")
    public ResponseEntity<?> getClientFineSummary(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            Object summary = fineService.getClientFineSummary(client);
            return new ResponseEntity<>(summary, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error generating fine summary", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/fines/type/{type} - Get fines by type
    @GetMapping("/type/{type}")
    public ResponseEntity<?> getFinesByType(@PathVariable String type) {
        try {
            FineEntity.FineType fineType = FineEntity.FineType.valueOf(type.toUpperCase());
            List<FineEntity> fines = fineService.getFinesByType(fineType);
            return new ResponseEntity<>(fines, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>("Invalid fine type: " + type, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching fines by type", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/fines/overdue - Get overdue fines
    @GetMapping("/overdue")
    public ResponseEntity<List<FineEntity>> getOverdueFines() {
        try {
            List<FineEntity> overdueFines = fineService.getOverdueFines();
            return new ResponseEntity<>(overdueFines, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/fines/unpaid - Get all unpaid fines
    @GetMapping("/unpaid")
    public ResponseEntity<List<FineEntity>> getAllUnpaidFines() {
        try {
            List<FineEntity> unpaidFines = fineService.getAllFines().stream()
                    .filter(fine -> !fine.getPaid())
                    .toList();
            return new ResponseEntity<>(unpaidFines, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/fines/client/{clientId}/total-unpaid - Get total unpaid amount for client
    @GetMapping("/client/{clientId}/total-unpaid")
    public ResponseEntity<?> getTotalUnpaidAmount(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            BigDecimal totalUnpaid = fineService.getTotalUnpaidAmount(client);
            return new ResponseEntity<>(Map.of("totalUnpaid", totalUnpaid), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error calculating total unpaid", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/fines/reports/statistics - Get fine statistics
    @GetMapping("/reports/statistics")
    public ResponseEntity<?> getFineStatistics() {
        try {
            List<Object[]> statsByType = fineService.getFineStatsByType();
            List<FineEntity> allFines = fineService.getAllFines();

            long totalFines = allFines.size();
            long unpaidFines = allFines.stream().filter(f -> !f.getPaid()).count();
            long overdueFines = fineService.getOverdueFines().size();

            BigDecimal totalUnpaidAmount = allFines.stream()
                    .filter(f -> !f.getPaid())
                    .map(FineEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> statistics = Map.of(
                    "totalFines", totalFines,
                    "unpaidFines", unpaidFines,
                    "overdueFines", overdueFines,
                    "totalUnpaidAmount", totalUnpaidAmount,
                    "finesByType", statsByType
            );

            return new ResponseEntity<>(statistics, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error generating statistics", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/fines/{id} - Update fine details (Admin only)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateFine(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        try {
            String description = (String) updates.get("description");
            LocalDate dueDate = updates.get("dueDate") != null ?
                    LocalDate.parse(updates.get("dueDate").toString()) : null;

            FineEntity updatedFine = fineService.updateFine(id, description, dueDate);
            return new ResponseEntity<>(updatedFine, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error updating fine: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // DELETE /api/fines/{id} - Delete fine (Admin only, unpaid fines only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFine(@PathVariable Long id, @RequestParam Long deletedByUserId) {
        try {
            UserEntity deletedBy = userService.getUserById(deletedByUserId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + deletedByUserId));
            fineService.deleteFine(id, deletedBy);
            return new ResponseEntity<>("Fine deleted successfully", HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error deleting fine: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/fines/reports/date-range - Get fines in date range
    @GetMapping("/reports/date-range")
    public ResponseEntity<?> getFinesInDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
            LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);

            List<FineEntity> fines = fineService.getFinesInDateRange(start, end);
            return new ResponseEntity<>(fines, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error fetching fines in date range: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
        }
    }

    // GET /api/fines/latest - Get latest fines (for dashboard)
    @GetMapping("/latest")
    public ResponseEntity<List<FineEntity>> getLatestFines(@RequestParam(defaultValue = "10") int limit) {
        try {
            List<FineEntity> latestFines = fineService.getLatestFines(limit);
            return new ResponseEntity<>(latestFines, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/fines/client/{clientId}/check-restrictions - Check if client is restricted by fines
    @PostMapping("/client/{clientId}/check-restrictions")
    public ResponseEntity<?> checkClientRestrictions(@PathVariable Long clientId) {
        try {
            ClientEntity client = clientService.getClientById(clientId);
            boolean hasUnpaidFines = fineService.clientHasUnpaidFines(client);
            BigDecimal totalUnpaid = fineService.getTotalUnpaidAmount(client);

            Map<String, Object> restrictions = Map.of(
                    "hasUnpaidFines", hasUnpaidFines,
                    "totalUnpaidAmount", totalUnpaid,
                    "isRestricted", client.getStatus() == ClientEntity.ClientStatus.RESTRICTED,
                    "canRequestLoans", !hasUnpaidFines && client.getStatus() == ClientEntity.ClientStatus.ACTIVE
            );

            return new ResponseEntity<>(restrictions, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error checking restrictions", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
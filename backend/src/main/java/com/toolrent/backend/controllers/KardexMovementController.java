package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.*;
import com.toolrent.backend.services.KardexMovementService;
import com.toolrent.backend.services.ToolService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kardex-movements")
@CrossOrigin(origins = "*")
public class KardexMovementController {

    private final KardexMovementService kardexMovementService;
    private final ToolService toolService;
    // private final UserService userService; // Uncomment if UserService exists

    public KardexMovementController(KardexMovementService kardexMovementService,
                                    ToolService toolService) {
        this.kardexMovementService = kardexMovementService;
        this.toolService = toolService;
        // this.userService = userService; // Uncomment if UserService exists
    }

    // ========== ENDPOINTS FOR MOVEMENT CREATION ==========

    // POST /api/kardex-movements/initial-stock - Create initial stock movement
    @PostMapping("/initial-stock")
    public ResponseEntity<?> createInitialStockMovement(@RequestBody Map<String, Object> request) {
        try {
            Long toolId = Long.valueOf(request.get("toolId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            Long userId = Long.valueOf(request.get("userId").toString());

            ToolEntity tool = toolService.getToolById(toolId)
                    .orElseThrow(() -> new RuntimeException("Tool not found"));


            KardexMovementEntity movement = kardexMovementService.createInitialStockMovement(
                    tool, quantity);

            return new ResponseEntity<>(movement, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error creating initial stock movement: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/kardex-movements/loan - Create loan movement
    @PostMapping("/loan")
    public ResponseEntity<?> createLoanMovement(@RequestBody Map<String, Object> request) {
        try {
            Long toolId = Long.valueOf(request.get("toolId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            String description = (String) request.get("description");
            Long loanId = request.get("loanId") != null ?
                    Long.valueOf(request.get("loanId").toString()) : null;

            ToolEntity tool = toolService.getToolById(toolId)
                    .orElseThrow(() -> new RuntimeException("Tool not found"));


            LoanEntity loan = null;
            if (loanId != null) {
                loan = new LoanEntity();
                loan.setId(loanId);
                // loan = loanService.getLoanById(loanId); // Use when LoanService is available
            }

            KardexMovementEntity movement = kardexMovementService.createLoanMovement(
                    tool, quantity, description, loan);

            return new ResponseEntity<>(movement, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error creating loan movement: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/kardex-movements/return - Create return movement
    @PostMapping("/return")
    public ResponseEntity<?> createReturnMovement(@RequestBody Map<String, Object> request) {
        try {
            Long toolId = Long.valueOf(request.get("toolId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            String description = (String) request.get("description");
            Long userId = Long.valueOf(request.get("userId").toString());
            Long loanId = Long.valueOf(request.get("loanId").toString());

            // Handle instance IDs for specific return
            @SuppressWarnings("unchecked")
            List<Long> instanceIds = (List<Long>) request.get("instanceIds");
            Boolean isDamaged = request.get("isDamaged") != null ?
                    (Boolean) request.get("isDamaged") : false;

            ToolEntity tool = toolService.getToolById(toolId)
                    .orElseThrow(() -> new RuntimeException("Tool not found"));

            LoanEntity loan = new LoanEntity();
            loan.setId(loanId);

            KardexMovementEntity movement = kardexMovementService.createReturnMovement(
                    tool, quantity, description, loan, instanceIds, isDamaged);

            return new ResponseEntity<>(movement, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error creating return movement: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/kardex-movements/decommission - Create decommission movement
    @PostMapping("/decommission")
    public ResponseEntity<?> createDecommissionMovement(@RequestBody Map<String, Object> request) {
        try {
            Long toolId = Long.valueOf(request.get("toolId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            String description = (String) request.get("description");
            Long userId = Long.valueOf(request.get("userId").toString());

            @SuppressWarnings("unchecked")
            List<Long> instanceIds = (List<Long>) request.get("instanceIds");

            ToolEntity tool = toolService.getToolById(toolId)
                    .orElseThrow(() -> new RuntimeException("Tool not found"));



            KardexMovementEntity movement = kardexMovementService.createDecommissionMovement(
                    tool, quantity, description, instanceIds);

            return new ResponseEntity<>(movement, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error creating decommission movement: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/kardex-movements/restock - Create restock movement
    @PostMapping("/restock")
    public ResponseEntity<?> createRestockMovement(@RequestBody Map<String, Object> request) {
        try {
            Long toolId = Long.valueOf(request.get("toolId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            String description = (String) request.get("description");
            Long userId = Long.valueOf(request.get("userId").toString());

            ToolEntity tool = toolService.getToolById(toolId)
                    .orElseThrow(() -> new RuntimeException("Tool not found"));


            KardexMovementEntity movement = kardexMovementService.createRestockMovement(
                    tool, quantity, description);

            return new ResponseEntity<>(movement, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error creating restock movement: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/kardex-movements/repair - Create repair movement
    @PostMapping("/repair")
    public ResponseEntity<?> createRepairMovement(@RequestBody Map<String, Object> request) {
        try {
            Long toolId = Long.valueOf(request.get("toolId").toString());
            String description = (String) request.get("description");
            Long userId = Long.valueOf(request.get("userId").toString());
            Long instanceId = request.get("instanceId") != null ?
                    Long.valueOf(request.get("instanceId").toString()) : null;

            ToolEntity tool = toolService.getToolById(toolId)
                    .orElseThrow(() -> new RuntimeException("Tool not found"));


            KardexMovementEntity movement = kardexMovementService.createRepairMovement(
                    tool, description, instanceId);

            return new ResponseEntity<>(movement, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error creating repair movement: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ========== QUERY ENDPOINTS (RF5.2 & RF5.3) ==========

    // GET /api/kardex-movements - Get all movements
    @GetMapping
    public ResponseEntity<List<KardexMovementEntity>> getAllMovements() {
        try {
            List<KardexMovementEntity> movements = kardexMovementService.getAllMovements();
            return new ResponseEntity<>(movements, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/kardex-movements/{id} - Get movement by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getMovementById(@PathVariable Long id) {
        try {
            KardexMovementEntity movement = kardexMovementService.getMovementById(id);
            return new ResponseEntity<>(movement, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error retrieving movement", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/kardex-movements/tool/{toolId} - Get movements by tool (RF5.2)
    @GetMapping("/tool/{toolId}")
    public ResponseEntity<?> getMovementHistoryByTool(@PathVariable Long toolId) {
        try {
            List<KardexMovementEntity> movements = kardexMovementService.getMovementHistoryByTool(toolId);
            return new ResponseEntity<>(movements, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error retrieving movement history", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/kardex-movements/date-range - Get movements by date range (RF5.3)
    @GetMapping("/date-range")
    public ResponseEntity<?> getMovementsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            List<KardexMovementEntity> movements = kardexMovementService.getMovementsByDateRange(start, end);
            return new ResponseEntity<>(movements, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error parsing dates or retrieving movements: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
        }
    }

    // GET /api/kardex-movements/date-range-datetime - Get movements by datetime range
    @GetMapping("/date-range-datetime")
    public ResponseEntity<?> getMovementsByDateTimeRange(
            @RequestParam String startDateTime,
            @RequestParam String endDateTime) {
        try {
            LocalDateTime start = LocalDateTime.parse(startDateTime);
            LocalDateTime end = LocalDateTime.parse(endDateTime);

            List<KardexMovementEntity> movements = kardexMovementService.getMovementsByDateRange(start, end);
            return new ResponseEntity<>(movements, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error parsing datetimes or retrieving movements: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST);
        }
    }

    // GET /api/kardex-movements/type/{type} - Get movements by type
    @GetMapping("/type/{type}")
    public ResponseEntity<?> getMovementsByType(@PathVariable String type) {
        try {
            KardexMovementEntity.MovementType movementType =
                    KardexMovementEntity.MovementType.valueOf(type.toUpperCase());
            List<KardexMovementEntity> movements = kardexMovementService.getMovementsByType(movementType);
            return new ResponseEntity<>(movements, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>("Invalid movement type: " + type, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error retrieving movements by type", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/kardex-movements/loan/{loanId} - Get movements by loan ID
    @GetMapping("/loan/{loanId}")
    public ResponseEntity<?> getMovementsByLoanId(@PathVariable Long loanId) {
        try {
            List<KardexMovementEntity> movements = kardexMovementService.getMovementsByLoanId(loanId);
            return new ResponseEntity<>(movements, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error retrieving movements by loan", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ========== CONSISTENCY AND AUDIT ENDPOINTS ==========

    // GET /api/kardex-movements/tool/{toolId}/verify-consistency - Verify stock consistency
    @GetMapping("/tool/{toolId}/verify-consistency")
    public ResponseEntity<?> verifyStockConsistency(@PathVariable Long toolId) {
        try {
            ToolEntity tool = toolService.getToolById(toolId)
                    .orElseThrow(() -> new RuntimeException("Tool not found"));

            boolean isConsistent = kardexMovementService.verifyStockConsistency(tool);
            return new ResponseEntity<>(Map.of("consistent", isConsistent), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error verifying consistency", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/kardex-movements/tool/{toolId}/audit-report - Generate audit report
    @GetMapping("/tool/{toolId}/audit-report")
    public ResponseEntity<?> generateAuditReport(@PathVariable Long toolId) {
        try {
            KardexMovementService.KardexAuditReport report =
                    kardexMovementService.generateAuditReport(toolId);
            return new ResponseEntity<>(report, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error generating audit report: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ========== UTILITY ENDPOINTS ==========

    // GET /api/kardex-movements/statistics/by-type - Get movement statistics by type
    @GetMapping("/statistics/by-type")
    public ResponseEntity<?> getMovementStatisticsByType() {
        try {
            // This would require implementing the statistics methods in the repository/service
            // For now, return a placeholder response
            return new ResponseEntity<>("Statistics endpoint - implement based on repository methods",
                    HttpStatus.NOT_IMPLEMENTED);
        } catch (Exception e) {
            return new ResponseEntity<>("Error getting statistics", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/kardex-movements/recent - Get recent movements (for dashboard)
    @GetMapping("/recent")
    public ResponseEntity<List<KardexMovementEntity>> getRecentMovements(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            // This would use pagination from the repository
            List<KardexMovementEntity> movements = kardexMovementService.getAllMovements();

            // Simple limitation - in production, use proper pagination
            List<KardexMovementEntity> recentMovements = movements.size() > limit ?
                    movements.subList(0, limit) : movements;

            return new ResponseEntity<>(recentMovements, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/kardex-movements/general - General movement creation endpoint
    @PostMapping("/general")
    public ResponseEntity<?> createGeneralMovement(@RequestBody Map<String, Object> request) {
        try {
            Long toolId = Long.valueOf(request.get("toolId").toString());
            String typeStr = (String) request.get("type");
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            String description = (String) request.get("description");
            Long userId = Long.valueOf(request.get("userId").toString());
            Long loanId = request.get("loanId") != null ?
                    Long.valueOf(request.get("loanId").toString()) : null;

            ToolEntity tool = toolService.getToolById(toolId)
                    .orElseThrow(() -> new RuntimeException("Tool not found"));


            LoanEntity loan = null;
            if (loanId != null) {
                loan = new LoanEntity();
                loan.setId(loanId);
            }

            KardexMovementEntity.MovementType type =
                    KardexMovementEntity.MovementType.valueOf(typeStr.toUpperCase());

            KardexMovementEntity movement = kardexMovementService.createMovement(
                    tool, type, quantity, description, loan);

            return new ResponseEntity<>(movement, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>("Invalid movement type", HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error creating movement: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
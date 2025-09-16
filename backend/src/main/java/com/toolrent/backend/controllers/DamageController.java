package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.*;
import com.toolrent.backend.services.DamageService;
import com.toolrent.backend.services.LoanService;
import com.toolrent.backend.services.ToolInstanceService;
import com.toolrent.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/damages")
@CrossOrigin(origins = "*")
public class DamageController {

    @Autowired
    private DamageService damageService;

    @Autowired
    private LoanService loanService;

    @Autowired
    private ToolInstanceService toolInstanceService;

    @Autowired
    private UserService userService;

    // ========== DAMAGE REPORTING ENDPOINTS ==========

    @PostMapping("/report")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<?> reportDamage(@RequestBody DamageReportRequest request,
                                          HttpServletRequest httpRequest) {
        try {
            // Get current user
            UserEntity currentUser = getCurrentUser(httpRequest);

            // Get loan and tool instance
            LoanEntity loan = loanService.getLoanById(request.getLoanId());
            ToolInstanceEntity toolInstance = toolInstanceService.getInstanceById(request.getToolInstanceId());

            // Report damage
            DamageEntity damage = damageService.reportDamage(loan, toolInstance,
                    request.getDescription(), currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Damage reported successfully");
            response.put("damageId", damage.getId());
            response.put("status", damage.getStatus());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ========== DAMAGE ASSESSMENT ENDPOINTS ==========

    @PutMapping("/{damageId}/assess")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<?> assessDamage(@PathVariable Long damageId,
                                          @RequestBody DamageAssessmentRequest request,
                                          HttpServletRequest httpRequest) {
        try {
            UserEntity currentUser = getCurrentUser(httpRequest);

            DamageEntity damage = damageService.assessDamage(
                    damageId,
                    DamageEntity.DamageType.valueOf(request.getDamageType()),
                    request.getAssessmentDescription(),
                    request.getRepairCost(),
                    request.getIsRepairable(),
                    currentUser
            );

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Damage assessed successfully");
            response.put("damage", damage);
            response.put("costCalculated", damage.calculateCost());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ========== REPAIR MANAGEMENT ENDPOINTS ==========

    @PutMapping("/{damageId}/start-repair")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<?> startRepair(@PathVariable Long damageId,
                                         HttpServletRequest httpRequest) {
        try {
            DamageEntity damage = damageService.startRepair(damageId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Repair started successfully");
            response.put("damage", damage);
            response.put("status", damage.getStatus());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{damageId}/complete-repair")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<?> completeRepair(@PathVariable Long damageId,
                                            HttpServletRequest httpRequest) {
        try {
            UserEntity currentUser = getCurrentUser(httpRequest);
            DamageEntity damage = damageService.completeRepair(damageId, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Repair completed successfully");
            response.put("damage", damage);
            response.put("status", damage.getStatus());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ========== QUERY ENDPOINTS ==========

    @GetMapping
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getAllDamages() {
        List<DamageEntity> damages = damageService.getAllDamages();
        return ResponseEntity.ok(damages);
    }

    @GetMapping("/{damageId}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<?> getDamageById(@PathVariable Long damageId) {
        try {
            DamageEntity damage = damageService.getDamageById(damageId);
            return ResponseEntity.ok(damage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/by-loan/{loanId}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getDamagesByLoan(@PathVariable Long loanId) {
        List<DamageEntity> damages = damageService.getDamagesByLoanId(loanId);
        return ResponseEntity.ok(damages);
    }

    @GetMapping("/by-tool-instance/{toolInstanceId}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getDamagesByToolInstance(@PathVariable Long toolInstanceId) {
        List<DamageEntity> damages = damageService.getDamagesByToolInstanceId(toolInstanceId);
        return ResponseEntity.ok(damages);
    }

    @GetMapping("/by-tool/{toolId}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getDamagesByTool(@PathVariable Long toolId) {
        List<DamageEntity> damages = damageService.getDamagesByToolId(toolId);
        return ResponseEntity.ok(damages);
    }

    @GetMapping("/by-client/{clientId}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getDamagesByClient(@PathVariable Long clientId) {
        List<DamageEntity> damages = damageService.getDamagesByClientId(clientId);
        return ResponseEntity.ok(damages);
    }

    @GetMapping("/by-status/{status}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getDamagesByStatus(@PathVariable String status) {
        try {
            DamageEntity.DamageStatus damageStatus = DamageEntity.DamageStatus.valueOf(status.toUpperCase());
            List<DamageEntity> damages = damageService.getDamagesByStatus(damageStatus);
            return ResponseEntity.ok(damages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/by-type/{type}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getDamagesByType(@PathVariable String type) {
        try {
            DamageEntity.DamageType damageType = DamageEntity.DamageType.valueOf(type.toUpperCase());
            List<DamageEntity> damages = damageService.getDamagesByType(damageType);
            return ResponseEntity.ok(damages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ========== DASHBOARD AND REPORTS ENDPOINTS ==========

    @GetMapping("/pending-assessments")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getPendingAssessments() {
        List<DamageEntity> damages = damageService.getPendingAssessments();
        return ResponseEntity.ok(damages);
    }

    @GetMapping("/under-repair")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getDamagesUnderRepair() {
        List<DamageEntity> damages = damageService.getDamagesUnderRepair();
        return ResponseEntity.ok(damages);
    }

    @GetMapping("/irreparable")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getIrreparableDamages() {
        List<DamageEntity> damages = damageService.getIrreparableDamages();
        return ResponseEntity.ok(damages);
    }

    @GetMapping("/urgent")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getUrgentDamages() {
        List<DamageEntity> damages = damageService.getUrgentDamages();
        return ResponseEntity.ok(damages);
    }

    @GetMapping("/stagnant-assessments")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getStagnantAssessments() {
        List<DamageEntity> damages = damageService.getStagnantAssessments();
        return ResponseEntity.ok(damages);
    }

    @GetMapping("/overdue-repairs")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getOverdueRepairs() {
        List<DamageEntity> damages = damageService.getOverdueRepairs();
        return ResponseEntity.ok(damages);
    }

    @GetMapping("/dashboard-summary")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<DamageService.DamageDashboardSummary> getDashboardSummary() {
        DamageService.DamageDashboardSummary summary = damageService.getDamageDashboardSummary();
        return ResponseEntity.ok(summary);
    }

    // ========== STATISTICS ENDPOINTS ==========

    @GetMapping("/stats/by-tool")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<Object[]>> getDamageStatsByTool() {
        List<Object[]> stats = damageService.getDamageStatsByTool();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/by-client")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<Object[]>> getDamageStatsByClient() {
        List<Object[]> stats = damageService.getDamageStatsByClient();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/monthly-trend")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<Object[]>> getMonthlyDamageTrend() {
        List<Object[]> trend = damageService.getMonthlyDamageTrend();
        return ResponseEntity.ok(trend);
    }

    @GetMapping("/stats/repair-cost")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<?> getTotalRepairCost(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        BigDecimal totalCost = damageService.calculateTotalRepairCostInPeriod(start, end);

        Map<String, Object> response = new HashMap<>();
        response.put("startDate", startDate);
        response.put("endDate", endDate);
        response.put("totalRepairCost", totalCost);

        return ResponseEntity.ok(response);
    }

    // ========== DATE RANGE QUERY ENDPOINTS ==========

    @GetMapping("/by-date-range")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<DamageEntity>> getDamagesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        List<DamageEntity> damages = damageService.getDamagesByDateRange(startDate, endDate);
        return ResponseEntity.ok(damages);
    }

    // ========== UTILITY ENDPOINTS ==========

    @GetMapping("/tool-instance/{toolInstanceId}/has-pending")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, Boolean>> checkPendingDamages(@PathVariable Long toolInstanceId) {
        boolean hasPending = damageService.hasPendingDamages(toolInstanceId);
        return ResponseEntity.ok(Map.of("hasPendingDamages", hasPending));
    }

    @GetMapping("/loan/{loanId}/has-damages")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, Boolean>> checkLoanDamages(@PathVariable Long loanId) {
        boolean hasDamages = damageService.loanHasDamages(loanId);
        return ResponseEntity.ok(Map.of("hasDamages", hasDamages));
    }

    @GetMapping("/count/by-status/{status}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<?> countDamagesByStatus(@PathVariable String status) {
        try {
            DamageEntity.DamageStatus damageStatus = DamageEntity.DamageStatus.valueOf(status.toUpperCase());
            long count = damageService.countDamagesByStatus(damageStatus);
            return ResponseEntity.ok(Map.of("status", status, "count", count));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + status));
        }
    }

    @GetMapping("/count/by-client/{clientId}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<Map<String, Object>> countDamagesByClient(@PathVariable Long clientId) {
        long totalCount = damageService.countDamagesByClient(clientId);
        long irreparableCount = damageService.countIrreparableDamagesByClient(clientId);

        Map<String, Object> response = new HashMap<>();
        response.put("clientId", clientId);
        response.put("totalDamages", totalCount);
        response.put("irreparableDamages", irreparableCount);

        return ResponseEntity.ok(response);
    }

    // ========== PRIVATE HELPER METHODS ==========

    private UserEntity getCurrentUser(HttpServletRequest request) {
        // Implementation would extract user from JWT token or session
        // For now, assuming user ID is in request header or session
        String userId = request.getHeader("X-User-Id");
        if (userId != null) {
            try {
                Optional<UserEntity> userOpt = userService.getUserById(Long.parseLong(userId));
                if (userOpt.isPresent()) {
                    return userOpt.get();
                } else {
                    throw new RuntimeException("User not found with ID: " + userId);
                }
            } catch (NumberFormatException e) {
                throw new RuntimeException("Invalid user ID format: " + userId);
            }
        }

        // Alternative: try to get user by username from header
        String username = request.getHeader("X-Username");
        if (username != null) {
            Optional<UserEntity> userOpt = userService.getUserByUsername(username);
            if (userOpt.isPresent()) {
                return userOpt.get();
            } else {
                throw new RuntimeException("User not found with username: " + username);
            }
        }

        throw new RuntimeException("User not authenticated - no user ID or username in headers");
    }

    // ========== REQUEST/RESPONSE DTOs ==========

    public static class DamageReportRequest {
        private Long loanId;
        private Long toolInstanceId;
        private String description;

        // Getters and Setters
        public Long getLoanId() { return loanId; }
        public void setLoanId(Long loanId) { this.loanId = loanId; }

        public Long getToolInstanceId() { return toolInstanceId; }
        public void setToolInstanceId(Long toolInstanceId) { this.toolInstanceId = toolInstanceId; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class DamageAssessmentRequest {
        private String damageType;
        private String assessmentDescription;
        private BigDecimal repairCost;
        private Boolean isRepairable;

        // Getters and Setters
        public String getDamageType() { return damageType; }
        public void setDamageType(String damageType) { this.damageType = damageType; }

        public String getAssessmentDescription() { return assessmentDescription; }
        public void setAssessmentDescription(String assessmentDescription) { this.assessmentDescription = assessmentDescription; }

        public BigDecimal getRepairCost() { return repairCost; }
        public void setRepairCost(BigDecimal repairCost) { this.repairCost = repairCost; }

        public Boolean getIsRepairable() { return isRepairable; }
        public void setIsRepairable(Boolean isRepairable) { this.isRepairable = isRepairable; }
    }
}
package com.toolrent.backend.controllers;
import com.toolrent.backend.services.ToolService;
import com.toolrent.backend.entities.ToolInstanceEntity;
import com.toolrent.backend.entities.ToolInstanceEntity.ToolInstanceStatus;
import com.toolrent.backend.services.ToolInstanceService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tool-instances")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class ToolInstanceController {

    private final ToolInstanceService toolInstanceService;
    private final ToolService toolService;

    public ToolInstanceController(ToolInstanceService toolInstanceService,
                                  ToolService toolService) { // AGREGAR PARÁMETRO
        this.toolInstanceService = toolInstanceService;
        this.toolService = toolService; // INICIALIZAR
    }

    // GET /api/tool-instances/tool/{toolId} - Get all instances of a tool
    @GetMapping("/tool/{toolId}")
    public ResponseEntity<?> getInstancesByTool(@PathVariable Long toolId) {
        System.out.println("=== DEBUG: Request received for tool ID: " + toolId + " ===");

        try {
            // Verificar que el toolId no sea null o inválido
            if (toolId == null || toolId <= 0) {
                System.out.println("=== ERROR: Invalid tool ID: " + toolId + " ===");
                return new ResponseEntity<>("Invalid tool ID", HttpStatus.BAD_REQUEST);
            }

            List<ToolInstanceEntity> instances = toolInstanceService.getInstancesByTool(toolId);
            System.out.println("=== DEBUG: Found " + instances.size() + " instances ===");

            // Debug: Print each instance with more details
            instances.forEach(instance -> {
                System.out.println("Instance ID: " + instance.getId() +
                        ", Status: " + instance.getStatus() +
                        ", Tool ID: " + (instance.getTool() != null ? instance.getTool().getId() : "NULL"));
            });

            // Retornar siempre una lista, incluso si está vacía
            return new ResponseEntity<>(instances, HttpStatus.OK);
        } catch (RuntimeException e) {
            System.out.println("=== RUNTIME ERROR in getInstancesByTool ===");
            System.out.println("Error message: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            System.out.println("=== GENERAL ERROR in getInstancesByTool ===");
            System.out.println("Error message: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>("Internal server error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tool-instances/tool/{toolId}/available - Count available instances
    @GetMapping("/tool/{toolId}/available")
    public ResponseEntity<?> getAvailableCount(@PathVariable Long toolId) {
        try {
            if (toolId == null || toolId <= 0) {
                return new ResponseEntity<>("Invalid tool ID", HttpStatus.BAD_REQUEST);
            }

            Long count = toolInstanceService.getAvailableCount(toolId);
            System.out.println("=== DEBUG: Available count for tool " + toolId + ": " + count + " ===");
            return new ResponseEntity<>(count, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("Error getting available count: " + e.getMessage());
            return new ResponseEntity<>("Error getting available count", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tool-instances/tool/{toolId}/stats - Get tool instance statistics
    @GetMapping("/tool/{toolId}/stats")
    public ResponseEntity<?> getToolStats(@PathVariable Long toolId) {
        try {
            ToolInstanceService.ToolInstanceStats stats = toolInstanceService.getToolInstanceStats(toolId);
            return new ResponseEntity<>(stats, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("Error getting tool stats: " + e.getMessage());
            return new ResponseEntity<>("Error getting tool stats", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tool-instances/status/{status} - Get instances by status
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getInstancesByStatus(@PathVariable String status) {
        try {
            ToolInstanceStatus instanceStatus = ToolInstanceStatus.valueOf(status.toUpperCase());
            List<ToolInstanceEntity> instances = toolInstanceService.getInstancesByStatus(instanceStatus);
            return new ResponseEntity<>(instances, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>("Invalid status: " + status, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.out.println("Error getting instances by status: " + e.getMessage());
            return new ResponseEntity<>("Error getting instances by status", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tool-instances/{instanceId}/status - Update instance status
    @PutMapping("/{instanceId}/status")
    public ResponseEntity<?> updateInstanceStatus(
            @PathVariable Long instanceId,
            @RequestBody Map<String, String> request) {

        System.out.println("=== DEBUG: Updating instance " + instanceId + " with request: " + request + " ===");

        try {
            String status = request.get("status");
            if (status == null || status.trim().isEmpty()) {
                return new ResponseEntity<>("Status is required", HttpStatus.BAD_REQUEST);
            }

            ToolInstanceStatus instanceStatus = ToolInstanceStatus.valueOf(status.toUpperCase());
            ToolInstanceEntity updatedInstance = toolInstanceService.updateInstanceStatus(instanceId, instanceStatus);

            System.out.println("=== DEBUG: Instance updated successfully ===");
            return new ResponseEntity<>(updatedInstance, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            System.out.println("Invalid status error: " + e.getMessage());
            return new ResponseEntity<>("Invalid status: " + request.get("status"), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            System.out.println("Runtime error: " + e.getMessage());
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            System.out.println("Error updating instance status: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>("Error updating instance status: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // DELETE /api/tool-instances/{instanceId} - Delete individual instance
    @DeleteMapping("/{instanceId}")
    public ResponseEntity<?> deleteInstance(@PathVariable Long instanceId) {
        System.out.println("=== DEBUG: Deleting instance " + instanceId + " ===");

        try {
            if (instanceId == null || instanceId <= 0) {
                return new ResponseEntity<>("Invalid instance ID", HttpStatus.BAD_REQUEST);
            }

            toolService.deleteToolInstanceAndUpdateStock(instanceId);
            System.out.println("=== DEBUG: Instance deleted successfully ===");
            return new ResponseEntity<>("Instance deleted successfully", HttpStatus.OK);
        } catch (RuntimeException e) {
            System.out.println("Runtime error deleting instance: " + e.getMessage());
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            System.out.println("Error deleting instance: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>("Error deleting instance: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    // PUT /api/tool-instances/tool/{toolId}/reserve - Reserve an instance for loan
    @PutMapping("/tool/{toolId}/reserve")
    public ResponseEntity<?> reserveInstance(@PathVariable Long toolId) {
        try {
            ToolInstanceEntity reservedInstance = toolInstanceService.reserveInstanceForLoan(toolId);
            return new ResponseEntity<>(reservedInstance, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error reserving instance", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tool-instances/tool/{toolId}/reserve-multiple - Reserve multiple instances
    @PutMapping("/tool/{toolId}/reserve-multiple")
    public ResponseEntity<?> reserveMultipleInstances(
            @PathVariable Long toolId,
            @RequestParam Integer quantity) {
        try {
            List<ToolInstanceEntity> reservedInstances = toolInstanceService.reserveMultipleInstances(toolId, quantity);
            return new ResponseEntity<>(reservedInstances, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error reserving instances", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tool-instances/{instanceId}/return - Return instance from loan
    @PutMapping("/{instanceId}/return")
    public ResponseEntity<?> returnInstance(
            @PathVariable Long instanceId,
            @RequestParam(required = false, defaultValue = "false") boolean damaged) {
        try {
            ToolInstanceEntity returnedInstance = toolInstanceService.returnInstanceFromLoan(instanceId, damaged);
            return new ResponseEntity<>(returnedInstance, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error returning instance", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tool-instances/return-multiple - Return multiple instances from loan
    @PutMapping("/return-multiple")
    public ResponseEntity<?> returnMultipleInstances(
            @RequestBody List<Long> instanceIds,
            @RequestParam(required = false, defaultValue = "false") boolean damaged) {
        try {
            List<ToolInstanceEntity> returnedInstances = toolInstanceService.returnMultipleInstances(instanceIds, damaged);
            return new ResponseEntity<>(returnedInstances, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error returning instances", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tool-instances/{instanceId}/decommission - Decommission instance
    @PutMapping("/{instanceId}/decommission")
    public ResponseEntity<?> decommissionInstance(@PathVariable Long instanceId) {
        try {
            ToolInstanceEntity decommissionedInstance = toolInstanceService.decommissionInstance(instanceId);
            return new ResponseEntity<>(decommissionedInstance, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error decommissioning instance", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tool-instances/{instanceId}/repair - Mark instance as repaired
    @PutMapping("/{instanceId}/repair")
    public ResponseEntity<?> repairInstance(@PathVariable Long instanceId) {
        try {
            ToolInstanceEntity repairedInstance = toolInstanceService.repairInstance(instanceId);
            return new ResponseEntity<>(repairedInstance, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error repairing instance", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tool-instances/available-check/{toolId} - Check if tool has available instances
    @GetMapping("/available-check/{toolId}")
    public ResponseEntity<Boolean> checkAvailability(
            @PathVariable Long toolId,
            @RequestParam(defaultValue = "1") int quantity) {
        try {
            boolean isAvailable = toolInstanceService.isAvailable(toolId, quantity);
            return new ResponseEntity<>(isAvailable, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tool-instances/under-repair - Get all instances under repair
    @GetMapping("/under-repair")
    public ResponseEntity<List<ToolInstanceEntity>> getInstancesUnderRepair() {
        try {
            List<ToolInstanceEntity> instances = toolInstanceService.getInstancesUnderRepair();
            return new ResponseEntity<>(instances, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tool-instances/loaned - Get all loaned instances
    @GetMapping("/loaned")
    public ResponseEntity<List<ToolInstanceEntity>> getLoanedInstances() {
        try {
            List<ToolInstanceEntity> instances = toolInstanceService.getLoanedInstances();
            return new ResponseEntity<>(instances, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // DELETE /api/tool-instances/tool/{toolId} - Delete all instances of a tool
    @DeleteMapping("/tool/{toolId}")
    public ResponseEntity<?> deleteAllInstancesByTool(@PathVariable Long toolId) {
        try {
            toolInstanceService.deleteAllInstancesByTool(toolId);
            return new ResponseEntity<>("All instances deleted successfully", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error deleting instances", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
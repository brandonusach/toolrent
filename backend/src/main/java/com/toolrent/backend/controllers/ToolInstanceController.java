package com.toolrent.backend.controllers;

import com.toolrent.backend.services.ToolService;
import com.toolrent.backend.entities.ToolInstanceEntity;
import com.toolrent.backend.entities.ToolInstanceEntity.ToolInstanceStatus;
import com.toolrent.backend.services.ToolInstanceService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tool-instances")
@CrossOrigin("*")
public class ToolInstanceController {

    @Autowired
    private ToolInstanceService toolInstanceService;

    @Autowired
    private ToolService toolService;

    // GET /api/tool-instances/tool/{toolId} - Get all instances of a tool
    @GetMapping("/tool/{toolId}")
    public ResponseEntity<List<ToolInstanceEntity>> getInstancesByTool(@PathVariable Long toolId) {
        List<ToolInstanceEntity> instances = toolInstanceService.getInstancesByTool(toolId);
        return ResponseEntity.ok(instances);
    }

    // GET /api/tool-instances/tool/{toolId}/available - Count available instances
    @GetMapping("/tool/{toolId}/available")
    public ResponseEntity<Long> getAvailableCount(@PathVariable Long toolId) {
        Long count = toolInstanceService.getAvailableCount(toolId);
        return ResponseEntity.ok(count);
    }

    // GET /api/tool-instances/tool/{toolId}/stats - Get tool instance statistics
    @GetMapping("/tool/{toolId}/stats")
    public ResponseEntity<ToolInstanceService.ToolInstanceStats> getToolStats(@PathVariable Long toolId) {
        ToolInstanceService.ToolInstanceStats stats = toolInstanceService.getToolInstanceStats(toolId);
        return ResponseEntity.ok(stats);
    }

    // GET /api/tool-instances/status/{status} - Get instances by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ToolInstanceEntity>> getInstancesByStatus(@PathVariable String status) {
        ToolInstanceStatus instanceStatus = ToolInstanceStatus.valueOf(status.toUpperCase());
        List<ToolInstanceEntity> instances = toolInstanceService.getInstancesByStatus(instanceStatus);
        return ResponseEntity.ok(instances);
    }

    // PUT /api/tool-instances/{instanceId}/status - Update instance status
    @PutMapping("/{instanceId}/status")
    public ResponseEntity<ToolInstanceEntity> updateInstanceStatus(
            @PathVariable Long instanceId,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");
        ToolInstanceStatus instanceStatus = ToolInstanceStatus.valueOf(status.toUpperCase());
        ToolInstanceEntity updatedInstance = toolInstanceService.updateInstanceStatus(instanceId, instanceStatus);
        return ResponseEntity.ok(updatedInstance);
    }

    // DELETE /api/tool-instances/{instanceId} - Delete individual instance
    @DeleteMapping("/{instanceId}")
    public ResponseEntity<Void> deleteInstance(@PathVariable Long instanceId) {
        toolService.deleteToolInstanceAndUpdateStock(instanceId);
        return ResponseEntity.noContent().build();
    }

    // PUT /api/tool-instances/tool/{toolId}/reserve - Reserve an instance for loan
    @PutMapping("/tool/{toolId}/reserve")
    public ResponseEntity<ToolInstanceEntity> reserveInstance(@PathVariable Long toolId) {
        ToolInstanceEntity reservedInstance = toolInstanceService.reserveInstanceForLoan(toolId);
        return ResponseEntity.ok(reservedInstance);
    }

    // PUT /api/tool-instances/tool/{toolId}/reserve-multiple - Reserve multiple instances
    @PutMapping("/tool/{toolId}/reserve-multiple")
    public ResponseEntity<List<ToolInstanceEntity>> reserveMultipleInstances(
            @PathVariable Long toolId,
            @RequestParam Integer quantity) {
        List<ToolInstanceEntity> reservedInstances = toolInstanceService.reserveMultipleInstances(toolId, quantity);
        return ResponseEntity.ok(reservedInstances);
    }

    // PUT /api/tool-instances/{instanceId}/return - Return instance from loan
    @PutMapping("/{instanceId}/return")
    public ResponseEntity<ToolInstanceEntity> returnInstance(
            @PathVariable Long instanceId,
            @RequestParam(required = false, defaultValue = "false") boolean damaged) {
        ToolInstanceEntity returnedInstance = toolInstanceService.returnInstanceFromLoan(instanceId, damaged);
        return ResponseEntity.ok(returnedInstance);
    }

    // PUT /api/tool-instances/return-multiple - Return multiple instances from loan
    @PutMapping("/return-multiple")
    public ResponseEntity<List<ToolInstanceEntity>> returnMultipleInstances(
            @RequestBody List<Long> instanceIds,
            @RequestParam(required = false, defaultValue = "false") boolean damaged) {
        List<ToolInstanceEntity> returnedInstances = toolInstanceService.returnMultipleInstances(instanceIds, damaged);
        return ResponseEntity.ok(returnedInstances);
    }

    // PUT /api/tool-instances/{instanceId}/decommission - Decommission instance
    @PutMapping("/{instanceId}/decommission")
    public ResponseEntity<ToolInstanceEntity> decommissionInstance(@PathVariable Long instanceId) {
        ToolInstanceEntity decommissionedInstance = toolInstanceService.decommissionInstance(instanceId);
        return ResponseEntity.ok(decommissionedInstance);
    }

    // PUT /api/tool-instances/{instanceId}/repair - Mark instance as repaired
    @PutMapping("/{instanceId}/repair")
    public ResponseEntity<ToolInstanceEntity> repairInstance(@PathVariable Long instanceId) {
        ToolInstanceEntity repairedInstance = toolInstanceService.repairInstance(instanceId);
        return ResponseEntity.ok(repairedInstance);
    }

    // GET /api/tool-instances/available-check/{toolId} - Check if tool has available instances
    @GetMapping("/available-check/{toolId}")
    public ResponseEntity<Boolean> checkAvailability(
            @PathVariable Long toolId,
            @RequestParam(defaultValue = "1") int quantity) {
        boolean isAvailable = toolInstanceService.isAvailable(toolId, quantity);
        return ResponseEntity.ok(isAvailable);
    }

    // GET /api/tool-instances/under-repair - Get all instances under repair
    @GetMapping("/under-repair")
    public ResponseEntity<List<ToolInstanceEntity>> getInstancesUnderRepair() {
        List<ToolInstanceEntity> instances = toolInstanceService.getInstancesUnderRepair();
        return ResponseEntity.ok(instances);
    }

    // GET /api/tool-instances/loaned - Get all loaned instances
    @GetMapping("/loaned")
    public ResponseEntity<List<ToolInstanceEntity>> getLoanedInstances() {
        List<ToolInstanceEntity> instances = toolInstanceService.getLoanedInstances();
        return ResponseEntity.ok(instances);
    }

    // DELETE /api/tool-instances/tool/{toolId} - Delete all instances of a tool
    @DeleteMapping("/tool/{toolId}")
    public ResponseEntity<Void> deleteAllInstancesByTool(@PathVariable Long toolId) {
        toolInstanceService.deleteAllInstancesByTool(toolId);
        return ResponseEntity.noContent().build();
    }
}
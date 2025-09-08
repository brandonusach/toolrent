package com.toolrent.backend.services;

import com.toolrent.backend.entities.ToolEntity;
import com.toolrent.backend.entities.ToolInstanceEntity;
import com.toolrent.backend.entities.ToolInstanceEntity.ToolInstanceStatus;
import com.toolrent.backend.repositories.ToolInstanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ToolInstanceService {

    private final ToolInstanceRepository toolInstanceRepository;

    public ToolInstanceService(ToolInstanceRepository toolInstanceRepository) {
        this.toolInstanceRepository = toolInstanceRepository;
    }

    // Create multiple instances when a tool is created
    public List<ToolInstanceEntity> createInstances(ToolEntity tool, int quantity) {
        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        List<ToolInstanceEntity> instances = new java.util.ArrayList<>();

        for (int i = 1; i <= quantity; i++) {
            ToolInstanceEntity instance = new ToolInstanceEntity(tool);
            instances.add(toolInstanceRepository.save(instance));
        }

        return instances;
    }

    // Get available count for a tool
    public Long getAvailableCount(Long toolId) {
        return toolInstanceRepository.countAvailableByToolId(toolId);
    }

    // Get first available instance of a tool
    public Optional<ToolInstanceEntity> getAvailableInstance(Long toolId) {
        return toolInstanceRepository.findFirstAvailableByToolId(toolId);
    }

    // Update instance status
    public ToolInstanceEntity updateInstanceStatus(Long instanceId, ToolInstanceStatus status) {
        ToolInstanceEntity instance = toolInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Tool instance not found with ID: " + instanceId));

        instance.setStatus(status);
        return toolInstanceRepository.save(instance);
    }

    // Reserve an instance for loan (change status from AVAILABLE to LOANED)
    public ToolInstanceEntity reserveInstanceForLoan(Long toolId) {
        Optional<ToolInstanceEntity> availableInstance = getAvailableInstance(toolId);

        if (availableInstance.isEmpty()) {
            throw new RuntimeException("No available instances for tool ID: " + toolId);
        }

        ToolInstanceEntity instance = availableInstance.get();
        instance.setStatus(ToolInstanceStatus.LOANED);

        return toolInstanceRepository.save(instance);
    }

    // Return an instance from loan (change status from LOANED to AVAILABLE or UNDER_REPAIR)
    public ToolInstanceEntity returnInstanceFromLoan(Long instanceId, boolean isDamaged) {
        ToolInstanceEntity instance = toolInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Tool instance not found with ID: " + instanceId));

        if (instance.getStatus() != ToolInstanceStatus.LOANED) {
            throw new RuntimeException("Instance is not currently loaned");
        }

        // Set status based on condition
        ToolInstanceStatus newStatus = isDamaged ? ToolInstanceStatus.UNDER_REPAIR : ToolInstanceStatus.AVAILABLE;
        instance.setStatus(newStatus);

        return toolInstanceRepository.save(instance);
    }

    // Decommission an instance (irreparable damage)
    public ToolInstanceEntity decommissionInstance(Long instanceId) {
        ToolInstanceEntity instance = toolInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Tool instance not found with ID: " + instanceId));

        instance.setStatus(ToolInstanceStatus.DECOMMISSIONED);
        return toolInstanceRepository.save(instance);
    }

    // Get all instances of a tool
    public List<ToolInstanceEntity> getInstancesByTool(Long toolId) {
        return toolInstanceRepository.findByToolIdOrderByStatus(toolId);
    }

    // Get instances by status
    public List<ToolInstanceEntity> getInstancesByStatus(ToolInstanceStatus status) {
        return toolInstanceRepository.findByStatus(status);
    }

    // Check if enough instances are available
    public boolean isAvailable(Long toolId, int quantity) {
        Long availableCount = getAvailableCount(toolId);
        return availableCount >= quantity;
    }

    // Get statistics for a tool
    public ToolInstanceStats getToolInstanceStats(Long toolId) {
        List<ToolInstanceEntity> instances = getInstancesByTool(toolId);

        long available = instances.stream().mapToLong(i -> i.isAvailable() ? 1 : 0).sum();
        long loaned = instances.stream().mapToLong(i -> i.isLoaned() ? 1 : 0).sum();
        long underRepair = instances.stream().mapToLong(i -> i.isUnderRepair() ? 1 : 0).sum();
        long decommissioned = instances.stream().mapToLong(i -> i.isDecommissioned() ? 1 : 0).sum();

        return new ToolInstanceStats(available, loaned, underRepair, decommissioned, instances.size());
    }

    // Reserve multiple instances for batch operations
    public List<ToolInstanceEntity> reserveMultipleInstances(Long toolId, int quantity) {
        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        List<ToolInstanceEntity> availableInstances = toolInstanceRepository.findAvailableInstancesByToolId(toolId);

        if (availableInstances.size() < quantity) {
            throw new RuntimeException("Not enough available instances. Requested: " + quantity + ", Available: " + availableInstances.size());
        }

        List<ToolInstanceEntity> reservedInstances = new java.util.ArrayList<>();
        for (int i = 0; i < quantity; i++) {
            ToolInstanceEntity instance = availableInstances.get(i);
            instance.setStatus(ToolInstanceStatus.LOANED);
            reservedInstances.add(toolInstanceRepository.save(instance));
        }

        return reservedInstances;
    }

    // Return multiple instances from loan
    public List<ToolInstanceEntity> returnMultipleInstances(List<Long> instanceIds, boolean isDamaged) {
        List<ToolInstanceEntity> returnedInstances = new java.util.ArrayList<>();

        for (Long instanceId : instanceIds) {
            returnedInstances.add(returnInstanceFromLoan(instanceId, isDamaged));
        }

        return returnedInstances;
    }

    // Get instances under repair
    public List<ToolInstanceEntity> getInstancesUnderRepair() {
        return toolInstanceRepository.findInstancesUnderRepair();
    }

    // Get loaned instances
    public List<ToolInstanceEntity> getLoanedInstances() {
        return toolInstanceRepository.findLoanedInstances();
    }

    // Repair instance (change status from UNDER_REPAIR to AVAILABLE)
    public ToolInstanceEntity repairInstance(Long instanceId) {
        ToolInstanceEntity instance = toolInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Tool instance not found with ID: " + instanceId));

        if (instance.getStatus() != ToolInstanceStatus.UNDER_REPAIR) {
            throw new RuntimeException("Instance is not under repair");
        }

        instance.setStatus(ToolInstanceStatus.AVAILABLE);
        return toolInstanceRepository.save(instance);
    }

    // Delete all instances of a tool (for cascade deletion)
    public void deleteAllInstancesByTool(Long toolId) {
        toolInstanceRepository.deleteByToolId(toolId);
    }

    // Decommission multiple instances (for bulk operations)
    @Transactional
    public List<ToolInstanceEntity> decommissionMultipleInstances(Long toolId, int quantity) {
        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        List<ToolInstanceEntity> availableInstances = toolInstanceRepository.findAvailableInstancesByToolId(toolId);

        if (availableInstances.size() < quantity) {
            throw new RuntimeException("Not enough available instances to decommission. Requested: " + quantity + ", Available: " + availableInstances.size());
        }

        List<ToolInstanceEntity> decommissionedInstances = new java.util.ArrayList<>();
        for (int i = 0; i < quantity; i++) {
            ToolInstanceEntity instance = availableInstances.get(i);
            instance.setStatus(ToolInstanceStatus.DECOMMISSIONED);
            decommissionedInstances.add(toolInstanceRepository.save(instance));
        }

        return decommissionedInstances;
    }
    // Helper class for statistics
    public static class ToolInstanceStats {
        public final long available;
        public final long loaned;
        public final long underRepair;
        public final long decommissioned;
        public final long total;

        public ToolInstanceStats(long available, long loaned, long underRepair, long decommissioned, long total) {
            this.available = available;
            this.loaned = loaned;
            this.underRepair = underRepair;
            this.decommissioned = decommissioned;
            this.total = total;
        }
    }
}
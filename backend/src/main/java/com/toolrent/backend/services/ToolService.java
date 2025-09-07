package com.toolrent.backend.services;

import com.toolrent.backend.entities.ToolEntity;
import com.toolrent.backend.entities.CategoryEntity;
import com.toolrent.backend.repositories.ToolRepository;
import com.toolrent.backend.repositories.CategoryRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ToolService {

    private final ToolRepository toolRepository;
    private final CategoryRepository categoryRepository;

    public ToolService(ToolRepository toolRepository, CategoryRepository categoryRepository) {
        this.toolRepository = toolRepository;
        this.categoryRepository = categoryRepository;
    }

    // Get all tools
    public List<ToolEntity> getAllTools() {
        return toolRepository.findAll();
    }

    // Get tool by ID
    public Optional<ToolEntity> getToolById(Long id) {
        return toolRepository.findById(id);
    }

    // Create new tool (RF1.1 implementation)
    public ToolEntity createTool(ToolEntity tool) {
        // Validate required fields according to business rules
        validateToolForCreation(tool);

        // Set initial status to AVAILABLE
        tool.setStatus(ToolEntity.ToolStatus.AVAILABLE);

        // Set current stock equal to initial stock when creating
        tool.setCurrentStock(tool.getInitialStock());

        return toolRepository.save(tool);
    }

    // Update tool
    public ToolEntity updateTool(Long id, ToolEntity toolDetails) {
        ToolEntity tool = toolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tool not found with ID: " + id));

        tool.setName(toolDetails.getName());
        tool.setCategory(toolDetails.getCategory());
        tool.setReplacementValue(toolDetails.getReplacementValue());

        // Only update initial stock if provided and valid
        if (toolDetails.getInitialStock() != null && toolDetails.getInitialStock() > 0) {
            tool.setInitialStock(toolDetails.getInitialStock());
        }

        return toolRepository.save(tool);
    }

    // Decommission tool units (RF1.2 - only for Administrators)
    public ToolEntity decommissionTool(Long id, Integer quantity) {
        ToolEntity tool = toolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tool not found with ID: " + id));

        // Validate quantity
        if (quantity == null || quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }

        if (quantity > tool.getCurrentStock()) {
            throw new RuntimeException("Cannot decommission more units than available in stock");
        }

        // Reduce stock by the specified quantity
        int newStock = tool.getCurrentStock() - quantity;
        tool.setCurrentStock(newStock);

        // If all units are decommissioned, change status to DECOMMISSIONED
        if (newStock == 0) {
            tool.setStatus(ToolEntity.ToolStatus.DECOMMISSIONED);
        }

        return toolRepository.save(tool);
    }

    // Decommission all units of a tool (convenience method)
    public ToolEntity decommissionAllUnits(Long id) {
        ToolEntity tool = toolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tool not found with ID: " + id));

        return decommissionTool(id, tool.getCurrentStock());
    }

    // Delete tool (physical deletion - use with caution)
    public void deleteTool(Long id) {
        ToolEntity tool = toolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tool not found with ID: " + id));
        toolRepository.delete(tool);
    }

    // Get tools by category
    public List<ToolEntity> getToolsByCategory(Long categoryId) {
        return toolRepository.findByCategoryId(categoryId);
    }

    // Get tools by status
    public List<ToolEntity> getToolsByStatus(ToolEntity.ToolStatus status) {
        return toolRepository.findByStatus(status);
    }

    // Get available tools
    public List<ToolEntity> getAvailableTools() {
        return toolRepository.findAvailableTools();
    }

    // Search tools by name
    public List<ToolEntity> searchToolsByName(String name) {
        return toolRepository.findByNameContainingIgnoreCase(name);
    }

    // Get tools with low stock
    public List<ToolEntity> getLowStockTools(Integer threshold) {
        return toolRepository.findLowStockTools(threshold != null ? threshold : 5);
    }

    // Check if tool name exists
    public boolean toolNameExists(String name) {
        return toolRepository.existsByNameIgnoreCase(name);
    }

    // Update tool stock (for loan/return operations)
    public ToolEntity updateToolStock(Long id, Integer newStock) {
        ToolEntity tool = toolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tool not found with ID: " + id));

        if (newStock < 0) {
            throw new RuntimeException("Stock cannot be negative");
        }

        tool.setCurrentStock(newStock);

        // Update status based on stock
        if (newStock == 0 && tool.getStatus() == ToolEntity.ToolStatus.AVAILABLE) {
            tool.setStatus(ToolEntity.ToolStatus.LOANED);
        } else if (newStock > 0 && tool.getStatus() == ToolEntity.ToolStatus.LOANED) {
            tool.setStatus(ToolEntity.ToolStatus.AVAILABLE);
        }

        return toolRepository.save(tool);
    }

    // Update tool status
    public ToolEntity updateToolStatus(Long id, ToolEntity.ToolStatus status) {
        ToolEntity tool = toolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tool not found with ID: " + id));

        tool.setStatus(status);
        return toolRepository.save(tool);
    }

    // Validation method for tool creation (Business Rules)
    private void validateToolForCreation(ToolEntity tool) {
        // BR: Tool can only be registered with name, category and replacement value
        if (tool.getName() == null || tool.getName().trim().isEmpty()) {
            throw new RuntimeException("Tool name is required");
        }

        if (tool.getCategory() == null) {
            throw new RuntimeException("Tool category is required");
        }

        if (tool.getReplacementValue() == null || tool.getReplacementValue().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Tool replacement value is required and must be greater than 0");
        }

        if (tool.getInitialStock() == null || tool.getInitialStock() <= 0) {
            throw new RuntimeException("Initial stock is required and must be greater than 0");
        }

        // Check if category exists
        if (!categoryRepository.existsById(tool.getCategory().getId())) {
            throw new RuntimeException("Category does not exist");
        }

        // Optional: Check if tool name already exists in the same category
        Optional<ToolEntity> existingTool = toolRepository.findByNameIgnoreCaseAndCategory(
                tool.getName(), tool.getCategory());
        if (existingTool.isPresent()) {
            throw new RuntimeException("Tool with this name already exists in the selected category");
        }
    }
}
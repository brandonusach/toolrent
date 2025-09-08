package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.ToolEntity;
import com.toolrent.backend.services.ToolService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tools")
@CrossOrigin(origins = "*")
public class ToolController {

    private final ToolService toolService;

    public ToolController(ToolService toolService) {
        this.toolService = toolService;
    }

    // GET /api/tools - Get all tools
    @GetMapping
    public ResponseEntity<List<ToolEntity>> getAllTools() {
        try {
            List<ToolEntity> tools = toolService.getAllTools();
            return new ResponseEntity<>(tools, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tools/{id} - Get tool by ID
    @GetMapping("/{id}")
    public ResponseEntity<ToolEntity> getToolById(@PathVariable Long id) {
        try {
            Optional<ToolEntity> tool = toolService.getToolById(id);
            return tool.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                    .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/tools - Create new tool (RF1.1)
    @PostMapping
    public ResponseEntity<?> createTool(@RequestBody ToolEntity tool) {
        try {
            ToolEntity createdTool = toolService.createTool(tool);
            return new ResponseEntity<>(createdTool, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error creating tool", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/tools/{id}/add-stock - Add more stock to existing tool
    @PostMapping("/{id}/add-stock")
    public ResponseEntity<?> addToolStock(@PathVariable Long id, @RequestParam Integer quantity) {
        try {
            ToolEntity updatedTool = toolService.addToolStock(id, quantity);
            return new ResponseEntity<>(updatedTool, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error adding stock", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tools/{id}/synchronize-stock - Synchronize stock with actual instances
    @PutMapping("/{id}/synchronize-stock")
    public ResponseEntity<?> synchronizeStock(@PathVariable Long id) {
        try {
            ToolEntity synchronizedTool = toolService.synchronizeStock(id);
            return new ResponseEntity<>(synchronizedTool, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error synchronizing stock", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tools/{id} - Update tool
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTool(@PathVariable Long id, @RequestBody ToolEntity toolDetails) {
        try {
            ToolEntity updatedTool = toolService.updateTool(id, toolDetails);
            return new ResponseEntity<>(updatedTool, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error updating tool", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tools/{id}/decommission - Decommission tool units (RF1.2 - Admin only)
    @PutMapping("/{id}/decommission")
    public ResponseEntity<?> decommissionTool(@PathVariable Long id, @RequestParam Integer quantity) {
        try {
            ToolEntity decommissionedTool = toolService.decommissionTool(id, quantity);
            return new ResponseEntity<>(decommissionedTool, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error decommissioning tool", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tools/{id}/decommission-all - Decommission all units
    @PutMapping("/{id}/decommission-all")
    public ResponseEntity<?> decommissionAllUnits(@PathVariable Long id) {
        try {
            ToolEntity decommissionedTool = toolService.decommissionAllUnits(id);
            return new ResponseEntity<>(decommissionedTool, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error decommissioning all units", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // DELETE /api/tools/{id} - Delete tool
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTool(@PathVariable Long id) {
        try {
            toolService.deleteTool(id);
            return new ResponseEntity<>("Tool deleted successfully", HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error deleting tool", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tools/category/{categoryId} - Get tools by category
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ToolEntity>> getToolsByCategory(@PathVariable Long categoryId) {
        try {
            List<ToolEntity> tools = toolService.getToolsByCategory(categoryId);
            return new ResponseEntity<>(tools, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tools/status/{status} - Get tools by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ToolEntity>> getToolsByStatus(@PathVariable String status) {
        try {
            ToolEntity.ToolStatus toolStatus = ToolEntity.ToolStatus.valueOf(status.toUpperCase());
            List<ToolEntity> tools = toolService.getToolsByStatus(toolStatus);
            return new ResponseEntity<>(tools, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tools/available - Get available tools
    @GetMapping("/available")
    public ResponseEntity<List<ToolEntity>> getAvailableTools() {
        try {
            List<ToolEntity> tools = toolService.getAvailableTools();
            return new ResponseEntity<>(tools, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tools/search?name={name} - Search tools by name
    @GetMapping("/search")
    public ResponseEntity<List<ToolEntity>> searchToolsByName(@RequestParam String name) {
        try {
            List<ToolEntity> tools = toolService.searchToolsByName(name);
            return new ResponseEntity<>(tools, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/tools/low-stock?threshold={threshold} - Get tools with low stock
    @GetMapping("/low-stock")
    public ResponseEntity<List<ToolEntity>> getLowStockTools(
            @RequestParam(required = false, defaultValue = "5") Integer threshold) {
        try {
            List<ToolEntity> tools = toolService.getLowStockTools(threshold);
            return new ResponseEntity<>(tools, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tools/{id}/stock - Update tool stock
    @PutMapping("/{id}/stock")
    public ResponseEntity<?> updateToolStock(@PathVariable Long id, @RequestParam Integer stock) {
        try {
            ToolEntity updatedTool = toolService.updateToolStock(id, stock);
            return new ResponseEntity<>(updatedTool, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Error updating stock", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/tools/{id}/status - Update tool status
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateToolStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            ToolEntity.ToolStatus toolStatus = ToolEntity.ToolStatus.valueOf(status.toUpperCase());
            ToolEntity updatedTool = toolService.updateToolStatus(id, toolStatus);
            return new ResponseEntity<>(updatedTool, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>("Invalid status", HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("Error updating status", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
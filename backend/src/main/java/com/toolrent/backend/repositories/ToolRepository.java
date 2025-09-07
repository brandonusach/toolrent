package com.toolrent.backend.repositories;

import com.toolrent.backend.entities.ToolEntity;
import com.toolrent.backend.entities.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ToolRepository extends JpaRepository<ToolEntity, Long> {

    // Find tools by name
    List<ToolEntity> findByNameContainingIgnoreCase(String name);

    // Find tools by category
    List<ToolEntity> findByCategory(CategoryEntity category);

    // Find tools by category ID
    List<ToolEntity> findByCategoryId(Long categoryId);

    // Find tools by status
    List<ToolEntity> findByStatus(ToolEntity.ToolStatus status);

    // Find available tools (status = AVAILABLE and currentStock > 0)
    @Query("SELECT t FROM ToolEntity t WHERE t.status = 'AVAILABLE' AND t.currentStock > 0")
    List<ToolEntity> findAvailableTools();

    // Find tools with low stock (currentStock <= threshold)
    @Query("SELECT t FROM ToolEntity t WHERE t.currentStock <= :threshold")
    List<ToolEntity> findLowStockTools(@Param("threshold") Integer threshold);

    // Check if tool name exists
    boolean existsByNameIgnoreCase(String name);

    // Find tools by category and status
    List<ToolEntity> findByCategoryAndStatus(CategoryEntity category, ToolEntity.ToolStatus status);

    // Count tools by status
    long countByStatus(ToolEntity.ToolStatus status);

    // Find tools by name and category
    Optional<ToolEntity> findByNameIgnoreCaseAndCategory(String name, CategoryEntity category);

    // Get tools ordered by current stock (descending)
    @Query("SELECT t FROM ToolEntity t ORDER BY t.currentStock DESC")
    List<ToolEntity> findAllOrderByCurrentStockDesc();

    // Get tools with stock greater than zero
    @Query("SELECT t FROM ToolEntity t WHERE t.currentStock > 0")
    List<ToolEntity> findToolsWithStock();
}
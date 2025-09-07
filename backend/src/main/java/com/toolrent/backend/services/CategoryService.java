package com.toolrent.backend.services;

import com.toolrent.backend.entities.CategoryEntity;
import com.toolrent.backend.repositories.CategoryRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    // Get all categories
    public List<CategoryEntity> getAllCategories() {
        return categoryRepository.findAllOrderByName();
    }

    // Get category by ID
    public Optional<CategoryEntity> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    // Create new category
    public CategoryEntity createCategory(CategoryEntity category) {
        validateCategoryForCreation(category);
        return categoryRepository.save(category);
    }

    // Update category
    public CategoryEntity updateCategory(Long id, CategoryEntity categoryDetails) {
        CategoryEntity category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));

        // Check if the new name already exists (excluding current category)
        if (!category.getName().equalsIgnoreCase(categoryDetails.getName()) &&
                categoryNameExists(categoryDetails.getName())) {
            throw new RuntimeException("Category name already exists");
        }

        category.setName(categoryDetails.getName());
        category.setDescription(categoryDetails.getDescription());

        return categoryRepository.save(category);
    }

    // Delete category
    public void deleteCategory(Long id) {
        CategoryEntity category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + id));
        categoryRepository.delete(category);
    }

    // Search categories by name
    public List<CategoryEntity> searchCategoriesByName(String name) {
        return categoryRepository.findByNameContainingIgnoreCase(name);
    }

    // Get category by name
    public Optional<CategoryEntity> getCategoryByName(String name) {
        return categoryRepository.findByNameIgnoreCase(name);
    }

    // Check if category name exists
    public boolean categoryNameExists(String name) {
        return categoryRepository.existsByNameIgnoreCase(name);
    }

    // Validation method for category creation
    private void validateCategoryForCreation(CategoryEntity category) {
        if (category.getName() == null || category.getName().trim().isEmpty()) {
            throw new RuntimeException("Category name is required");
        }

        if (categoryNameExists(category.getName())) {
            throw new RuntimeException("Category name already exists");
        }
    }
}
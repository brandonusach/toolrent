package com.toolrent.backend.controllers;

import com.toolrent.backend.entities.CategoryEntity;
import com.toolrent.backend.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@CrossOrigin("*")
public class CategoryController {
    @Autowired
    CategoryService categoryService;

    @GetMapping("/")
    public ResponseEntity<List<CategoryEntity>> listCategories() {
        List<CategoryEntity> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryEntity> getCategoryById(@PathVariable Long id) {

        CategoryEntity category = categoryService.getCategoryById(id).orElse(null);
        if (category != null) {
            return ResponseEntity.ok(category);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/")
    public ResponseEntity<CategoryEntity> saveCategory(@RequestBody CategoryEntity category) {
        CategoryEntity categoryNew = categoryService.createCategory(category);
        return ResponseEntity.ok(categoryNew);
    }


    @PutMapping("/")
    public ResponseEntity<CategoryEntity> updateCategory(@RequestBody CategoryEntity category){
        CategoryEntity categoryUpdated = categoryService.updateCategory(category.getId(), category);
        return ResponseEntity.ok(categoryUpdated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteCategoryById(@PathVariable Long id) throws Exception {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
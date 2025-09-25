package com.toolrent.backend.services;

import com.toolrent.backend.entities.CategoryEntity;
import com.toolrent.backend.repositories.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryService implements CommandLineRunner {
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    // IMPLEMENTACIÓN DE CommandLineRunner PARA INICIALIZACIÓN AUTOMÁTICA
    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== INICIALIZANDO CATEGORÍAS POR DEFECTO ===");
        initializeDefaultCategories();
        System.out.println("=== CATEGORÍAS INICIALIZADAS ===");
    }

    // MÉTODO DE INICIALIZACIÓN DE CATEGORÍAS POR DEFECTO
    private void initializeDefaultCategories() {
        // Lista de categorías por defecto
        String[][] defaultCategories = {
                {"Herramientas de Corte", "Sierras, cortadoras, amoladoras, etc."},
                {"Herramientas de Perforación", "Taladros, rotomartillos, brocas, etc."},
                {"Herramientas de Medición", "Niveles, metros, reglas, escuadras, etc."},
                {"Herramientas Manuales", "Martillos, destornilladores, llaves, alicates, etc."},
                {"Herramientas de Jardín", "Podadoras, cortacéspedes, motosierras, etc."},
                {"Equipos de Limpieza", "Hidrolavadoras, aspiradoras industriales, pulidoras, etc."},
                {"Maquinaria Pesada", "Mezcladoras, compactadores, generadores, etc."},
                {"Herramientas Eléctricas", "Soldadoras, compresores, herramientas neumáticas, etc."},
                {"Herramientas de Fontanería", "Llaves de tubo, destapadores, prensas, etc."},
                {"Herramientas de Electricidad", "Multímetros, pelacables, crimpadoras, etc."},
                {"Herramientas de Pintura", "Compresores de pintura, rodillos, brochas profesionales, etc."},
                {"Equipos de Elevación", "Poleas, tecles, gatos hidráulicos, escaleras, etc."},
                {"Herramientas de Transporte", "Carretillas, diablitos, plataformas rodantes, etc."},
                {"Equipos de Seguridad", "Cascos, arneses, guantes de seguridad, etc."},
                {"Herramientas de Demolición", "Martillos neumáticos, cinceles, barras, etc."}
        };

        int created = 0;
        int existing = 0;

        for (String[] categoryData : defaultCategories) {
            String name = categoryData[0];
            String description = categoryData[1];

            if (!categoryRepository.existsByNameIgnoreCase(name)) {
                CategoryEntity category = new CategoryEntity();
                category.setName(name);
                category.setDescription(description);

                try {
                    categoryRepository.save(category);
                    created++;
                    System.out.println("✓ Categoría creada: " + name);
                } catch (Exception e) {
                    System.err.println("✗ Error creando categoría '" + name + "': " + e.getMessage());
                }
            } else {
                existing++;
            }
        }

        System.out.println("Categorías creadas: " + created);
        System.out.println("Categorías existentes: " + existing);
        System.out.println("Total categorías en sistema: " + categoryRepository.count());
    }

    // MÉTODOS ORIGINALES DEL SERVICIO

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

    // MÉTODOS ADICIONALES PARA GESTIÓN DE CATEGORÍAS POR DEFECTO

    /**
     * Método para reinicializar categorías por defecto manualmente
     * Útil para resetear o actualizar categorías desde un endpoint de admin
     */
    public void reinitializeDefaultCategories() {
        initializeDefaultCategories();
    }

    /**
     * Obtener estadísticas de categorías
     */
    public CategoryStats getCategoryStats() {
        long totalCategories = categoryRepository.count();
        return new CategoryStats(totalCategories);
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

    // Clase interna para estadísticas
    public static class CategoryStats {
        private final long totalCategories;

        public CategoryStats(long totalCategories) {
            this.totalCategories = totalCategories;
        }

        public long getTotalCategories() {
            return totalCategories;
        }
    }
}
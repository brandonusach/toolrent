// inventory/hooks/useCategories.js
import { useState, useCallback } from 'react';

export const useCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE = 'http://localhost:8081/api';

    // Cargar todas las categorías
    const loadCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/categories`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        } catch (err) {
            console.error('Error loading categories:', err);
            setError(err.message);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear nueva categoría
    const createCategory = useCallback(async (categoryData) => {
        try {
            const response = await fetch(`${API_BASE}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(categoryData),
            });

            if (response.ok) {
                const newCategory = await response.json();
                setCategories(prevCategories => [...prevCategories, newCategory]);
                return newCategory;
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Error al crear la categoría');
            }
        } catch (err) {
            console.error('Error creating category:', err);
            throw err;
        }
    }, []);

    // Actualizar categoría existente
    const updateCategory = useCallback(async (categoryId, categoryData) => {
        try {
            const response = await fetch(`${API_BASE}/categories/${categoryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(categoryData),
            });

            if (response.ok) {
                const updatedCategory = await response.json();
                setCategories(prevCategories =>
                    prevCategories.map(category =>
                        category.id === categoryId ? updatedCategory : category
                    )
                );
                return updatedCategory;
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Error al actualizar la categoría');
            }
        } catch (err) {
            console.error('Error updating category:', err);
            throw err;
        }
    }, []);

    // Eliminar categoría
    const deleteCategory = useCallback(async (categoryId) => {
        try {
            const response = await fetch(`${API_BASE}/categories/${categoryId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setCategories(prevCategories =>
                    prevCategories.filter(category => category.id !== categoryId)
                );
                return true;
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Error al eliminar la categoría');
            }
        } catch (err) {
            console.error('Error deleting category:', err);
            throw err;
        }
    }, []);

    // Obtener categoría por ID
    const getCategoryById = useCallback((categoryId) => {
        return categories.find(category => category.id === parseInt(categoryId));
    }, [categories]);

    // Filtrar categorías
    const filterCategories = useCallback((searchTerm) => {
        return categories.filter(category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categories]);

    // Obtener estadísticas de categorías
    const getCategoryStats = useCallback(() => {
        const totalCategories = categories.length;
        // Aquí podrías agregar más estadísticas si tienes información sobre herramientas por categoría

        return {
            totalCategories
        };
    }, [categories]);

    return {
        // Estado
        categories,
        loading,
        error,

        // Operaciones CRUD
        loadCategories,
        createCategory,
        updateCategory,
        deleteCategory,

        // Utilidades
        getCategoryById,
        filterCategories,
        getCategoryStats
    };
};
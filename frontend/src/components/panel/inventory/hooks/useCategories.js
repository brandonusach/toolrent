// hooks/useCategories.js - Version con Axios
import { useState, useCallback } from 'react';
import apiClient from '../../../../api/axiosConfig';

export const useCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar todas las categorías
    const loadCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/categories');
            setCategories(response.data || []);
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
            const response = await apiClient.post('/categories', categoryData);
            const newCategory = response.data;

            setCategories(prevCategories => [...prevCategories, newCategory]);
            return newCategory;
        } catch (err) {
            console.error('Error creating category:', err);
            throw new Error(err.message || 'Error al crear la categoría');
        }
    }, []);

    // Actualizar categoría existente
    const updateCategory = useCallback(async (categoryId, categoryData) => {
        try {
            const response = await apiClient.put(`/categories/${categoryId}`, categoryData);
            const updatedCategory = response.data;

            setCategories(prevCategories =>
                prevCategories.map(category =>
                    category.id === categoryId ? updatedCategory : category
                )
            );
            return updatedCategory;
        } catch (err) {
            console.error('Error updating category:', err);
            throw new Error(err.message || 'Error al actualizar la categoría');
        }
    }, []);

    // Eliminar categoría
    const deleteCategory = useCallback(async (categoryId) => {
        try {
            await apiClient.delete(`/categories/${categoryId}`);
            setCategories(prevCategories =>
                prevCategories.filter(category => category.id !== categoryId)
            );
            return true;
        } catch (err) {
            console.error('Error deleting category:', err);
            throw new Error(err.message || 'Error al eliminar la categoría');
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
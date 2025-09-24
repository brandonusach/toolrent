// hooks/useCategories.js - Siguiendo exactamente el patrón del profesor
import { useState, useCallback } from 'react';
import httpClient from "../../../../http-common";

export const useCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.get('/api/v1/categories/');
            setCategories(response.data || []);
        } catch (err) {
            console.error('Error loading categories:', err);
            setError(err.message);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear nueva categoría - igual que profesor
    const createCategory = useCallback(async (categoryData) => {
        try {
            const response = await httpClient.post('/api/v1/categories/', categoryData);
            const newCategory = response.data;

            setCategories(prevCategories => [...prevCategories, newCategory]);
            return newCategory;
        } catch (err) {
            console.error('Error creating category:', err);
            throw new Error(err.message || 'Error al crear la categoría');
        }
    }, []);

    // Actualizar categoría - patrón del profesor con objeto completo
    const updateCategory = useCallback(async (categoryId, categoryData) => {
        try {
            // Patrón del profesor: PUT sin ID en URL, objeto completo con ID
            const categoryWithId = { ...categoryData, id: categoryId };
            const response = await httpClient.put('/api/v1/categories/', categoryWithId);
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

    // Eliminar categoría - igual que profesor
    const deleteCategory = useCallback(async (categoryId) => {
        try {
            await httpClient.delete(`/api/v1/categories/${categoryId}`);
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

        // Operaciones CRUD - nombres iguales al profesor
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
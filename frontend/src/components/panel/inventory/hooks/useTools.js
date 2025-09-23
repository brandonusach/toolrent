// hooks/useTools.js - Version con Axios
import { useState, useCallback } from 'react';


export const useTools = () => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load all tools
    const loadTools = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/tools');
            setTools(response.data || []);
        } catch (err) {
            console.error('Error loading tools:', err);
            setError(err.message);
            setTools([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new tool
    const createTool = useCallback(async (toolData) => {
        try {
            const response = await apiClient.post('/tools', toolData);
            const newTool = response.data;

            setTools(prevTools => [...prevTools, newTool]);
            return newTool;
        } catch (err) {
            console.error('Error creating tool:', err);
            // Mantener la estructura del error para compatibilidad
            const error = new Error(err.message || 'Error al crear la herramienta');
            error.response = { data: err.response?.data || err.message };
            throw error;
        }
    }, []);

    // Update tool
    const updateTool = useCallback(async (toolId, toolData) => {
        try {
            const response = await apiClient.put(`/tools/${toolId}`, toolData);
            const updatedTool = response.data;

            setTools(prevTools =>
                prevTools.map(tool =>
                    tool.id === toolId ? updatedTool : tool
                )
            );
            return updatedTool;
        } catch (err) {
            console.error('Error updating tool:', err);
            const error = new Error(err.message || 'Error al actualizar la herramienta');
            error.response = { data: err.response?.data || err.message };
            throw error;
        }
    }, []);

    // Delete tool
    const deleteTool = useCallback(async (toolId) => {
        try {
            await apiClient.delete(`/tools/${toolId}`);
            setTools(prevTools => prevTools.filter(tool => tool.id !== toolId));
            return true;
        } catch (err) {
            console.error('Error deleting tool:', err);
            throw new Error(err.message || 'Error al eliminar la herramienta');
        }
    }, []);

    // Add stock
    const updateStock = useCallback(async (toolId, quantity) => {
        try {
            const response = await apiClient.post(`/tools/${toolId}/add-stock`, null, {
                params: { quantity }
            });
            const updatedTool = response.data;

            setTools(prevTools =>
                prevTools.map(tool =>
                    tool.id === toolId ? updatedTool : tool
                )
            );
            return updatedTool;
        } catch (err) {
            console.error('Error adding stock:', err);
            const error = new Error(err.message || 'Error al agregar stock');
            error.response = { data: err.response?.data || err.message };
            throw error;
        }
    }, []);

    // Decommission tool
    const decommissionTool = useCallback(async (toolId, quantity) => {
        try {
            const response = await apiClient.put(`/tools/${toolId}/decommission`, null, {
                params: { quantity }
            });
            const updatedTool = response.data;

            setTools(prevTools =>
                prevTools.map(tool =>
                    tool.id === toolId ? updatedTool : tool
                )
            );
            return updatedTool;
        } catch (err) {
            console.error('Error decommissioning tool:', err);
            const error = new Error(err.message || 'Error al dar de baja');
            error.response = { data: err.response?.data || err.message };
            throw error;
        }
    }, []);

    // Get tool by ID
    const getToolById = useCallback((toolId) => {
        return tools.find(tool => tool.id === parseInt(toolId));
    }, [tools]);

    // Filter tools
    const filterTools = useCallback((searchTerm, categoryFilter) => {
        return tools.filter(tool => {
            const matchesSearch = !searchTerm ||
                tool.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'ALL' ||
                (tool.category && tool.category.id.toString() === categoryFilter);

            return matchesSearch && matchesCategory;
        });
    }, [tools]);

    return {
        // State
        tools,
        loading,
        error,

        // CRUD operations
        loadTools,
        createTool,
        updateTool,
        deleteTool,

        // Stock operations
        updateStock,
        decommissionTool,

        // Utilities
        getToolById,
        filterTools
    };
};
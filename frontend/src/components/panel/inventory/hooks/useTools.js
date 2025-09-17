// inventory/hooks/useTools.js - PURE VERSION
import { useState, useCallback } from 'react';

export const useTools = () => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE = 'http://localhost:8081/api';

    // Load all tools (no client-side processing)
    const loadTools = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/tools`);
            if (response.ok) {
                const data = await response.json();
                setTools(data); // Use data exactly as returned from backend
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        } catch (err) {
            console.error('Error loading tools:', err);
            setError(err.message);
            setTools([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new tool (minimal frontend processing)
    const createTool = useCallback(async (toolData) => {
        try {
            const response = await fetch(`${API_BASE}/tools`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(toolData),
            });

            if (response.ok) {
                const newTool = await response.json();
                setTools(prevTools => [...prevTools, newTool]);
                return newTool;
            } else {
                const errorText = await response.text();
                const error = new Error(errorText || 'Error al crear la herramienta');
                // Attach response for detailed error handling
                error.response = { data: errorText };
                throw error;
            }
        } catch (err) {
            console.error('Error creating tool:', err);
            throw err;
        }
    }, []);

    // Update tool (minimal frontend processing)
    const updateTool = useCallback(async (toolId, toolData) => {
        try {
            const response = await fetch(`${API_BASE}/tools/${toolId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(toolData),
            });

            if (response.ok) {
                const updatedTool = await response.json();
                setTools(prevTools =>
                    prevTools.map(tool =>
                        tool.id === toolId ? updatedTool : tool
                    )
                );
                return updatedTool;
            } else {
                const errorText = await response.text();
                const error = new Error(errorText || 'Error al actualizar la herramienta');
                error.response = { data: errorText };
                throw error;
            }
        } catch (err) {
            console.error('Error updating tool:', err);
            throw err;
        }
    }, []);

    // Delete tool (backend handles all business logic)
    const deleteTool = useCallback(async (toolId) => {
        try {
            const response = await fetch(`${API_BASE}/tools/${toolId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setTools(prevTools => prevTools.filter(tool => tool.id !== toolId));
                return true;
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Error al eliminar la herramienta');
            }
        } catch (err) {
            console.error('Error deleting tool:', err);
            throw err;
        }
    }, []);

    // Add stock (backend handles all validation and business logic)
    const updateStock = useCallback(async (toolId, quantity) => {
        try {
            const response = await fetch(
                `${API_BASE}/tools/${toolId}/add-stock?quantity=${quantity}`,
                { method: 'POST' }
            );

            if (response.ok) {
                const updatedTool = await response.json();
                setTools(prevTools =>
                    prevTools.map(tool =>
                        tool.id === toolId ? updatedTool : tool
                    )
                );
                return updatedTool;
            } else {
                const errorText = await response.text();
                const error = new Error(errorText || 'Error al agregar stock');
                error.response = { data: errorText };
                throw error;
            }
        } catch (err) {
            console.error('Error adding stock:', err);
            throw err;
        }
    }, []);

    // Decommission tool (backend handles all validation and business logic)
    const decommissionTool = useCallback(async (toolId, quantity) => {
        try {
            const response = await fetch(
                `${API_BASE}/tools/${toolId}/decommission?quantity=${quantity}`,
                { method: 'PUT' }
            );

            if (response.ok) {
                const updatedTool = await response.json();
                setTools(prevTools =>
                    prevTools.map(tool =>
                        tool.id === toolId ? updatedTool : tool
                    )
                );
                return updatedTool;
            } else {
                const errorText = await response.text();
                const error = new Error(errorText || 'Error al dar de baja');
                error.response = { data: errorText };
                throw error;
            }
        } catch (err) {
            console.error('Error decommissioning tool:', err);
            throw err;
        }
    }, []);

    // Get tool by ID (simple lookup)
    const getToolById = useCallback((toolId) => {
        return tools.find(tool => tool.id === parseInt(toolId));
    }, [tools]);

    // Simple client-side filtering (only UI logic, no business rules)
    const filterTools = useCallback((searchTerm, categoryFilter) => {
        return tools.filter(tool => {
            const matchesSearch = !searchTerm ||
                tool.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'ALL' ||
                (tool.category && tool.category.id.toString() === categoryFilter);

            return matchesSearch && matchesCategory;
        });
    }, [tools]);

    // Remove client-side statistics calculation - let backend provide stats if needed

    return {
        // State
        tools,
        loading,
        error,

        // CRUD operations (pure API calls)
        loadTools,
        createTool,
        updateTool,
        deleteTool,

        // Stock operations (pure API calls)
        updateStock,
        decommissionTool,

        // Utilities (simple frontend operations)
        getToolById,
        filterTools
    };
};
// inventory/hooks/useTools.js
import { useState, useCallback } from 'react';

export const useTools = () => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE = 'http://localhost:8081/api';

    // Cargar todas las herramientas
    const loadTools = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/tools`);
            if (response.ok) {
                const data = await response.json();
                setTools(data);
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

    // Crear nueva herramienta
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
                throw new Error(errorText || 'Error al crear la herramienta');
            }
        } catch (err) {
            console.error('Error creating tool:', err);
            throw err;
        }
    }, []);

    // Actualizar herramienta existente
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
                throw new Error(errorText || 'Error al actualizar la herramienta');
            }
        } catch (err) {
            console.error('Error updating tool:', err);
            throw err;
        }
    }, []);

    // Eliminar herramienta
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

    // Agregar stock
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
                throw new Error(errorText || 'Error al agregar stock');
            }
        } catch (err) {
            console.error('Error adding stock:', err);
            throw err;
        }
    }, []);

    // Dar de baja herramientas
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
                throw new Error(errorText || 'Error al dar de baja');
            }
        } catch (err) {
            console.error('Error decommissioning tool:', err);
            throw err;
        }
    }, []);

    // Obtener herramienta por ID
    const getToolById = useCallback((toolId) => {
        return tools.find(tool => tool.id === parseInt(toolId));
    }, [tools]);

    // Filtrar herramientas
    const filterTools = useCallback((searchTerm, categoryFilter, statusFilter) => {
        return tools.filter(tool => {
            const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'ALL' ||
                (tool.category && tool.category.id.toString() === categoryFilter);

            // Lógica para filtro de status si se implementa
            let matchesStatus = true;
            if (statusFilter !== 'ALL') {
                switch (statusFilter) {
                    case 'LOW_STOCK':
                        matchesStatus = (tool.currentStock || 0) <= 2;
                        break;
                    case 'NO_STOCK':
                        matchesStatus = (tool.currentStock || 0) === 0;
                        break;
                    case 'AVAILABLE':
                        matchesStatus = (tool.currentStock || 0) > 0;
                        break;
                    default:
                        matchesStatus = true;
                }
            }

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [tools]);

    // Estadísticas de herramientas
    const getToolStats = useCallback(() => {
        const totalTools = tools.length;
        const totalStock = tools.reduce((sum, tool) => sum + (tool.currentStock || 0), 0);
        const lowStockTools = tools.filter(tool => (tool.currentStock || 0) <= 2).length;
        const noStockTools = tools.filter(tool => (tool.currentStock || 0) === 0).length;
        const averageStock = totalTools > 0 ? totalStock / totalTools : 0;

        return {
            totalTools,
            totalStock,
            lowStockTools,
            noStockTools,
            averageStock: Math.round(averageStock * 100) / 100
        };
    }, [tools]);

    return {
        // Estado
        tools,
        loading,
        error,

        // Operaciones CRUD
        loadTools,
        createTool,
        updateTool,
        deleteTool,

        // Operaciones de stock
        updateStock,
        decommissionTool,

        // Utilidades
        getToolById,
        filterTools,
        getToolStats
    };
};
// hooks/useFines.js - Hook para gestión de multas
import { useState, useCallback } from 'react';
import httpClient from "../../../../http-common";

export const useFines = () => {
    const [fines, setFines] = useState([]);
    const [unpaidFines, setUnpaidFines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load all fines
    const loadFines = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.get('/api/v1/fines/');
            setFines(response.data || []);
        } catch (err) {
            console.error('Error loading fines:', err);
            setError(err.message);
            setFines([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load unpaid fines
    const loadUnpaidFines = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.get('/api/v1/fines/unpaid');
            setUnpaidFines(response.data || []);
        } catch (err) {
            console.error('Error loading unpaid fines:', err);
            setError(err.message);
            setUnpaidFines([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get fines by client - RF2.5
    const getFinesByClient = useCallback(async (clientId) => {
        try {
            const response = await httpClient.get(`/api/v1/fines/client/${clientId}`);
            return response.data || [];
        } catch (err) {
            console.error('Error getting fines by client:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener multas del cliente');
        }
    }, []);

    // Get unpaid fines by client
    const getUnpaidFinesByClient = useCallback(async (clientId) => {
        try {
            const response = await httpClient.get(`/api/v1/fines/client/${clientId}/unpaid`);
            return response.data || [];
        } catch (err) {
            console.error('Error getting unpaid fines by client:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener multas impagas del cliente');
        }
    }, []);

    // Get total unpaid amount by client
    const getTotalUnpaidAmount = useCallback(async (clientId) => {
        try {
            const response = await httpClient.get(`/api/v1/fines/client/${clientId}/total-unpaid`);
            return response.data.totalUnpaid || 0;
        } catch (err) {
            console.error('Error getting total unpaid amount:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener total de multas impagas');
        }
    }, []);

    // Check client restrictions - NUEVA FUNCIÓN FALTANTE
    const checkClientRestrictions = useCallback(async (clientId) => {
        try {
            const response = await httpClient.post(`/api/v1/fines/${clientId}/check-restrictions`);
            return response.data;
        } catch (err) {
            console.error('Error checking client restrictions:', err);
            throw new Error(err.response?.data || err.message || 'Error al verificar restricciones del cliente');
        }
    }, []);

    // Create fine
    const createFine = useCallback(async (fineData) => {
        try {
            const response = await httpClient.post('/api/v1/fines/', fineData);
            const newFine = response.data;

            setFines(prev => [...prev, newFine]);
            if (!newFine.paid) {
                setUnpaidFines(prev => [...prev, newFine]);
            }

            return newFine;
        } catch (err) {
            console.error('Error creating fine:', err);
            throw new Error(err.response?.data || err.message || 'Error al crear la multa');
        }
    }, []);

    // Pay fine - RF2.5
    const payFine = useCallback(async (fineId) => {
        try {
            const response = await httpClient.put(`/api/v1/fines/${fineId}/pay`);
            const paidFine = response.data;

            // Update fines list
            setFines(prev =>
                prev.map(fine => fine.id === fineId ? paidFine : fine)
            );

            // Remove from unpaid fines
            setUnpaidFines(prev => prev.filter(fine => fine.id !== fineId));

            return paidFine;
        } catch (err) {
            console.error('Error paying fine:', err);
            throw new Error(err.response?.data || err.message || 'Error al pagar la multa');
        }
    }, []);

    // Cancel fine (admin only)
    const cancelFine = useCallback(async (fineId) => {
        try {
            const response = await httpClient.put(`/api/v1/fines/${fineId}/cancel`);

            // Remove from both lists
            setFines(prev => prev.filter(fine => fine.id !== fineId));
            setUnpaidFines(prev => prev.filter(fine => fine.id !== fineId));

            return response.data;
        } catch (err) {
            console.error('Error cancelling fine:', err);
            throw new Error(err.response?.data || err.message || 'Error al cancelar la multa');
        }
    }, []);

    // Update fine
    const updateFine = useCallback(async (fineId, updates) => {
        try {
            const updateData = { id: fineId, ...updates };
            const response = await httpClient.put('/api/v1/fines/', updateData);
            const updatedFine = response.data;

            // Update in both lists
            setFines(prev =>
                prev.map(fine => fine.id === fineId ? updatedFine : fine)
            );
            setUnpaidFines(prev =>
                prev.map(fine => fine.id === fineId ? updatedFine : fine)
            );

            return updatedFine;
        } catch (err) {
            console.error('Error updating fine:', err);
            throw new Error(err.response?.data || err.message || 'Error al actualizar la multa');
        }
    }, []);

    // Delete fine
    const deleteFine = useCallback(async (fineId) => {
        try {
            await httpClient.delete(`/api/v1/fines/${fineId}`);

            // Remove from both lists
            setFines(prev => prev.filter(fine => fine.id !== fineId));
            setUnpaidFines(prev => prev.filter(fine => fine.id !== fineId));

            return true;
        } catch (err) {
            console.error('Error deleting fine:', err);
            throw new Error(err.response?.data || err.message || 'Error al eliminar la multa');
        }
    }, []);

    // Get overdue fines
    const getOverdueFines = useCallback(async () => {
        try {
            const response = await httpClient.get('/api/v1/fines/overdue');
            return response.data || [];
        } catch (err) {
            console.error('Error getting overdue fines:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener multas vencidas');
        }
    }, []);

    // Get fines by type
    const getFinesByType = useCallback(async (type) => {
        try {
            const response = await httpClient.get(`/api/v1/fines/type/${type}`);
            return response.data || [];
        } catch (err) {
            console.error('Error getting fines by type:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener multas por tipo');
        }
    }, []);

    // Get fine statistics
    const getFineStatistics = useCallback(async () => {
        try {
            const response = await httpClient.get('/api/v1/fines/statistics');
            return response.data;
        } catch (err) {
            console.error('Error getting fine statistics:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener estadísticas de multas');
        }
    }, []);

    // Get fines in date range
    const getFinesInDateRange = useCallback(async (startDate, endDate) => {
        try {
            const response = await httpClient.get('/api/v1/fines/date-range', {
                params: { startDate, endDate }
            });
            return response.data || [];
        } catch (err) {
            console.error('Error getting fines in date range:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener multas por rango de fechas');
        }
    }, []);

    return {
        // State
        fines,
        unpaidFines,
        loading,
        error,

        // CRUD operations
        loadFines,
        loadUnpaidFines,
        createFine,
        updateFine,
        deleteFine,
        payFine,
        cancelFine,

        // Specific queries
        getFinesByClient,
        getUnpaidFinesByClient,
        getTotalUnpaidAmount,
        checkClientRestrictions, // AGREGADA
        getOverdueFines,
        getFinesByType,
        getFineStatistics,
        getFinesInDateRange
    };
};
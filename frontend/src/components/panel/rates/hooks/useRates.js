// hooks/useRates.js - Hook simplificado para gestión de tarifas
import { useState, useCallback } from 'react';
import httpClient from "../../../../http-common";

export const useRates = () => {
    const [rates, setRates] = useState({
        all: [],
        current: {},
        history: {}
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para limpiar errores
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Cargar todas las tarifas
    const loadRates = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.get('/api/v1/rates/');
            setRates(prev => ({
                ...prev,
                all: response.data || []
            }));
        } catch (err) {
            console.error('Error loading rates:', err);
            setError(err.response?.data?.error || 'Error al cargar tarifas');
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener tarifas actuales - SIMPLIFICADO
    const getCurrentRates = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // El backend maneja la lógica de crear tarifas por defecto si no existen
            const [rentalRes, lateFeeRes, repairRes] = await Promise.all([
                httpClient.get('/api/v1/rates/current/rental'),
                httpClient.get('/api/v1/rates/current/late-fee'),
                httpClient.get('/api/v1/rates/current/repair')
            ]);

            const currentRates = {
                RENTAL_RATE: rentalRes.data.rate || 0,
                LATE_FEE_RATE: lateFeeRes.data.rate || 0,
                REPAIR_RATE: repairRes.data.rate || 0
            };

            setRates(prev => ({
                ...prev,
                current: currentRates
            }));

            return currentRates;
        } catch (err) {
            console.error('Error getting current rates:', err);
            setError(err.response?.data?.error || 'Error al obtener tarifas actuales');

            const defaultRates = {
                RENTAL_RATE: 0,
                LATE_FEE_RATE: 0,
                REPAIR_RATE: 0
            };

            setRates(prev => ({
                ...prev,
                current: defaultRates
            }));

            return defaultRates;
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear nueva tarifa
    const createRate = useCallback(async (rateData) => {
        try {
            console.log('Creating rate:', rateData);
            const response = await httpClient.post('/api/v1/rates/', rateData);
            const newRate = response.data;

            // Actualizar estado local
            setRates(prev => ({
                ...prev,
                all: [...prev.all, newRate]
            }));

            // Recargar tarifas actuales
            await getCurrentRates();

            return newRate;
        } catch (err) {
            console.error('Error creating rate:', err);
            const errorMsg = err.response?.data?.error || 'Error al crear tarifa';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    }, [getCurrentRates]);

    // Actualizar tarifa existente
    const updateRate = useCallback(async (rateId, rateData) => {
        try {
            console.log('Updating rate:', { rateId, rateData });
            const rateWithId = { ...rateData, id: rateId };
            const response = await httpClient.put('/api/v1/rates/', rateWithId);
            const updatedRate = response.data;

            // Actualizar estado local
            setRates(prev => ({
                ...prev,
                all: prev.all.map(rate =>
                    rate.id === rateId ? updatedRate : rate
                )
            }));

            // Recargar tarifas actuales
            await getCurrentRates();

            return updatedRate;
        } catch (err) {
            console.error('Error updating rate:', err);
            const errorMsg = err.response?.data?.error || 'Error al actualizar tarifa';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    }, [getCurrentRates]);

    // Desactivar tarifa
    const deactivateRate = useCallback(async (rateId) => {
        try {
            console.log('Deactivating rate:', rateId);
            const response = await httpClient.put(`/api/v1/rates/${rateId}/deactivate`);
            const deactivatedRate = response.data;

            // Actualizar estado local
            setRates(prev => ({
                ...prev,
                all: prev.all.map(rate =>
                    rate.id === rateId ? deactivatedRate : rate
                )
            }));

            // Recargar tarifas actuales
            await getCurrentRates();

            return deactivatedRate;
        } catch (err) {
            console.error('Error deactivating rate:', err);
            const errorMsg = err.response?.data?.error || 'Error al desactivar tarifa';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    }, [getCurrentRates]);

    // Obtener tarifa por ID
    const getRateById = useCallback(async (rateId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.get(`/api/v1/rates/${rateId}`);
            return response.data;
        } catch (err) {
            console.error('Error getting rate by ID:', err);
            const errorMsg = err.response?.data?.error || 'Error al obtener tarifa';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener tarifas por tipo
    const getRatesByType = useCallback(async (rateType) => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.get(`/api/v1/rates/type/${rateType}`);
            return response.data || [];
        } catch (err) {
            console.error('Error getting rates by type:', err);
            setError(err.response?.data?.error || 'Error al obtener tarifas por tipo');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener historial de tarifas
    const getRateHistory = useCallback(async (rateType) => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.get(`/api/v1/rates/history/${rateType}`);
            const history = response.data || [];

            setRates(prev => ({
                ...prev,
                history: {
                    ...prev.history,
                    [rateType]: history
                }
            }));

            return history;
        } catch (err) {
            console.error('Error getting rate history:', err);
            setError(err.response?.data?.error || 'Error al obtener historial de tarifas');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Verificar si existe tarifa activa por tipo
    const hasActiveRate = useCallback(async (rateType) => {
        try {
            const response = await httpClient.get(`/api/v1/rates/exists/active/${rateType}`);
            return response.data?.exists || false;
        } catch (err) {
            console.error('Error checking active rate:', err);
            return false;
        }
    }, []);

    // Obtener tarifas en rango de fechas
    const getRatesInDateRange = useCallback(async (startDate, endDate) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await httpClient.get(`/api/v1/rates/date-range?${params.toString()}`);
            return response.data || [];
        } catch (err) {
            console.error('Error getting rates in date range:', err);
            setError(err.response?.data?.error || 'Error al obtener tarifas por rango de fechas');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Calcular costo de reparación
    const calculateRepairCost = useCallback(async (replacementValue) => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.post(`/api/v1/rates/calculate-repair?replacementValue=${replacementValue}`);
            return response.data?.repairCost || 0;
        } catch (err) {
            console.error('Error calculating repair cost:', err);
            const errorMsg = err.response?.data?.error || 'Error al calcular costo de reparación';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Eliminar tarifa
    const deleteRate = useCallback(async (rateId) => {
        try {
            await httpClient.delete(`/api/v1/rates/${rateId}`);
            setRates(prev => ({
                ...prev,
                all: prev.all.filter(rate => rate.id !== rateId)
            }));
            return true;
        } catch (err) {
            console.error('Error deleting rate:', err);
            const errorMsg = err.response?.data?.error || 'Error al eliminar la tarifa';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
    }, []);

    return {
        // Estado
        rates,
        loading,
        error,

        // Acciones CRUD
        loadRates,
        createRate,
        updateRate,
        deleteRate,
        deactivateRate,
        getRateById,
        getRatesByType,

        // Acciones específicas
        getCurrentRates,
        getRateHistory,
        hasActiveRate,
        getRatesInDateRange,
        calculateRepairCost,

        // Utilidades
        clearError
    };
};
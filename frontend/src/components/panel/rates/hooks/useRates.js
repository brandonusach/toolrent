// hooks/useRates.js - Hook para gestión de tarifas con Axios - CORREGIDO
import { useState, useCallback } from 'react';


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

    // Cargar todas las tarifas - CORREGIDO: Quitar /api duplicado
    const loadRates = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/rates'); // CORREGIDO: era '/api/rates'
            setRates(prev => ({
                ...prev,
                all: response.data || []
            }));
        } catch (err) {
            console.error('Error loading rates:', err);
            setError(err.message || 'Error al cargar tarifas');
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener tarifas actuales - CORREGIDO: URLs consistentes
    const getCurrentRates = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // CORREGIDO: URLs consistentes sin /api duplicado
            const [rentalResponse, lateFeeResponse, repairResponse] = await Promise.allSettled([
                apiClient.get('/rates/current/rental'),      // CORREGIDO
                apiClient.get('/rates/current/late-fee'),    // CORREGIDO
                apiClient.get('/rates/current/repair')       // CORREGIDO
            ]);

            const currentRates = {
                RENTAL_RATE: rentalResponse.status === 'fulfilled' ? rentalResponse.value.data : 0,
                LATE_FEE_RATE: lateFeeResponse.status === 'fulfilled' ? lateFeeResponse.value.data : 0,
                REPAIR_RATE: repairResponse.status === 'fulfilled' ? repairResponse.value.data : 0
            };

            // Log individual results para debugging
            console.log('Current rates loaded:', {
                rental: { status: rentalResponse.status, value: currentRates.RENTAL_RATE },
                lateFee: { status: lateFeeResponse.status, value: currentRates.LATE_FEE_RATE },
                repair: { status: repairResponse.status, value: currentRates.REPAIR_RATE }
            });

            setRates(prev => ({
                ...prev,
                current: currentRates
            }));

            return currentRates;
        } catch (err) {
            console.error('Error getting current rates:', err);
            setError(err.message || 'Error al obtener tarifas actuales');

            // Retornar valores por defecto en caso de error
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

    // Crear nueva tarifa - CORREGIDO
    const createRate = useCallback(async (rateData) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Creating rate:', rateData);
            const response = await apiClient.post('/rates', rateData); // CORREGIDO
            const newRate = response.data;

            // Actualizar estado local
            setRates(prev => ({
                ...prev,
                all: [...prev.all, newRate]
            }));

            // Actualizar tarifas actuales si es necesario
            if (newRate.active) {
                await getCurrentRates();
            }

            return newRate;
        } catch (err) {
            console.error('Error creating rate:', err);
            const errorMsg = err.response?.data?.message ||
            err.response?.status === 409 ? 'Ya existe una tarifa activa que se superpone con el rango de fechas' :
                err.response?.status === 401 ? 'No autorizado. Verifique su sesión.' :
                    err.message || 'Error al crear tarifa';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [getCurrentRates]);

    // Actualizar tarifa existente - CORREGIDO
    const updateRate = useCallback(async (rateId, rateData) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Updating rate:', { rateId, rateData });
            const response = await apiClient.put(`/rates/${rateId}`, rateData); // CORREGIDO
            const updatedRate = response.data;

            // Actualizar estado local
            setRates(prev => ({
                ...prev,
                all: prev.all.map(rate =>
                    rate.id === rateId ? updatedRate : rate
                )
            }));

            // Actualizar tarifas actuales
            await getCurrentRates();

            return updatedRate;
        } catch (err) {
            console.error('Error updating rate:', err);
            const errorMsg = err.response?.data?.message ||
            err.response?.status === 404 ? 'Tarifa no encontrada' :
                err.response?.status === 409 ? 'Existe una tarifa activa que se superpone con el rango de fechas' :
                    err.response?.status === 401 ? 'No autorizado. Verifique su sesión.' :
                        err.message || 'Error al actualizar tarifa';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [getCurrentRates]);

    // Desactivar tarifa - CORREGIDO
    const deactivateRate = useCallback(async (rateId) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Deactivating rate:', rateId);
            const response = await apiClient.patch(`/rates/${rateId}/deactivate`); // CORREGIDO
            const deactivatedRate = response.data;

            // Actualizar estado local
            setRates(prev => ({
                ...prev,
                all: prev.all.map(rate =>
                    rate.id === rateId ? deactivatedRate : rate
                )
            }));

            // Actualizar tarifas actuales
            await getCurrentRates();

            return deactivatedRate;
        } catch (err) {
            console.error('Error deactivating rate:', err);
            const errorMsg = err.response?.data?.message ||
            err.response?.status === 404 ? 'Tarifa no encontrada' :
                err.response?.status === 401 ? 'No autorizado. Verifique su sesión.' :
                    err.message || 'Error al desactivar tarifa';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [getCurrentRates]);

    // Obtener tarifa por ID - CORREGIDO
    const getRateById = useCallback(async (rateId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/rates/${rateId}`); // CORREGIDO
            return response.data;
        } catch (err) {
            console.error('Error getting rate by ID:', err);
            const errorMsg = err.response?.status === 404 ? 'Tarifa no encontrada' :
                err.response?.status === 401 ? 'No autorizado. Verifique su sesión.' :
                    err.message || 'Error al obtener tarifa';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener tarifas por tipo - CORREGIDO
    const getRatesByType = useCallback(async (rateType) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/rates/type/${rateType}`); // CORREGIDO
            return response.data || [];
        } catch (err) {
            console.error('Error getting rates by type:', err);
            setError(err.message || 'Error al obtener tarifas por tipo');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener historial de tarifas - CORREGIDO
    const getRateHistory = useCallback(async (rateType) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Getting rate history for type:', rateType);
            const response = await apiClient.get(`/rates/history/${rateType}`); // CORREGIDO
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
            setError(err.message || 'Error al obtener historial de tarifas');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Verificar si existe tarifa activa por tipo - CORREGIDO
    const hasActiveRate = useCallback(async (rateType) => {
        try {
            const response = await apiClient.get(`/rates/exists/active/${rateType}`); // CORREGIDO
            return response.data;
        } catch (err) {
            console.error('Error checking active rate:', err);
            return false;
        }
    }, []);

    // Obtener tarifas en rango de fechas - CORREGIDO
    const getRatesInDateRange = useCallback(async (startDate, endDate) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await apiClient.get(`/rates/date-range?${params.toString()}`); // CORREGIDO
            return response.data || [];
        } catch (err) {
            console.error('Error getting rates in date range:', err);
            setError(err.message || 'Error al obtener tarifas por rango de fechas');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Calcular costo de reparación - CORREGIDO
    const calculateRepairCost = useCallback(async (replacementValue) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Calculating repair cost for value:', replacementValue);
            const params = new URLSearchParams();
            params.append('replacementValue', replacementValue);

            const response = await apiClient.post(`/rates/calculate-repair?${params.toString()}`); // CORREGIDO
            return response.data;
        } catch (err) {
            console.error('Error calculating repair cost:', err);
            const errorMsg = err.response?.data?.message ||
            err.response?.status === 401 ? 'No autorizado. Verifique su sesión.' :
                'No hay tarifa de reparación activa configurada' ||
                err.message || 'Error al calcular costo de reparación';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener tarifa actual por tipo específico - CORREGIDO
    const getCurrentRateByType = useCallback(async (rateType) => {
        setError(null);
        try {
            let endpoint = '';
            switch (rateType) {
                case 'RENTAL_RATE':
                    endpoint = '/rates/current/rental';      // CORREGIDO
                    break;
                case 'LATE_FEE_RATE':
                    endpoint = '/rates/current/late-fee';    // CORREGIDO
                    break;
                case 'REPAIR_RATE':
                    endpoint = '/rates/current/repair';      // CORREGIDO
                    break;
                default:
                    throw new Error('Tipo de tarifa no válido');
            }

            const response = await apiClient.get(endpoint);
            return response.data;
        } catch (err) {
            if (err.response?.status === 404 || err.message.includes('No hay tarifa')) {
                return null; // No hay tarifa activa configurada
            }
            console.error('Error getting current rate by type:', err);
            setError(err.message || 'Error al obtener tarifa actual');
            throw err;
        }
    }, []);

    // Validar solapamiento de fechas
    const validateRateOverlap = useCallback(async (rateType, startDate, endDate, excludeId = null) => {
        try {
            const rates = await getRatesByType(rateType);
            const activeRates = rates.filter(rate =>
                rate.active &&
                (!excludeId || rate.id !== excludeId)
            );

            for (const rate of activeRates) {
                const rateStart = new Date(rate.effectiveFrom);
                const rateEnd = rate.effectiveTo ? new Date(rate.effectiveTo) : new Date('2099-12-31');
                const newStart = new Date(startDate);
                const newEnd = endDate ? new Date(endDate) : new Date('2099-12-31');

                // Verificar solapamiento
                if (newStart <= rateEnd && newEnd >= rateStart) {
                    return {
                        hasOverlap: true,
                        overlappingRate: rate
                    };
                }
            }

            return { hasOverlap: false };
        } catch (err) {
            console.error('Error validating overlap:', err);
            return { hasOverlap: false };
        }
    }, [getRatesByType]);

    return {
        // Estado
        rates,
        loading,
        error,

        // Acciones CRUD
        loadRates,
        createRate,
        updateRate,
        deactivateRate,
        getRateById,
        getRatesByType,

        // Acciones específicas
        getCurrentRates,
        getCurrentRateByType,
        getRateHistory,
        hasActiveRate,
        getRatesInDateRange,
        calculateRepairCost,

        // Utilidades
        validateRateOverlap,
        clearError
    };
};
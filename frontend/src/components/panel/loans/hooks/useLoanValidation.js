// hooks/useLoanValidation.js - Hook para validaciones completas de préstamos
import { useState, useCallback } from 'react';
import httpClient from "../../../../http-common";

export const useLoanValidation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Validación comprensiva para crear préstamo - RF2.1, RF2.5
    const validateLoanComprehensive = useCallback(async (clientId, toolId, quantity) => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.post('/api/v1/loans/validate-comprehensive', {
                clientId: parseInt(clientId),
                toolId: parseInt(toolId),
                quantity: parseInt(quantity)
            });
            return response.data;
        } catch (err) {
            console.error('Error validating loan comprehensively:', err);
            setError(err.response?.data || err.message || 'Error al validar el préstamo');
            throw new Error(err.response?.data || err.message || 'Error al validar el préstamo');
        } finally {
            setLoading(false);
        }
    }, []);

    // Verificar restricciones del cliente - RF2.5
    const checkClientRestrictions = useCallback(async (clientId) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/client/${clientId}/restrictions`);
            return response.data;
        } catch (err) {
            console.error('Error checking client restrictions:', err);
            throw new Error(err.response?.data || err.message || 'Error al verificar restricciones del cliente');
        }
    }, []);

    // Verificar disponibilidad de herramienta - RF2.2
    const checkToolAvailability = useCallback(async (toolId, quantity = 1) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/tool/${toolId}/availability`, {
                params: { quantity }
            });
            return response.data;
        } catch (err) {
            console.error('Error checking tool availability:', err);
            throw new Error(err.response?.data || err.message || 'Error al verificar disponibilidad de herramienta');
        }
    }, []);

    // Verificar si cliente ya tiene préstamo de herramienta específica
    const checkClientToolLoan = useCallback(async (clientId, toolId) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/client/${clientId}/tool/${toolId}/check`);
            return response.data;
        } catch (err) {
            console.error('Error checking client tool loan:', err);
            throw new Error(err.response?.data || err.message || 'Error al verificar préstamo de herramienta del cliente');
        }
    }, []);

    // Contar préstamos activos del cliente
    const getActiveLoanCount = useCallback(async (clientId) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/client/${clientId}/active-count`);
            return response.data;
        } catch (err) {
            console.error('Error getting active loan count:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener cantidad de préstamos activos');
        }
    }, []);

    // Verificar restricciones de multas del cliente - RF2.5
    const checkClientFineRestrictions = useCallback(async (clientId) => {
        try {
            const response = await httpClient.post(`/api/v1/fines/${clientId}/check-restrictions`);
            return response.data;
        } catch (err) {
            console.error('Error checking client fine restrictions:', err);
            throw new Error(err.response?.data || err.message || 'Error al verificar restricciones de multas');
        }
    }, []);

    // Obtener tarifas actuales para el préstamo
    const getCurrentRates = useCallback(async () => {
        try {
            const response = await httpClient.get('/api/v1/loans/rates/current');
            return response.data;
        } catch (err) {
            console.error('Error getting current rates:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener tarifas actuales');
        }
    }, []);

    // Validación completa combinando todas las verificaciones
    const validateLoanRequest = useCallback(async (clientId, toolId, quantity, returnDate) => {
        setLoading(true);
        setError(null);

        try {
            // Verificar todas las condiciones en paralelo
            const [
                clientRestrictions,
                toolAvailability,
                clientToolCheck,
                activeLoanCount,
                fineRestrictions,
                currentRates
            ] = await Promise.all([
                checkClientRestrictions(clientId),
                checkToolAvailability(toolId, quantity),
                checkClientToolLoan(clientId, toolId),
                getActiveLoanCount(clientId),
                checkClientFineRestrictions(clientId).catch(() => ({ canRequestLoan: true })), // Opcional
                getCurrentRates()
            ]);

            // Evaluar condiciones
            const validation = {
                // Elegibilidad del cliente
                clientEligible: clientRestrictions.eligible,
                clientIssue: clientRestrictions.restriction || null,
                clientStatus: clientRestrictions.eligible ? 'ELIGIBLE' : 'RESTRICTED',

                // Disponibilidad de herramienta
                toolAvailable: toolAvailability.available,
                toolIssue: toolAvailability.issue || null,
                toolStatus: toolAvailability.toolStatus,
                currentStock: toolAvailability.currentStock,

                // Verificación de préstamo existente
                hasExistingLoanForTool: clientToolCheck.hasActiveLoanForTool,
                existingLoanDetails: clientToolCheck.hasActiveLoanForTool ? {
                    loanId: clientToolCheck.activeLoanId,
                    loanDate: clientToolCheck.loanDate,
                    agreedReturnDate: clientToolCheck.agreedReturnDate,
                    quantity: clientToolCheck.quantity
                } : null,

                // Límites de préstamos
                currentActiveLoans: activeLoanCount.activeLoanCount,
                maxAllowedLoans: activeLoanCount.maxAllowed,
                canRequestMore: activeLoanCount.canRequestMore,

                // Restricciones de multas
                fineRestrictions: fineRestrictions || {},

                // Tarifas actuales
                currentRates: currentRates,

                // Validación final
                canCreateLoan: (
                    clientRestrictions.eligible &&
                    toolAvailability.available &&
                    !clientToolCheck.hasActiveLoanForTool &&
                    activeLoanCount.canRequestMore &&
                    fineRestrictions.canRequestLoan
                ),

                // Detalles adicionales
                validation: {
                    dateValidation: validateReturnDate(returnDate),
                    quantityValidation: validateQuantity(quantity, toolAvailability.currentStock),
                },

                // Resumen de problemas
                issues: generateIssuesList(
                    clientRestrictions,
                    toolAvailability,
                    clientToolCheck,
                    activeLoanCount,
                    fineRestrictions
                ),

                // Timestamp de validación
                validatedAt: new Date().toISOString()
            };

            return validation;

        } catch (err) {
            console.error('Error in complete loan validation:', err);
            setError(err.message || 'Error en validación completa');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [checkClientRestrictions, checkToolAvailability, checkClientToolLoan, getActiveLoanCount, checkClientFineRestrictions, getCurrentRates]);

    // Validar fecha de devolución
    const validateReturnDate = (returnDate) => {
        if (!returnDate) {
            return { valid: false, issue: 'Fecha de devolución requerida' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const returnDateObj = new Date(returnDate);
        returnDateObj.setHours(0, 0, 0, 0);

        if (returnDateObj < today) {
            return { valid: false, issue: 'La fecha de devolución no puede ser anterior a hoy' };
        }

        // Verificar que no sea más de 30 días
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        if (returnDateObj > thirtyDaysFromNow) {
            return { valid: false, issue: 'La fecha de devolución no puede ser más de 30 días' };
        }

        return { valid: true, daysFromNow: Math.ceil((returnDateObj - today) / (1000 * 60 * 60 * 24)) };
    };

    // Validar cantidad
    const validateQuantity = (quantity, availableStock) => {
        if (!quantity || quantity < 1) {
            return { valid: false, issue: 'La cantidad debe ser mayor a 0' };
        }

        if (quantity > availableStock) {
            return {
                valid: false,
                issue: `Cantidad solicitada (${quantity}) excede stock disponible (${availableStock})`
            };
        }

        return { valid: true, requestedQuantity: quantity, availableStock };
    };

    // Generar lista de problemas
    const generateIssuesList = (clientRestrictions, toolAvailability, clientToolCheck, activeLoanCount, fineRestrictions) => {
        const issues = [];

        if (!clientRestrictions.eligible) {
            issues.push({
                type: 'CLIENT_RESTRICTION',
                severity: 'ERROR',
                message: clientRestrictions.restriction,
                details: clientRestrictions
            });
        }

        if (!toolAvailability.available) {
            issues.push({
                type: 'TOOL_UNAVAILABLE',
                severity: 'ERROR',
                message: toolAvailability.issue,
                details: toolAvailability
            });
        }

        if (clientToolCheck.hasActiveLoanForTool) {
            issues.push({
                type: 'DUPLICATE_TOOL_LOAN',
                severity: 'ERROR',
                message: 'Cliente ya tiene préstamo activo de esta herramienta',
                details: clientToolCheck
            });
        }

        if (!activeLoanCount.canRequestMore) {
            issues.push({
                type: 'LOAN_LIMIT_REACHED',
                severity: 'ERROR',
                message: `Cliente ha alcanzado el límite de ${activeLoanCount.maxAllowed} préstamos activos`,
                details: activeLoanCount
            });
        }

        if (fineRestrictions && !fineRestrictions.canRequestLoan) {
            issues.push({
                type: 'FINE_RESTRICTION',
                severity: 'ERROR',
                message: 'Cliente tiene multas pendientes que bloquean nuevos préstamos',
                details: fineRestrictions
            });
        }

        return issues;
    };

    return {
        // State
        loading,
        error,

        // Validation methods
        validateLoanComprehensive,
        validateLoanRequest,
        checkClientRestrictions,
        checkToolAvailability,
        checkClientToolLoan,
        getActiveLoanCount,
        checkClientFineRestrictions,
        getCurrentRates,

        // Utility methods
        validateReturnDate,
        validateQuantity
    };
};
// hooks/useLoans.js - Hook principal para préstamos siguiendo patrón del proyecto
import { useState, useCallback } from 'react';
import httpClient from "../../../../http-common";

export const useLoans = () => {
    const [loans, setLoans] = useState([]);
    const [activeLoans, setActiveLoans] = useState([]);
    const [overdueLoans, setOverdueLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load all loans (history)
    const loadLoans = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.get('/api/v1/loans/');
            setLoans(response.data || []);
        } catch (err) {
            console.error('Error loading loans:', err);
            setError(err.message);
            setLoans([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load active loans - RF6.1
    const loadActiveLoans = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.get('/api/v1/loans/active');
            setActiveLoans(response.data || []);
        } catch (err) {
            console.error('Error loading active loans:', err);
            setError(err.message);
            setActiveLoans([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load overdue loans - RF6.2
    const loadOverdueLoans = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.get('/api/v1/loans/overdue');
            setOverdueLoans(response.data || []);
        } catch (err) {
            console.error('Error loading overdue loans:', err);
            setError(err.message);
            setOverdueLoans([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new loan - RF2.1
    const createLoan = useCallback(async (loanData) => {
        try {
            const response = await httpClient.post('/api/v1/loans/', loanData);
            const newLoan = response.data;

            // Update active loans list
            setActiveLoans(prev => [...prev, newLoan]);

            return newLoan;
        } catch (err) {
            console.error('Error creating loan:', err);
            const errorMsg = err.response?.data || err.message || 'Error al crear el préstamo';
            throw new Error(errorMsg);
        }
    }, []);

    // Return tool - RF2.3
    const returnLoan = useCallback(async (loanId, returnData) => {
        try {
            const { damaged = false, notes = '' } = returnData;

            const response = await httpClient.put(`/api/v1/loans/${loanId}/return`, null, {
                params: { damaged, notes }
            });

            const returnedLoan = response.data;

            // Remove from active loans
            setActiveLoans(prev => prev.filter(loan => loan.id !== loanId));

            // Remove from overdue if it was there
            setOverdueLoans(prev => prev.filter(loan => loan.id !== loanId));

            return returnedLoan;
        } catch (err) {
            console.error('Error returning loan:', err);
            const errorMsg = err.response?.data || err.message || 'Error al procesar la devolución';
            throw new Error(errorMsg);
        }
    }, []);

    // Get loan by ID
    const getLoanById = useCallback(async (loanId) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/${loanId}`);
            return response.data;
        } catch (err) {
            console.error('Error getting loan by ID:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener el préstamo');
        }
    }, []);

    // Get loans by client
    const getLoansByClient = useCallback(async (clientId) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/client/${clientId}`);
            return response.data || [];
        } catch (err) {
            console.error('Error getting loans by client:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener préstamos del cliente');
        }
    }, []);

    // Get loans by tool
    const getLoansByTool = useCallback(async (toolId) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/tool/${toolId}`);
            return response.data || [];
        } catch (err) {
            console.error('Error getting loans by tool:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener préstamos de la herramienta');
        }
    }, []);

    // Update loan (limited to notes and agreed return date)
    const updateLoan = useCallback(async (loanId, loanData) => {
        try {
            // Patrón del profesor: PUT sin ID en URL, objeto completo con ID
            const loanWithId = { ...loanData, id: loanId };
            const response = await httpClient.put('/api/v1/loans/', loanWithId);
            const updatedLoan = response.data;

            // Update in active loans if present
            setActiveLoans(prev =>
                prev.map(loan => loan.id === loanId ? updatedLoan : loan)
            );

            return updatedLoan;
        } catch (err) {
            console.error('Error updating loan:', err);
            throw new Error(err.response?.data || err.message || 'Error al actualizar el préstamo');
        }
    }, []);

    // Delete loan (only non-active loans without fines)
    const deleteLoan = useCallback(async (loanId) => {
        try {
            await httpClient.delete(`/api/v1/loans/${loanId}`);

            // Remove from all loan lists
            setLoans(prev => prev.filter(loan => loan.id !== loanId));
            setActiveLoans(prev => prev.filter(loan => loan.id !== loanId));
            setOverdueLoans(prev => prev.filter(loan => loan.id !== loanId));

            return true;
        } catch (err) {
            console.error('Error deleting loan:', err);
            throw new Error(err.response?.data || err.message || 'Error al eliminar el préstamo');
        }
    }, []);

    // Get loan summary for reports - RF6
    const getLoanSummary = useCallback(async () => {
        try {
            const response = await httpClient.get('/api/v1/loans/reports/summary');
            return response.data;
        } catch (err) {
            console.error('Error getting loan summary:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener resumen de préstamos');
        }
    }, []);

    // Get current rates for loan creation
    const getCurrentRates = useCallback(async () => {
        try {
            const response = await httpClient.get('/api/v1/loans/rates/current');
            return response.data;
        } catch (err) {
            console.error('Error getting current rates:', err);
            throw new Error(err.response?.data || err.message || 'Error al obtener tarifas actuales');
        }
    }, []);

    return {
        // State
        loans,
        activeLoans,
        overdueLoans,
        loading,
        error,

        // CRUD operations
        loadLoans,
        loadActiveLoans,
        loadOverdueLoans,
        createLoan,
        updateLoan,
        deleteLoan,
        returnLoan,

        // Specific queries
        getLoanById,
        getLoansByClient,
        getLoansByTool,

        // Reports and utilities
        getLoanSummary,
        getCurrentRates
    };
};
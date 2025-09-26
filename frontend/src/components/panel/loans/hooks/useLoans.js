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
            const errorMsg = err.response?.data?.message || err.message || 'Error al cargar préstamos';
            setError(errorMsg);
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
            console.log('Active loans response:', response.data); // Debug
            setActiveLoans(response.data || []);
        } catch (err) {
            console.error('Error loading active loans:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Error al cargar préstamos activos';
            setError(errorMsg);
            setActiveLoans([]);

            // Fallback: try to get all loans and filter manually
            try {
                console.log('Trying fallback method for active loans...');
                const fallbackResponse = await httpClient.get('/api/v1/loans/');
                const allLoans = fallbackResponse.data || [];
                const activeLoansFiltered = allLoans.filter(loan =>
                    loan.status === 'ACTIVE' || loan.status === 'active'
                );
                setActiveLoans(activeLoansFiltered);
                setError(null); // Clear error if fallback works
            } catch (fallbackErr) {
                console.error('Fallback method also failed:', fallbackErr);
            }
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
            console.log('Overdue loans response:', response.data); // Debug
            setOverdueLoans(response.data || []);
        } catch (err) {
            console.error('Error loading overdue loans:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Error al cargar préstamos atrasados';
            setError(errorMsg);
            setOverdueLoans([]);

            // Fallback: try to get all loans and filter manually
            try {
                console.log('Trying fallback method for overdue loans...');
                const fallbackResponse = await httpClient.get('/api/v1/loans/');
                const allLoans = fallbackResponse.data || [];
                const today = new Date().toISOString().split('T')[0];
                const overdueLoansFiltered = allLoans.filter(loan =>
                    (loan.status === 'ACTIVE' || loan.status === 'active') &&
                    loan.agreedReturnDate < today
                );
                setOverdueLoans(overdueLoansFiltered);
                setError(null); // Clear error if fallback works
            } catch (fallbackErr) {
                console.error('Fallback method also failed:', fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new loan - RF2.1 - VERSIÓN CORREGIDA
    const createLoan = useCallback(async (loanData) => {
        setLoading(true);
        setError(null);
        try {
            // Validar datos antes del envío
            if (!loanData.clientId || !loanData.toolId || !loanData.quantity || !loanData.agreedReturnDate) {
                throw new Error('Faltan datos requeridos para crear el préstamo');
            }

            console.log('Creating loan with data:', loanData); // Debug

            // Hacer la petición al backend
            const response = await httpClient.post('/api/v1/loans/', loanData);

            if (!response.data) {
                throw new Error('Respuesta vacía del servidor');
            }

            const newLoan = response.data;
            console.log('Loan created successfully:', newLoan); // Debug

            // Actualizar la lista de préstamos activos solo si el préstamo está activo
            if (newLoan.status === 'ACTIVE') {
                setActiveLoans(prev => {
                    // Evitar duplicados
                    const filtered = prev.filter(loan => loan.id !== newLoan.id);
                    return [...filtered, newLoan];
                });
            }

            // También actualizar la lista general si está cargada
            if (loans.length > 0) {
                setLoans(prev => {
                    const filtered = prev.filter(loan => loan.id !== newLoan.id);
                    return [newLoan, ...filtered]; // Poner el nuevo préstamo al inicio
                });
            }

            return newLoan;
        } catch (err) {
            console.error('Error creating loan:', err);

            // Manejo de errores más específico
            let errorMsg = 'Error al crear el préstamo';

            if (err.response?.status === 500) {
                errorMsg = 'Error interno del servidor. Verifique que todos los datos sean correctos.';
            } else if (err.response?.status === 400) {
                errorMsg = err.response.data?.message || 'Datos inválidos para crear el préstamo';
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (err.response?.data) {
                errorMsg = typeof err.response.data === 'string' ? err.response.data : 'Error en la validación de datos';
            } else if (err.message) {
                errorMsg = err.message;
            }

            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [loans]);

    // Return tool - RF2.3
    const returnLoan = useCallback(async (loanId, returnData) => {
        setLoading(true);
        setError(null);
        try {
            const { damaged = false, notes = '' } = returnData;
            console.log('Returning loan:', loanId, { damaged, notes }); // Debug

            const response = await httpClient.put(`/api/v1/loans/${loanId}/return`, null, {
                params: { damaged, notes }
            });

            const returnedLoan = response.data;
            console.log('Loan returned successfully:', returnedLoan); // Debug

            // Remove from active loans
            setActiveLoans(prev => prev.filter(loan => loan.id !== loanId));

            // Remove from overdue if it was there
            setOverdueLoans(prev => prev.filter(loan => loan.id !== loanId));

            return returnedLoan;
        } catch (err) {
            console.error('Error returning loan:', err);
            const errorMsg = err.response?.data?.message ||
                err.response?.data ||
                err.message ||
                'Error al procesar la devolución';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get loan by ID
    const getLoanById = useCallback(async (loanId) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/${loanId}`);
            return response.data;
        } catch (err) {
            console.error('Error getting loan by ID:', err);
            throw new Error(err.response?.data?.message || err.message || 'Error al obtener el préstamo');
        }
    }, []);

    // Get loans by client
    const getLoansByClient = useCallback(async (clientId) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/client/${clientId}`);
            return response.data || [];
        } catch (err) {
            console.error('Error getting loans by client:', err);
            throw new Error(err.response?.data?.message || err.message || 'Error al obtener préstamos del cliente');
        }
    }, []);

    // Get loans by tool
    const getLoansByTool = useCallback(async (toolId) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/tool/${toolId}`);
            return response.data || [];
        } catch (err) {
            console.error('Error getting loans by tool:', err);
            throw new Error(err.response?.data?.message || err.message || 'Error al obtener préstamos de la herramienta');
        }
    }, []);

    // Check client restrictions - MEJORADA
    const checkClientRestrictions = useCallback(async (clientId) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/client/${clientId}/restrictions`);
            return response.data;
        } catch (err) {
            console.error('Error checking client restrictions:', err);
            // Fallback con validación básica
            try {
                const clientLoans = await getLoansByClient(clientId);
                const activeLoans = clientLoans.filter(loan =>
                    loan.status === 'ACTIVE' || loan.status === 'active'
                );

                return {
                    eligible: activeLoans.length < 5,
                    canRequestLoan: activeLoans.length < 5,
                    currentActiveLoans: activeLoans.length,
                    maxAllowedLoans: 5,
                    remainingLoanSlots: Math.max(0, 5 - activeLoans.length),
                    restriction: activeLoans.length >= 5 ? 'Cliente ha alcanzado el límite de préstamos activos' : null,
                    clientStatus: activeLoans.length >= 5 ? 'RESTRICTED' : 'ACTIVE'
                };
            } catch (fallbackErr) {
                throw new Error(err.response?.data?.message || err.message || 'Error al verificar restricciones del cliente');
            }
        }
    }, [getLoansByClient]);

    // Update loan (limited to notes and agreed return date)
    const updateLoan = useCallback(async (loanId, loanData) => {
        setLoading(true);
        setError(null);
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
            const errorMsg = err.response?.data?.message || err.message || 'Error al actualizar el préstamo';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete loan (only non-active loans without fines)
    const deleteLoan = useCallback(async (loanId) => {
        setLoading(true);
        setError(null);
        try {
            await httpClient.delete(`/api/v1/loans/${loanId}`);

            // Remove from all loan lists
            setLoans(prev => prev.filter(loan => loan.id !== loanId));
            setActiveLoans(prev => prev.filter(loan => loan.id !== loanId));
            setOverdueLoans(prev => prev.filter(loan => loan.id !== loanId));

            return true;
        } catch (err) {
            console.error('Error deleting loan:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Error al eliminar el préstamo';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get loan summary for reports - RF6
    const getLoanSummary = useCallback(async () => {
        try {
            const response = await httpClient.get('/api/v1/loans/reports/summary');
            return response.data;
        } catch (err) {
            console.error('Error getting loan summary:', err);
            throw new Error(err.response?.data?.message || err.message || 'Error al obtener resumen de préstamos');
        }
    }, []);

    // Get current rates for loan creation
    const getCurrentRates = useCallback(async () => {
        try {
            const response = await httpClient.get('/api/v1/loans/rates/current');
            return response.data;
        } catch (err) {
            console.error('Error getting current rates:', err);
            // Fallback con valores por defecto
            return {
                rentalRate: 100.00,
                lateFeeRate: 10.00,
                repairRate: 0.20
            };
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
        checkClientRestrictions,

        // Reports and utilities
        getLoanSummary,
        getCurrentRates
    };
};
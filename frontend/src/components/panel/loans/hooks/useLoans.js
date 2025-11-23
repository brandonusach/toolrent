// hooks/useLoans.js - VERSION CORREGIDA para manejar errores del backend
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
            console.log('All loans response:', response.data);
            setLoans(response.data || []);
        } catch (err) {
            console.error('Error loading loans:', err);
            const errorMsg = err.response?.data?.message ||
                err.response?.data ||
                err.message ||
                'Error al cargar préstamos';
            setError(errorMsg);
            setLoans([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load active loans - VERSIÓN MEJORADA
    const loadActiveLoans = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Attempting to load active loans...');
            const response = await httpClient.get('/api/v1/loans/active');
            console.log('Active loans response:', response.data);

            const activeLoansData = response.data || [];
            setActiveLoans(activeLoansData);

            if (activeLoansData.length === 0) {
                console.log('No active loans found');
            }

        } catch (err) {
            console.error('Error loading active loans:', err);
            console.error('Error details:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message
            });

            const errorMsg = err.response?.data?.message ||
                err.response?.data ||
                err.message ||
                'Error al cargar préstamos activos';
            setError(errorMsg);

            // Fallback: try to get all loans and filter manually
            try {
                console.log('Trying fallback method for active loans...');
                const fallbackResponse = await httpClient.get('/api/v1/loans/');
                const allLoans = fallbackResponse.data || [];
                console.log('Fallback - all loans:', allLoans.length);

                const activeLoansFiltered = allLoans.filter(loan => {
                    const isActive = loan.status === 'ACTIVE' || loan.status === 'active';
                    console.log(`Loan ${loan.id}: status=${loan.status}, isActive=${isActive}`);
                    return isActive;
                });

                console.log('Fallback - filtered active loans:', activeLoansFiltered.length);
                setActiveLoans(activeLoansFiltered);
                setError(null); // Clear error if fallback works

            } catch (fallbackErr) {
                console.error('Fallback method also failed:', fallbackErr);
                setActiveLoans([]); // Set empty array as last resort
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Load overdue loans - VERSIÓN MEJORADA
    const loadOverdueLoans = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Attempting to load overdue loans...');
            const response = await httpClient.get('/api/v1/loans/overdue');
            console.log('Overdue loans response:', response.data);

            const overdueLoansData = response.data || [];
            setOverdueLoans(overdueLoansData);

        } catch (err) {
            console.error('Error loading overdue loans:', err);
            const errorMsg = err.response?.data?.message ||
                err.response?.data ||
                err.message ||
                'Error al cargar préstamos atrasados';
            setError(errorMsg);

            // Fallback: try to get all loans and filter manually
            try {
                console.log('Trying fallback method for overdue loans...');
                const fallbackResponse = await httpClient.get('/api/v1/loans/');
                const allLoans = fallbackResponse.data || [];
                const today = new Date().toISOString().split('T')[0];

                const overdueLoansFiltered = allLoans.filter(loan => {
                    const isActive = loan.status === 'ACTIVE' || loan.status === 'active';
                    const isOverdue = loan.agreedReturnDate <= today;
                    return isActive && isOverdue;
                });

                console.log('Fallback - filtered overdue loans:', overdueLoansFiltered.length);
                setOverdueLoans(overdueLoansFiltered);
                setError(null); // Clear error if fallback works

            } catch (fallbackErr) {
                console.error('Fallback method also failed:', fallbackErr);
                setOverdueLoans([]);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new loan - VERSIÓN ULTRA ROBUSTA
    const createLoan = useCallback(async (loanData) => {
        setLoading(true);
        setError(null);

        try {
            // Validación exhaustiva de datos antes del envío
            console.log('Creating loan with data:', loanData);

            if (!loanData || typeof loanData !== 'object') {
                throw new Error('Datos del préstamo son requeridos');
            }

            // Validar campos requeridos
            const requiredFields = ['clientId', 'toolId', 'quantity', 'agreedReturnDate'];
            for (const field of requiredFields) {
                if (!loanData[field]) {
                    throw new Error(`Campo requerido faltante: ${field}`);
                }
            }

            // Validar tipos de datos
            if (isNaN(Number(loanData.clientId)) || Number(loanData.clientId) <= 0) {
                throw new Error('ID de cliente debe ser un número válido mayor a 0');
            }
            if (isNaN(Number(loanData.toolId)) || Number(loanData.toolId) <= 0) {
                throw new Error('ID de herramienta debe ser un número válido mayor a 0');
            }
            if (isNaN(Number(loanData.quantity)) || Number(loanData.quantity) <= 0) {
                throw new Error('Cantidad debe ser un número válido mayor a 0');
            }

            // Validar fecha
            const returnDate = new Date(loanData.agreedReturnDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            returnDate.setHours(0, 0, 0, 0);

            if (isNaN(returnDate.getTime())) {
                throw new Error('Fecha de devolución no es válida');
            }
            if (returnDate < today) {
                throw new Error('La fecha de devolución no puede ser anterior a hoy');
            }

            // Preparar datos limpios para envío
            const cleanLoanData = {
                clientId: Number(loanData.clientId),
                toolId: Number(loanData.toolId),
                quantity: Number(loanData.quantity),
                agreedReturnDate: loanData.agreedReturnDate,
                notes: (loanData.notes || '').trim()
            };

            console.log('Sending clean loan data:', cleanLoanData);

            // Hacer la petición con manejo de errores específicos
            const response = await httpClient.post('/api/v1/loans/', cleanLoanData);

            if (!response.data) {
                throw new Error('Respuesta vacía del servidor');
            }

            const newLoan = response.data;
            console.log('Loan created successfully:', newLoan);

            // Actualizar la lista de préstamos activos solo si el préstamo está activo
            if (newLoan.status === 'ACTIVE' || newLoan.status === 'active') {
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
            console.error('Error details:', {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                message: err.message
            });

            // Manejo de errores más específico
            let errorMsg = 'Error al crear el préstamo';

            if (err.response?.status === 500) {
                errorMsg = 'Error interno del servidor. Verifique que todos los datos sean correctos.';
            } else if (err.response?.status === 400) {
                errorMsg = err.response.data?.message ||
                    err.response.data ||
                    'Datos inválidos para crear el préstamo';
            } else if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMsg = err.response.data;
                } else if (err.response.data.message) {
                    errorMsg = err.response.data.message;
                } else {
                    errorMsg = 'Error en la validación de datos';
                }
            } else if (err.message) {
                errorMsg = err.message;
            }

            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [loans]);

    // Return tool - VERSIÓN MEJORADA CON TIPO DE DAÑO
    const returnLoan = useCallback(async (loanId, returnData) => {
        setLoading(true);
        setError(null);
        try {
            const { damaged = false, damageType = 'MINOR', notes = '' } = returnData;
            console.log('Returning loan:', loanId, { damaged, damageType, notes });

            const response = await httpClient.put(`/api/v1/loans/${loanId}/return`, null, {
                params: { damaged, damageType, notes }
            });

            const returnedLoan = response.data;
            console.log('Loan returned successfully:', returnedLoan);

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

    // Get loans by client - VERSIÓN MEJORADA
    const getLoansByClient = useCallback(async (clientId) => {
        try {
            if (!clientId || clientId <= 0) {
                return [];
            }
            const response = await httpClient.get(`/api/v1/loans/client/${clientId}`);
            return response.data || [];
        } catch (err) {
            console.error('Error getting loans by client:', err);
            // No lanzar error, solo retornar array vacío
            return [];
        }
    }, []);

    // Get loans by tool
    const getLoansByTool = useCallback(async (toolId) => {
        try {
            const response = await httpClient.get(`/api/v1/loans/tool/${toolId}`);
            return response.data || [];
        } catch (err) {
            console.error('Error getting loans by tool:', err);
            return [];
        }
    }, []);

    // Check client restrictions - VERSIÓN ULTRA MEJORADA
    const checkClientRestrictions = useCallback(async (clientId) => {
        try {
            if (!clientId || clientId <= 0) {
                return {
                    eligible: false,
                    canRequestLoan: false,
                    restriction: 'ID de cliente inválido'
                };
            }

            console.log('Checking restrictions for client:', clientId);
            const response = await httpClient.get(`/api/v1/loans/client/${clientId}/restrictions`);
            console.log('Client restrictions response:', response.data);
            return response.data;

        } catch (err) {
            console.error('Error checking client restrictions:', err);

            // Fallback más completo
            try {
                console.log('Attempting fallback validation for client:', clientId);

                // Obtener préstamos del cliente
                const clientLoans = await getLoansByClient(clientId);
                const activeLoans = clientLoans.filter(loan =>
                    loan.status === 'ACTIVE' || loan.status === 'active'
                );

                console.log('Fallback - client loans:', clientLoans.length, 'active:', activeLoans.length);

                // Verificar multas usando el servicio de multas
                let hasUnpaidFines = false;
                try {
                    const finesResponse = await httpClient.get(`/api/v1/fines/client/${clientId}/unpaid`);
                    hasUnpaidFines = (finesResponse.data || []).length > 0;
                } catch (fineErr) {
                    console.warn('Could not check fines, assuming no fines:', fineErr.message);
                }

                const eligible = activeLoans.length < 5 && !hasUnpaidFines;

                return {
                    eligible: eligible,
                    canRequestLoan: eligible,
                    currentActiveLoans: activeLoans.length,
                    maxAllowedLoans: 5,
                    remainingLoanSlots: Math.max(0, 5 - activeLoans.length),
                    restriction: eligible ? null : 'Verificación mediante fallback - revise restricciones',
                    clientStatus: eligible ? 'ACTIVE' : 'RESTRICTED',
                    fallback: true
                };

            } catch (fallbackErr) {
                console.error('Fallback validation also failed:', fallbackErr);
                return {
                    eligible: false,
                    canRequestLoan: false,
                    restriction: 'Error al verificar restricciones del cliente',
                    clientStatus: 'ERROR',
                    error: true
                };
            }
        }
    }, [getLoansByClient]);

    // Update loan (limited to notes and agreed return date)
    const updateLoan = useCallback(async (loanId, loanData) => {
        setLoading(true);
        setError(null);
        try {
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
            // Fallback básico
            return {
                totalLoans: loans.length,
                activeLoans: activeLoans.length,
                overdueLoans: overdueLoans.length,
                error: 'Datos parciales - error en el servidor'
            };
        }
    }, [loans.length, activeLoans.length, overdueLoans.length]);

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
                repairRate: 0.20,
                error: 'Usando valores por defecto'
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
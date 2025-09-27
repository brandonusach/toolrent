// hooks/useReports.js - Hook simplificado sin filtros de fecha ni exportación
import { useState, useCallback } from 'react';
import api from "../../../../http-common";

export const useReports = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState({});

    // RF6.1: Listar préstamos activos y estado (vigentes, atrasados)
    const getActiveLoansReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/v1/reports/active-loans');
            const data = response.data;

            setReportData(prevData => ({
                ...prevData,
                activeLoans: data
            }));

            return data;
        } catch (err) {
            console.error('Error loading active loans report:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Error al cargar reporte de préstamos activos';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // RF6.2: Listar clientes con atrasos
    const getOverdueClientsReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/v1/reports/overdue-clients');
            const data = response.data;

            setReportData(prevData => ({
                ...prevData,
                overdueClients: data
            }));

            return data;
        } catch (err) {
            console.error('Error loading overdue clients report:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Error al cargar reporte de clientes morosos';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // RF6.3: Ranking herramientas más prestadas
    const getPopularToolsReport = useCallback(async (limit = 10) => {
        setLoading(true);
        setError(null);
        try {
            const params = { limit };
            const response = await api.get('/api/v1/reports/popular-tools', { params });
            const data = response.data;

            setReportData(prevData => ({
                ...prevData,
                popularTools: data
            }));

            return data;
        } catch (err) {
            console.error('Error loading popular tools report:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Error al cargar reporte de herramientas populares';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // Generar resumen general de reportes
    const generateGeneralSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/v1/reports/summary');
            const data = response.data;

            setReportData(prevData => ({
                ...prevData,
                generalSummary: data
            }));

            return data;
        } catch (err) {
            console.error('Error generating general summary:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Error al generar resumen general';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // Limpiar datos de reportes
    const clearReportData = useCallback(() => {
        setReportData({});
        setError(null);
    }, []);

    return {
        loading,
        error,
        reportData,
        getActiveLoansReport,
        getOverdueClientsReport,
        getPopularToolsReport,
        generateGeneralSummary,
        clearReportData
    };
};

// hooks/useClients.js - Version con Axios
import { useState, useCallback } from 'react';
import apiClient from '../../../../api/axiosConfig';

export const useClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para limpiar errores
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Cargar todos los clientes
    const loadClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/client/');

            // Axios maneja automáticamente status 204 y otros
            setClients(response.data || []);
        } catch (err) {
            setError(err.message || 'Error al cargar clientes');
            setClients([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear cliente
    const createClient = useCallback(async (clientData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post('/client/', clientData);
            const newClient = response.data;

            setClients(prev => [...prev, newClient]);
            return newClient;
        } catch (err) {
            const errorMsg = err.response?.status === 409
                ? 'Ya existe un cliente con estos datos'
                : err.message;
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Actualizar cliente
    const updateClient = useCallback(async (clientId, clientData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.put(`/client/${clientId}`, clientData);
            const updatedClient = response.data;

            setClients(prev =>
                prev.map(client =>
                    client.id === clientId ? updatedClient : client
                )
            );
            return updatedClient;
        } catch (err) {
            const errorMsg = err.response?.status === 404
                ? 'Cliente no encontrado'
                : err.message;
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Eliminar cliente
    const deleteClient = useCallback(async (clientId) => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/client/${clientId}`);
            setClients(prev => prev.filter(client => client.id !== clientId));
            return true;
        } catch (err) {
            const errorMsg = err.response?.status === 404
                ? 'Cliente no encontrado'
                : err.message;
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cambiar estado del cliente
    const updateClientStatus = useCallback(async (clientId, newStatus) => {
        setLoading(true);
        setError(null);
        try {
            const currentClient = clients.find(c => c.id === clientId);
            if (!currentClient) {
                throw new Error('Cliente no encontrado en caché local');
            }

            const updatedClientData = {
                ...currentClient,
                status: newStatus
            };

            const response = await apiClient.put(`/client/${clientId}`, updatedClientData);
            const updatedClient = response.data;

            setClients(prev =>
                prev.map(client =>
                    client.id === clientId ? updatedClient : client
                )
            );
            return updatedClient;
        } catch (err) {
            const errorMsg = err.response?.status === 404
                ? 'Cliente no encontrado'
                : err.message;
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [clients]);

    // Filtrar clientes - Solo filtrado básico en frontend
    const filterClients = useCallback((searchTerm, statusFilter) => {
        let filtered = [...clients];

        if (searchTerm && searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(client =>
                (client.name && client.name.toLowerCase().includes(term)) ||
                (client.rut && client.rut.toLowerCase().includes(term)) ||
                (client.email && client.email.toLowerCase().includes(term)) ||
                (client.phone && client.phone.toLowerCase().includes(term))
            );
        }

        if (statusFilter && statusFilter !== 'ALL') {
            filtered = filtered.filter(client => client.status === statusFilter);
        }

        return filtered;
    }, [clients]);

    // Buscar cliente por RUT
    const getClientByRut = useCallback(async (rut) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/client/rut/${encodeURIComponent(rut)}`);
            return response.data;
        } catch (err) {
            if (err.response?.status === 404) {
                return null;
            }
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Verificar existencia por RUT
    const existsByRut = useCallback(async (rut) => {
        try {
            const response = await apiClient.get(`/client/exists/${encodeURIComponent(rut)}`);
            return response.data;
        } catch (err) {
            console.error('Error checking RUT existence:', err);
            return false;
        }
    }, []);

    return {
        // Estado
        clients,
        loading,
        error,

        // Acciones
        loadClients,
        createClient,
        updateClient,
        deleteClient,
        updateClientStatus,
        filterClients,
        getClientByRut,
        existsByRut,

        // Utilidades
        clearError
    };
};
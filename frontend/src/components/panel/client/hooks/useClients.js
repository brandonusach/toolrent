import { useState, useCallback } from 'react';

// Configuración de la API - El backend maneja toda la lógica
const getApiBaseUrl = () => {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    return 'http://localhost:8081/api';
};

const API_BASE_URL = getApiBaseUrl();

export const useClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Headers básicos para las peticiones
    const getAuthHeaders = useCallback(() => {
        return {
            'Content-Type': 'application/json',
        };
    }, []);

    // Función para limpiar errores
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Función auxiliar para manejar errores HTTP
    const handleHttpError = async (response) => {
        let errorMessage = `Error HTTP: ${response.status}`;

        try {
            const errorText = await response.text();
            if (errorText) {
                errorMessage = errorText;
            }
        } catch (e) {
            // Si no se puede leer el texto del error, usar el mensaje por defecto
        }

        return errorMessage;
    };

    // Cargar todos los clientes - El backend decide qué devolver
    const loadClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/client/`, {
                headers: getAuthHeaders()
            });

            if (response.status === 204) {
                setClients([]);
                return;
            }

            if (!response.ok) {
                const errorMsg = await handleHttpError(response);
                throw new Error(errorMsg);
            }

            const data = await response.json();
            setClients(data);
        } catch (err) {
            setError(err.message || 'Error al cargar clientes');
            setClients([]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    // Crear cliente - Enviar datos directos al backend
    const createClient = useCallback(async (clientData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/client/`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(clientData),
            });

            if (response.status === 409) {
                const errorText = await handleHttpError(response);
                throw new Error(errorText);
            }

            if (!response.ok) {
                const errorText = await handleHttpError(response);
                throw new Error(errorText);
            }

            const newClient = await response.json();
            setClients(prev => [...prev, newClient]);
            return newClient;
        } catch (err) {
            setError(err.message);
            throw err; // Re-lanzar para que el componente maneje la UI
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    // Actualizar cliente - Backend maneja toda la lógica
    const updateClient = useCallback(async (clientId, clientData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/client/${clientId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(clientData),
            });

            if (response.status === 404) {
                throw new Error('Cliente no encontrado');
            }

            if (!response.ok) {
                const errorText = await handleHttpError(response);
                throw new Error(errorText);
            }

            const updatedClient = await response.json();
            setClients(prev =>
                prev.map(client =>
                    client.id === clientId ? updatedClient : client
                )
            );
            return updatedClient;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    // Eliminar cliente
    const deleteClient = useCallback(async (clientId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/client/${clientId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.status === 404) {
                throw new Error('Cliente no encontrado');
            }

            if (!response.ok) {
                const errorText = await handleHttpError(response);
                throw new Error(errorText);
            }

            setClients(prev => prev.filter(client => client.id !== clientId));
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    // Cambiar estado del cliente - Backend valida las reglas de negocio
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

            const response = await fetch(`${API_BASE_URL}/client/${clientId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedClientData),
            });

            if (response.status === 404) {
                throw new Error('Cliente no encontrado');
            }

            if (!response.ok) {
                const errorText = await handleHttpError(response);
                throw new Error(errorText);
            }

            const updatedClient = await response.json();
            setClients(prev =>
                prev.map(client =>
                    client.id === clientId ? updatedClient : client
                )
            );
            return updatedClient;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [clients, getAuthHeaders]);

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

    // Buscar cliente por RUT - Delegar al backend
    const getClientByRut = useCallback(async (rut) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/client/rut/${encodeURIComponent(rut)}`, {
                headers: getAuthHeaders()
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                const errorText = await handleHttpError(response);
                throw new Error(errorText);
            }

            const client = await response.json();
            return client;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    // Verificar existencia por RUT - Backend decide
    const existsByRut = useCallback(async (rut) => {
        try {
            const response = await fetch(`${API_BASE_URL}/client/exists/${encodeURIComponent(rut)}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                return false;
            }

            const exists = await response.json();
            return exists;
        } catch (err) {
            console.error('Error checking RUT existence:', err);
            return false;
        }
    }, [getAuthHeaders]);

    return {
        // Estado
        clients,
        loading,
        error,

        // Acciones - Todas delegan lógica al backend
        loadClients,
        createClient,
        updateClient,
        deleteClient,
        updateClientStatus,
        filterClients, // Solo filtrado básico frontend
        getClientByRut,
        existsByRut,

        // Utilidades
        clearError
    };
};
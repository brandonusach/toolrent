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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Usar los datos exactamente como los devuelve el backend
            // El backend ya formateó RUT, normalizó teléfonos, etc.
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
                body: JSON.stringify(clientData), // Datos tal como los ingresó el usuario
            });

            if (response.status === 409) {
                const errorText = await response.text();
                throw new Error(errorText || 'Ya existe un cliente con estos datos');
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error HTTP: ${response.status}`);
            }

            const newClient = await response.json();
            // El backend devuelve el cliente con datos normalizados y formateados
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
                body: JSON.stringify(clientData), // Datos crudos del formulario
            });

            if (response.status === 404) {
                throw new Error('Cliente no encontrado');
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error HTTP: ${response.status}`);
            }

            const updatedClient = await response.json();
            // Backend devuelve cliente actualizado con datos procesados
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
                const errorText = await response.text();
                throw new Error(errorText || `Error HTTP: ${response.status}`);
            }

            // Solo actualizar UI si el backend confirmó la eliminación
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
            // Obtener cliente actual
            const currentClient = clients.find(c => c.id === clientId);
            if (!currentClient) {
                throw new Error('Cliente no encontrado en caché local');
            }

            // Enviar cliente completo con nuevo estado
            // El backend decidirá si el cambio es válido
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
                const errorText = await response.text();
                throw new Error(errorText || `Error HTTP: ${response.status}`);
            }

            const updatedClient = await response.json();
            // Backend confirmó el cambio y devolvió el estado actualizado
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
    // Para filtros complejos, debería hacerse en backend con endpoints específicos
    const filterClients = useCallback((searchTerm, statusFilter) => {
        let filtered = [...clients];

        // Filtro de búsqueda básico
        if (searchTerm && searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(client =>
                (client.name && client.name.toLowerCase().includes(term)) ||
                (client.rut && client.rut.toLowerCase().includes(term)) ||
                (client.email && client.email.toLowerCase().includes(term)) ||
                (client.phone && client.phone.toLowerCase().includes(term))
            );
        }

        // Filtro por estado
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
            // El backend normaliza y valida el RUT
            const response = await fetch(`${API_BASE_URL}/client/rut/${encodeURIComponent(rut)}`, {
                headers: getAuthHeaders()
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error HTTP: ${response.status}`);
            }

            const client = await response.json();
            return client; // Cliente con datos formateados por el backend
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
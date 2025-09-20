import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, UserCheck, UserX, Filter } from 'lucide-react';

// Componentes
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import ClientDetail from './components/ClientDetail';
import ClientStatus from './components/ClientStatus';
import ClientSearch from './components/ClientSearch';

// Hooks
import { useClients } from './hooks/useClients';

// Constantes
import { CLIENT_STATUS, PERMISSIONS, hasPermission } from './utils/clientConstants';

const ClientManagement = () => {
    // Por ahora asumimos que el usuario es admin (puedes cambiar esto más tarde)
    const isAdmin = true; // Cambiar por tu lógica de roles si es necesario

    // Modal states
    const [selectedClient, setSelectedClient] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    // Search and filter states
    const [searchCriteria, setSearchCriteria] = useState({
        general: '',
        name: '',
        rut: '',
        phone: '',
        email: '',
        status: 'ALL',
        dateFrom: '',
        dateTo: ''
    });

    // Data hooks
    const {
        clients,
        loading,
        error,
        loadClients,
        createClient,
        updateClient,
        deleteClient,
        updateClientStatus,
        filterClients,
        clearError
    } = useClients();


    // Load clients on mount
    useEffect(() => {
        loadClients();
    }, [loadClients]);

    // Modal handlers
    const handleViewClient = (client) => {
        setSelectedClient(client);
        setShowDetailModal(true);
    };

    const handleEditClient = (client) => {
        if (!hasPermission(isAdmin ? 'admin' : 'user', PERMISSIONS.CLIENT.UPDATE)) {
            alert('No tiene permisos para editar clientes');
            return;
        }
        setSelectedClient(client);
        setShowEditModal(true);
    };

    const handleAddClient = () => {
        if (!hasPermission(isAdmin ? 'admin' : 'user', PERMISSIONS.CLIENT.CREATE)) {
            alert('No tiene permisos para crear clientes');
            return;
        }
        setShowAddModal(true);
    };

    const handleChangeStatus = (client) => {
        if (!hasPermission(isAdmin ? 'admin' : 'user', PERMISSIONS.CLIENT.CHANGE_STATUS)) {
            alert('No tiene permisos para cambiar el estado de clientes');
            return;
        }
        setSelectedClient(client);
        setShowStatusModal(true);
    };

    const closeAllModals = () => {
        setSelectedClient(null);
        setShowAddModal(false);
        setShowEditModal(false);
        setShowDetailModal(false);
        setShowStatusModal(false);
        if (clearError) clearError();
    };

    // CRUD handlers
    const handleCreateClient = async (clientData) => {
        try {
            await createClient(clientData);
            closeAllModals();
        } catch (error) {
            console.error('Error creating client:', error);
            // El error se maneja en el componente ClientForm
        }
    };

    const handleUpdateClient = async (clientId, clientData) => {
        try {
            await updateClient(clientId, clientData);
            closeAllModals();
        } catch (error) {
            console.error('Error updating client:', error);
        }
    };

    const handleStatusUpdate = async (clientId, newStatus, reason = '') => {
        try {
            await updateClientStatus(clientId, newStatus);
            closeAllModals();

            // Log del cambio de estado (podrías enviarlo a un servicio de auditoría)
            console.log(`Client ${clientId} status changed to ${newStatus}`, { reason });
        } catch (error) {
            console.error('Error updating client status:', error);
        }
    };

    const handleDeleteClient = async (client) => {
        if (!hasPermission(isAdmin ? 'admin' : 'user', PERMISSIONS.CLIENT.DELETE)) {
            alert('Solo administradores pueden eliminar clientes');
            return;
        }

        if (window.confirm('¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.')) {
            try {
                await deleteClient(client.id);
                closeAllModals();
            } catch (error) {
                console.error('Error deleting client:', error);
            }
        }
    };

    // Search handlers
    const handleSearch = (criteria) => {
        setSearchCriteria(criteria);
    };

    const handleClearSearch = () => {
        setSearchCriteria({
            general: '',
            name: '',
            rut: '',
            phone: '',
            email: '',
            status: 'ALL',
            dateFrom: '',
            dateTo: ''
        });
    };

    // Get filtered clients based on search criteria
    const getFilteredClients = () => {
        let filtered = [...clients];

        // Aplicar filtro general
        if (searchCriteria.general && searchCriteria.general.trim() !== '') {
            const term = searchCriteria.general.toLowerCase().trim();
            filtered = filtered.filter(client =>
                client.name?.toLowerCase().includes(term) ||
                client.rut?.toLowerCase().includes(term) ||
                client.email?.toLowerCase().includes(term) ||
                client.phone?.toLowerCase().includes(term)
            );
        }

        // Aplicar filtros específicos
        if (searchCriteria.name && searchCriteria.name.trim() !== '') {
            const term = searchCriteria.name.toLowerCase().trim();
            filtered = filtered.filter(client =>
                client.name?.toLowerCase().includes(term)
            );
        }

        if (searchCriteria.rut && searchCriteria.rut.trim() !== '') {
            const term = searchCriteria.rut.toLowerCase().trim();
            filtered = filtered.filter(client =>
                client.rut?.toLowerCase().includes(term)
            );
        }

        if (searchCriteria.phone && searchCriteria.phone.trim() !== '') {
            const term = searchCriteria.phone.toLowerCase().trim();
            filtered = filtered.filter(client =>
                client.phone?.toLowerCase().includes(term)
            );
        }

        if (searchCriteria.email && searchCriteria.email.trim() !== '') {
            const term = searchCriteria.email.toLowerCase().trim();
            filtered = filtered.filter(client =>
                client.email?.toLowerCase().includes(term)
            );
        }

        // Filtrar por estado
        if (searchCriteria.status && searchCriteria.status !== 'ALL') {
            filtered = filtered.filter(client => client.status === searchCriteria.status);
        }

        // TODO: Implementar filtros de fecha cuando tengamos campos de fecha en el backend

        return filtered;
    };

    const filteredClients = getFilteredClients();

    // Calculate stats for display
    const displayStats = {
        totalClients: clients?.length || 0,
        activeClients: clients?.filter(client => client.status === CLIENT_STATUS.ACTIVE).length || 0,
        restrictedClients: clients?.filter(client => client.status === CLIENT_STATUS.RESTRICTED).length || 0,
    };

    return (
        <div className="p-6 bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Gestión de Clientes
                        </h1>
                        <p className="text-gray-400">
                            Administra la información y estados de los clientes
                        </p>
                    </div>

                    {/* Botón agregar - Solo para usuarios con permisos */}
                    {hasPermission(isAdmin ? 'admin' : 'user', PERMISSIONS.CLIENT.CREATE) && (
                        <button
                            onClick={handleAddClient}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                        >
                            <Plus size={20} />
                            Nuevo Cliente
                        </button>
                    )}
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Total Clientes</p>
                                <p className="text-3xl font-bold text-white">{displayStats.totalClients}</p>
                            </div>
                            <div className="bg-blue-500/20 p-3 rounded-lg">
                                <Users className="text-blue-400" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Activos</p>
                                <p className="text-3xl font-bold text-green-400">{displayStats.activeClients}</p>
                            </div>
                            <div className="bg-green-500/20 p-3 rounded-lg">
                                <UserCheck className="text-green-400" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Restringidos</p>
                                <p className="text-3xl font-bold text-red-400">{displayStats.restrictedClients}</p>
                            </div>
                            <div className="bg-red-500/20 p-3 rounded-lg">
                                <UserX className="text-red-400" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Component */}
                <ClientSearch
                    onSearch={handleSearch}
                    onClear={handleClearSearch}
                />
            </div>

            {/* Results summary */}
            {filteredClients.length !== clients.length && (
                <div className="mb-4 text-gray-400 text-sm">
                    Mostrando {filteredClients.length} de {clients.length} clientes
                </div>
            )}

            {/* Main Client List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <span className="ml-4 text-gray-400">Cargando clientes...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <p className="text-red-400 mb-2">Error al cargar clientes: {error}</p>
                            <button
                                onClick={loadClients}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Intentar nuevamente
                            </button>
                        </div>
                    </div>
                ) : (
                    <ClientList
                        clients={filteredClients}
                        onViewClient={handleViewClient}
                        onEditClient={handleEditClient}
                        onChangeStatus={handleChangeStatus}
                        onDeleteClient={handleDeleteClient}
                        isAdmin={isAdmin}
                    />
                )}
            </div>

            {/* Modals */}
            {showAddModal && (
                <ClientForm
                    mode="create"
                    onClose={closeAllModals}
                    onSubmit={handleCreateClient}
                />
            )}

            {showEditModal && selectedClient && (
                <ClientForm
                    mode="edit"
                    client={selectedClient}
                    onClose={closeAllModals}
                    onSubmit={(data) => handleUpdateClient(selectedClient.id, data)}
                />
            )}

            {showDetailModal && selectedClient && (
                <ClientDetail
                    client={selectedClient}
                    isOpen={showDetailModal}
                    onClose={closeAllModals}
                />
            )}

            {showStatusModal && selectedClient && (
                <ClientStatus
                    client={selectedClient}
                    isOpen={showStatusModal}
                    onClose={closeAllModals}
                    onConfirm={handleStatusUpdate}
                    isLoading={loading}
                />
            )}
        </div>
    );
};

export default ClientManagement;
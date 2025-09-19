import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, UserCheck, UserX, Filter } from 'lucide-react';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import { useClients } from './hooks/useClients';

const ClientManagement = () => {
    // Por ahora asumimos que el usuario es admin (puedes cambiar esto más tarde)
    const isAdmin = true; // Cambiar por tu lógica de roles si es necesario

    // Modal states
    const [selectedClient, setSelectedClient] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);

    // Data hooks - Sin keycloak por ahora
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
    } = useClients(); // Removido keycloak parameter

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
        setSelectedClient(client);
        setShowEditModal(true);
    };

    const handleAddClient = () => {
        setShowAddModal(true);
    };

    const handleChangeStatus = (client) => {
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

    const handleStatusUpdate = async (clientId, newStatus) => {
        try {
            await updateClientStatus(clientId, newStatus);
            closeAllModals();
        } catch (error) {
            console.error('Error updating client status:', error);
        }
    };

    const handleDeleteClient = async (client) => {
        if (!isAdmin) {
            alert('Solo administradores pueden eliminar clientes');
            return;
        }

        if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
            try {
                await deleteClient(client.id);
                closeAllModals();
            } catch (error) {
                console.error('Error deleting client:', error);
            }
        }
    };

    // Get filtered clients for display
    const filteredClients = filterClients(searchTerm, statusFilter);

    // Simple stats calculation for display
    const displayStats = {
        totalClients: clients?.length || 0,
        activeClients: clients?.filter(client => client.status === 'ACTIVE').length || 0,
        restrictedClients: clients?.filter(client => client.status === 'RESTRICTED').length || 0,
    };

    return (
        <div className="p-6 bg-gray-900 min-h-screen">
            {/* Header moderno */}
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

                    {/* Botón agregar - Solo para admin */}
                    {isAdmin && (
                        <button
                            onClick={handleAddClient}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                        >
                            <Plus size={20} />
                            Nuevo Cliente
                        </button>
                    )}
                </div>

                {/* Stats cards modernas */}
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

                {/* Search and filters modernos */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search bar */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, RUT, email o teléfono..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>

                        {/* Status filter */}
                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                <option value="ALL">Todos los estados</option>
                                <option value="ACTIVE">Activos</option>
                                <option value="RESTRICTED">Restringidos</option>
                            </select>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:bg-gray-600 transition-colors duration-200"
                            >
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Filtros avanzados (colapsibles) */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Fecha registro desde
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Fecha registro hasta
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                                        Aplicar Filtros
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
                                className="text-blue-400 hover:text-blue-300"
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
        </div>
    );
};

export default ClientManagement;
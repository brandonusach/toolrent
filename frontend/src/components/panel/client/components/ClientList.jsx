import React from 'react';
import { Eye, Edit, Trash2, UserX } from 'lucide-react';

const ClientList = ({
                        clients = [],
                        onViewClient,
                        onEditClient,
                        onDeleteClient,
                        isAdmin = false
                    }) => {

    const getStatusBadge = (status) => {
        const statusStyles = {
            ACTIVE: 'bg-green-500/20 text-green-400 border border-green-500/30',
            RESTRICTED: 'bg-red-500/20 text-red-400 border border-red-500/30',
        };

        const statusLabels = {
            ACTIVE: 'Activo',
            RESTRICTED: 'Restringido',
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.RESTRICTED}`}>
                {statusLabels[status] || status}
            </span>
        );
    };

    const formatRUT = (rut) => {
        if (!rut) return 'Sin RUT';
        // El RUT ya viene formateado del backend
        return rut;
    };

    const formatPhone = (phone) => {
        if (!phone) return 'Sin teléfono';
        // Formatear teléfono chileno para mostrar
        const cleanPhone = phone.replace(/^\+56/, '');
        if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
            return `+56 ${cleanPhone.substring(0, 1)} ${cleanPhone.substring(1, 5)} ${cleanPhone.substring(5)}`;
        } else if (cleanPhone.length === 8) {
            return `+56 ${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 6)} ${cleanPhone.substring(6)}`;
        }
        return phone;
    };

    if (!clients || clients.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="mb-4">
                    <UserX className="mx-auto h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                    No hay clientes disponibles
                </h3>
                <p className="text-gray-400">
                    No se encontraron clientes que coincidan con los criterios de búsqueda.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            {/* Header de la tabla */}
            <div className="bg-gray-750 px-6 py-4 border-b border-gray-600">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-300 uppercase tracking-wide">
                    <div className="col-span-3">Cliente</div>
                    <div className="col-span-2">RUT</div>
                    <div className="col-span-3">Contacto</div>
                    <div className="col-span-2">Estado</div>
                    <div className="col-span-2 text-right">Acciones</div>
                </div>
            </div>

            {/* Lista de clientes */}
            <div className="divide-y divide-gray-700">
                {clients.map((client) => (
                    <div
                        key={client.id}
                        className="px-6 py-4 hover:bg-gray-700/30 transition-colors duration-200"
                    >
                        <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Información del cliente */}
                            <div className="col-span-3">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-semibold">
                                                {client.name ? client.name.substring(0, 2).toUpperCase() : 'CL'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-white font-medium">
                                            {client.name}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            ID: {client.id}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* RUT */}
                            <div className="col-span-2">
                                <p className="text-white font-mono">
                                    {formatRUT(client.rut)}
                                </p>
                            </div>

                            {/* Contacto */}
                            <div className="col-span-3">
                                <p className="text-white text-sm">
                                    {formatPhone(client.phone)}
                                </p>
                                <p className="text-gray-400 text-sm">
                                    {client.email}
                                </p>
                            </div>

                            {/* Estado */}
                            <div className="col-span-2">
                                {getStatusBadge(client.status)}
                            </div>

                            {/* Acciones */}
                            <div className="col-span-2 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                    {/* Ver detalles */}
                                    <button
                                        onClick={() => onViewClient(client)}
                                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                        title="Ver detalles"
                                    >
                                        <Eye size={16} />
                                    </button>

                                    {/* Editar - solo admin */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => onEditClient(client)}
                                            className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                            title="Editar cliente"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    )}


                                    {/* Eliminar - solo admin */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => onDeleteClient(client)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                            title="Eliminar cliente"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientList;
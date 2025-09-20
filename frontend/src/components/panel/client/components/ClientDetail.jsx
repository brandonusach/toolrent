import React from 'react';
import { X, User, Hash, Phone, Mail, Calendar, Shield, MapPin } from 'lucide-react';

const ClientDetail = ({ client, isOpen, onClose }) => {
    if (!isOpen || !client) return null;

    const formatRUT = (rut) => {
        if (!rut) return 'Sin RUT';
        return rut;
    };

    const formatPhone = (phone) => {
        if (!phone) return 'Sin teléfono';
        const cleanPhone = phone.replace(/^\+56/, '');
        if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
            return `+56 ${cleanPhone.substring(0, 1)} ${cleanPhone.substring(1, 5)} ${cleanPhone.substring(5)}`;
        } else if (cleanPhone.length === 8) {
            return `+56 ${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 6)} ${cleanPhone.substring(6)}`;
        }
        return phone;
    };

    const getStatusInfo = (status) => {
        const statusConfig = {
            ACTIVE: {
                color: 'text-green-400',
                bgColor: 'bg-green-500/20',
                borderColor: 'border-green-500/30',
                label: 'Cliente Activo',
                description: 'Cliente habilitado para realizar transacciones'
            },
            RESTRICTED: {
                color: 'text-red-400',
                bgColor: 'bg-red-500/20',
                borderColor: 'border-red-500/30',
                label: 'Cliente Restringido',
                description: 'Cliente con restricciones por atrasos en pagos'
            }
        };
        return statusConfig[status] || statusConfig.RESTRICTED;
    };

    const statusInfo = getStatusInfo(client.status);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg font-semibold">
                                {client.name ? client.name.substring(0, 2).toUpperCase() : 'CL'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {client.name}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                ID: {client.id}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Card */}
                    <div className={`p-4 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                        <div className="flex items-center space-x-3 mb-2">
                            <Shield className={statusInfo.color} size={20} />
                            <h3 className={`font-semibold ${statusInfo.color}`}>
                                {statusInfo.label}
                            </h3>
                        </div>
                        <p className="text-gray-300 text-sm">
                            {statusInfo.description}
                        </p>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <User className="mr-2" size={20} />
                            Información Personal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Nombre Completo
                                </label>
                                <p className="text-white">{client.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    RUT
                                </label>
                                <p className="text-white font-mono">{formatRUT(client.rut)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Phone className="mr-2" size={20} />
                            Información de Contacto
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Teléfono
                                </label>
                                <p className="text-white">{formatPhone(client.phone)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Email
                                </label>
                                <p className="text-white break-all">{client.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Account Activity - Placeholder for future features */}
                    <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Calendar className="mr-2" size={20} />
                            Actividad de la Cuenta
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-400">0</p>
                                <p className="text-sm text-gray-400">Préstamos Activos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-400">0</p>
                                <p className="text-sm text-gray-400">Préstamos Completados</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-400">0</p>
                                <p className="text-sm text-gray-400">Días de Retraso</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-gray-600/30 rounded-lg">
                            <p className="text-sm text-gray-400 text-center">
                                Historial de préstamos disponible próximamente
                            </p>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <MapPin className="mr-2" size={20} />
                            Información Adicional
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Fecha de registro:</span>
                                <span className="text-white">Información no disponible</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Última actualización:</span>
                                <span className="text-white">Información no disponible</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Cliente desde:</span>
                                <span className="text-white">Información no disponible</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-700 bg-gray-750 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientDetail;
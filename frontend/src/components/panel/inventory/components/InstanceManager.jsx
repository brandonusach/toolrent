// inventory/components/InstanceManager.jsx - PURE VERSION
import React, { useState, useEffect } from 'react';
import { X, Package, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

const InstanceManager = ({ tool, onClose, onInstanceUpdate }) => {
    const [instances, setInstances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const API_BASE = 'http://localhost:8081/api';

    useEffect(() => {
        if (tool?.id) {
            loadInstances();
        }
    }, [tool]);

    // Handle overlay click to close modal
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle escape key to close
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const loadInstances = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/tool-instances/tool/${tool.id}`);
            if (response.ok) {
                const data = await response.json();
                setInstances(Array.isArray(data) ? data : []);
            } else {
                console.error('Error loading instances:', response.status);
                setInstances([]);
                if (response.status !== 404) {
                    alert('Error al cargar instancias de herramientas');
                }
            }
        } catch (error) {
            console.error('Error loading instances:', error);
            setInstances([]);
            alert('Error de conexión al cargar instancias');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (instanceId, newStatus) => {
        setUpdating(true);
        try {
            const response = await fetch(`${API_BASE}/tool-instances/${instanceId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                await loadInstances();
                onInstanceUpdate(); // Update main inventory
                alert('Estado actualizado exitosamente');
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteInstance = async (instanceId) => {
        if (!window.confirm('¿Está seguro de eliminar esta instancia permanentemente?')) {
            return;
        }

        setUpdating(true);
        try {
            const response = await fetch(`${API_BASE}/tool-instances/${instanceId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadInstances();
                onInstanceUpdate(); // Update main inventory
                alert('Instancia eliminada exitosamente');
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            console.error('Error deleting instance:', error);
            alert('Error al eliminar la instancia');
        } finally {
            setUpdating(false);
        }
    };

    // Simple status display functions (no business logic)
    const getStatusColor = (status) => {
        const colors = {
            'AVAILABLE': 'bg-green-900 text-green-300',
            'LOANED': 'bg-blue-900 text-blue-300',
            'UNDER_REPAIR': 'bg-yellow-900 text-yellow-300',
            'DECOMMISSIONED': 'bg-red-900 text-red-300'
        };
        return colors[status] || 'bg-gray-900 text-gray-300';
    };

    const getStatusText = (status) => {
        const labels = {
            'AVAILABLE': 'Disponible',
            'LOANED': 'Prestada',
            'UNDER_REPAIR': 'En Reparación',
            'DECOMMISSIONED': 'Dada de Baja'
        };
        return labels[status] || status;
    };

    // Simple counting function (no business logic)
    const getStatusCounts = () => {
        const counts = {
            AVAILABLE: 0,
            LOANED: 0,
            UNDER_REPAIR: 0,
            DECOMMISSIONED: 0
        };

        instances.forEach(instance => {
            counts[instance.status] = (counts[instance.status] || 0) + 1;
        });

        return counts;
    };

    const statusCounts = getStatusCounts();

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleOverlayClick}
        >
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-hidden relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-white">
                            Instancias de: {tool?.name}
                        </h3>
                        <p className="text-gray-400 mt-1">
                            Total: {instances.length} instancias - Stock Actual: {tool?.currentStock || 0}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={loadInstances}
                            disabled={loading || updating}
                            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                            title="Actualizar"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg z-10"
                            title="Cerrar"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-900 bg-opacity-30 rounded-lg p-3">
                        <div className="text-green-400 font-bold text-lg">{statusCounts.AVAILABLE}</div>
                        <div className="text-green-300 text-sm">Disponibles</div>
                    </div>
                    <div className="bg-blue-900 bg-opacity-30 rounded-lg p-3">
                        <div className="text-blue-400 font-bold text-lg">{statusCounts.LOANED}</div>
                        <div className="text-blue-300 text-sm">Prestadas</div>
                    </div>
                    <div className="bg-yellow-900 bg-opacity-30 rounded-lg p-3">
                        <div className="text-yellow-400 font-bold text-lg">{statusCounts.UNDER_REPAIR}</div>
                        <div className="text-yellow-300 text-sm">En Reparación</div>
                    </div>
                    <div className="bg-red-900 bg-opacity-30 rounded-lg p-3">
                        <div className="text-red-400 font-bold text-lg">{statusCounts.DECOMMISSIONED}</div>
                        <div className="text-red-300 text-sm">Dadas de Baja</div>
                    </div>
                </div>

                {/* Instance List */}
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 300px)' }}>
                    {loading ? (
                        <div className="text-center py-8">
                            <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                            <p className="text-gray-400">Cargando instancias...</p>
                        </div>
                    ) : instances.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">No hay instancias registradas</p>
                            <p className="text-gray-500 text-sm mt-2">
                                Las instancias se crean automáticamente al agregar stock
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {instances.map((instance) => (
                                <div
                                    key={instance.id}
                                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
                                >
                                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-3 lg:space-y-0">
                                        {/* Instance Information */}
                                        <div className="flex items-center space-x-4">
                                            <div>
                                                <p className="text-white font-medium">
                                                    ID: #{instance.id}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    Instancia individual de herramienta
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status and Actions */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                            {/* Status Selector */}
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-300">Estado:</span>
                                                <select
                                                    value={instance.status}
                                                    onChange={(e) => handleUpdateStatus(instance.id, e.target.value)}
                                                    disabled={updating}
                                                    className="text-xs px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
                                                >
                                                    <option value="AVAILABLE">Disponible</option>
                                                    <option value="LOANED">Prestada</option>
                                                    <option value="UNDER_REPAIR">En Reparación</option>
                                                    <option value="DECOMMISSIONED">Dada de Baja</option>
                                                </select>
                                            </div>

                                            {/* Current Status Badge */}
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
                                                {getStatusText(instance.status)}
                                            </span>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDeleteInstance(instance.id)}
                                                disabled={updating}
                                                className="text-red-400 hover:text-red-300 p-1 rounded transition-colors disabled:opacity-50"
                                                title="Eliminar Instancia"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Loan Warning */}
                                    {instance.status === 'LOANED' && (
                                        <div className="flex items-center mt-3 p-2 bg-blue-900 bg-opacity-30 rounded">
                                            <AlertTriangle className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                                            <span className="text-blue-300 text-xs">
                                                Esta instancia está actualmente prestada
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-sm text-gray-400 space-y-1 sm:space-y-0">
                        <span>
                            {instances.length > 0 && `Mostrando ${instances.length} instancia${instances.length !== 1 ? 's' : ''}`}
                        </span>
                        <span>
                            Última actualización: {new Date().toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstanceManager;
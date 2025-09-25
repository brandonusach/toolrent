// loans/components/LoanForm.jsx - Formulario para crear préstamos con validación visual
import React, { useState, useEffect } from 'react';
import { X, User, Wrench, Calendar, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import httpClient from "../../../../http-common";
import ToolAvailability from './ToolAvailability';
import ClientValidation from './ClientValidation';

const LoanForm = ({ onSubmit, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        clientId: '',
        toolId: '',
        quantity: 1,
        agreedReturnDate: '',
        notes: ''
    });

    const [clients, setClients] = useState([]);
    const [tools, setTools] = useState([]);
    const [toolAvailability, setToolAvailability] = useState(null);
    const [clientValidation, setClientValidation] = useState(null);
    const [comprehensiveValidation, setComprehensiveValidation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState('');

    // Cargar datos iniciales
    useEffect(() => {
        loadClients();
        loadTools();
    }, []);

    // Validar cuando cambien los parámetros principales
    useEffect(() => {
        if (formData.clientId && formData.toolId && formData.quantity) {
            validateComprehensive();
        } else {
            setComprehensiveValidation(null);
        }
    }, [formData.clientId, formData.toolId, formData.quantity]);

    const loadClients = async () => {
        try {
            const response = await httpClient.get('/api/v1/clients/');
            const activeClients = response.data.filter(client => client.status === 'ACTIVE');
            setClients(activeClients);
        } catch (err) {
            console.error('Error loading clients:', err);
        }
    };

    const loadTools = async () => {
        try {
            const response = await httpClient.get('/api/v1/tools/');
            const availableTools = response.data.filter(tool =>
                tool.status === 'AVAILABLE' && tool.currentStock > 0
            );
            setTools(availableTools);
        } catch (err) {
            console.error('Error loading tools:', err);
        }
    };

    const validateComprehensive = async () => {
        setValidating(true);
        try {
            const response = await httpClient.post('/api/v1/loans/validate-comprehensive', {
                clientId: parseInt(formData.clientId),
                toolId: parseInt(formData.toolId),
                quantity: parseInt(formData.quantity)
            });
            setComprehensiveValidation(response.data);
        } catch (err) {
            console.error('Error validating loan:', err);
            setComprehensiveValidation(null);
        } finally {
            setValidating(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleToolAvailabilityChange = (availability) => {
        setToolAvailability(availability);
    };

    const handleClientValidationChange = (validation) => {
        setClientValidation(validation);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!comprehensiveValidation?.canCreateLoan) {
            setError('No se puede crear el préstamo. Revisa las validaciones.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const loanData = {
                clientId: parseInt(formData.clientId),
                toolId: parseInt(formData.toolId),
                quantity: parseInt(formData.quantity),
                agreedReturnDate: formData.agreedReturnDate,
                notes: formData.notes.trim()
            };

            await onSubmit(loanData);
            onSuccess();
        } catch (err) {
            console.error('Error creating loan:', err);
            setError(err.message || 'Error al crear el préstamo');
        } finally {
            setLoading(false);
        }
    };

    const getValidationIcon = (isValid) => {
        if (validating) return <Loader className="h-4 w-4 animate-spin text-orange-400" />;
        return isValid ?
            <CheckCircle className="h-4 w-4 text-green-400" /> :
            <AlertCircle className="h-4 w-4 text-red-400" />;
    };

    const selectedClient = clients.find(c => c.id === parseInt(formData.clientId));
    const selectedTool = tools.find(t => t.id === parseInt(formData.toolId));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Crear Nuevo Préstamo</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Columna izquierda - Formulario */}
                        <div className="space-y-6">
                            {/* Cliente */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <User className="h-4 w-4 inline mr-1" />
                                    Cliente
                                </label>
                                <select
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="">Seleccionar cliente...</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.name} - {client.email}
                                        </option>
                                    ))}
                                </select>
                                {selectedClient && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        Estado: {selectedClient.status} | Teléfono: {selectedClient.phone || 'N/A'}
                                    </p>
                                )}
                            </div>

                            {/* Herramienta */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <Wrench className="h-4 w-4 inline mr-1" />
                                    Herramienta
                                </label>
                                <select
                                    name="toolId"
                                    value={formData.toolId}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="">Seleccionar herramienta...</option>
                                    {tools.map(tool => (
                                        <option key={tool.id} value={tool.id}>
                                            {tool.name} - Stock: {tool.currentStock} - ${tool.replacementValue}
                                        </option>
                                    ))}
                                </select>
                                {selectedTool && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        Categoría: {selectedTool.category} | Estado: {selectedTool.status}
                                    </p>
                                )}
                            </div>

                            {/* Cantidad */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    min="1"
                                    max={selectedTool?.currentStock || 1}
                                    required
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                {selectedTool && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        Máximo disponible: {selectedTool.currentStock}
                                    </p>
                                )}
                            </div>

                            {/* Fecha de devolución acordada */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <Calendar className="h-4 w-4 inline mr-1" />
                                    Fecha de Devolución Acordada
                                </label>
                                <input
                                    type="date"
                                    name="agreedReturnDate"
                                    value={formData.agreedReturnDate}
                                    onChange={handleInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <FileText className="h-4 w-4 inline mr-1" />
                                    Notas (Opcional)
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Información adicional sobre el préstamo..."
                                />
                            </div>
                        </div>

                        {/* Columna derecha - Validaciones */}
                        <div className="space-y-6">
                            {/* Validación del cliente */}
                            {formData.clientId && (
                                <ClientValidation
                                    clientId={parseInt(formData.clientId)}
                                    onValidationChange={handleClientValidationChange}
                                />
                            )}

                            {/* Disponibilidad de herramienta */}
                            {formData.toolId && (
                                <ToolAvailability
                                    toolId={parseInt(formData.toolId)}
                                    quantity={parseInt(formData.quantity)}
                                    clientId={formData.clientId ? parseInt(formData.clientId) : null}
                                    onAvailabilityChange={handleToolAvailabilityChange}
                                />
                            )}
                        </div>
                    </div>

                    {/* Validación comprensiva */}
                    {comprehensiveValidation && (
                        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                            <h3 className="text-sm font-medium text-white mb-3">Resumen de Validación</h3>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    {getValidationIcon(comprehensiveValidation.clientEligible)}
                                    <span className={`ml-2 text-sm ${
                                        comprehensiveValidation.clientEligible ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        Cliente elegible
                                    </span>
                                    {comprehensiveValidation.clientIssue && (
                                        <span className="ml-2 text-xs text-gray-400">
                                            - {comprehensiveValidation.clientIssue}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center">
                                    {getValidationIcon(comprehensiveValidation.toolAvailable)}
                                    <span className={`ml-2 text-sm ${
                                        comprehensiveValidation.toolAvailable ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        Herramienta disponible
                                    </span>
                                    {comprehensiveValidation.toolIssue && (
                                        <span className="ml-2 text-xs text-gray-400">
                                            - {comprehensiveValidation.toolIssue}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center">
                                    {getValidationIcon(!comprehensiveValidation.hasExistingLoanForTool)}
                                    <span className={`ml-2 text-sm ${
                                        !comprehensiveValidation.hasExistingLoanForTool ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        Sin préstamo existente de esta herramienta
                                    </span>
                                </div>

                                {comprehensiveValidation.currentDailyRate && (
                                    <div className="text-sm text-gray-300 mt-3 p-3 bg-gray-600 rounded">
                                        <strong>Tarifa diaria:</strong> ${comprehensiveValidation.currentDailyRate} |{' '}
                                        <strong>Multa por atraso:</strong> ${comprehensiveValidation.currentLateFeeRate}/día
                                    </div>
                                )}

                                {/* Estado final */}
                                <div className={`mt-4 p-3 rounded-lg border ${
                                    comprehensiveValidation.canCreateLoan
                                        ? 'bg-green-900 border-green-700'
                                        : 'bg-red-900 border-red-700'
                                }`}>
                                    <div className="flex items-center">
                                        {comprehensiveValidation.canCreateLoan ? (
                                            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                                        )}
                                        <span className={`font-medium ${
                                            comprehensiveValidation.canCreateLoan ? 'text-green-200' : 'text-red-200'
                                        }`}>
                                            {comprehensiveValidation.canCreateLoan
                                                ? 'Préstamo puede ser creado'
                                                : 'No se puede crear el préstamo'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-900 border border-red-700 rounded-md p-3">
                            <div className="flex items-center">
                                <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                                <span className="text-red-200 text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !comprehensiveValidation?.canCreateLoan || validating}
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                            {loading && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                            {loading ? 'Creando...' : 'Crear Préstamo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoanForm;
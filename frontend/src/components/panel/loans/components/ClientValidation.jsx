// loans/components/ClientValidation.jsx - Validar eligibilidad del cliente
import React, { useState, useEffect } from 'react';
import {
    User,
    AlertTriangle,
    CheckCircle,
    XCircle,
    DollarSign,
    Clock,
    Loader,
    Shield,
    FileText,
    Calendar
} from 'lucide-react';
import { useLoans } from '../hooks/useLoans';
import { useFines } from '../hooks/useFines';

const ClientValidation = ({ clientId, onValidationChange }) => {
    const { checkClientRestrictions } = useLoans();
    const { checkClientRestrictions: checkFineRestrictions } = useFines();

    const [validation, setValidation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (clientId) {
            validateClient();
        } else {
            setValidation(null);
            if (onValidationChange) {
                onValidationChange(null);
            }
        }
    }, [clientId]);

    const validateClient = async () => {
        setLoading(true);
        setError('');
        try {
            // Obtener restricciones de préstamos
            const loanRestrictions = await checkClientRestrictions(clientId);

            // Obtener restricciones de multas
            const fineRestrictions = await checkFineRestrictions(clientId);

            // Combinar información
            const combinedValidation = {
                eligible: loanRestrictions.eligible && fineRestrictions.canRequestLoan,
                canRequestLoan: loanRestrictions.eligible && fineRestrictions.canRequestLoan,
                loanRestrictions,
                fineRestrictions,
                summary: generateValidationSummary(loanRestrictions, fineRestrictions)
            };

            setValidation(combinedValidation);

            if (onValidationChange) {
                onValidationChange(combinedValidation);
            }
        } catch (err) {
            console.error('Error validating client:', err);
            setError(err.message || 'Error al validar el cliente');
        } finally {
            setLoading(false);
        }
    };

    const generateValidationSummary = (loanRestrictions, fineRestrictions) => {
        const issues = [];
        const warnings = [];
        const info = [];

        // Verificar estado del cliente
        if (fineRestrictions.isRestricted) {
            issues.push({
                type: 'error',
                icon: XCircle,
                title: 'Cliente Restringido',
                description: 'El cliente tiene restricciones activas',
                details: fineRestrictions.restrictionReason
            });
        }

        // Verificar multas impagas
        if (fineRestrictions.hasUnpaidFines) {
            issues.push({
                type: 'error',
                icon: DollarSign,
                title: 'Multas Pendientes',
                description: `${fineRestrictions.unpaidFinesCount} multa(s) por $${fineRestrictions.totalUnpaidAmount.toFixed(2)}`,
                details: 'Debe pagar todas las multas antes de solicitar préstamos'
            });
        }

        // Verificar préstamos activos
        if (loanRestrictions.currentActiveLoans) {
            const remaining = loanRestrictions.remainingLoanSlots;
            if (remaining <= 1) {
                warnings.push({
                    type: 'warning',
                    icon: AlertTriangle,
                    title: 'Límite de Préstamos',
                    description: `${loanRestrictions.currentActiveLoans} de 5 préstamos activos`,
                    details: `Solo puede solicitar ${remaining} préstamo(s) más`
                });
            } else {
                info.push({
                    type: 'info',
                    icon: Clock,
                    title: 'Préstamos Activos',
                    description: `${loanRestrictions.currentActiveLoans} de 5 préstamos activos`,
                    details: `Puede solicitar ${remaining} préstamo(s) más`
                });
            }
        }

        // Multas vencidas
        if (fineRestrictions.overdueFinesCount > 0) {
            issues.push({
                type: 'error',
                icon: Calendar,
                title: 'Multas Vencidas',
                description: `${fineRestrictions.overdueFinesCount} multa(s) vencida(s)`,
                details: 'Las multas vencidas requieren atención inmediata'
            });
        }

        // Si no hay problemas
        if (issues.length === 0 && warnings.length === 0) {
            info.push({
                type: 'success',
                icon: CheckCircle,
                title: 'Cliente Elegible',
                description: 'El cliente cumple todos los requisitos',
                details: 'Puede procesar préstamos sin restricciones'
            });
        }

        return { issues, warnings, info };
    };

    const getStatusColor = (type) => {
        const colors = {
            success: 'text-green-400 bg-green-900 border-green-700',
            warning: 'text-yellow-400 bg-yellow-900 border-yellow-700',
            error: 'text-red-400 bg-red-900 border-red-700',
            info: 'text-blue-400 bg-blue-900 border-blue-700'
        };
        return colors[type] || colors.info;
    };

    const renderValidationItem = (item) => {
        const Icon = item.icon;
        const colorClasses = getStatusColor(item.type);

        return (
            <div key={item.title} className={`rounded-lg p-4 border ${colorClasses}`}>
                <div className="flex items-start">
                    <Icon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h4 className="font-medium text-white">{item.title}</h4>
                        <p className="text-sm mt-1 opacity-90">{item.description}</p>
                        {item.details && (
                            <p className="text-xs mt-2 opacity-75">{item.details}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (!clientId) {
        return (
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center text-gray-400">
                    <User className="h-5 w-5 mr-2" />
                    <span>Seleccione un cliente para validar su elegibilidad</span>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center text-gray-300">
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    <span>Validando elegibilidad del cliente...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900 rounded-lg p-4 border border-red-700">
                <div className="flex items-center text-red-200">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span>Error: {error}</span>
                </div>
            </div>
        );
    }

    if (!validation) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Header de validación */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-gray-400" />
                        <h3 className="text-lg font-medium text-white">Validación de Cliente</h3>
                    </div>
                    <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                        validation.eligible
                            ? 'bg-green-900 text-green-200 border-green-700'
                            : 'bg-red-900 text-red-200 border-red-700'
                    }`}>
                        {validation.eligible ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                        ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                        )}
                        {validation.eligible ? 'Elegible' : 'No Elegible'}
                    </div>
                </div>
            </div>

            {/* Resumen rápido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Estado del cliente */}
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <div className="text-gray-400 text-sm">Estado del Cliente</div>
                    <div className={`text-lg font-medium ${
                        validation.fineRestrictions.isRestricted ? 'text-red-400' : 'text-green-400'
                    }`}>
                        {validation.fineRestrictions.clientStatus || 'ACTIVE'}
                    </div>
                </div>

                {/* Préstamos activos */}
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <div className="text-gray-400 text-sm">Préstamos Activos</div>
                    <div className="text-lg font-medium text-white">
                        {validation.loanRestrictions.currentActiveLoans || 0} / 5
                    </div>
                </div>

                {/* Multas pendientes */}
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <div className="text-gray-400 text-sm">Total Multas</div>
                    <div className={`text-lg font-medium ${
                        validation.fineRestrictions.totalUnpaidAmount > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                        ${validation.fineRestrictions.totalUnpaidAmount?.toFixed(2) || '0.00'}
                    </div>
                </div>
            </div>

            {/* Validación detallada */}
            <div className="space-y-3">
                {/* Errores/Problemas */}
                {validation.summary.issues.map(item => renderValidationItem(item))}

                {/* Advertencias */}
                {validation.summary.warnings.map(item => renderValidationItem(item))}

                {/* Información */}
                {validation.summary.info.map(item => renderValidationItem(item))}
            </div>

            {/* Información adicional */}
            {(validation.fineRestrictions.unpaidFines && validation.fineRestrictions.unpaidFines.length > 0) && (
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-white font-medium mb-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Multas Pendientes de Pago
                    </h4>
                    <div className="space-y-2">
                        {validation.fineRestrictions.unpaidFines.map((fine, index) => (
                            <div key={index} className="bg-gray-600 rounded p-3 text-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-white font-medium">
                                            ${fine.amount?.toFixed(2)} - {fine.type}
                                        </div>
                                        <div className="text-gray-300">{fine.description}</div>
                                        <div className="text-gray-400 text-xs mt-1">
                                            Vence: {fine.dueDate ? new Date(fine.dueDate).toLocaleDateString('es-ES') : 'N/A'}
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs ${
                                        fine.dueDate && new Date(fine.dueDate) < new Date()
                                            ? 'bg-red-900 text-red-200'
                                            : 'bg-yellow-900 text-yellow-200'
                                    }`}>
                                        {fine.dueDate && new Date(fine.dueDate) < new Date() ? 'Vencida' : 'Pendiente'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Acciones recomendadas */}
            {!validation.eligible && (
                <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
                    <h4 className="text-blue-200 font-medium mb-2">Acciones Recomendadas:</h4>
                    <ul className="text-blue-300 text-sm space-y-1">
                        {validation.fineRestrictions.hasUnpaidFines && (
                            <li>• Gestionar el pago de las multas pendientes</li>
                        )}
                        {validation.fineRestrictions.isRestricted && (
                            <li>• Contactar al administrador para revisar las restricciones del cliente</li>
                        )}
                        {validation.fineRestrictions.overdueFinesCount > 0 && (
                            <li>• Priorizar el pago de multas vencidas</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ClientValidation;
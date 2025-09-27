// loans/components/ClientValidation.jsx - VERSION CORREGIDA para manejar errores del backend
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
    Calendar,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useLoans } from '../hooks/useLoans';
import { useFines } from '../hooks/useFines';

const ClientValidation = ({ clientId, onValidationChange }) => {
    const { getLoansByClient, checkClientRestrictions } = useLoans();
    const { getFinesByClient, getTotalUnpaidAmount, checkClientRestrictions: checkFineRestrictions } = useFines();

    const [validation, setValidation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('checking');

    useEffect(() => {
        if (clientId) {
            validateClient();
        } else {
            setValidation(null);
            setConnectionStatus('idle');
            if (onValidationChange) {
                onValidationChange(null);
            }
        }
    }, [clientId]);

    const validateClient = async () => {
        setLoading(true);
        setError('');
        setConnectionStatus('checking');

        try {
            console.log('Starting client validation for ID:', clientId);

            // Primer intento: usar el endpoint principal de restricciones
            let loanRestrictions = null;
            let fineRestrictions = null;
            let clientLoans = [];
            let clientFines = [];
            let totalUnpaid = 0;

            // Intentar obtener restricciones de préstamos
            try {
                console.log('Checking loan restrictions...');
                loanRestrictions = await checkClientRestrictions(clientId);
                console.log('Loan restrictions:', loanRestrictions);
                setConnectionStatus('connected');
            } catch (loanErr) {
                console.warn('Error checking loan restrictions:', loanErr.message);
                setConnectionStatus('partial');
            }

            // Intentar obtener préstamos del cliente
            try {
                console.log('Getting client loans...');
                clientLoans = await getLoansByClient(clientId);
                console.log('Client loans:', clientLoans.length);
            } catch (loansErr) {
                console.warn('Error getting client loans:', loansErr.message);
            }

            // Intentar obtener restricciones de multas
            try {
                console.log('Checking fine restrictions...');
                fineRestrictions = await checkFineRestrictions(clientId);
                console.log('Fine restrictions:', fineRestrictions);
            } catch (fineErr) {
                console.warn('Error checking fine restrictions:', fineErr.message);
                // Fallback: intentar obtener multas manualmente
                try {
                    clientFines = await getFinesByClient(clientId);
                    totalUnpaid = await getTotalUnpaidAmount(clientId);
                    fineRestrictions = {
                        canRequestLoan: clientFines.filter(f => !f.paid).length === 0,
                        hasUnpaidFines: clientFines.filter(f => !f.paid).length > 0,
                        unpaidFinesCount: clientFines.filter(f => !f.paid).length,
                        totalUnpaidAmount: totalUnpaid,
                        fallback: true
                    };
                } catch (fallbackErr) {
                    console.warn('Fallback fine check also failed:', fallbackErr.message);
                }
            }

            // Si no pudimos obtener restricciones de préstamos, hacer cálculo manual
            if (!loanRestrictions && clientLoans.length >= 0) {
                console.log('Creating fallback loan restrictions...');
                const activeLoans = clientLoans.filter(loan =>
                    loan.status === 'ACTIVE' || loan.status === 'active'
                );

                loanRestrictions = {
                    eligible: activeLoans.length < 5,
                    canRequestLoan: activeLoans.length < 5,
                    currentActiveLoans: activeLoans.length,
                    maxAllowedLoans: 5,
                    remainingLoanSlots: Math.max(0, 5 - activeLoans.length),
                    restriction: activeLoans.length >= 5 ? 'Cliente ha alcanzado el límite de préstamos activos' : null,
                    clientStatus: activeLoans.length >= 5 ? 'RESTRICTED' : 'ACTIVE',
                    fallback: true
                };
                setConnectionStatus('offline');
            }

            // Si no pudimos obtener restricciones de multas, asumir que no hay
            if (!fineRestrictions) {
                console.log('Creating fallback fine restrictions...');
                fineRestrictions = {
                    canRequestLoan: true,
                    hasUnpaidFines: false,
                    unpaidFinesCount: 0,
                    totalUnpaidAmount: 0,
                    isRestricted: false,
                    clientStatus: 'ACTIVE',
                    fallback: true,
                    message: 'No se pudieron verificar multas - asumiendo sin restricciones'
                };
            }

            // Combinar validación
            const combinedValidation = {
                eligible: (loanRestrictions?.eligible || false) && (fineRestrictions?.canRequestLoan || false),
                canRequestLoan: (loanRestrictions?.canRequestLoan || false) && (fineRestrictions?.canRequestLoan || false),
                loanRestrictions: loanRestrictions || {
                    eligible: false,
                    currentActiveLoans: 0,
                    maxAllowedLoans: 5,
                    restriction: 'No se pudo verificar estado de préstamos'
                },
                fineRestrictions: fineRestrictions,
                summary: generateValidationSummary(loanRestrictions, fineRestrictions),
                connectionStatus: connectionStatus,
                dataSource: {
                    loans: loanRestrictions?.fallback ? 'fallback' : 'api',
                    fines: fineRestrictions?.fallback ? 'fallback' : 'api'
                }
            };

            console.log('Final combined validation:', combinedValidation);
            setValidation(combinedValidation);

            if (onValidationChange) {
                onValidationChange(combinedValidation);
            }

        } catch (err) {
            console.error('Error in client validation:', err);
            setError(err.message || 'Error al validar el cliente');
            setConnectionStatus('error');

            // Validación de emergencia - permitir el préstamo pero con advertencia
            const emergencyValidation = {
                eligible: true, // Permitir en caso de error
                canRequestLoan: true,
                loanRestrictions: {
                    eligible: true,
                    currentActiveLoans: 0,
                    maxAllowedLoans: 5,
                    remainingLoanSlots: 5,
                    restriction: null,
                    clientStatus: 'UNKNOWN',
                    emergency: true
                },
                fineRestrictions: {
                    canRequestLoan: true,
                    hasUnpaidFines: false,
                    unpaidFinesCount: 0,
                    totalUnpaidAmount: 0,
                    emergency: true
                },
                summary: {
                    issues: [{
                        type: 'error',
                        icon: AlertTriangle,
                        title: 'Error de Validación',
                        description: 'No se pudo verificar completamente las restricciones',
                        details: 'Proceda con precaución - verifique manualmente si es necesario'
                    }],
                    warnings: [],
                    info: []
                },
                emergency: true,
                error: err.message
            };

            setValidation(emergencyValidation);
            if (onValidationChange) {
                onValidationChange(emergencyValidation);
            }
        } finally {
            setLoading(false);
        }
    };

    const generateValidationSummary = (loanRestrictions, fineRestrictions) => {
        const issues = [];
        const warnings = [];
        const info = [];

        if (!loanRestrictions || !fineRestrictions) {
            warnings.push({
                type: 'warning',
                icon: WifiOff,
                title: 'Validación Parcial',
                description: 'No se pudieron verificar todas las restricciones',
                details: 'Algunos servicios no están disponibles'
            });
            return { issues, warnings, info };
        }

        // Verificar restricciones de multas
        if (fineRestrictions.isRestricted || fineRestrictions.hasUnpaidFines) {
            issues.push({
                type: 'error',
                icon: DollarSign,
                title: 'Multas Pendientes',
                description: `${fineRestrictions.unpaidFinesCount || 0} multa(s) por $${(fineRestrictions.totalUnpaidAmount || 0).toFixed(2)}`,
                details: 'Debe pagar todas las multas antes de solicitar préstamos'
            });
        }

        // Verificar límite de préstamos
        if (loanRestrictions.currentActiveLoans) {
            const remaining = loanRestrictions.remainingLoanSlots || 0;
            if (remaining <= 1 && remaining > 0) {
                warnings.push({
                    type: 'warning',
                    icon: AlertTriangle,
                    title: 'Límite de Préstamos',
                    description: `${loanRestrictions.currentActiveLoans} de ${loanRestrictions.maxAllowedLoans || 5} préstamos activos`,
                    details: `Solo puede solicitar ${remaining} préstamo(s) más`
                });
            } else if (remaining <= 0) {
                issues.push({
                    type: 'error',
                    icon: XCircle,
                    title: 'Límite Alcanzado',
                    description: `${loanRestrictions.currentActiveLoans} de ${loanRestrictions.maxAllowedLoans || 5} préstamos activos`,
                    details: 'Ha alcanzado el límite máximo de préstamos'
                });
            } else {
                info.push({
                    type: 'info',
                    icon: Clock,
                    title: 'Préstamos Activos',
                    description: `${loanRestrictions.currentActiveLoans} de ${loanRestrictions.maxAllowedLoans || 5} préstamos activos`,
                    details: `Puede solicitar ${remaining} préstamo(s) más`
                });
            }
        }

        // Estado general
        if (issues.length === 0 && warnings.length === 0) {
            info.push({
                type: 'success',
                icon: CheckCircle,
                title: 'Cliente Elegible',
                description: 'El cliente cumple todos los requisitos',
                details: 'Puede procesar préstamos sin restricciones'
            });
        }

        // Advertencia sobre datos de fallback
        if (loanRestrictions?.fallback || fineRestrictions?.fallback) {
            warnings.push({
                type: 'warning',
                icon: Wifi,
                title: 'Datos de Respaldo',
                description: 'Algunos datos provienen de validación local',
                details: 'La validación puede no estar completamente actualizada'
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

    const getConnectionIcon = () => {
        switch (connectionStatus) {
            case 'connected': return <Wifi className="h-4 w-4 text-green-400" />;
            case 'partial': return <Wifi className="h-4 w-4 text-yellow-400" />;
            case 'offline': return <WifiOff className="h-4 w-4 text-orange-400" />;
            case 'error': return <WifiOff className="h-4 w-4 text-red-400" />;
            default: return <Loader className="h-4 w-4 text-gray-400 animate-spin" />;
        }
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

    if (error && !validation) {
        return (
            <div className="bg-red-900 rounded-lg p-4 border border-red-700">
                <div className="flex items-center text-red-200">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <div>
                        <div className="font-medium">Error de Validación</div>
                        <div className="text-sm">{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!validation) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Header de validación con estado de conexión */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-gray-400" />
                        <h3 className="text-lg font-medium text-white">Validación de Cliente</h3>
                        <div className="ml-2 flex items-center">
                            {getConnectionIcon()}
                        </div>
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

                {validation.emergency && (
                    <div className="mt-2 text-xs text-yellow-300">
                        ⚠️ Validación de emergencia - Verifique manualmente las restricciones
                    </div>
                )}
            </div>

            {/* Resumen rápido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <div className="text-gray-400 text-sm">Estado del Cliente</div>
                    <div className={`text-lg font-medium ${
                        validation.fineRestrictions?.isRestricted ? 'text-red-400' : 'text-green-400'
                    }`}>
                        {validation.fineRestrictions?.clientStatus || 'ACTIVE'}
                    </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <div className="text-gray-400 text-sm">Préstamos Activos</div>
                    <div className="text-lg font-medium text-white">
                        {validation.loanRestrictions?.currentActiveLoans || 0} / {validation.loanRestrictions?.maxAllowedLoans || 5}
                    </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <div className="text-gray-400 text-sm">Total Multas</div>
                    <div className={`text-lg font-medium ${
                        (validation.fineRestrictions?.totalUnpaidAmount || 0) > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                        ${(validation.fineRestrictions?.totalUnpaidAmount || 0).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Validación detallada */}
            <div className="space-y-3">
                {/* Errores/Problemas */}
                {validation.summary?.issues?.map(item => renderValidationItem(item))}

                {/* Advertencias */}
                {validation.summary?.warnings?.map(item => renderValidationItem(item))}

                {/* Información */}
                {validation.summary?.info?.map(item => renderValidationItem(item))}
            </div>

            {/* Información sobre la fuente de datos */}
            {(validation.dataSource || validation.emergency) && (
                <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
                    <h4 className="text-blue-200 font-medium mb-2">Información del Sistema:</h4>
                    <div className="text-blue-300 text-sm space-y-1">
                        {validation.emergency && (
                            <p>• Validación de emergencia activada debido a errores del servidor</p>
                        )}
                        {validation.dataSource?.loans === 'fallback' && (
                            <p>• Datos de préstamos obtenidos mediante validación local</p>
                        )}
                        {validation.dataSource?.fines === 'fallback' && (
                            <p>• Datos de multas obtenidos mediante validación local</p>
                        )}
                        <p>• Estado de conexión: {connectionStatus}</p>
                    </div>
                </div>
            )}

            {/* Acciones recomendadas */}
            {!validation.eligible && !validation.emergency && (
                <div className="bg-orange-900 rounded-lg p-4 border border-orange-700">
                    <h4 className="text-orange-200 font-medium mb-2">Acciones Recomendadas:</h4>
                    <ul className="text-orange-300 text-sm space-y-1">
                        {validation.fineRestrictions?.hasUnpaidFines && (
                            <li>• Gestionar el pago de las multas pendientes</li>
                        )}
                        {validation.loanRestrictions?.currentActiveLoans >= 5 && (
                            <li>• Esperar a que se devuelvan algunos préstamos activos</li>
                        )}
                        {validation.loanRestrictions?.restriction && (
                            <li>• Revisar el estado general del cliente</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ClientValidation;
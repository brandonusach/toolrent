// loans/components/ReturnForm.jsx - Formulario para procesar devoluciones
import React, { useState, useEffect } from 'react';
import { X, Package, AlertTriangle, Calendar, FileText, DollarSign, CheckCircle, Clock, Loader } from 'lucide-react';

const ReturnForm = ({ loan, onSubmit, onClose, onSuccess }) => {
    const [returnData, setReturnData] = useState({
        damaged: false,
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lateInfo, setLateInfo] = useState(null);

    // Calcular información de atraso
    useEffect(() => {
        if (loan) {
            const today = new Date();
            const agreedDate = new Date(loan.agreedReturnDate);
            const isLate = today > agreedDate;

            if (isLate) {
                const daysLate = Math.ceil((today - agreedDate) / (1000 * 60 * 60 * 24));
                setLateInfo({
                    isLate: true,
                    daysLate: daysLate,
                    agreedDate: agreedDate.toLocaleDateString()
                });
            } else {
                setLateInfo({
                    isLate: false,
                    daysEarly: Math.ceil((agreedDate - today) / (1000 * 60 * 60 * 24)),
                    agreedDate: agreedDate.toLocaleDateString()
                });
            }
        }
    }, [loan]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setReturnData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {
            await onSubmit(loan.id, returnData);
            onSuccess();
        } catch (err) {
            console.error('Error processing return:', err);
            setError(err.message || 'Error al procesar la devolución');
        } finally {
            setLoading(false);
        }
    };

    if (!loan) {
        return null;
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Procesar Devolución</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Información del préstamo */}
                    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <h3 className="text-lg font-medium text-white mb-3">Información del Préstamo</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Cliente:</span>
                                <p className="text-white font-medium">{loan.client?.name}</p>
                            </div>

                            <div>
                                <span className="text-gray-400">Herramienta:</span>
                                <p className="text-white font-medium">{loan.tool?.name}</p>
                            </div>

                            <div>
                                <span className="text-gray-400">Cantidad:</span>
                                <p className="text-white font-medium">{loan.quantity} unidad(es)</p>
                            </div>

                            <div>
                                <span className="text-gray-400">Fecha de préstamo:</span>
                                <p className="text-white font-medium">{formatDate(loan.loanDate)}</p>
                            </div>

                            <div>
                                <span className="text-gray-400">Fecha acordada:</span>
                                <p className="text-white font-medium">{formatDate(loan.agreedReturnDate)}</p>
                            </div>

                            <div>
                                <span className="text-gray-400">Tarifa diaria:</span>
                                <p className="text-white font-medium">${loan.dailyRate}</p>
                            </div>
                        </div>

                        {loan.notes && (
                            <div className="mt-3">
                                <span className="text-gray-400">Notas del préstamo:</span>
                                <p className="text-white text-sm bg-gray-600 rounded p-2 mt-1">{loan.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Estado del tiempo */}
                    {lateInfo && (
                        <div className={`rounded-lg p-4 border ${
                            lateInfo.isLate
                                ? 'bg-red-900 border-red-700'
                                : 'bg-green-900 border-green-700'
                        }`}>
                            <div className="flex items-center">
                                {lateInfo.isLate ? (
                                    <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                                ) : (
                                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                                )}

                                <div className="flex-1">
                                    <h4 className={`font-medium ${
                                        lateInfo.isLate ? 'text-red-200' : 'text-green-200'
                                    }`}>
                                        {lateInfo.isLate
                                            ? `Préstamo Atrasado - ${lateInfo.daysLate} día(s)`
                                            : `Devolución Puntual - ${lateInfo.daysEarly} día(s) antes`
                                        }
                                    </h4>
                                    <p className={`text-sm ${
                                        lateInfo.isLate ? 'text-red-300' : 'text-green-300'
                                    }`}>
                                        {lateInfo.isLate
                                            ? `Se aplicará automáticamente una multa por atraso`
                                            : `No se aplicarán multas por atraso`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Estado de la herramienta */}
                    <div>
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                name="damaged"
                                checked={returnData.damaged}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                            />
                            <div className="flex items-center">
                                <Package className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-white font-medium">La herramienta presenta daños</span>
                            </div>
                        </label>

                        {returnData.damaged && (
                            <div className="mt-3 ml-7 bg-yellow-900 border border-yellow-700 rounded-lg p-3">
                                <div className="flex items-center text-yellow-200 text-sm">
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    <span>Se aplicarán automáticamente multas por daño según el costo de reparación</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notas de devolución */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <FileText className="h-4 w-4 inline mr-1" />
                            Notas de Devolución
                            {returnData.damaged && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <textarea
                            name="notes"
                            value={returnData.notes}
                            onChange={handleInputChange}
                            rows={4}
                            required={returnData.damaged}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder={
                                returnData.damaged
                                    ? "Describa detalladamente los daños encontrados en la herramienta..."
                                    : "Observaciones sobre el estado de la herramienta y el proceso de devolución..."
                            }
                        />
                        {returnData.damaged && (
                            <p className="text-xs text-red-400 mt-1">
                                * Requerido cuando la herramienta presenta daños
                            </p>
                        )}
                    </div>

                    {/* Información de multas */}
                    <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
                        <div className="flex items-center text-blue-200 mb-2">
                            <DollarSign className="h-4 w-4 mr-2" />
                            <span className="font-medium">Información de Multas Automáticas</span>
                        </div>
                        <div className="text-sm text-blue-300 space-y-1">
                            {lateInfo?.isLate && (
                                <p>• Multa por atraso: {lateInfo.daysLate} día(s) × tarifa de multa por día</p>
                            )}
                            {returnData.damaged && (
                                <p>• Multa por daño: Se calculará basado en el costo de reparación</p>
                            )}
                            {!lateInfo?.isLate && !returnData.damaged && (
                                <p>• No se aplicarán multas automáticas para esta devolución</p>
                            )}
                            <p className="text-xs text-blue-400 mt-2">
                                Las multas se calcularán automáticamente según las tarifas vigentes
                            </p>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-900 border border-red-700 rounded-md p-3">
                            <div className="flex items-center">
                                <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
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
                            disabled={loading || (returnData.damaged && !returnData.notes.trim())}
                            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                            {loading && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                            {loading ? 'Procesando...' : 'Procesar Devolución'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReturnForm;
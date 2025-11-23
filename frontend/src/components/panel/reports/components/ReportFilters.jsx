// ReportFilters.jsx - Filtros de fecha para reportes
import React, { useState } from 'react';
import { getTodayDate, toInputDate } from '../../../../utils/dateUtils';

const ReportFilters = ({ dateFilters, onDateChange, loading }) => {
    const [localFilters, setLocalFilters] = useState(dateFilters);

    // Presets de fechas comunes
    const datePresets = [
        {
            label: 'Hoy',
            getValue: () => {
                const today = getTodayDate();
                return { startDate: today, endDate: today };
            }
        },
        {
            label: 'Esta Semana',
            getValue: () => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
                const lastDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
                return {
                    startDate: toInputDate(firstDay),
                    endDate: toInputDate(lastDay)
                };
            }
        },
        {
            label: 'Este Mes',
            getValue: () => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                return {
                    startDate: toInputDate(firstDay),
                    endDate: toInputDate(lastDay)
                };
            }
        },
        {
            label: 'Último Mes',
            getValue: () => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                return {
                    startDate: toInputDate(firstDay),
                    endDate: toInputDate(lastDay)
                };
            }
        },
        {
            label: 'Últimos 30 días',
            getValue: () => {
                const today = new Date();
                const thirtyDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
                return {
                    startDate: toInputDate(thirtyDaysAgo),
                    endDate: getTodayDate()
                };
            }
        }
    ];

    const handleInputChange = (field, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleApplyFilters = () => {
        // Validar que ambas fechas estén presentes
        if (localFilters.startDate && localFilters.endDate) {
            // Validar que fecha inicio sea menor o igual a fecha fin
            if (new Date(localFilters.startDate) > new Date(localFilters.endDate)) {
                alert('La fecha de inicio debe ser anterior o igual a la fecha de fin');
                return;
            }
        }

        onDateChange(localFilters);
    };

    const handlePresetClick = (preset) => {
        const presetValues = preset.getValue();
        setLocalFilters(presetValues);
        onDateChange(presetValues);
    };

    const handleClearFilters = () => {
        const emptyFilters = { startDate: '', endDate: '' };
        setLocalFilters(emptyFilters);
        onDateChange(emptyFilters);
    };

    const hasActiveFilters = dateFilters.startDate || dateFilters.endDate;

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📅</span>
                <h3 className="text-lg font-semibold text-gray-900">Filtros por Fecha</h3>
                {hasActiveFilters && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Filtros activos
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Filtros Manuales */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Rango Personalizado</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Fecha Inicio
                            </label>
                            <input
                                type="date"
                                value={localFilters.startDate}
                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Fecha Fin
                            </label>
                            <input
                                type="date"
                                value={localFilters.endDate}
                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleApplyFilters}
                            disabled={loading || (!localFilters.startDate && !localFilters.endDate)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            {loading ? 'Aplicando...' : 'Aplicar Filtros'}
                        </button>

                        <button
                            onClick={handleClearFilters}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* Presets Rápidos */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Rangos Predefinidos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {datePresets.map((preset, index) => (
                            <button
                                key={index}
                                onClick={() => handlePresetClick(preset)}
                                disabled={loading}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-gray-700"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Información del rango activo */}
                    {hasActiveFilters && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <span className="text-blue-600 text-sm">📊</span>
                                <div className="text-sm">
                                    <p className="text-blue-700 font-medium">Rango Activo:</p>
                                    <p className="text-blue-600">
                                        {dateFilters.startDate && dateFilters.endDate ? (
                                            <>
                                                {new Date(dateFilters.startDate).toLocaleDateString('es-ES')}
                                                {' - '}
                                                {new Date(dateFilters.endDate).toLocaleDateString('es-ES')}
                                                {' '}
                                                ({Math.ceil((new Date(dateFilters.endDate) - new Date(dateFilters.startDate)) / (1000 * 60 * 60 * 24)) + 1} días)
                                            </>
                                        ) : (
                                            'Todos los registros'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportFilters;

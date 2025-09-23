import React, { useState, useEffect } from 'react';
import { Settings, Calendar, Save, X, AlertTriangle, CheckCircle, Calculator } from 'lucide-react';
import { RATE_TYPES, formatCurrency, validateAmount, validateDateRange, CALCULATOR_CONFIG } from '../utils/rateConstants';

const ReplacementValues = ({
                               currentRate = 0,
                               rates = {},
                               onCreate,
                               onUpdate,
                               onDeactivate,
                               onShowHistory,
                               onCalculateRepairCost,
                               loading = false,
                               isAdmin = false
                           }) => {
    const [formData, setFormData] = useState({
        type: RATE_TYPES.REPAIR_RATE,
        dailyAmount: '',
        effectiveFrom: '',
        effectiveTo: '',
        active: true
    });
    const [errors, setErrors] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Calculadora de reparación
    const [calculator, setCalculator] = useState({
        replacementValue: '',
        repairCost: 0,
        calculating: false
    });

    // Obtener tarifas de reparación del estado
    const repairRates = rates.all?.filter(rate => rate.type === RATE_TYPES.REPAIR_RATE) || [];
    const activeRepairRates = repairRates.filter(rate => rate.active);
    const currentRateData = activeRepairRates.find(rate => rate.isCurrentlyActive) || activeRepairRates[0];

    useEffect(() => {
        if (!showForm) {
            setFormData({
                type: RATE_TYPES.REPAIR_RATE,
                dailyAmount: '',
                effectiveFrom: '',
                effectiveTo: '',
                active: true
            });
            setEditingId(null);
            setErrors({});
        }
    }, [showForm]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validar porcentaje (1-100)
        const percentage = parseFloat(formData.dailyAmount);
        if (!percentage || percentage <= 0) {
            newErrors.dailyAmount = 'El porcentaje es requerido y debe ser mayor a 0';
        } else if (percentage > 100) {
            newErrors.dailyAmount = 'El porcentaje no puede ser mayor a 100%';
        }

        const dateError = validateDateRange(formData.effectiveFrom, formData.effectiveTo);
        if (dateError) {
            newErrors.effectiveFrom = dateError;
        }

        if (!editingId && formData.effectiveFrom) {
            const today = new Date().toISOString().split('T')[0];
            if (formData.effectiveFrom < today) {
                newErrors.effectiveFrom = 'La fecha de inicio debe ser hoy o una fecha futura';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const rateData = {
                ...formData,
                dailyAmount: parseFloat(formData.dailyAmount)
            };

            if (editingId) {
                await onUpdate(editingId, rateData);
            } else {
                await onCreate(rateData);
            }

            setShowForm(false);
        } catch (error) {
            setErrors({ submit: error.message });
        }
    };

    const handleEdit = (rate) => {
        setFormData({
            type: rate.type,
            dailyAmount: rate.dailyAmount.toString(),
            effectiveFrom: rate.effectiveFrom,
            effectiveTo: rate.effectiveTo || '',
            active: rate.active
        });
        setEditingId(rate.id);
        setShowForm(true);
    };

    const handleDeactivate = async (rateId) => {
        if (window.confirm('¿Está seguro de que quiere desactivar esta tarifa?')) {
            try {
                await onDeactivate(rateId);
            } catch (error) {
                setErrors({ general: error.message });
            }
        }
    };

    // Calculadora de costo de reparación
    const handleCalculateRepairCost = async () => {
        const replacementValue = parseFloat(calculator.replacementValue);

        if (!replacementValue || replacementValue <= 0) {
            setErrors({ calculator: 'Ingrese un valor de reposición válido' });
            return;
        }

        if (replacementValue < CALCULATOR_CONFIG.REPAIR_COST.MIN_REPLACEMENT_VALUE) {
            setErrors({ calculator: `El valor mínimo es ${formatCurrency(CALCULATOR_CONFIG.REPAIR_COST.MIN_REPLACEMENT_VALUE)}` });
            return;
        }

        if (replacementValue > CALCULATOR_CONFIG.REPAIR_COST.MAX_REPLACEMENT_VALUE) {
            setErrors({ calculator: `El valor máximo es ${formatCurrency(CALCULATOR_CONFIG.REPAIR_COST.MAX_REPLACEMENT_VALUE)}` });
            return;
        }

        setCalculator(prev => ({ ...prev, calculating: true }));
        setErrors(prev => ({ ...prev, calculator: null }));

        try {
            const repairCost = await onCalculateRepairCost(replacementValue);
            setCalculator(prev => ({
                ...prev,
                repairCost: repairCost,
                calculating: false
            }));
        } catch (error) {
            setErrors({ calculator: error.message });
            setCalculator(prev => ({ ...prev, calculating: false }));
        }
    };

    const handleCalculatorInputChange = (value) => {
        setCalculator(prev => ({
            ...prev,
            replacementValue: value,
            repairCost: 0
        }));

        if (errors.calculator) {
            setErrors(prev => ({ ...prev, calculator: null }));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('es-CL');
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                        <Settings className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Tarifa de Reparación</h2>
                        <p className="text-gray-400 text-sm">
                            Configurar porcentaje aplicado sobre el valor de reposición
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onShowHistory}
                        className="px-4 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                    >
                        Ver Historial
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            {showForm ? <X size={18} /> : <Settings size={18} />}
                            {showForm ? 'Cancelar' : 'Nueva Tarifa'}
                        </button>
                    )}
                </div>
            </div>

            {/* Error general */}
            {errors.general && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={18} />
                    {errors.general}
                </div>
            )}

            {/* Tarifa actual */}
            <div className="mb-6 bg-gray-750 p-4 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-white mb-1">Tarifa Actual</h3>
                        <p className="text-2xl font-bold text-blue-400">
                            {currentRate}%
                            <span className="text-sm text-gray-400 font-normal ml-1">del valor de reposición</span>
                        </p>
                        {currentRateData && (
                            <p className="text-sm text-gray-400 mt-1">
                                Vigente desde: {formatDate(currentRateData.effectiveFrom)}
                                {currentRateData.effectiveTo && (
                                    <span> hasta {formatDate(currentRateData.effectiveTo)}</span>
                                )}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="text-blue-400" size={20} />
                        <span className="text-blue-400 text-sm">Activa</span>
                    </div>
                </div>
            </div>

            {/* Calculadora de costo de reparación */}
            <div className="mb-6 bg-gray-750 p-6 rounded-lg border border-gray-600">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Calculator size={20} />
                    Calculadora de Costo de Reparación
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Valor de Reposición
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                $
                            </span>
                            <input
                                type="number"
                                value={calculator.replacementValue}
                                onChange={(e) => handleCalculatorInputChange(e.target.value)}
                                placeholder={CALCULATOR_CONFIG.REPAIR_COST.DEFAULT_REPLACEMENT_VALUE.toLocaleString()}
                                min={CALCULATOR_CONFIG.REPAIR_COST.MIN_REPLACEMENT_VALUE}
                                max={CALCULATOR_CONFIG.REPAIR_COST.MAX_REPLACEMENT_VALUE}
                                step="1000"
                                className={`w-full bg-gray-700 border ${
                                    errors.calculator ? 'border-red-500' : 'border-gray-600'
                                } rounded-lg px-4 pl-8 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500`}
                            />
                        </div>
                        {errors.calculator && (
                            <p className="mt-1 text-sm text-red-400">{errors.calculator}</p>
                        )}
                    </div>

                    <div className="flex flex-col justify-end">
                        <button
                            onClick={handleCalculateRepairCost}
                            disabled={calculator.calculating || !currentRate}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2.5 rounded-lg transition-colors"
                        >
                            <Calculator size={18} />
                            {calculator.calculating ? 'Calculando...' : 'Calcular'}
                        </button>
                    </div>
                </div>

                {calculator.repairCost > 0 && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-blue-400 font-medium">Costo de Reparación Calculado:</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {formatCurrency(parseFloat(calculator.replacementValue))} × {currentRate}% =
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-blue-400">
                                    {formatCurrency(calculator.repairCost)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Formulario */}
            {showForm && isAdmin && (
                <div className="mb-6 bg-gray-750 p-6 rounded-lg border border-gray-600">
                    <h3 className="text-lg font-medium text-white mb-4">
                        {editingId ? 'Editar Tarifa' : 'Nueva Tarifa de Reparación'}
                    </h3>

                    <div className="space-y-4">
                        {errors.submit && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg">
                                {errors.submit}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Porcentaje */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Porcentaje de Reparación *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.dailyAmount}
                                        onChange={(e) => handleInputChange('dailyAmount', e.target.value)}
                                        placeholder="30"
                                        min="1"
                                        max="100"
                                        step="1"
                                        className={`w-full bg-gray-700 border ${
                                            errors.dailyAmount ? 'border-red-500' : 'border-gray-600'
                                        } rounded-lg px-4 pr-8 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500`}
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        %
                                    </span>
                                </div>
                                {errors.dailyAmount && (
                                    <p className="mt-1 text-sm text-red-400">{errors.dailyAmount}</p>
                                )}
                            </div>

                            {/* Fecha efectiva desde */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Vigente Desde *
                                </label>
                                <input
                                    type="date"
                                    value={formData.effectiveFrom}
                                    onChange={(e) => handleInputChange('effectiveFrom', e.target.value)}
                                    className={`w-full bg-gray-700 border ${
                                        errors.effectiveFrom ? 'border-red-500' : 'border-gray-600'
                                    } rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500`}
                                />
                                {errors.effectiveFrom && (
                                    <p className="mt-1 text-sm text-red-400">{errors.effectiveFrom}</p>
                                )}
                            </div>

                            {/* Fecha efectiva hasta */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Vigente Hasta (Opcional)
                                </label>
                                <input
                                    type="date"
                                    value={formData.effectiveTo}
                                    onChange={(e) => handleInputChange('effectiveTo', e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-400">
                                    Si se deja vacío, la tarifa será válida indefinidamente
                                </p>
                            </div>

                            {/* Estado activo */}
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 text-sm text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => handleInputChange('active', e.target.checked)}
                                        className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                                    />
                                    Activar inmediatamente
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                <Save size={18} />
                                {loading ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear Tarifa')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de tarifas */}
            <div>
                <h3 className="text-lg font-medium text-white mb-4">Tarifas de Reparación Configuradas</h3>

                {repairRates.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Settings className="mx-auto h-12 w-12 mb-2" />
                        <p>No hay tarifas de reparación configuradas</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {repairRates.map((rate) => (
                            <div
                                key={rate.id}
                                className={`p-4 rounded-lg border ${
                                    rate.active
                                        ? 'bg-blue-500/5 border-blue-500/30'
                                        : 'bg-gray-750 border-gray-600'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-bold text-white">
                                                {rate.dailyAmount}%
                                            </span>
                                            {rate.active && (
                                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                                    Activa
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">
                                            <Calendar size={14} className="inline mr-1" />
                                            Desde: {formatDate(rate.effectiveFrom)}
                                            {rate.effectiveTo && (
                                                <span> • Hasta: {formatDate(rate.effectiveTo)}</span>
                                            )}
                                        </p>
                                        {rate.createdAt && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Creada: {formatDate(rate.createdAt)}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            Ejemplo: Para una herramienta de {formatCurrency(50000)} el costo sería {formatCurrency(50000 * rate.dailyAmount / 100)}
                                        </p>
                                    </div>

                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(rate)}
                                                className="px-3 py-1.5 text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500/50 rounded text-sm transition-colors"
                                            >
                                                Editar
                                            </button>
                                            {rate.active && (
                                                <button
                                                    onClick={() => handleDeactivate(rate.id)}
                                                    className="px-3 py-1.5 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded text-sm transition-colors"
                                                >
                                                    Desactivar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReplacementValues;


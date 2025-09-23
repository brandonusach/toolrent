/**
 * Utilidades de cálculo para tarifas - Frontend
 * Funciones puras de cálculo que no dependen del backend
 * Complementa la lógica de negocio manejada por el backend
 */

import { formatCurrency } from './rateConstants';

/**
 * Calcula el costo total de arriendo basado en días y tarifa diaria
 * @param {number} days - Número de días
 * @param {number} dailyRate - Tarifa diaria de arriendo
 * @returns {number} Costo total calculado
 */
export const calculateRentalCost = (days, dailyRate) => {
    if (!days || !dailyRate || days <= 0 || dailyRate <= 0) {
        return 0;
    }
    return days * dailyRate;
};

/**
 * Calcula el costo de multa por días de atraso
 * @param {number} daysLate - Número de días de atraso
 * @param {number} dailyLateFee - Tarifa diaria de multa
 * @returns {number} Costo total de multa
 */
export const calculateLateFee = (daysLate, dailyLateFee) => {
    if (!daysLate || !dailyLateFee || daysLate <= 0 || dailyLateFee <= 0) {
        return 0;
    }
    return daysLate * dailyLateFee;
};

/**
 * Calcula el costo de reparación basado en porcentaje del valor de reposición
 * @param {number} replacementValue - Valor de reposición de la herramienta
 * @param {number} repairRate - Porcentaje de reparación (ej: 30 para 30%)
 * @returns {number} Costo de reparación calculado
 */
export const calculateRepairCost = (replacementValue, repairRate) => {
    if (!replacementValue || !repairRate || replacementValue <= 0 || repairRate <= 0) {
        return 0;
    }
    return replacementValue * (repairRate / 100);
};

/**
 * Calcula los días entre dos fechas
 * @param {string|Date} startDate - Fecha de inicio
 * @param {string|Date} endDate - Fecha de fin
 * @returns {number} Número de días entre las fechas
 */
export const calculateDaysBetween = (startDate, endDate) => {
    if (!startDate || !endDate) {
        return 0;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
};

/**
 * Calcula días de atraso desde una fecha de vencimiento
 * @param {string|Date} dueDate - Fecha de vencimiento
 * @param {string|Date} currentDate - Fecha actual (opcional, por defecto hoy)
 * @returns {number} Días de atraso (0 si no hay atraso)
 */
export const calculateDaysLate = (dueDate, currentDate = new Date()) => {
    if (!dueDate) {
        return 0;
    }

    const due = new Date(dueDate);
    const current = new Date(currentDate);

    if (isNaN(due.getTime()) || isNaN(current.getTime())) {
        return 0;
    }

    // Si la fecha actual es antes o igual a la fecha de vencimiento, no hay atraso
    if (current <= due) {
        return 0;
    }

    const diffTime = current - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
};

/**
 * Proyecta el costo total de un préstamo
 * @param {Object} loanDetails - Detalles del préstamo
 * @param {number} loanDetails.days - Días del préstamo
 * @param {number} loanDetails.dailyRate - Tarifa diaria
 * @param {number} loanDetails.daysLate - Días de atraso (opcional)
 * @param {number} loanDetails.dailyLateFee - Tarifa de multa diaria (opcional)
 * @param {number} loanDetails.repairCost - Costo de reparación (opcional)
 * @returns {Object} Desglose de costos
 */
export const calculateTotalLoanCost = (loanDetails) => {
    const {
        days = 0,
        dailyRate = 0,
        daysLate = 0,
        dailyLateFee = 0,
        repairCost = 0
    } = loanDetails;

    const rentalCost = calculateRentalCost(days, dailyRate);
    const lateFee = calculateLateFee(daysLate, dailyLateFee);
    const total = rentalCost + lateFee + repairCost;

    return {
        rentalCost,
        lateFee,
        repairCost,
        total,
        breakdown: {
            rental: {
                days,
                dailyRate,
                total: rentalCost,
                formatted: formatCurrency(rentalCost)
            },
            lateFee: {
                daysLate,
                dailyLateFee,
                total: lateFee,
                formatted: formatCurrency(lateFee)
            },
            repair: {
                cost: repairCost,
                formatted: formatCurrency(repairCost)
            },
            total: {
                amount: total,
                formatted: formatCurrency(total)
            }
        }
    };
};

/**
 * Calcula el valor promedio de una tarifa en un período
 * @param {Array} rates - Array de tarifas con fechas y montos
 * @param {string|Date} startDate - Fecha de inicio del período
 * @param {string|Date} endDate - Fecha de fin del período
 * @returns {number} Valor promedio ponderado
 */
export const calculateAverageRate = (rates, startDate, endDate) => {
    if (!rates || !rates.length || !startDate || !endDate) {
        return 0;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = calculateDaysBetween(start, end);

    if (totalDays === 0) {
        return 0;
    }

    let weightedSum = 0;

    rates.forEach(rate => {
        const rateStart = new Date(rate.effectiveFrom);
        const rateEnd = rate.effectiveTo ? new Date(rate.effectiveTo) : end;

        // Calcular intersección con el período consultado
        const intersectionStart = new Date(Math.max(start, rateStart));
        const intersectionEnd = new Date(Math.min(end, rateEnd));

        if (intersectionStart <= intersectionEnd) {
            const intersectionDays = calculateDaysBetween(intersectionStart, intersectionEnd);
            weightedSum += rate.dailyAmount * intersectionDays;
        }
    });

    return totalDays > 0 ? weightedSum / totalDays : 0;
};

/**
 * Valida si un monto está dentro de los límites permitidos
 * @param {number} amount - Monto a validar
 * @param {string} rateType - Tipo de tarifa (RENTAL_RATE, LATE_FEE_RATE, REPAIR_RATE)
 * @param {Object} limits - Límites por tipo de tarifa
 * @returns {Object} Resultado de validación
 */
export const validateRateAmount = (amount, rateType, limits) => {
    if (!amount || amount <= 0) {
        return {
            isValid: false,
            error: 'El monto debe ser mayor a 0'
        };
    }

    const typeLimit = limits[rateType];
    if (!typeLimit) {
        return {
            isValid: false,
            error: 'Tipo de tarifa no válido'
        };
    }

    if (amount < typeLimit.MIN) {
        return {
            isValid: false,
            error: `El monto mínimo es ${formatCurrency(typeLimit.MIN)}`
        };
    }

    if (amount > typeLimit.MAX) {
        return {
            isValid: false,
            error: `El monto máximo es ${formatCurrency(typeLimit.MAX)}`
        };
    }

    return {
        isValid: true,
        error: null
    };
};

/**
 * Calcula estadísticas de tarifas para un período
 * @param {Array} rates - Array de tarifas
 * @param {string} rateType - Tipo de tarifa
 * @param {string|Date} startDate - Fecha de inicio
 * @param {string|Date} endDate - Fecha de fin
 * @returns {Object} Estadísticas calculadas
 */
export const calculateRateStatistics = (rates, rateType, startDate, endDate) => {
    const filteredRates = rates.filter(rate =>
        rate.type === rateType &&
        new Date(rate.effectiveFrom) <= new Date(endDate) &&
        (!rate.effectiveTo || new Date(rate.effectiveTo) >= new Date(startDate))
    );

    if (filteredRates.length === 0) {
        return {
            count: 0,
            average: 0,
            min: 0,
            max: 0,
            current: 0
        };
    }

    const amounts = filteredRates.map(rate => rate.dailyAmount);
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);

    // Encontrar tarifa actual
    const currentRate = filteredRates.find(rate => rate.isCurrentlyActive) || filteredRates[0];

    return {
        count: filteredRates.length,
        average: Math.round(average * 100) / 100,
        min,
        max,
        current: currentRate ? currentRate.dailyAmount : 0,
        formatted: {
            average: formatCurrency(average),
            min: formatCurrency(min),
            max: formatCurrency(max),
            current: formatCurrency(currentRate ? currentRate.dailyAmount : 0)
        }
    };
};

/**
 * Genera proyección de costos para diferentes escenarios
 * @param {Object} baseParams - Parámetros base
 * @param {Array} scenarios - Array de escenarios a evaluar
 * @returns {Array} Proyecciones calculadas
 */
export const generateCostProjections = (baseParams, scenarios = []) => {
    const defaultScenarios = [
        { days: 1, label: '1 día' },
        { days: 7, label: '1 semana' },
        { days: 15, label: '15 días' },
        { days: 30, label: '1 mes' }
    ];

    const scenariosToUse = scenarios.length > 0 ? scenarios : defaultScenarios;

    return scenariosToUse.map(scenario => {
        const projectedCost = calculateTotalLoanCost({
            ...baseParams,
            days: scenario.days
        });

        return {
            ...scenario,
            cost: projectedCost.total,
            formatted: formatCurrency(projectedCost.total),
            breakdown: projectedCost.breakdown
        };
    });
};

/**
 * Calcula impacto de cambio de tarifa
 * @param {number} currentRate - Tarifa actual
 * @param {number} newRate - Nueva tarifa propuesta
 * @param {number} estimatedUsage - Uso estimado (días promedio)
 * @returns {Object} Análisis de impacto
 */
export const calculateRateChangeImpact = (currentRate, newRate, estimatedUsage = 30) => {
    if (!currentRate || !newRate || !estimatedUsage) {
        return {
            absoluteChange: 0,
            percentageChange: 0,
            impactPerPeriod: 0,
            recommendation: 'Datos insuficientes para el análisis'
        };
    }

    const absoluteChange = newRate - currentRate;
    const percentageChange = ((absoluteChange / currentRate) * 100);
    const impactPerPeriod = absoluteChange * estimatedUsage;

    let recommendation = '';
    if (Math.abs(percentageChange) < 5) {
        recommendation = 'Cambio menor - Impacto mínimo en usuarios';
    } else if (Math.abs(percentageChange) < 15) {
        recommendation = 'Cambio moderado - Comunicar a usuarios';
    } else {
        recommendation = 'Cambio significativo - Requiere período de transición';
    }

    return {
        absoluteChange: Math.round(absoluteChange * 100) / 100,
        percentageChange: Math.round(percentageChange * 100) / 100,
        impactPerPeriod: Math.round(impactPerPeriod * 100) / 100,
        recommendation,
        formatted: {
            absoluteChange: formatCurrency(absoluteChange),
            impactPerPeriod: formatCurrency(impactPerPeriod),
            percentageChange: `${Math.round(percentageChange * 100) / 100}%`
        }
    };
};

/**
 * Utilidades adicionales para el manejo de fechas y validaciones
 */
export const dateUtils = {
    /**
     * Verifica si una fecha está en el futuro
     */
    isFutureDate: (date) => {
        return new Date(date) > new Date();
    },

    /**
     * Formatea una fecha para input de tipo date
     */
    formatForInput: (date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
    },

    /**
     * Obtiene la fecha de hoy en formato YYYY-MM-DD
     */
    getToday: () => {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Añade días a una fecha
     */
    addDays: (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
};

/**
 * Validadores específicos para tarifas
 */
export const rateValidators = {
    /**
     * Valida rango de fechas para tarifas
     */
    validateDateRange: (startDate, endDate) => {
        if (!startDate) {
            return { isValid: false, error: 'Fecha de inicio es requerida' };
        }

        if (endDate && new Date(endDate) <= new Date(startDate)) {
            return { isValid: false, error: 'Fecha de fin debe ser posterior a fecha de inicio' };
        }

        return { isValid: true, error: null };
    },

    /**
     * Valida solapamiento de fechas (frontend validation)
     */
    hasDateOverlap: (newStart, newEnd, existingRates) => {
        const start = new Date(newStart);
        const end = newEnd ? new Date(newEnd) : new Date('2099-12-31');

        return existingRates.some(rate => {
            if (!rate.active) return false;

            const rateStart = new Date(rate.effectiveFrom);
            const rateEnd = rate.effectiveTo ? new Date(rate.effectiveTo) : new Date('2099-12-31');

            return start <= rateEnd && end >= rateStart;
        });
    }
};

export default {
    calculateRentalCost,
    calculateLateFee,
    calculateRepairCost,
    calculateDaysBetween,
    calculateDaysLate,
    calculateTotalLoanCost,
    calculateAverageRate,
    validateRateAmount,
    calculateRateStatistics,
    generateCostProjections,
    calculateRateChangeImpact,
    dateUtils,
    rateValidators
};
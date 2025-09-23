/**
 * Constantes para la gestión de tarifas
 * Centraliza todos los valores constantes utilizados en el módulo de tarifas
 */

// Tipos de tarifa
export const RATE_TYPES = {
    RENTAL_RATE: 'RENTAL_RATE',
    LATE_FEE_RATE: 'LATE_FEE_RATE',
    REPAIR_RATE: 'REPAIR_RATE'
};

// Configuración de tipos de tarifa
export const RATE_TYPE_CONFIG = {
    [RATE_TYPES.RENTAL_RATE]: {
        label: 'Tarifa de Arriendo',
        description: 'Costo diario por el arriendo de herramientas',
        unit: '$/día',
        icon: 'DollarSign',
        color: 'green'
    },
    [RATE_TYPES.LATE_FEE_RATE]: {
        label: 'Multa por Atraso',
        description: 'Costo diario por devolución tardía',
        unit: '$/día',
        icon: 'Calculator',
        color: 'red'
    },
    [RATE_TYPES.REPAIR_RATE]: {
        label: 'Tarifa de Reparación',
        description: 'Porcentaje del valor de reposición para reparaciones',
        unit: '%',
        icon: 'Settings',
        color: 'blue'
    }
};

// Opciones para selects
export const RATE_TYPE_OPTIONS = [
    { value: RATE_TYPES.RENTAL_RATE, label: RATE_TYPE_CONFIG[RATE_TYPES.RENTAL_RATE].label },
    { value: RATE_TYPES.LATE_FEE_RATE, label: RATE_TYPE_CONFIG[RATE_TYPES.LATE_FEE_RATE].label },
    { value: RATE_TYPES.REPAIR_RATE, label: RATE_TYPE_CONFIG[RATE_TYPES.REPAIR_RATE].label }
];

// Campos para formularios de tarifas
export const RATE_FIELDS = {
    TYPE: 'type',
    DAILY_AMOUNT: 'dailyAmount',
    EFFECTIVE_FROM: 'effectiveFrom',
    EFFECTIVE_TO: 'effectiveTo',
    ACTIVE: 'active'
};

// Configuración de campos
export const RATE_FIELD_CONFIG = {
    [RATE_FIELDS.TYPE]: {
        label: 'Tipo de Tarifa',
        type: 'select',
        required: true,
        options: RATE_TYPE_OPTIONS
    },
    [RATE_FIELDS.DAILY_AMOUNT]: {
        label: 'Monto Diario',
        placeholder: '0.00',
        type: 'number',
        required: true,
        min: 0,
        max: 999999.99,
        step: 0.01
    },
    [RATE_FIELDS.EFFECTIVE_FROM]: {
        label: 'Vigente Desde',
        type: 'date',
        required: true
    },
    [RATE_FIELDS.EFFECTIVE_TO]: {
        label: 'Vigente Hasta',
        type: 'date',
        required: false
    },
    [RATE_FIELDS.ACTIVE]: {
        label: 'Activo',
        type: 'checkbox',
        required: false
    }
};

// Mensajes de validación
export const VALIDATION_MESSAGES = {
    REQUIRED: 'Este campo es requerido',
    AMOUNT: {
        REQUIRED: 'Monto es requerido',
        MIN: 'El monto debe ser mayor a 0',
        MAX: 'El monto no puede exceder $999,999.99',
        INVALID: 'Monto no válido'
    },
    DATE: {
        REQUIRED: 'Fecha es requerida',
        INVALID: 'Fecha no válida',
        FUTURE: 'La fecha debe ser futura',
        RANGE: 'Fecha de fin debe ser posterior a fecha de inicio',
        OVERLAP: 'Existe una tarifa activa que se superpone con el rango de fechas'
    },
    TYPE: {
        REQUIRED: 'Tipo de tarifa es requerido',
        INVALID: 'Tipo de tarifa no válido'
    },
    GENERAL: {
        NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet',
        SERVER_ERROR: 'Error interno del servidor. Intente nuevamente',
        PERMISSION_DENIED: 'No tiene permisos para realizar esta acción',
        UNKNOWN_ERROR: 'Ha ocurrido un error inesperado'
    }
};

// Límites de valores
export const VALUE_LIMITS = {
    RENTAL_RATE: {
        MIN: 1000,
        MAX: 50000,
        DEFAULT: 5000
    },
    LATE_FEE_RATE: {
        MIN: 500,
        MAX: 20000,
        DEFAULT: 2000
    },
    REPAIR_RATE: {
        MIN: 1,
        MAX: 100,
        DEFAULT: 30
    }
};

// Configuración de la API
export const API_CONFIG = {
    ENDPOINTS: {
        GET_ALL: '/api/rates',
        GET_BY_ID: '/api/rates/{id}',
        GET_BY_TYPE: '/api/rates/type/{type}',
        GET_CURRENT_RENTAL: '/api/rates/current/rental',
        GET_CURRENT_LATE_FEE: '/api/rates/current/late-fee',
        GET_CURRENT_REPAIR: '/api/rates/current/repair',
        CREATE: '/api/rates',
        UPDATE: '/api/rates/{id}',
        DEACTIVATE: '/api/rates/{id}/deactivate',
        CALCULATE_REPAIR: '/api/rates/calculate-repair',
        GET_HISTORY: '/api/rates/history/{type}',
        DATE_RANGE: '/api/rates/date-range',
        HAS_ACTIVE: '/api/rates/exists/active/{type}'
    },
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        INTERNAL_SERVER_ERROR: 500
    },
    TIMEOUT: 10000
};

// Configuración de permisos
export const PERMISSIONS = {
    RATE: {
        VIEW: 'rate:view',
        CREATE: 'rate:create',
        UPDATE: 'rate:update',
        DELETE: 'rate:delete',
        DEACTIVATE: 'rate:deactivate'
    },
    ROLES: {
        ADMIN: 'admin',
        USER: 'user'
    }
};

// Mapeo de roles a permisos
export const ROLE_PERMISSIONS = {
    [PERMISSIONS.ROLES.ADMIN]: [
        PERMISSIONS.RATE.VIEW,
        PERMISSIONS.RATE.CREATE,
        PERMISSIONS.RATE.UPDATE,
        PERMISSIONS.RATE.DELETE,
        PERMISSIONS.RATE.DEACTIVATE
    ],
    [PERMISSIONS.ROLES.USER]: [
        PERMISSIONS.RATE.VIEW
    ]
};

// Mensajes del sistema
export const SYSTEM_MESSAGES = {
    SUCCESS: {
        RATE_CREATED: 'Tarifa creada exitosamente',
        RATE_UPDATED: 'Tarifa actualizada exitosamente',
        RATE_DEACTIVATED: 'Tarifa desactivada exitosamente'
    },
    ERROR: {
        RATE_NOT_FOUND: 'Tarifa no encontrada',
        RATE_EXISTS: 'Ya existe una tarifa activa para este tipo y período',
        INVALID_DATA: 'Los datos ingresados no son válidos',
        NO_ACTIVE_RATE: 'No hay tarifa activa configurada para este tipo',
        OVERLAPPING_RATE: 'Existe una tarifa que se superpone con el período especificado'
    },
    CONFIRMATION: {
        DEACTIVATE_RATE: '¿Está seguro de que quiere desactivar esta tarifa?',
        UPDATE_RATE: '¿Está seguro de que quiere actualizar esta tarifa?',
        CREATE_RATE: '¿Está seguro de que quiere crear esta nueva tarifa?'
    },
    INFO: {
        NO_RATES_FOUND: 'No se encontraron tarifas configuradas',
        LOADING_RATES: 'Cargando tarifas...',
        CALCULATING: 'Calculando...'
    }
};

// Configuración de formato
export const FORMAT_CONFIG = {
    CURRENCY: {
        LOCALE: 'es-CL',
        CURRENCY: 'CLP',
        OPTIONS: {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    },
    PERCENTAGE: {
        LOCALE: 'es-CL',
        OPTIONS: {
            style: 'percent',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    },
    DATE: {
        LOCALE: 'es-CL',
        OPTIONS: {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }
    }
};

// Configuración de la interfaz
export const UI_CONFIG = {
    COLORS: {
        PRIMARY: 'blue',
        SUCCESS: 'green',
        DANGER: 'red',
        WARNING: 'yellow',
        INFO: 'blue'
    },
    ANIMATIONS: {
        FADE_IN: 'fadeIn 0.3s ease-in-out',
        SLIDE_IN: 'slideIn 0.2s ease-out'
    }
};

// Configuración de calculadora
export const CALCULATOR_CONFIG = {
    REPAIR_COST: {
        MIN_REPLACEMENT_VALUE: 1000,
        MAX_REPLACEMENT_VALUE: 10000000,
        DEFAULT_REPLACEMENT_VALUE: 50000
    }
};

// Utilitarios
export const getRateTypeConfig = (type) => {
    return RATE_TYPE_CONFIG[type] || null;
};

export const isValidRateType = (type) => {
    return Object.values(RATE_TYPES).includes(type);
};

export const getFieldConfig = (field) => {
    return RATE_FIELD_CONFIG[field] || null;
};

export const hasPermission = (userRole, permission) => {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
};

export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0';
    return new Intl.NumberFormat(FORMAT_CONFIG.CURRENCY.LOCALE, FORMAT_CONFIG.CURRENCY.OPTIONS)
        .format(Number(amount));
};

export const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${Number(value)}%`;
};

export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return new Intl.DateFormat(FORMAT_CONFIG.DATE.LOCALE, FORMAT_CONFIG.DATE.OPTIONS)
        .format(d);
};

export const getValueLimits = (rateType) => {
    return VALUE_LIMITS[rateType] || { MIN: 0, MAX: 999999, DEFAULT: 0 };
};

// Validadores
export const validateAmount = (amount, rateType) => {
    const limits = getValueLimits(rateType);
    if (!amount || amount <= 0) {
        return VALIDATION_MESSAGES.AMOUNT.REQUIRED;
    }
    if (amount < limits.MIN) {
        return `El monto mínimo es ${formatCurrency(limits.MIN)}`;
    }
    if (amount > limits.MAX) {
        return `El monto máximo es ${formatCurrency(limits.MAX)}`;
    }
    return null;
};

export const validateDateRange = (startDate, endDate) => {
    if (!startDate) {
        return VALIDATION_MESSAGES.DATE.REQUIRED;
    }
    if (endDate && new Date(endDate) <= new Date(startDate)) {
        return VALIDATION_MESSAGES.DATE.RANGE;
    }
    return null;
};

// Exportar todo como default también
export default {
    RATE_TYPES,
    RATE_TYPE_CONFIG,
    RATE_TYPE_OPTIONS,
    RATE_FIELDS,
    RATE_FIELD_CONFIG,
    VALIDATION_MESSAGES,
    VALUE_LIMITS,
    API_CONFIG,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    SYSTEM_MESSAGES,
    FORMAT_CONFIG,
    UI_CONFIG,
    CALCULATOR_CONFIG,
    getRateTypeConfig,
    isValidRateType,
    getFieldConfig,
    hasPermission,
    formatCurrency,
    formatPercentage,
    formatDate,
    getValueLimits,
    validateAmount,
    validateDateRange
};
// inventory/utils/toolConstants.js - Actualizado para Axios

// Estados de herramientas
export const TOOL_STATUS = {
    AVAILABLE: 'AVAILABLE',
    LOANED: 'LOANED',
    UNDER_REPAIR: 'UNDER_REPAIR',
    DECOMMISSIONED: 'DECOMMISSIONED'
};

// Etiquetas de estado para mostrar al usuario
export const TOOL_STATUS_LABELS = {
    [TOOL_STATUS.AVAILABLE]: 'Disponible',
    [TOOL_STATUS.LOANED]: 'Prestada',
    [TOOL_STATUS.UNDER_REPAIR]: 'En Reparación',
    [TOOL_STATUS.DECOMMISSIONED]: 'Dada de Baja'
};

// Colores para los badges de estado
export const TOOL_STATUS_COLORS = {
    [TOOL_STATUS.AVAILABLE]: 'bg-green-900 text-green-300',
    [TOOL_STATUS.LOANED]: 'bg-blue-900 text-blue-300',
    [TOOL_STATUS.UNDER_REPAIR]: 'bg-yellow-900 text-yellow-300',
    [TOOL_STATUS.DECOMMISSIONED]: 'bg-red-900 text-red-300'
};

// Tipos de filtro para herramientas
export const FILTER_TYPES = {
    ALL: 'ALL',
    LOW_STOCK: 'LOW_STOCK',
    NO_STOCK: 'NO_STOCK',
    AVAILABLE: 'AVAILABLE'
};

// Etiquetas para filtros
export const FILTER_LABELS = {
    [FILTER_TYPES.ALL]: 'Todas',
    [FILTER_TYPES.LOW_STOCK]: 'Stock Bajo',
    [FILTER_TYPES.NO_STOCK]: 'Sin Stock',
    [FILTER_TYPES.AVAILABLE]: 'Disponibles'
};

// Umbrales de stock
export const STOCK_THRESHOLDS = {
    LOW_STOCK: 2,
    NO_STOCK: 0,
    WARNING: 5
};

// Tipos de operación de stock
export const STOCK_OPERATIONS = {
    ADD_STOCK: 'add-stock',
    DECOMMISSION: 'decommission'
};

// Tipos de movimiento en kardex
export const MOVEMENT_TYPES = {
    INITIAL_STOCK: 'INITIAL_STOCK',
    LOAN: 'LOAN',
    RETURN: 'RETURN',
    REPAIR: 'REPAIR',
    DECOMMISSION: 'DECOMMISSION',
    RESTOCK: 'RESTOCK'
};

// Etiquetas para movimientos
export const MOVEMENT_LABELS = {
    [MOVEMENT_TYPES.INITIAL_STOCK]: 'Stock Inicial',
    [MOVEMENT_TYPES.LOAN]: 'Préstamo',
    [MOVEMENT_TYPES.RETURN]: 'Devolución',
    [MOVEMENT_TYPES.REPAIR]: 'Reparación',
    [MOVEMENT_TYPES.DECOMMISSION]: 'Baja',
    [MOVEMENT_TYPES.RESTOCK]: 'Reposición'
};

// Reglas de validación
export const VALIDATION_RULES = {
    TOOL_NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 100,
        REQUIRED: true
    },
    INITIAL_STOCK: {
        MIN_VALUE: 1,
        MAX_VALUE: 999,
        REQUIRED: true
    },
    REPLACEMENT_VALUE: {
        MIN_VALUE: 0.01,
        MAX_VALUE: 999999,
        REQUIRED: true
    }
};

// Mensajes de error estándar
export const ERROR_MESSAGES = {
    REQUIRED_FIELD: 'Este campo es requerido',
    INVALID_NAME: `El nombre debe tener entre ${VALIDATION_RULES.TOOL_NAME.MIN_LENGTH} y ${VALIDATION_RULES.TOOL_NAME.MAX_LENGTH} caracteres`,
    INVALID_STOCK: `El stock debe ser entre ${VALIDATION_RULES.INITIAL_STOCK.MIN_VALUE} y ${VALIDATION_RULES.INITIAL_STOCK.MAX_VALUE}`,
    INVALID_VALUE: `El valor debe ser mayor a ${VALIDATION_RULES.REPLACEMENT_VALUE.MIN_VALUE}`,
    CATEGORY_REQUIRED: 'Debe seleccionar una categoría',
    INSUFFICIENT_STOCK: 'No hay suficiente stock disponible',
    NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
    SERVER_ERROR: 'Error interno del servidor. Intente nuevamente.',
    TIMEOUT_ERROR: 'Tiempo de espera agotado. Intente nuevamente.'
};

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
    TOOL_CREATED: 'Herramienta registrada exitosamente',
    TOOL_UPDATED: 'Herramienta actualizada exitosamente',
    TOOL_DELETED: 'Herramienta eliminada exitosamente',
    STOCK_ADDED: 'Stock agregado exitosamente',
    TOOL_DECOMMISSIONED: 'Herramienta(s) dada(s) de baja exitosamente',
    INSTANCE_UPDATED: 'Estado de instancia actualizado exitosamente',
    INSTANCE_DELETED: 'Instancia eliminada exitosamente'
};

// Configuración de la API - Actualizada para Axios
export const API_CONFIG = {
    BASE_URL: 'http://localhost:8081/api',
    TIMEOUT: 10000, // 10 segundos (manejado por Axios)
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 segundo
    ENDPOINTS: {
        TOOLS: '/tools',
        CATEGORIES: '/categories',
        TOOL_INSTANCES: '/tool-instances',
        CLIENTS: '/client'
    }
};

// Utilidades para formateo
export const formatters = {
    // Formatear precio en pesos chilenos
    formatPrice: (value) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(value || 0);
    },

    // Formatear número simple
    formatNumber: (value) => {
        return new Intl.NumberFormat('es-CL').format(value || 0);
    },

    // Formatear fecha
    formatDate: (date) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(date));
    },

    // Formatear fecha y hora
    formatDateTime: (date) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
};

// Validadores
export const validators = {
    // Validar nombre de herramienta
    validateToolName: (name) => {
        if (!name || name.trim().length === 0) {
            return ERROR_MESSAGES.REQUIRED_FIELD;
        }
        if (name.trim().length < VALIDATION_RULES.TOOL_NAME.MIN_LENGTH ||
            name.trim().length > VALIDATION_RULES.TOOL_NAME.MAX_LENGTH) {
            return ERROR_MESSAGES.INVALID_NAME;
        }
        return null;
    },

    // Validar stock
    validateStock: (stock) => {
        const numStock = parseInt(stock);
        if (isNaN(numStock) || numStock < VALIDATION_RULES.INITIAL_STOCK.MIN_VALUE ||
            numStock > VALIDATION_RULES.INITIAL_STOCK.MAX_VALUE) {
            return ERROR_MESSAGES.INVALID_STOCK;
        }
        return null;
    },

    // Validar valor de reposición
    validateReplacementValue: (value) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < VALIDATION_RULES.REPLACEMENT_VALUE.MIN_VALUE ||
            numValue > VALIDATION_RULES.REPLACEMENT_VALUE.MAX_VALUE) {
            return ERROR_MESSAGES.INVALID_VALUE;
        }
        return null;
    },

    // Validar categoría
    validateCategory: (category) => {
        if (!category || !category.id) {
            return ERROR_MESSAGES.CATEGORY_REQUIRED;
        }
        return null;
    }
};

// Utilidades de estado
export const statusUtils = {
    // Obtener clase CSS para el estado
    getStatusClass: (status) => {
        return TOOL_STATUS_COLORS[status] || 'bg-gray-900 text-gray-300';
    },

    // Obtener etiqueta del estado
    getStatusLabel: (status) => {
        return TOOL_STATUS_LABELS[status] || status;
    },

    // Verificar si el stock está bajo
    isLowStock: (currentStock, threshold = STOCK_THRESHOLDS.LOW_STOCK) => {
        return (currentStock || 0) <= threshold;
    },

    // Verificar si no hay stock
    hasNoStock: (currentStock) => {
        return (currentStock || 0) === STOCK_THRESHOLDS.NO_STOCK;
    },

    // Obtener clase CSS para el stock
    getStockClass: (currentStock) => {
        if (statusUtils.hasNoStock(currentStock)) {
            return 'text-red-500';
        } else if (statusUtils.isLowStock(currentStock)) {
            return 'text-orange-500';
        }
        return 'text-green-500';
    }
};

// Utilidades para manejo de errores con Axios
export const axiosErrorHandlers = {
    // Determinar tipo de error
    getErrorType: (error) => {
        if (error.response) {
            // Error del servidor
            return 'server_error';
        } else if (error.request) {
            // Error de red
            return 'network_error';
        } else if (error.code === 'ECONNABORTED') {
            // Timeout
            return 'timeout_error';
        }
        return 'unknown_error';
    },

    // Obtener mensaje de error apropiado
    getErrorMessage: (error) => {
        const errorType = axiosErrorHandlers.getErrorType(error);

        switch (errorType) {
            case 'network_error':
                return ERROR_MESSAGES.NETWORK_ERROR;
            case 'timeout_error':
                return ERROR_MESSAGES.TIMEOUT_ERROR;
            case 'server_error':
                return error.response?.data || ERROR_MESSAGES.SERVER_ERROR;
            default:
                return error.message || 'Error desconocido';
        }
    },

    // Verificar si el error es recuperable
    isRetryable: (error) => {
        const errorType = axiosErrorHandlers.getErrorType(error);
        const status = error.response?.status;

        // Errores recuperables: problemas de red, timeouts, errores 5xx
        return errorType === 'network_error' ||
            errorType === 'timeout_error' ||
            (status >= 500 && status < 600);
    },

    // Determinar si es un error de validación
    isValidationError: (error) => {
        return error.response?.status === 400 || error.response?.status === 422;
    },

    // Determinar si es un error de autorización
    isAuthError: (error) => {
        return error.response?.status === 401 || error.response?.status === 403;
    }
};

export default {
    TOOL_STATUS,
    TOOL_STATUS_LABELS,
    TOOL_STATUS_COLORS,
    FILTER_TYPES,
    FILTER_LABELS,
    STOCK_THRESHOLDS,
    STOCK_OPERATIONS,
    MOVEMENT_TYPES,
    MOVEMENT_LABELS,
    VALIDATION_RULES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    API_CONFIG,
    formatters,
    validators,
    statusUtils,
    axiosErrorHandlers
};
// constants/clientConstants.js - Simplificado siguiendo el patrón de toolConstants

// Estados de clientes
export const CLIENT_STATUS = {
    ACTIVE: 'ACTIVE',
    RESTRICTED: 'RESTRICTED'
};

// Etiquetas de estado para mostrar al usuario
export const CLIENT_STATUS_LABELS = {
    [CLIENT_STATUS.ACTIVE]: 'Activo',
    [CLIENT_STATUS.RESTRICTED]: 'Restringido'
};

// Colores para los badges de estado
export const CLIENT_STATUS_COLORS = {
    [CLIENT_STATUS.ACTIVE]: 'bg-green-900 text-green-300',
    [CLIENT_STATUS.RESTRICTED]: 'bg-red-900 text-red-300'
};

// Tipos de filtro para clientes
export const FILTER_TYPES = {
    ALL: 'ALL',
    ACTIVE: 'ACTIVE',
    RESTRICTED: 'RESTRICTED'
};

// Etiquetas para filtros
export const FILTER_LABELS = {
    [FILTER_TYPES.ALL]: 'Todos',
    [FILTER_TYPES.ACTIVE]: 'Activos',
    [FILTER_TYPES.RESTRICTED]: 'Restringidos'
};

// Reglas de validación
export const VALIDATION_RULES = {
    CLIENT_NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 100,
        REQUIRED: true
    },
    RUT: {
        REQUIRED: true,
        MAX_LENGTH: 12
    },
    PHONE: {
        REQUIRED: true,
        MAX_LENGTH: 15
    },
    EMAIL: {
        REQUIRED: true,
        MAX_LENGTH: 255
    }
};

// Mensajes de error estándar
export const ERROR_MESSAGES = {
    REQUIRED_FIELD: 'Este campo es requerido',
    INVALID_NAME: `El nombre debe tener entre ${VALIDATION_RULES.CLIENT_NAME.MIN_LENGTH} y ${VALIDATION_RULES.CLIENT_NAME.MAX_LENGTH} caracteres`,
    INVALID_RUT: 'RUT chileno no válido',
    INVALID_PHONE: 'Número de teléfono chileno no válido',
    INVALID_EMAIL: 'Formato de email no válido',
    DUPLICATE_RUT: 'Ya existe un cliente con este RUT',
    DUPLICATE_EMAIL: 'Ya existe un cliente con este email',
    CLIENT_NOT_FOUND: 'Cliente no encontrado',
    NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
    SERVER_ERROR: 'Error interno del servidor. Intente nuevamente.',
    TIMEOUT_ERROR: 'Tiempo de espera agotado. Intente nuevamente.'
};

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
    CLIENT_CREATED: 'Cliente registrado exitosamente',
    CLIENT_UPDATED: 'Cliente actualizado exitosamente',
    CLIENT_DELETED: 'Cliente eliminado exitosamente',
    STATUS_UPDATED: 'Estado del cliente actualizado exitosamente'
};

// Configuración de la API
export const API_CONFIG = {
    BASE_URL: 'http://localhost:8081/api',
    TIMEOUT: 10000, // 10 segundos
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 segundo
    ENDPOINTS: {
        CLIENTS: '/clients',
        CLIENT_BY_RUT: '/clients/rut',
        CLIENT_EXISTS: '/clients/exists'
    }
};

// Utilidades para formateo
export const formatters = {
    // Formatear RUT
    formatRut: (rut) => {
        if (!rut) return '';
        const cleanRut = rut.replace(/\D/g, '');
        if (cleanRut.length < 8) return rut;

        const rutBody = cleanRut.slice(0, -1);
        const checkDigit = cleanRut.slice(-1);

        return `${rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${checkDigit}`;
    },

    // Formatear teléfono
    formatPhone: (phone) => {
        if (!phone) return '';
        const cleanPhone = phone.replace(/\D/g, '');

        if (cleanPhone.length === 9 && cleanPhone[0] === '9') {
            // Celular: 9 1234 5678
            return `${cleanPhone[0]} ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`;
        } else if (cleanPhone.length === 8) {
            // Fijo: 22 123 456
            return `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 5)} ${cleanPhone.slice(5)}`;
        }
        return phone;
    },

    // Formatear fecha
    formatDate: (date) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(date));
    }
};

// Validadores
export const validators = {
    // Validar nombre de cliente
    validateName: (name) => {
        if (!name || name.trim().length === 0) {
            return ERROR_MESSAGES.REQUIRED_FIELD;
        }
        if (name.trim().length < VALIDATION_RULES.CLIENT_NAME.MIN_LENGTH ||
            name.trim().length > VALIDATION_RULES.CLIENT_NAME.MAX_LENGTH) {
            return ERROR_MESSAGES.INVALID_NAME;
        }
        return null;
    },

    // Validar RUT
    validateRut: (rut) => {
        if (!rut || rut.trim().length === 0) {
            return ERROR_MESSAGES.REQUIRED_FIELD;
        }

        const cleanRut = rut.replace(/[.-]/g, '');
        if (!/^[0-9]+[0-9kK]$/.test(cleanRut)) {
            return ERROR_MESSAGES.INVALID_RUT;
        }

        // Validación del dígito verificador
        const rutBody = cleanRut.slice(0, -1);
        const checkDigit = cleanRut.slice(-1).toUpperCase();

        let sum = 0;
        let multiplier = 2;

        for (let i = rutBody.length - 1; i >= 0; i--) {
            sum += parseInt(rutBody[i]) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }

        const remainder = sum % 11;
        const calculatedCheckDigit = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString();

        if (checkDigit !== calculatedCheckDigit) {
            return ERROR_MESSAGES.INVALID_RUT;
        }

        return null;
    },

    // Validar teléfono
    validatePhone: (phone) => {
        if (!phone || phone.trim().length === 0) {
            return ERROR_MESSAGES.REQUIRED_FIELD;
        }

        const cleanPhone = phone.replace(/\D/g, '');

        // Celular: 9 seguido de 8 dígitos
        if (cleanPhone.length === 9 && cleanPhone[0] === '9') {
            return null;
        }

        // Fijo: 8 dígitos (área + número)
        if (cleanPhone.length === 8) {
            return null;
        }

        return ERROR_MESSAGES.INVALID_PHONE;
    },

    // Validar email
    validateEmail: (email) => {
        if (!email || email.trim().length === 0) {
            return ERROR_MESSAGES.REQUIRED_FIELD;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return ERROR_MESSAGES.INVALID_EMAIL;
        }

        return null;
    }
};

// Utilidades de estado
export const statusUtils = {
    // Obtener clase CSS para el estado
    getStatusClass: (status) => {
        return CLIENT_STATUS_COLORS[status] || 'bg-gray-900 text-gray-300';
    },

    // Obtener etiqueta del estado
    getStatusLabel: (status) => {
        return CLIENT_STATUS_LABELS[status] || status;
    },

    // Verificar si el cliente está activo
    isActive: (status) => {
        return status === CLIENT_STATUS.ACTIVE;
    },

    // Verificar si el cliente está restringido
    isRestricted: (status) => {
        return status === CLIENT_STATUS.RESTRICTED;
    }
};

// Utilidades para manejo de errores con Axios
export const axiosErrorHandlers = {
    // Determinar tipo de error
    getErrorType: (error) => {
        if (error.response) {
            return 'server_error';
        } else if (error.request) {
            return 'network_error';
        } else if (error.code === 'ECONNABORTED') {
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

        return errorType === 'network_error' ||
            errorType === 'timeout_error' ||
            (status >= 500 && status < 600);
    }
};

// Configuración de permisos
export const PERMISSIONS = {
    CLIENT: {
        VIEW: 'client:view',
        CREATE: 'client:create',
        UPDATE: 'client:update',
        DELETE: 'client:delete',
        CHANGE_STATUS: 'client:change_status'
    },
    ROLES: {
        ADMIN: 'admin',
        USER: 'user',
        VIEWER: 'viewer'
    }
};

// Mapeo de roles a permisos
export const ROLE_PERMISSIONS = {
    [PERMISSIONS.ROLES.ADMIN]: [
        PERMISSIONS.CLIENT.VIEW,
        PERMISSIONS.CLIENT.CREATE,
        PERMISSIONS.CLIENT.UPDATE,
        PERMISSIONS.CLIENT.DELETE,
        PERMISSIONS.CLIENT.CHANGE_STATUS
    ],
    [PERMISSIONS.ROLES.USER]: [
        PERMISSIONS.CLIENT.VIEW,
        PERMISSIONS.CLIENT.CREATE,
        PERMISSIONS.CLIENT.UPDATE
    ],
    [PERMISSIONS.ROLES.VIEWER]: [
        PERMISSIONS.CLIENT.VIEW
    ]
};

// Utility function for permission checking
export const hasPermission = (userRole, permission) => {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
};

export default {
    CLIENT_STATUS,
    CLIENT_STATUS_LABELS,
    CLIENT_STATUS_COLORS,
    FILTER_TYPES,
    FILTER_LABELS,
    VALIDATION_RULES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    API_CONFIG,
    formatters,
    validators,
    statusUtils,
    axiosErrorHandlers,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    hasPermission
};
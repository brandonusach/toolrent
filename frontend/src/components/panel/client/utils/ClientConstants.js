/**
 * Constantes para la gestión de clientes
 * Centraliza todos los valores constantes utilizados en el módulo de clientes
 */

// Estados de cliente
export const CLIENT_STATUS = {
    ACTIVE: 'ACTIVE',
    RESTRICTED: 'RESTRICTED'
};

// Configuración de estados con metadatos
export const CLIENT_STATUS_CONFIG = {
    [CLIENT_STATUS.ACTIVE]: {
        label: 'Activo',
        description: 'Cliente habilitado para realizar transacciones',
        color: 'green',
        textColor: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        icon: 'UserCheck'
    },
    [CLIENT_STATUS.RESTRICTED]: {
        label: 'Restringido',
        description: 'Cliente con restricciones por atrasos en pagos o políticas internas',
        color: 'red',
        textColor: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: 'UserX'
    }
};

// Opciones para selects y filtros
export const CLIENT_STATUS_OPTIONS = [
    { value: CLIENT_STATUS.ACTIVE, label: CLIENT_STATUS_CONFIG[CLIENT_STATUS.ACTIVE].label },
    { value: CLIENT_STATUS.RESTRICTED, label: CLIENT_STATUS_CONFIG[CLIENT_STATUS.RESTRICTED].label }
];

// Opciones de filtro incluyendo "Todos"
export const CLIENT_FILTER_OPTIONS = [
    { value: 'ALL', label: 'Todos los estados' },
    ...CLIENT_STATUS_OPTIONS
];

// Campos de cliente para formularios
export const CLIENT_FIELDS = {
    NAME: 'name',
    RUT: 'rut',
    PHONE: 'phone',
    EMAIL: 'email',
    STATUS: 'status'
};

// Configuración de campos para formularios
export const CLIENT_FIELD_CONFIG = {
    [CLIENT_FIELDS.NAME]: {
        label: 'Nombre Completo',
        placeholder: 'Ingrese el nombre completo',
        type: 'text',
        required: true,
        maxLength: 100,
        minLength: 2
    },
    [CLIENT_FIELDS.RUT]: {
        label: 'RUT',
        placeholder: '12.345.678-9',
        type: 'text',
        required: true,
        maxLength: 12,
        pattern: '[0-9.-K]+'
    },
    [CLIENT_FIELDS.PHONE]: {
        label: 'Teléfono',
        placeholder: '9 1234 5678 o 22 1234 5678',
        type: 'tel',
        required: true,
        maxLength: 15
    },
    [CLIENT_FIELDS.EMAIL]: {
        label: 'Email',
        placeholder: 'cliente@email.com',
        type: 'email',
        required: true,
        maxLength: 255
    },
    [CLIENT_FIELDS.STATUS]: {
        label: 'Estado',
        type: 'select',
        required: true,
        options: CLIENT_STATUS_OPTIONS
    }
};

// Mensajes de validación
export const VALIDATION_MESSAGES = {
    REQUIRED: 'Este campo es requerido',
    RUT: {
        INVALID: 'RUT chileno no válido',
        REQUIRED: 'RUT es requerido',
        FORMAT: 'Formato de RUT incorrecto (ej: 12.345.678-9)',
        DUPLICATE: 'Ya existe un cliente con este RUT'
    },
    PHONE: {
        INVALID: 'Número de teléfono chileno no válido',
        REQUIRED: 'Teléfono es requerido',
        FORMAT: 'Use formato: 9 XXXX XXXX (celular) o XX XXXX XXXX (fijo)',
        DUPLICATE: 'Ya existe un cliente con este teléfono'
    },
    EMAIL: {
        INVALID: 'Formato de email no válido',
        REQUIRED: 'Email es requerido',
        DUPLICATE: 'Ya existe un cliente con este email'
    },
    NAME: {
        REQUIRED: 'Nombre es requerido',
        MIN_LENGTH: 'Nombre debe tener al menos 2 caracteres',
        MAX_LENGTH: 'Nombre no puede exceder 100 caracteres',
        FORMAT: 'Nombre solo puede contener letras, espacios y algunos caracteres especiales'
    }
};

// Configuración de búsqueda
export const SEARCH_CONFIG = {
    DEBOUNCE_DELAY: 300, // ms
    MIN_SEARCH_LENGTH: 2,
    MAX_RESULTS: 100,
    FIELDS: [
        CLIENT_FIELDS.NAME,
        CLIENT_FIELDS.RUT,
        CLIENT_FIELDS.PHONE,
        CLIENT_FIELDS.EMAIL
    ]
};

// Configuración de paginación
export const PAGINATION_CONFIG = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_PAGE_SIZE: 100
};

// Motivos comunes de restricción de clientes
export const RESTRICTION_REASONS = [
    'Atrasos en pagos superiores a 30 días',
    'Múltiples préstamos vencidos',
    'Incumplimiento reiterado de términos',
    'Solicitud del cliente',
    'Revisión de crédito pendiente',
    'Documentación incompleta',
    'Comportamiento inadecuado',
    'Otro'
];

// Configuración de formatos
export const FORMAT_CONFIG = {
    RUT: {
        PATTERN: /^[0-9]+[-]?[0-9kK]{1}$/,
        DISPLAY_PATTERN: /^[0-9]{1,3}(\.[0-9]{3})*[-][0-9kK]{1}$/,
        MAX_LENGTH: 12
    },
    PHONE: {
        CELLULAR_PATTERN: /^(\+56)?[9][0-9]{8}$/,
        LANDLINE_PATTERN: /^(\+56)?(2|3[2-5]|4[1-5]|5[1-358]|6[1-34567]|7[1-5])[0-9]{6,7}$/,
        DISPLAY_FORMAT: '+56 X XXXX XXXX'
    },
    EMAIL: {
        PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        MAX_LENGTH: 255
    }
};

// Configuración de la API
export const API_CONFIG = {
    ENDPOINTS: {
        GET_ALL: '/client/',
        GET_BY_ID: '/client/{id}',
        GET_BY_RUT: '/client/rut/{rut}',
        GET_BY_NAME: '/client/name/{name}',
        GET_BY_STATUS: '/client/status/{status}',
        EXISTS_BY_RUT: '/client/exists/{rut}',
        CREATE: '/client/',
        UPDATE: '/client/{id}',
        DELETE: '/client/{id}'
    },
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        NOT_FOUND: 404,
        CONFLICT: 409,
        INTERNAL_SERVER_ERROR: 500
    },
    TIMEOUT: 10000 // 10 segundos
};

// Configuración de la interfaz
export const UI_CONFIG = {
    COLORS: {
        PRIMARY: 'blue',
        SUCCESS: 'green',
        DANGER: 'red',
        WARNING: 'yellow',
        INFO: 'blue',
        DARK: 'gray'
    },
    ANIMATIONS: {
        FADE_IN: 'fadeIn 0.3s ease-in-out',
        SLIDE_IN: 'slideIn 0.2s ease-out',
        BOUNCE: 'bounce 0.5s ease-in-out'
    },
    BREAKPOINTS: {
        SM: '640px',
        MD: '768px',
        LG: '1024px',
        XL: '1280px'
    }
};

// Mensajes del sistema
export const SYSTEM_MESSAGES = {
    SUCCESS: {
        CLIENT_CREATED: 'Cliente creado exitosamente',
        CLIENT_UPDATED: 'Cliente actualizado exitosamente',
        CLIENT_DELETED: 'Cliente eliminado exitosamente',
        STATUS_CHANGED: 'Estado del cliente cambiado exitosamente'
    },
    ERROR: {
        NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet',
        SERVER_ERROR: 'Error interno del servidor. Intente nuevamente',
        CLIENT_NOT_FOUND: 'Cliente no encontrado',
        CLIENT_EXISTS: 'Ya existe un cliente con estos datos',
        INVALID_DATA: 'Los datos ingresados no son válidos',
        PERMISSION_DENIED: 'No tiene permisos para realizar esta acción',
        UNKNOWN_ERROR: 'Ha ocurrido un error inesperado'
    },
    CONFIRMATION: {
        DELETE_CLIENT: '¿Está seguro de que quiere eliminar este cliente?',
        CHANGE_STATUS: '¿Está seguro de que quiere cambiar el estado de este cliente?',
        DISCARD_CHANGES: '¿Está seguro de que quiere descartar los cambios?'
    },
    INFO: {
        NO_CLIENTS_FOUND: 'No se encontraron clientes que coincidan con los criterios de búsqueda',
        LOADING_CLIENTS: 'Cargando clientes...',
        EMPTY_STATE: 'No hay clientes registrados en el sistema'
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

// Configuración de exportación
export const EXPORT_CONFIG = {
    FORMATS: ['csv', 'excel', 'pdf'],
    CSV: {
        DELIMITER: ',',
        ENCODING: 'utf-8',
        HEADERS: [
            'ID',
            'Nombre',
            'RUT',
            'Teléfono',
            'Email',
            'Estado',
            'Fecha Registro'
        ]
    },
    MAX_RECORDS: 10000
};

// Configuración de filtros avanzados
export const ADVANCED_FILTERS = {
    DATE_RANGES: [
        { value: 'today', label: 'Hoy' },
        { value: 'week', label: 'Esta semana' },
        { value: 'month', label: 'Este mes' },
        { value: 'quarter', label: 'Este trimestre' },
        { value: 'year', label: 'Este año' },
        { value: 'custom', label: 'Personalizado' }
    ],
    SORT_OPTIONS: [
        { value: 'name_asc', label: 'Nombre (A-Z)' },
        { value: 'name_desc', label: 'Nombre (Z-A)' },
        { value: 'rut_asc', label: 'RUT (Menor a Mayor)' },
        { value: 'rut_desc', label: 'RUT (Mayor a Menor)' },
        { value: 'date_asc', label: 'Fecha registro (Más antiguo)' },
        { value: 'date_desc', label: 'Fecha registro (Más reciente)' },
        { value: 'status', label: 'Estado' }
    ]
};

// Utilitarios para trabajar con las constantes
export const getStatusConfig = (status) => {
    return CLIENT_STATUS_CONFIG[status] || CLIENT_STATUS_CONFIG[CLIENT_STATUS.RESTRICTED];
};

export const isValidStatus = (status) => {
    return Object.values(CLIENT_STATUS).includes(status);
};

export const getFieldConfig = (field) => {
    return CLIENT_FIELD_CONFIG[field] || null;
};

export const hasPermission = (userRole, permission) => {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
};

// Exportar todo como default también
export default {
    CLIENT_STATUS,
    CLIENT_STATUS_CONFIG,
    CLIENT_STATUS_OPTIONS,
    CLIENT_FILTER_OPTIONS,
    CLIENT_FIELDS,
    CLIENT_FIELD_CONFIG,
    VALIDATION_MESSAGES,
    SEARCH_CONFIG,
    PAGINATION_CONFIG,
    RESTRICTION_REASONS,
    FORMAT_CONFIG,
    API_CONFIG,
    UI_CONFIG,
    SYSTEM_MESSAGES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    EXPORT_CONFIG,
    ADVANCED_FILTERS,
    getStatusConfig,
    isValidStatus,
    getFieldConfig,
    hasPermission
};
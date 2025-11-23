// utils/dateUtils.js - Utilidad para manejar fechas correctamente
// Crear este archivo en: frontend/src/utils/dateUtils.js

/**
 * Formatea una fecha en formato ISO (YYYY-MM-DD) a formato legible en español
 * Sin conversión de zona horaria
 * @param {string} dateString - Fecha en formato ISO (YYYY-MM-DD)
 * @param {object} options - Opciones de formato
 * @returns {string} Fecha formateada
 */
export const formatDateLocal = (dateString, options = {}) => {
    if (!dateString) return 'N/A';

    try {
        // Extraer año, mes, día directamente del string sin conversión
        const [year, month, day] = dateString.split('T')[0].split('-');

        // Crear fecha usando componentes locales (sin conversión UTC)
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        // Opciones por defecto - formato corto
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC', // Forzar UTC para evitar conversiones
            ...options
        };

        return date.toLocaleDateString('es-ES', defaultOptions);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
};

/**
 * Formatea una fecha completa con hora
 * @param {string} dateString - Fecha ISO con hora
 * @returns {string} Fecha y hora formateadas
 */
export const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting datetime:', error);
        return dateString;
    }
};

/**
 * Formatea una fecha en formato largo español (ej: "22 de noviembre de 2025")
 * @param {string} dateString - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha formateada en formato largo
 */
export const formatDateLong = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        // Extraer año, mes, día directamente del string sin conversión
        const [year, month, day] = dateString.split('T')[0].split('-');

        // Crear fecha usando componentes locales
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date long:', error);
        return dateString;
    }
};

/**
 * Convierte una fecha a formato YYYY-MM-DD para inputs
 * @param {Date|string} date - Fecha a convertir
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const toInputDate = (date) => {
    if (!date) return '';

    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error converting to input date:', error);
        return '';
    }
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 * @returns {string} Fecha de hoy
 */
export const getTodayDate = () => {
    const today = new Date();
    return toInputDate(today);
};

/**
 * Obtiene la fecha de mañana en formato YYYY-MM-DD
 * @returns {string} Fecha de mañana
 */
export const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toInputDate(tomorrow);
};

/**
 * Calcula días entre dos fechas
 * @param {string} date1 - Primera fecha (YYYY-MM-DD)
 * @param {string} date2 - Segunda fecha (YYYY-MM-DD)
 * @returns {number} Días de diferencia
 */
export const daysBetween = (date1, date2) => {
    try {
        const [y1, m1, d1] = date1.split('T')[0].split('-').map(Number);
        const [y2, m2, d2] = date2.split('T')[0].split('-').map(Number);

        const first = new Date(y1, m1 - 1, d1);
        const second = new Date(y2, m2 - 1, d2);

        const diffTime = second - first;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
        console.error('Error calculating days between:', error);
        return 0;
    }
};

/**
 * Verifica si una fecha es anterior a otra
 * @param {string} date1 - Primera fecha
 * @param {string} date2 - Segunda fecha
 * @returns {boolean}
 */
export const isDateBefore = (date1, date2) => {
    try {
        return daysBetween(date1, date2) > 0;
    } catch (error) {
        return false;
    }
};

/**
 * Formatea una fecha de forma compacta (DD/MM/YYYY)
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha en formato DD/MM/YYYY
 */
export const formatDateCompact = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formatting date compact:', error);
        return dateString;
    }
};

/**
 * Obtiene el nombre del mes
 * @param {number} monthIndex - Índice del mes (0-11)
 * @returns {string} Nombre del mes
 */
export const getMonthName = (monthIndex) => {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex] || '';
};

/**
 * Parsea una fecha ISO a componentes locales
 * @param {string} dateString - Fecha ISO
 * @returns {object} { year, month, day }
 */
export const parseISODate = (dateString) => {
    if (!dateString) return null;

    try {
        const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
        return { year, month, day };
    } catch (error) {
        console.error('Error parsing ISO date:', error);
        return null;
    }
};

export default {
    formatDateLocal,
    formatDateLong,
    formatDateTime,
    toInputDate,
    getTodayDate,
    getTomorrowDate,
    daysBetween,
    isDateBefore,
    formatDateCompact,
    getMonthName,
    parseISODate
};
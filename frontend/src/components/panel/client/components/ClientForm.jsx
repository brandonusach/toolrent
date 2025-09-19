import React, { useState, useEffect } from 'react';
import { X, Save, User, Hash, Phone, Mail, AlertCircle } from 'lucide-react';

const ClientForm = ({
                        mode = 'create', // 'create' or 'edit'
                        client = null,
                        onClose,
                        onSubmit
                    }) => {
    const [formData, setFormData] = useState({
        name: '',
        rut: '',
        phone: '',
        email: '',
        status: 'ACTIVE'
    });

    // Solo errores del servidor, no validaciones frontend
    const [serverErrors, setServerErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Llenar el formulario si estamos en modo edición
    useEffect(() => {
        if (mode === 'edit' && client) {
            setFormData({
                name: client.name || '',
                rut: client.rut || '',
                phone: client.phone || '',
                email: client.email || '',
                status: client.status || 'ACTIVE'
            });
        }
    }, [mode, client]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error del servidor cuando el usuario cambie el campo
        if (serverErrors[name]) {
            setServerErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setServerErrors({}); // Limpiar errores previos

        try {
            // Enviar datos directamente al backend sin validaciones frontend
            // El backend se encarga de toda la validación y normalización
            await onSubmit(formData);
        } catch (error) {
            // Manejar errores del servidor
            console.error('Server error:', error);

            // Si el error contiene información específica de campos
            if (error.response && error.response.data) {
                const errorData = error.response.data;

                // Parsear errores del backend por campo
                const fieldErrors = {};
                if (typeof errorData === 'string') {
                    // Error general del servidor
                    if (errorData.includes('RUT')) {
                        fieldErrors.rut = errorData;
                    } else if (errorData.includes('teléfono') || errorData.includes('telefono')) {
                        fieldErrors.phone = errorData;
                    } else if (errorData.includes('email') || errorData.includes('correo')) {
                        fieldErrors.email = errorData;
                    } else if (errorData.includes('nombre')) {
                        fieldErrors.name = errorData;
                    } else {
                        fieldErrors.general = errorData;
                    }
                } else if (errorData.errors) {
                    // Si el backend envía errores estructurados
                    Object.assign(fieldErrors, errorData.errors);
                }

                setServerErrors(fieldErrors);
            } else {
                // Error genérico
                setServerErrors({ general: 'Error al procesar la solicitud. Intente nuevamente.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">
                        {mode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error general del servidor */}
                    {serverErrors.general && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm flex items-center">
                                <AlertCircle size={14} className="mr-2" />
                                {serverErrors.general}
                            </p>
                        </div>
                    )}

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <User size={16} className="inline mr-2" />
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                serverErrors.name ? 'border-red-500' : 'border-gray-600'
                            }`}
                            placeholder="Ingrese el nombre completo"
                            disabled={isSubmitting}
                        />
                        {serverErrors.name && (
                            <p className="mt-1 text-sm text-red-400 flex items-center">
                                <AlertCircle size={14} className="mr-1" />
                                {serverErrors.name}
                            </p>
                        )}
                    </div>

                    {/* RUT - Sin formateo frontend, el backend lo maneja */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Hash size={16} className="inline mr-2" />
                            RUT
                        </label>
                        <input
                            type="text"
                            name="rut"
                            value={formData.rut}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                serverErrors.rut ? 'border-red-500' : 'border-gray-600'
                            }`}
                            placeholder="Ej: 12345678-9 o 12.345.678-9"
                            disabled={isSubmitting}
                        />
                        {serverErrors.rut && (
                            <p className="mt-1 text-sm text-red-400 flex items-center">
                                <AlertCircle size={14} className="mr-1" />
                                {serverErrors.rut}
                            </p>
                        )}
                    </div>

                    {/* Teléfono - Sin formateo frontend, el backend lo maneja */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Phone size={16} className="inline mr-2" />
                            Teléfono
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                serverErrors.phone ? 'border-red-500' : 'border-gray-600'
                            }`}
                            placeholder="Ej: 912345678, +56912345678, 221234567"
                            disabled={isSubmitting}
                        />
                        {serverErrors.phone && (
                            <p className="mt-1 text-sm text-red-400 flex items-center">
                                <AlertCircle size={14} className="mr-1" />
                                {serverErrors.phone}
                            </p>
                        )}
                    </div>

                    {/* Email - Sin validación frontend */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Mail size={16} className="inline mr-2" />
                            Email
                        </label>
                        <input
                            type="text"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                serverErrors.email ? 'border-red-500' : 'border-gray-600'
                            }`}
                            placeholder="cliente@email.com"
                            disabled={isSubmitting}
                        />
                        {serverErrors.email && (
                            <p className="mt-1 text-sm text-red-400 flex items-center">
                                <AlertCircle size={14} className="mr-1" />
                                {serverErrors.email}
                            </p>
                        )}
                    </div>

                    {/* Estado - solo en modo edición */}
                    {mode === 'edit' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Estado
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                disabled={isSubmitting}
                            >
                                <option value="ACTIVE">Activo</option>
                                <option value="RESTRICTED">Restringido</option>
                            </select>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                                <Save size={16} className="mr-2" />
                            )}
                            {mode === 'create' ? 'Crear Cliente' : 'Actualizar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientForm;
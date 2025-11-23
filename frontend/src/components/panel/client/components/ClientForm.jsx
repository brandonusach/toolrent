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
        email: ''
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
                email: client.email || ''
            });
        }
    }, [mode, client]);

    const formatRUTInput = (value) => {
        if (!value) return '';

        // Limpiar entrada manteniendo solo números y K
        const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();

        if (cleaned.length <= 1) return cleaned;

        // Separar cuerpo y posible dígito verificador
        const body = cleaned.slice(0, -1);
        const lastChar = cleaned.slice(-1);

        // Formatear cuerpo con puntos
        const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        // Si hay suficientes caracteres, agregar el guión
        if (cleaned.length > 7) {
            return `${formattedBody}-${lastChar}`;
        }

        return formattedBody + lastChar;
    };

    const formatPhoneInput = (value) => {
        if (!value) return '';

        // Limpiar entrada manteniendo solo números
        const cleaned = value.replace(/[^0-9]/g, '');

        if (cleaned.length <= 1) return cleaned;

        // Formatear según longitud
        if (cleaned.length === 9 && cleaned.startsWith('9')) {
            // Celular: 9 1234 5678
            return cleaned.replace(/(\d{1})(\d{4})(\d{4})/, '$1 $2 $3');
        } else if (cleaned.length === 8) {
            // Fijo: 22 1234 5678
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
        } else if (cleaned.length > 4) {
            // Formateo progresivo
            return cleaned.replace(/(\d{2})(\d{4})/, '$1 $2');
        }

        return cleaned;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        let formattedValue = value;

        // Aplicar formateo según el campo
        if (name === 'rut') {
            formattedValue = formatRUTInput(value);
        } else if (name === 'phone') {
            formattedValue = formatPhoneInput(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: formattedValue
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
            // En modo edición, no se envía el RUT
            const dataToSubmit = mode === 'edit'
                ? { name: formData.name, phone: formData.phone, email: formData.email }
                : formData;

            await onSubmit(dataToSubmit);
            onClose(); // Cerrar el modal solo si tiene éxito
        } catch (error) {
            // Manejar errores del servidor igual que ToolForm
            console.error('Error submitting form:', error);
            console.log('Error completo:', JSON.stringify(error, null, 2));
            console.log('Error.response:', error.response);
            console.log('Error.response.data:', error.response?.data);

            if (error.response && error.response.data) {
                const errorData = error.response.data;
                console.log('Tipo de errorData:', typeof errorData);
                console.log('errorData:', errorData);
                console.log('errorData.fieldErrors:', errorData.fieldErrors);

                // Si el backend envía fieldErrors (mismo formato que ToolForm)
                if (typeof errorData === 'object' && errorData.fieldErrors) {
                    console.log('✅ Usando fieldErrors:', errorData.fieldErrors);
                    setServerErrors(errorData.fieldErrors);
                } else if (typeof errorData === 'string') {
                    // Mostrar error en alert igual que ToolForm
                    console.log('⚠️ errorData es string:', errorData);
                    alert(`Error: ${errorData}`);
                } else {
                    console.log('❌ errorData no reconocido');
                    alert('Error: Error desconocido del servidor');
                }
            } else {
                console.log('❌ No hay error.response.data, usando error.message');
                alert(`Error: ${error.message || 'Error desconocido'}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 py-8 px-4">
            <div className="bg-gray-800 rounded-xl max-w-lg w-full border border-gray-700 max-h-[85vh] overflow-y-auto my-auto">
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
                            Nombre Completo *
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            minLength={2}
                            maxLength={100}
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                                serverErrors.name 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-600 focus:ring-blue-500'
                            } transition-colors`}
                            placeholder="Ingrese el nombre completo"
                            disabled={isSubmitting}
                        />
                        {serverErrors.name && (
                            <p className="mt-1 text-sm text-red-400 flex items-center">
                                <AlertCircle size={14} className="mr-1" />
                                {serverErrors.name}
                            </p>
                        )}
                        {!serverErrors.name && (
                            <p className="text-gray-400 text-xs mt-1">Mínimo 2 caracteres</p>
                        )}
                    </div>

                    {/* RUT - Sin formateo frontend, el backend lo maneja */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Hash size={16} className="inline mr-2" />
                            RUT *
                        </label>
                        <input
                            type="text"
                            name="rut"
                            required
                            minLength={7}
                            maxLength={12}
                            value={formData.rut}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                                serverErrors.rut 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-600 focus:ring-blue-500'
                            } ${mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''} transition-colors`}
                            placeholder="Ej: 12345678-9 o 12.345.678-9"
                            disabled={isSubmitting || mode === 'edit'}
                        />
                        {serverErrors.rut && (
                            <p className="mt-1 text-sm text-red-400 flex items-center">
                                <AlertCircle size={14} className="mr-1" />
                                {serverErrors.rut}
                            </p>
                        )}
                        {!serverErrors.rut && mode === 'create' && (
                            <p className="text-gray-400 text-xs mt-1">Formato: 12.345.678-9</p>
                        )}
                        {!serverErrors.rut && mode === 'edit' && (
                            <p className="text-gray-400 text-xs mt-1">El RUT no se puede modificar</p>
                        )}
                    </div>

                    {/* Teléfono - Sin formateo frontend, el backend lo maneja */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Phone size={16} className="inline mr-2" />
                            Teléfono *
                        </label>
                        <input
                            type="text"
                            name="phone"
                            required
                            minLength={8}
                            maxLength={15}
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                                serverErrors.phone 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-600 focus:ring-blue-500'
                            } transition-colors`}
                            placeholder="Ej: 912345678, +56912345678, 221234567"
                            disabled={isSubmitting}
                        />
                        {serverErrors.phone && (
                            <p className="mt-1 text-sm text-red-400 flex items-center">
                                <AlertCircle size={14} className="mr-1" />
                                {serverErrors.phone}
                            </p>
                        )}
                        {!serverErrors.phone && (
                            <p className="text-gray-400 text-xs mt-1">Celular o fijo chileno</p>
                        )}
                    </div>

                    {/* Email - Validación HTML5 básica */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Mail size={16} className="inline mr-2" />
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                                serverErrors.email 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-600 focus:ring-blue-500'
                            } transition-colors`}
                            placeholder="cliente@email.com"
                            disabled={isSubmitting}
                        />
                        {serverErrors.email && (
                            <p className="mt-1 text-sm text-red-400 flex items-center">
                                <AlertCircle size={14} className="mr-1" />
                                {serverErrors.email}
                            </p>
                        )}
                        {!serverErrors.email && (
                            <p className="text-gray-400 text-xs mt-1">Formato válido de correo electrónico</p>
                        )}
                    </div>


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
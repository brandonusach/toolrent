// inventory/components/ToolForm.jsx - PURE VERSION
import React, { useState, useEffect } from 'react';

const ToolForm = ({ mode, tool, categories, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        initialStock: 1,
        replacementValue: 0
    });

    const [loading, setLoading] = useState(false);
    const [serverErrors, setServerErrors] = useState({});

    // Initialize form data
    useEffect(() => {
        if (mode === 'edit' && tool) {
            setFormData({
                name: tool.name || '',
                categoryId: tool.category?.id || '',
                initialStock: tool.initialStock || 1,
                replacementValue: tool.replacementValue || 0
            });
        } else {
            setFormData({
                name: '',
                categoryId: '',
                initialStock: 1,
                replacementValue: 0
            });
        }
        setServerErrors({});
    }, [mode, tool]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerErrors({});
        setLoading(true);

        try {
            // Send raw form data to backend - let backend handle all validation
            const payload = {
                name: formData.name.trim(),
                category: { id: parseInt(formData.categoryId) },
                initialStock: parseInt(formData.initialStock),
                replacementValue: parseFloat(formData.replacementValue)
            };

            if (mode === 'edit') {
                await onSubmit(tool.id, payload);
            } else {
                await onSubmit(payload);
            }
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);

            // Handle server validation errors
            if (error.response && error.response.data) {
                const errorData = error.response.data;

                // Parse server validation errors into field-specific errors
                if (typeof errorData === 'object' && errorData.fieldErrors) {
                    setServerErrors(errorData.fieldErrors);
                } else if (typeof errorData === 'string') {
                    // Single error message - show as general alert
                    alert(`Error: ${errorData}`);
                } else {
                    alert('Error: Unknown server error');
                }
            } else {
                alert(`Error: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const title = mode === 'edit' ? 'Editar Herramienta' : 'Registrar Nueva Herramienta';
    const submitText = mode === 'edit' ? 'Actualizar' : 'Registrar';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-white mb-4">{title}</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none ${
                                serverErrors.name
                                    ? 'border-red-500 focus:border-red-400'
                                    : 'border-gray-600 focus:border-orange-500'
                            }`}
                            placeholder="Nombre de la herramienta"
                            disabled={loading}
                        />
                        {serverErrors.name && (
                            <p className="text-red-400 text-xs mt-1">{serverErrors.name}</p>
                        )}
                    </div>

                    {/* Category Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Categoría *
                        </label>
                        <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none ${
                                serverErrors.category
                                    ? 'border-red-500 focus:border-red-400'
                                    : 'border-gray-600 focus:border-orange-500'
                            }`}
                            disabled={loading}
                        >
                            <option value="">Seleccionar categoría</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {serverErrors.category && (
                            <p className="text-red-400 text-xs mt-1">{serverErrors.category}</p>
                        )}
                    </div>

                    {/* Initial Stock Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Stock Inicial *
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.initialStock}
                            onChange={(e) => setFormData({
                                ...formData,
                                initialStock: parseInt(e.target.value) || 1
                            })}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none ${
                                serverErrors.initialStock
                                    ? 'border-red-500 focus:border-red-400'
                                    : 'border-gray-600 focus:border-orange-500'
                            }`}
                            disabled={loading}
                        />
                        {serverErrors.initialStock && (
                            <p className="text-red-400 text-xs mt-1">{serverErrors.initialStock}</p>
                        )}
                    </div>

                    {/* Replacement Value Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Valor de Reposición *
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.replacementValue}
                            onChange={(e) => setFormData({
                                ...formData,
                                replacementValue: parseFloat(e.target.value) || 0
                            })}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none ${
                                serverErrors.replacementValue
                                    ? 'border-red-500 focus:border-red-400'
                                    : 'border-gray-600 focus:border-orange-500'
                            }`}
                            placeholder="0.00"
                            disabled={loading}
                        />
                        {serverErrors.replacementValue && (
                            <p className="text-red-400 text-xs mt-1">{serverErrors.replacementValue}</p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-3 mt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Procesando...' : submitText}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ToolForm;
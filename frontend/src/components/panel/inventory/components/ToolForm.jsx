// inventory/components/ToolForm.jsx
import React, { useState, useEffect } from 'react';

const ToolForm = ({ mode, tool, categories, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: null,
        initialStock: 1,
        replacementValue: 0
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Inicializar formulario
    useEffect(() => {
        if (mode === 'edit' && tool) {
            setFormData({
                name: tool.name || '',
                category: tool.category || null,
                initialStock: tool.initialStock || 1,
                replacementValue: tool.replacementValue || 0
            });
        } else {
            // Reset para modo crear
            setFormData({
                name: '',
                category: null,
                initialStock: 1,
                replacementValue: 0
            });
        }
        setErrors({});
    }, [mode, tool]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.category) {
            newErrors.category = 'La categoría es requerida';
        }

        if (formData.initialStock < 1) {
            newErrors.initialStock = 'El stock inicial debe ser al menos 1';
        }

        if (formData.replacementValue <= 0) {
            newErrors.replacementValue = 'El valor de reposición debe ser mayor a 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            if (mode === 'edit') {
                await onSubmit(tool.id, formData);
                alert('Herramienta actualizada exitosamente');
            } else {
                await onSubmit(formData);
                alert('Herramienta registrada exitosamente');
            }
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert(`Error: ${error.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (e) => {
        const selectedCategory = categories.find(c => c.id.toString() === e.target.value);
        setFormData({ ...formData, category: selectedCategory || null });
    };

    const title = mode === 'edit' ? 'Editar Herramienta' : 'Registrar Nueva Herramienta';
    const submitText = mode === 'edit' ? 'Actualizar' : 'Registrar';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-white mb-4">{title}</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none ${
                                errors.name
                                    ? 'border-red-500 focus:border-red-400'
                                    : 'border-gray-600 focus:border-orange-500'
                            }`}
                            placeholder="Nombre de la herramienta"
                            disabled={loading}
                        />
                        {errors.name && (
                            <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                        )}
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Categoría *
                        </label>
                        <select
                            value={formData.category?.id || ''}
                            onChange={handleCategoryChange}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none ${
                                errors.category
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
                        {errors.category && (
                            <p className="text-red-400 text-xs mt-1">{errors.category}</p>
                        )}
                    </div>

                    {/* Stock Inicial */}
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
                                errors.initialStock
                                    ? 'border-red-500 focus:border-red-400'
                                    : 'border-gray-600 focus:border-orange-500'
                            }`}
                            disabled={loading}
                        />
                        {errors.initialStock && (
                            <p className="text-red-400 text-xs mt-1">{errors.initialStock}</p>
                        )}
                    </div>

                    {/* Valor de Reposición */}
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
                                errors.replacementValue
                                    ? 'border-red-500 focus:border-red-400'
                                    : 'border-gray-600 focus:border-orange-500'
                            }`}
                            placeholder="0.00"
                            disabled={loading}
                        />
                        {errors.replacementValue && (
                            <p className="text-red-400 text-xs mt-1">{errors.replacementValue}</p>
                        )}
                    </div>

                    {/* Botones */}
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
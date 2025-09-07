import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Package,
    AlertTriangle,
    Tags,
    Hash
} from 'lucide-react';

const InventoryManagement = () => {
    // Estados principales
    const [tools, setTools] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para filtros y búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);

    // Estados para modales
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null);

    // Estados para formularios
    const [toolForm, setToolForm] = useState({
        name: '',
        categoryId: '',
        initialStock: '',
        replacementValue: ''
    });

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        description: ''
    });

    // API Configuration
    const API_BASE = 'http://localhost:8081/api';

    // Cargar datos iniciales
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [toolsRes, categoriesRes] = await Promise.all([
                fetch(`${API_BASE}/tools`),
                fetch(`${API_BASE}/categories`)
            ]);

            if (toolsRes.ok) setTools(await toolsRes.json());
            if (categoriesRes.ok) setCategories(await categoriesRes.json());
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setLoading(false);
    };

    // Filtrar herramientas
    const filteredTools = tools.filter(tool => {
        const matchesSearch = tool.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || tool.category?.id?.toString() === selectedCategory;
        const matchesStatus = !selectedStatus || tool.status === selectedStatus;
        const matchesLowStock = !showLowStock || (tool.currentStock <= 5);

        return matchesSearch && matchesCategory && matchesStatus && matchesLowStock;
    });

    // Crear herramienta
    const handleCreateTool = async (e) => {
        e.preventDefault();
        const categoryObj = categories.find(cat => cat.id.toString() === toolForm.categoryId);

        const toolData = {
            name: toolForm.name,
            category: categoryObj,
            initialStock: parseInt(toolForm.initialStock),
            replacementValue: parseFloat(toolForm.replacementValue)
        };

        try {
            const response = await fetch(`${API_BASE}/tools`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toolData)
            });

            if (response.ok) {
                const newTool = await response.json();
                setTools(prev => [...prev, newTool]);
                setShowAddModal(false);
                resetToolForm();
            }
        } catch (error) {
            console.error('Error creating tool:', error);
        }
    };

    // Actualizar herramienta
    const handleEditTool = async (e) => {
        e.preventDefault();
        const categoryObj = categories.find(cat => cat.id.toString() === toolForm.categoryId);

        const toolData = {
            name: toolForm.name,
            category: categoryObj,
            initialStock: parseInt(toolForm.initialStock),
            replacementValue: parseFloat(toolForm.replacementValue)
        };

        try {
            const response = await fetch(`${API_BASE}/tools/${selectedTool.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toolData)
            });

            if (response.ok) {
                const updatedTool = await response.json();
                setTools(prev => prev.map(tool => tool.id === selectedTool.id ? updatedTool : tool));
                setShowEditModal(false);
                setSelectedTool(null);
                resetToolForm();
            }
        } catch (error) {
            console.error('Error updating tool:', error);
        }
    };

    // Eliminar herramienta
    const handleDeleteTool = async (toolId) => {
        if (!confirm('¿Eliminar esta herramienta?')) return;

        try {
            const response = await fetch(`${API_BASE}/tools/${toolId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setTools(prev => prev.filter(tool => tool.id !== toolId));
            }
        } catch (error) {
            console.error('Error deleting tool:', error);
        }
    };

    // Crear categoría
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: categoryForm.name,
                    description: categoryForm.description
                })
            });

            if (response.ok) {
                const newCategory = await response.json();
                setCategories(prev => [...prev, newCategory]);
                setShowCategoryModal(false);
                resetCategoryForm();
            }
        } catch (error) {
            console.error('Error creating category:', error);
        }
    };

    // Actualizar stock
    const handleUpdateStock = async (toolId, newStock) => {
        try {
            const response = await fetch(`${API_BASE}/tools/${toolId}/stock?stock=${newStock}`, {
                method: 'PUT'
            });

            if (response.ok) {
                const updatedTool = await response.json();
                setTools(prev => prev.map(tool => tool.id === toolId ? updatedTool : tool));
            }
        } catch (error) {
            console.error('Error updating stock:', error);
        }
    };

    // Actualizar estado
    const handleUpdateStatus = async (toolId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE}/tools/${toolId}/status?status=${newStatus}`, {
                method: 'PUT'
            });

            if (response.ok) {
                const updatedTool = await response.json();
                setTools(prev => prev.map(tool => tool.id === toolId ? updatedTool : tool));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Funciones auxiliares
    const resetToolForm = () => {
        setToolForm({ name: '', categoryId: '', initialStock: '', replacementValue: '' });
    };

    const resetCategoryForm = () => {
        setCategoryForm({ name: '', description: '' });
    };

    const openEditModal = (tool) => {
        setSelectedTool(tool);
        setToolForm({
            name: tool.name || '',
            categoryId: tool.category?.id?.toString() || '',
            initialStock: tool.initialStock?.toString() || '',
            replacementValue: tool.replacementValue?.toString() || ''
        });
        setShowEditModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-green-100 text-green-800';
            case 'LOANED': return 'bg-blue-100 text-blue-800';
            case 'UNDER_REPAIR': return 'bg-yellow-100 text-yellow-800';
            case 'DECOMMISSIONED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'Disponible';
            case 'LOANED': return 'Prestado';
            case 'UNDER_REPAIR': return 'En Reparación';
            case 'DECOMMISSIONED': return 'Dado de Baja';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                <span className="ml-4 text-white">Cargando inventario...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gestión de Inventario</h2>
                    <p className="text-gray-400">
                        Administra herramientas y categorías • {tools.length} herramientas • {categories.length} categorías
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Tags className="h-4 w-4 mr-2" />
                        Nueva Categoría
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Herramienta
                    </button>
                </div>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Buscar herramientas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                        />
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-orange-500"
                    >
                        <option value="">Todas las categorías</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-orange-500"
                    >
                        <option value="">Todos los estados</option>
                        <option value="AVAILABLE">Disponible</option>
                        <option value="LOANED">Prestado</option>
                        <option value="UNDER_REPAIR">En Reparación</option>
                        <option value="DECOMMISSIONED">Dado de Baja</option>
                    </select>

                    <label className="flex items-center text-white">
                        <input
                            type="checkbox"
                            checked={showLowStock}
                            onChange={(e) => setShowLowStock(e.target.checked)}
                            className="mr-2"
                        />
                        Stock bajo
                    </label>

                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('');
                            setSelectedStatus('');
                            setShowLowStock(false);
                        }}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Tabla de herramientas */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Herramienta
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Categoría
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Valor
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {filteredTools.map((tool) => (
                            <tr key={tool.id} className="hover:bg-gray-700 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="bg-gray-600 p-2 rounded-lg mr-3">
                                            <Package className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{tool.name}</div>
                                            <div className="text-sm text-gray-400">ID: {tool.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            {tool.category?.name || 'Sin categoría'}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="text-sm text-white">{tool.currentStock}/{tool.initialStock}</div>
                                        {tool.currentStock <= 5 && (
                                            <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                                        )}
                                    </div>
                                    <div className="w-full bg-gray-600 rounded-full h-1 mt-1">
                                        <div
                                            className={`h-1 rounded-full ${
                                                tool.currentStock <= 5 ? 'bg-red-500' : 'bg-green-500'
                                            }`}
                                            style={{
                                                width: `${Math.min((tool.currentStock / tool.initialStock) * 100, 100)}%`
                                            }}
                                        ></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={tool.status}
                                        onChange={(e) => handleUpdateStatus(tool.id, e.target.value)}
                                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${getStatusColor(tool.status)}`}
                                    >
                                        <option value="AVAILABLE">Disponible</option>
                                        <option value="LOANED">Prestado</option>
                                        <option value="UNDER_REPAIR">En Reparación</option>
                                        <option value="DECOMMISSIONED">Dado de Baja</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                    ${tool.replacementValue?.toFixed(2) || '0.00'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => openEditModal(tool)}
                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newStock = prompt('Nuevo stock:', tool.currentStock);
                                                if (newStock !== null && !isNaN(newStock)) {
                                                    handleUpdateStock(tool.id, parseInt(newStock));
                                                }
                                            }}
                                            className="text-green-400 hover:text-green-300 transition-colors"
                                            title="Actualizar Stock"
                                        >
                                            <Hash className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTool(tool.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {filteredTools.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            No se encontraron herramientas con los filtros aplicados
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para agregar herramienta */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4">Nueva Herramienta</h3>
                        <form onSubmit={handleCreateTool} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={toolForm.name}
                                    onChange={(e) => setToolForm({...toolForm, name: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Categoría *</label>
                                <select
                                    required
                                    value={toolForm.categoryId}
                                    onChange={(e) => setToolForm({...toolForm, categoryId: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Stock Inicial *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={toolForm.initialStock}
                                    onChange={(e) => setToolForm({...toolForm, initialStock: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Valor de Reposición *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={toolForm.replacementValue}
                                    onChange={(e) => setToolForm({...toolForm, replacementValue: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetToolForm();
                                    }}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para editar herramienta */}
            {showEditModal && selectedTool && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4">Editar Herramienta</h3>
                        <form onSubmit={handleEditTool} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={toolForm.name}
                                    onChange={(e) => setToolForm({...toolForm, name: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Categoría *</label>
                                <select
                                    required
                                    value={toolForm.categoryId}
                                    onChange={(e) => setToolForm({...toolForm, categoryId: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Stock Inicial *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={toolForm.initialStock}
                                    onChange={(e) => setToolForm({...toolForm, initialStock: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Valor de Reposición *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={toolForm.replacementValue}
                                    onChange={(e) => setToolForm({...toolForm, replacementValue: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedTool(null);
                                        resetToolForm();
                                    }}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Actualizar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para agregar categoría */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4">Nueva Categoría</h3>
                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                                <textarea
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCategoryModal(false);
                                        resetCategoryForm();
                                    }}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManagement;
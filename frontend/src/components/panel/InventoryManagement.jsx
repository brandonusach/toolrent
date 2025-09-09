import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Eye, Package, AlertTriangle,
    Search, X, RefreshCw, TrendingUp, TrendingDown
} from 'lucide-react';

const InventoryManagement = () => {
    const [tools, setTools] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedTool, setSelectedTool] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showInstanceModal, setShowInstanceModal] = useState(false);
    const [showDecommissionModal, setShowDecommissionModal] = useState(false);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [toolInstances, setToolInstances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [instancesLoading, setInstancesLoading] = useState(false); // Nuevo estado
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [decommissionQuantity, setDecommissionQuantity] = useState(1);
    const [addStockQuantity, setAddStockQuantity] = useState(1);

    // Formulario para herramientas
    const [newTool, setNewTool] = useState({
        name: '',
        category: null,
        initialStock: 1,
        replacementValue: 0
    });

    const [editTool, setEditTool] = useState({
        id: null,
        name: '',
        category: null,
        initialStock: 1,
        replacementValue: 0
    });

    // API Base URL
    const API_BASE = 'http://localhost:8081/api';

    // Cargar datos iniciales
    useEffect(() => {
        loadTools();
        loadCategories();
    }, []);

    const loadTools = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/tools`);
            if (response.ok) {
                const data = await response.json();
                console.log('Tools loaded:', data); // Debug
                setTools(data);
            } else {
                console.error('Error loading tools:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error loading tools:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await fetch(`${API_BASE}/categories`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

// FUNCIÓN CORREGIDA: Cargar instancias de herramientas
    const loadToolInstances = async (toolId) => {
        setInstancesLoading(true);
        setToolInstances([]); // Limpiar instancias previas

        console.log(`Loading instances for tool ID: ${toolId}`); // Debug

        try {
            const response = await fetch(`${API_BASE}/tool-instances/tool/${toolId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                    // Removido el token de autorización ya que no está definido
                }
            });

            console.log('Response status:', response.status); // Debug
            console.log('Response headers:', response.headers); // Debug

            if (response.ok) {
                const data = await response.json();
                console.log('Tool instances loaded:', data); // Debug

                // Verificar que data sea un array
                if (Array.isArray(data)) {
                    setToolInstances(data);
                    console.log(`Successfully loaded ${data.length} instances`); // Debug
                } else {
                    console.warn('Expected array but got:', typeof data, data);
                    setToolInstances([]);
                    alert('Error: La respuesta del servidor no es válida');
                }
            } else {
                const errorText = await response.text();
                console.error('Error loading tool instances:', response.status, errorText);
                setToolInstances([]);

                // Mostrar error específico al usuario
                if (response.status === 404) {
                    alert('No se encontraron instancias para esta herramienta');
                } else if (response.status === 500) {
                    alert('Error interno del servidor al cargar instancias');
                } else {
                    alert(`Error al cargar instancias: ${response.status} - ${errorText}`);
                }
            }
        } catch (error) {
            console.error('Network error loading tool instances:', error);
            setToolInstances([]);

            // Verificar si es un error de conexión
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                alert('Error de conexión: Verifique que el servidor esté funcionando');
            } else {
                alert('Error de conexión al cargar instancias de herramientas');
            }
        } finally {
            setInstancesLoading(false);
        }
    };

    // Registrar nueva herramienta
    const handleAddTool = async () => {
        if (!newTool.name || !newTool.category || newTool.replacementValue <= 0) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/tools`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTool),
            });

            if (response.ok) {
                const createdTool = await response.json();
                setTools([...tools, createdTool]);
                setShowAddModal(false);
                setNewTool({
                    name: '',
                    category: null,
                    initialStock: 1,
                    replacementValue: 0
                });
                alert('Herramienta registrada exitosamente');
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            console.error('Error adding tool:', error);
            alert('Error al registrar la herramienta');
        }
    };

    // Actualizar herramienta
    const handleEditTool = async () => {
        try {
            const response = await fetch(`${API_BASE}/tools/${editTool.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editTool),
            });

            if (response.ok) {
                const updatedTool = await response.json();
                setTools(tools.map(tool =>
                    tool.id === editTool.id ? updatedTool : tool
                ));
                setShowEditModal(false);
                alert('Herramienta actualizada exitosamente');
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            console.error('Error updating tool:', error);
        }
    };

    // Dar de baja herramientas
    const handleDecommissionTool = async () => {
        if (!selectedTool || decommissionQuantity <= 0) {
            alert('Por favor seleccione una cantidad válida');
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/tools/${selectedTool.id}/decommission?quantity=${decommissionQuantity}`,
                { method: 'PUT' }
            );

            if (response.ok) {
                const updatedTool = await response.json();
                setTools(tools.map(tool =>
                    tool.id === selectedTool.id ? updatedTool : tool
                ));
                setShowDecommissionModal(false);
                setDecommissionQuantity(1);
                alert(`${decommissionQuantity} unidad(es) dada(s) de baja exitosamente`);
                if (showInstanceModal) {
                    loadToolInstances(selectedTool.id);
                }
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            console.error('Error decommissioning tool:', error);
        }
    };

    // Eliminar herramienta completamente
    const handleDeleteTool = async (toolId) => {
        if (!window.confirm('¿Está seguro de eliminar esta herramienta permanentemente?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/tools/${toolId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setTools(tools.filter(tool => tool.id !== toolId));
                alert('Herramienta eliminada exitosamente');
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            console.error('Error deleting tool:', error);
        }
    };

    // Agregar stock
    const handleAddStock = async () => {
        if (!selectedTool || addStockQuantity <= 0) {
            alert('Por favor seleccione una cantidad válida');
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/tools/${selectedTool.id}/add-stock?quantity=${addStockQuantity}`,
                { method: 'POST' }
            );

            if (response.ok) {
                const updatedTool = await response.json();
                setTools(tools.map(tool =>
                    tool.id === selectedTool.id ? updatedTool : tool
                ));
                setShowAddStockModal(false);
                setAddStockQuantity(1);
                alert(`${addStockQuantity} unidad(es) agregada(s) exitosamente`);

                // CORRECCIÓN: Verificar correctamente si el modal está abierto
                if (showInstanceModal && selectedTool?.id) {
                    loadToolInstances(selectedTool.id);
                }
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            console.error('Error adding stock:', error);
        }
    };

    // FUNCIÓN CORREGIDA: Abrir modal de instancias
    const handleViewInstances = (tool) => {
        console.log('Opening instances modal for tool:', tool); // Debug
        setSelectedTool(tool);
        setToolInstances([]); // Limpiar instancias previas
        setShowInstanceModal(true);
        loadToolInstances(tool.id);
    };

    // Actualizar estado de instancia individual
    const handleUpdateInstanceStatus = async (instanceId, newStatus) => {
        console.log(`Updating instance ${instanceId} to status ${newStatus}`); // Debug

        try {
            const response = await fetch(`${API_BASE}/tool-instances/${instanceId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                loadToolInstances(selectedTool.id);
                loadTools();
                alert('Estado de instancia actualizado exitosamente');
            } else {
                const errorText = await response.text();
                console.error('Error updating instance status:', errorText);
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            console.error('Error updating instance status:', error);
            alert('Error al actualizar el estado de la instancia');
        }
    };

    // Eliminar instancia individual
    const handleDeleteInstance = async (instanceId) => {
        if (!window.confirm('¿Está seguro de eliminar esta instancia permanentemente?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/tool-instances/${instanceId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadToolInstances(selectedTool.id);
                loadTools();
                alert('Instancia eliminada exitosamente');
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText}`);
            }
        } catch (error) {
            console.error('Error deleting instance:', error);
            alert('Error al eliminar la instancia');
        }
    };

    // Filtrar herramientas
    const filteredTools = tools.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' ||
            (tool.category && tool.category.id.toString() === categoryFilter);

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-6 bg-gray-900 min-h-screen">
            {/* Header simplificado */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Administra el catálogo de herramientas</h1>
                <p className="text-gray-400">Gestiona herramientas y su estado individual</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Buscar herramientas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                >
                    <option value="ALL">Todas las Categorías</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Herramienta
                </button>

                <button
                    onClick={loadTools}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Tools Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
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
                                Valor Reposición
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                        {filteredTools.map((tool) => (
                            <tr key={tool.id} className="hover:bg-gray-750">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-white font-medium">{tool.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-gray-300">{tool.category?.name || 'Sin categoría'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <span className={`text-sm font-medium ${(tool.currentStock || 0) <= 2 ? 'text-red-400' : 'text-gray-300'}`}>
                                            {tool.currentStock || 0} / {tool.initialStock}
                                        </span>
                                        {(tool.currentStock || 0) <= 2 && (
                                            <AlertTriangle className="h-4 w-4 text-red-400 ml-2" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                    ${tool.replacementValue?.toLocaleString() || '0'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleViewInstances(tool)}
                                            className="text-blue-400 hover:text-blue-300 p-1 rounded"
                                            title="Ver Instancias"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditTool({
                                                    id: tool.id,
                                                    name: tool.name,
                                                    category: tool.category,
                                                    initialStock: tool.initialStock,
                                                    replacementValue: tool.replacementValue
                                                });
                                                setShowEditModal(true);
                                            }}
                                            className="text-yellow-400 hover:text-yellow-300 p-1 rounded"
                                            title="Editar"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedTool(tool);
                                                setShowAddStockModal(true);
                                            }}
                                            className="text-green-400 hover:text-green-300 p-1 rounded"
                                            title="Agregar Stock"
                                        >
                                            <TrendingUp className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedTool(tool);
                                                setShowDecommissionModal(true);
                                            }}
                                            className="text-orange-400 hover:text-orange-300 p-1 rounded"
                                            title="Dar de Baja"
                                        >
                                            <TrendingDown className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTool(tool.id)}
                                            className="text-red-400 hover:text-red-300 p-1 rounded"
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
                </div>

                {filteredTools.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No se encontraron herramientas</p>
                    </div>
                )}
            </div>

            {/* Modal: Agregar Herramienta */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Registrar Nueva Herramienta</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre *</label>
                                <input
                                    type="text"
                                    value={newTool.name}
                                    onChange={(e) => setNewTool({...newTool, name: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                    placeholder="Nombre de la herramienta"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Categoría *</label>
                                <select
                                    value={newTool.category?.id || ''}
                                    onChange={(e) => {
                                        const selectedCategory = categories.find(c => c.id.toString() === e.target.value);
                                        setNewTool({...newTool, category: selectedCategory});
                                    }}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Stock Inicial *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newTool.initialStock}
                                    onChange={(e) => setNewTool({...newTool, initialStock: parseInt(e.target.value) || 1})}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Valor de Reposición *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newTool.replacementValue}
                                    onChange={(e) => setNewTool({...newTool, replacementValue: parseFloat(e.target.value) || 0})}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={handleAddTool}
                                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                Registrar
                            </button>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Editar Herramienta */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Editar Herramienta</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre *</label>
                                <input
                                    type="text"
                                    value={editTool.name}
                                    onChange={(e) => setEditTool({...editTool, name: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                    placeholder="Nombre de la herramienta"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Categoría *</label>
                                <select
                                    value={editTool.category?.id || ''}
                                    onChange={(e) => {
                                        const selectedCategory = categories.find(c => c.id.toString() === e.target.value);
                                        setEditTool({...editTool, category: selectedCategory});
                                    }}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Stock Inicial *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={editTool.initialStock}
                                    onChange={(e) => setEditTool({...editTool, initialStock: parseInt(e.target.value) || 1})}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Valor de Reposición *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editTool.replacementValue}
                                    onChange={(e) => setEditTool({...editTool, replacementValue: parseFloat(e.target.value) || 0})}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={handleEditTool}
                                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                Actualizar
                            </button>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Agregar Stock - Interfaz mejorada */}
            {showAddStockModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Agregar Stock</h3>

                        <div className="mb-4">
                            <p className="text-gray-300 mb-2">
                                Herramienta: <span className="font-semibold text-white">{selectedTool?.name}</span>
                            </p>
                            <p className="text-gray-300 mb-4">
                                Stock actual: <span className="font-semibold text-white">{selectedTool?.currentStock || 0}</span>
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Cantidad a agregar *
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={addStockQuantity}
                                onChange={(e) => setAddStockQuantity(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                            />
                            <p className="text-sm text-gray-400 mt-1">
                                Stock final: {(selectedTool?.currentStock || 0) + addStockQuantity}
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={handleAddStock}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                            >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Agregar Stock
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddStockModal(false);
                                    setAddStockQuantity(1);
                                }}
                                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Dar de Baja - Interfaz mejorada */}
            {showDecommissionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Dar de Baja Herramientas</h3>

                        <div className="mb-4">
                            <p className="text-gray-300 mb-2">
                                Herramienta: <span className="font-semibold text-white">{selectedTool?.name}</span>
                            </p>
                            <p className="text-gray-300 mb-4">
                                Stock disponible: <span className="font-semibold text-white">{selectedTool?.currentStock || 0}</span>
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Cantidad a dar de baja *
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={selectedTool?.currentStock || 0}
                                value={decommissionQuantity}
                                onChange={(e) => setDecommissionQuantity(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                            />
                            <p className="text-sm text-gray-400 mt-1">
                                Stock restante: {Math.max(0, (selectedTool?.currentStock || 0) - decommissionQuantity)}
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={handleDecommissionTool}
                                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                            >
                                <TrendingDown className="h-4 w-4 mr-2" />
                                Dar de Baja
                            </button>
                            <button
                                onClick={() => {
                                    setShowDecommissionModal(false);
                                    setDecommissionQuantity(1);
                                }}
                                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Ver Instancias */}
            {showInstanceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">
                                Instancias de: {selectedTool?.name}
                            </h3>
                            <button
                                onClick={() => setShowInstanceModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-gray-300">
                                Stock Total: {selectedTool?.currentStock || 0} unidades
                            </p>
                        </div>

                        <div className="overflow-y-auto max-h-96">
                            <div className="grid gap-3">
                                {toolInstances.map((instance) => (
                                    <div key={instance.id} className="bg-gray-700 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-white font-medium">ID: {instance.id}</p>

                                                <div className="flex items-center mt-2">
                                                    <span className="text-sm font-medium text-gray-300 mr-2">Estado:</span>
                                                    <select
                                                        value={instance.status}
                                                        onChange={(e) => handleUpdateInstanceStatus(instance.id, e.target.value)}
                                                        className="text-xs px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:border-orange-500"
                                                    >
                                                        <option value="AVAILABLE">Disponible</option>
                                                        <option value="LOANED">Prestada</option>
                                                        <option value="UNDER_REPAIR">En Reparación</option>
                                                        <option value="DECOMMISSIONED">Dada de Baja</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    instance.status === 'AVAILABLE' ? 'bg-green-900 text-green-300' :
                                                        instance.status === 'LOANED' ? 'bg-blue-900 text-blue-300' :
                                                            instance.status === 'UNDER_REPAIR' ? 'bg-yellow-900 text-yellow-300' :
                                                                'bg-red-900 text-red-300'
                                                }`}>
                                                    {instance.status === 'AVAILABLE' ? 'Disponible' :
                                                        instance.status === 'LOANED' ? 'Prestada' :
                                                            instance.status === 'UNDER_REPAIR' ? 'En Reparación' :
                                                                'Dada de Baja'}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteInstance(instance.id)}
                                                    className="text-red-400 hover:text-red-300 p-1 rounded"
                                                    title="Eliminar Instancia"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {toolInstances.length === 0 && (
                                    <div className="text-center py-8">
                                        <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                                        <p className="text-gray-400">No hay instancias registradas</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManagement;
import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit3,
    Trash2,
    AlertTriangle,
    Package,
    Wrench,
    Eye,
    Settings,
    RefreshCw,
    X,
    Check,
    Minus,
    TrendingDown,
    FileText,
    Users,
    Tool,
    Hash,
    Clock,
    DollarSign,
    Archive,
    PlusCircle
} from 'lucide-react';

const InventoryManagement = () => {
    // State management
    const [tools, setTools] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedTool, setSelectedTool] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        initialStock: '',
        replacementValue: '',
        description: ''
    });
    const [stockData, setStockData] = useState({
        quantity: ''
    });

    // Mock data para pruebas
    const mockTools = [
        {
            id: 1,
            name: 'Martillo',
            category: { id: 1, name: 'Herramientas Manuales' },
            currentStock: 5,
            initialStock: 10,
            replacementValue: 25.50,
            status: 'AVAILABLE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Destornillador',
            category: { id: 1, name: 'Herramientas Manuales' },
            currentStock: 0,
            initialStock: 15,
            replacementValue: 12.75,
            status: 'LOANED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    const mockCategories = [
        { id: 1, name: 'Herramientas Manuales' },
        { id: 2, name: 'Herramientas Eléctricas' }
    ];

    // API Base URL - configurable
    const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8081/api';

    // Estados de herramientas
    const TOOL_STATUS = {
        AVAILABLE: { label: 'Disponible', color: 'bg-green-100 text-green-800', icon: Package },
        LOANED: { label: 'Todas Prestadas', color: 'bg-yellow-100 text-yellow-800', icon: Users },
        DECOMMISSIONED: { label: 'Dada de Baja', color: 'bg-red-100 text-red-800', icon: TrendingDown }
    };

    // Cargar datos iniciales
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Cargando datos iniciales...');

            // Intentar cargar desde API primero
            try {
                await Promise.all([
                    loadTools(),
                    loadCategories()
                ]);
                console.log('Datos cargados desde API exitosamente');
            } catch (apiError) {
                console.warn('Error al cargar desde API, usando datos mock:', apiError);
                // Fallback a datos mock
                setTools(mockTools);
                setCategories(mockCategories);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
            setError('Error al cargar los datos: ' + error.message);
            // Usar datos mock como último recurso
            setTools(mockTools);
            setCategories(mockCategories);
        } finally {
            setLoading(false);
        }
    };

    const loadTools = async () => {
        try {
            console.log('Intentando cargar herramientas desde:', `${API_BASE}/tools`);
            const response = await fetch(`${API_BASE}/tools`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Herramientas cargadas:', data);
            setTools(data);
        } catch (error) {
            console.error('Error loading tools:', error);
            throw error;
        }
    };

    const loadCategories = async () => {
        try {
            console.log('Intentando cargar categorías desde:', `${API_BASE}/categories`);
            const response = await fetch(`${API_BASE}/categories`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Categorías cargadas:', data);
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
            throw error;
        }
    };

    // Filtrar herramientas con validación
    const filteredTools = React.useMemo(() => {
        if (!Array.isArray(tools)) {
            console.warn('Tools is not an array:', tools);
            return [];
        }

        return tools.filter(tool => {
            if (!tool) return false;

            const matchesSearch = !searchTerm ||
                (tool.name && tool.name.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'ALL' || tool.status === statusFilter;
            const matchesCategory = categoryFilter === 'ALL' ||
                (tool.category && tool.category.id.toString() === categoryFilter);

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [tools, searchTerm, statusFilter, categoryFilter]);

    // Manejar creación de herramienta
    const handleToolSubmit = async (e) => {
        e.preventDefault();

        try {
            const selectedCategory = categories.find(cat => cat.id.toString() === formData.categoryId);

            if (!selectedCategory) {
                setError('Debe seleccionar una categoría válida');
                return;
            }

            const payload = {
                name: formData.name.trim(),
                category: selectedCategory,
                initialStock: parseInt(formData.initialStock) || 0,
                replacementValue: parseFloat(formData.replacementValue) || 0
            };

            console.log('Enviando payload:', payload);

            const response = await fetch(`${API_BASE}/tools`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                await loadTools();
                closeModal();
            } else {
                const errorText = await response.text();
                setError('Error al crear herramienta: ' + errorText);
            }
        } catch (error) {
            console.error('Error creating tool:', error);
            setError('Error de conexión al crear la herramienta');
        }
    };

    // Abrir modal
    const openModal = (type, tool = null) => {
        console.log('Abriendo modal:', type, tool);
        setModalType(type);
        setShowModal(true);
        setError(null);

        if (type === 'create') {
            setFormData({
                name: '',
                categoryId: '',
                initialStock: '',
                replacementValue: '',
                description: ''
            });
        } else if (type === 'edit' && tool) {
            setSelectedTool(tool);
            setFormData({
                name: tool.name || '',
                categoryId: tool.category?.id?.toString() || '',
                initialStock: tool.initialStock?.toString() || '',
                replacementValue: tool.replacementValue?.toString() || '',
                description: ''
            });
        } else if (type === 'details' && tool) {
            setSelectedTool(tool);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setSelectedTool(null);
        setFormData({
            name: '',
            categoryId: '',
            initialStock: '',
            replacementValue: '',
            description: ''
        });
        setStockData({ quantity: '' });
        setError(null);
    };

    // Obtener estadísticas con validación
    const getToolStats = React.useMemo(() => {
        if (!Array.isArray(tools)) return { total: 0, available: 0, loaned: 0, decommissioned: 0, lowStock: 0, totalValue: 0, totalUnits: 0 };

        const total = tools.length;
        const available = tools.filter(t => t && t.status === 'AVAILABLE').length;
        const loaned = tools.filter(t => t && t.status === 'LOANED').length;
        const decommissioned = tools.filter(t => t && t.status === 'DECOMMISSIONED').length;
        const lowStock = tools.filter(t => t && t.currentStock <= 2 && t.currentStock > 0).length;
        const totalValue = tools.reduce((sum, tool) => {
            if (!tool) return sum;
            return sum + ((tool.replacementValue || 0) * (tool.initialStock || 0));
        }, 0);
        const totalUnits = tools.reduce((sum, tool) => {
            if (!tool) return sum;
            return sum + (tool.initialStock || 0);
        }, 0);

        return { total, available, loaned, decommissioned, lowStock, totalValue, totalUnits };
    }, [tools]);

    // Renderizado condicional para debugging
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-2 text-gray-400">Cargando herramientas...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-gray-900 min-h-screen p-6">
            {/* Debug Info */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium text-yellow-400 mb-2">Debug Info</h3>
                <div className="text-xs text-gray-400 space-y-1">
                    <div>API Base: {API_BASE}</div>
                    <div>Tools count: {Array.isArray(tools) ? tools.length : 'Not array'}</div>
                    <div>Categories count: {Array.isArray(categories) ? categories.length : 'Not array'}</div>
                    <div>Filtered tools: {filteredTools.length}</div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            {error}
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-300 hover:text-red-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gestión de Herramientas</h2>
                    <p className="text-gray-400 mt-1">Administrar herramientas del inventario</p>
                </div>
                <button
                    onClick={() => openModal('create')}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Herramienta
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Herramientas</p>
                            <p className="text-xl font-bold text-white">{getToolStats.total}</p>
                        </div>
                        <Tool className="h-6 w-6 text-blue-500" />
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Disponibles</p>
                            <p className="text-xl font-bold text-white">{getToolStats.available}</p>
                        </div>
                        <Package className="h-6 w-6 text-green-500" />
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Agotadas</p>
                            <p className="text-xl font-bold text-white">{getToolStats.loaned}</p>
                        </div>
                        <Users className="h-6 w-6 text-yellow-500" />
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">De Baja</p>
                            <p className="text-xl font-bold text-white">{getToolStats.decommissioned}</p>
                        </div>
                        <TrendingDown className="h-6 w-6 text-red-500" />
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Stock Bajo</p>
                            <p className="text-xl font-bold text-white">{getToolStats.lowStock}</p>
                        </div>
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Unidades Totales</p>
                            <p className="text-xl font-bold text-white">{getToolStats.totalUnits}</p>
                        </div>
                        <Hash className="h-6 w-6 text-purple-500" />
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Valor Total</p>
                            <p className="text-xl font-bold text-white">${getToolStats.totalValue.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-6 w-6 text-green-500" />
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Buscar herramientas por nombre..."
                                className="pl-10 pr-4 py-2 w-full bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Todos los estados</option>
                        <option value="AVAILABLE">Disponible</option>
                        <option value="LOANED">Agotadas</option>
                        <option value="DECOMMISSIONED">Dadas de Baja</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="ALL">Todas las categorías</option>
                        {Array.isArray(categories) && categories.map(category => (
                            <option key={category.id} value={category.id.toString()}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={loadInitialData}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Tools Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-750">
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
                                Valor Unit.
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Valor Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                        {Array.isArray(filteredTools) && filteredTools.length > 0 ? (
                            filteredTools.map((tool) => {
                                if (!tool) return null;

                                const status = TOOL_STATUS[tool.status] || TOOL_STATUS.AVAILABLE;
                                const StatusIcon = status.icon;
                                const totalValue = (tool.replacementValue || 0) * (tool.initialStock || 0);

                                return (
                                    <tr key={tool.id} className="hover:bg-gray-750">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <Tool className="h-5 w-5 text-gray-400 mr-3" />
                                                <div>
                                                    <div className="text-sm font-medium text-white">
                                                        {tool.name || 'Sin nombre'}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        ID: {tool.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-300">
                                                {tool.category?.name || 'Sin categoría'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-white">
                                                <span className={tool.currentStock <= 2 ? 'text-red-400' : 'text-white'}>
                                                    {tool.currentStock || 0}
                                                </span>
                                                <span className="text-gray-400"> / {tool.initialStock || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-300">
                                                ${(tool.replacementValue || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-white font-medium">
                                                ${totalValue.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => openModal('details', tool)}
                                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openModal('edit', tool)}
                                                    className="text-green-400 hover:text-green-300 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                                    No se encontraron herramientas
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">
                                {modalType === 'create' && 'Registrar Nueva Herramienta'}
                                {modalType === 'edit' && 'Editar Herramienta'}
                                {modalType === 'details' && 'Detalles de la Herramienta'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        {(modalType === 'create' || modalType === 'edit') && (
                            <form onSubmit={handleToolSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Categoría *
                                    </label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                                    >
                                        <option value="">Seleccionar categoría</option>
                                        {Array.isArray(categories) && categories.map(category => (
                                            <option key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Stock Inicial *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                        value={formData.initialStock}
                                        onChange={(e) => setFormData({...formData, initialStock: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Valor de Reposición *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                                        value={formData.replacementValue}
                                        onChange={(e) => setFormData({...formData, replacementValue: e.target.value})}
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                                    >
                                        {modalType === 'create' ? 'Registrar' : 'Actualizar'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {modalType === 'details' && selectedTool && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-gray-700 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-300 mb-2">Información General</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-400">ID:</span>
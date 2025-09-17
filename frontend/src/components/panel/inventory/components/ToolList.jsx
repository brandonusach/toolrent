// inventory/components/ToolList.jsx - PURE VERSION
import React from 'react';
import {
    Plus, Edit2, Trash2, Eye, Package, AlertTriangle,
    Search, RefreshCw, TrendingUp, TrendingDown
} from 'lucide-react';

const ToolList = ({
                      tools,
                      categories,
                      loading,
                      searchTerm,
                      setSearchTerm,
                      categoryFilter,
                      setCategoryFilter,
                      onViewInstances,
                      onEditTool,
                      onDeleteTool,
                      onAddStock,
                      onDecommission,
                      onAddNew,
                      onRefresh
                  }) => {

    // Simple client-side filtering (only UI logic)
    const filteredTools = tools.filter(tool => {
        const matchesSearch = !searchTerm ||
            tool.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' ||
            (tool.category && tool.category.id.toString() === categoryFilter);
        return matchesSearch && matchesCategory;
    });

    const handleDeleteTool = async (toolId) => {
        if (!window.confirm('¿Está seguro de eliminar esta herramienta permanentemente?')) {
            return;
        }
        try {
            await onDeleteTool(toolId);
            alert('Herramienta eliminada exitosamente');
        } catch (error) {
            alert('Error al eliminar la herramienta');
        }
    };

    return (
        <div>
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
                    onClick={onAddNew}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Herramienta
                </button>

                <button
                    onClick={onRefresh}
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
                                        {/* Display stock as provided by backend, with optional styling based on values */}
                                        <span className={`text-sm font-medium ${
                                            tool.currentStock <= 0
                                                ? 'text-red-400'
                                                : tool.currentStock <= 2
                                                    ? 'text-orange-400'
                                                    : 'text-gray-300'
                                        }`}>
                                            {tool.currentStock || 0} / {tool.initialStock || 0}
                                        </span>
                                        {tool.currentStock <= 2 && (
                                            <AlertTriangle className="h-4 w-4 text-orange-400 ml-2" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                    ${(tool.replacementValue || 0).toLocaleString('es-CL')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onViewInstances(tool)}
                                            className="text-blue-400 hover:text-blue-300 p-1 rounded"
                                            title="Ver Instancias"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onEditTool(tool)}
                                            className="text-yellow-400 hover:text-yellow-300 p-1 rounded"
                                            title="Editar"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onAddStock(tool)}
                                            className="text-green-400 hover:text-green-300 p-1 rounded"
                                            title="Agregar Stock"
                                        >
                                            <TrendingUp className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onDecommission(tool)}
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
                        <p className="text-gray-400">
                            {loading ? 'Cargando herramientas...' : 'No se encontraron herramientas'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolList;
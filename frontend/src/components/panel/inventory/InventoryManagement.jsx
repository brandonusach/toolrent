// inventory/InventoryManagement.jsx
import React, { useState, useEffect } from 'react';
import ToolList from './components/ToolList';
import ToolForm from './components/ToolForm';
import InstanceManager from './components/InstanceManager';
import StockManager from './components/StockManager';
import { useTools } from './hooks/useTools';
import { useCategories } from './hooks/useCategories';

const InventoryManagement = () => {
    // Estados principales para modales
    const [selectedTool, setSelectedTool] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showInstanceModal, setShowInstanceModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'add-stock' | 'decommission'

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    // Custom hooks para datos y operaciones
    const {
        tools,
        loading,
        loadTools,
        createTool,
        updateTool,
        deleteTool,
        updateStock,
        decommissionTool,
        getToolStats
    } = useTools();

    const { categories, loadCategories } = useCategories();

    // Cargar datos iniciales
    useEffect(() => {
        loadTools();
        loadCategories();
    }, [loadTools, loadCategories]);

    // Handlers para gestión de modales
    const handleViewInstances = (tool) => {
        setSelectedTool(tool);
        setShowInstanceModal(true);
    };

    const handleEditTool = (tool) => {
        setSelectedTool(tool);
        setShowEditModal(true);
    };

    const handleStockAction = (tool, type) => {
        setSelectedTool(tool);
        setModalType(type);
        setShowStockModal(true);
    };

    const closeAllModals = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowInstanceModal(false);
        setShowStockModal(false);
        setSelectedTool(null);
        setModalType('');
    };

    // Handler para crear herramienta
    const handleCreateTool = async (toolData) => {
        try {
            await createTool(toolData);
            closeAllModals();
        } catch (error) {
            throw error; // Re-lanzar para que el componente ToolForm lo maneje
        }
    };

    // Handler para actualizar herramienta
    const handleUpdateTool = async (toolId, toolData) => {
        try {
            await updateTool(toolId, toolData);
            closeAllModals();
        } catch (error) {
            throw error; // Re-lanzar para que el componente ToolForm lo maneje
        }
    };

    // Handler para actualizar stock exitosamente
    const handleStockUpdateSuccess = () => {
        loadTools(); // Recargar tools para reflejar cambios
        closeAllModals();
    };

    // Handler para actualización de instancias
    const handleInstanceUpdate = () => {
        loadTools(); // Recargar tools cuando las instancias cambien
    };

    // Obtener estadísticas para mostrar en el header (opcional)
    const stats = getToolStats();

    return (
        <div className="p-6 bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Administra el catálogo de herramientas
                </h1>
                <p className="text-gray-400 mb-4">
                    Gestiona herramientas y su estado individual
                </p>

                {/* Estadísticas rápidas (opcional) */}
                {stats.totalTools > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{stats.totalTools}</div>
                            <div className="text-sm text-gray-400">Total Herramientas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{stats.totalStock}</div>
                            <div className="text-sm text-gray-400">Stock Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-400">{stats.lowStockTools}</div>
                            <div className="text-sm text-gray-400">Stock Bajo</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-400">{stats.noStockTools}</div>
                            <div className="text-sm text-gray-400">Sin Stock</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Lista principal de herramientas */}
            <ToolList
                tools={tools}
                categories={categories}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                onViewInstances={handleViewInstances}
                onEditTool={handleEditTool}
                onDeleteTool={deleteTool}
                onAddStock={(tool) => handleStockAction(tool, 'add-stock')}
                onDecommission={(tool) => handleStockAction(tool, 'decommission')}
                onAddNew={() => setShowAddModal(true)}
                onRefresh={loadTools}
            />

            {/* Modal: Agregar nueva herramienta */}
            {showAddModal && (
                <ToolForm
                    mode="create"
                    categories={categories}
                    onSubmit={handleCreateTool}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {/* Modal: Editar herramienta existente */}
            {showEditModal && selectedTool && (
                <ToolForm
                    mode="edit"
                    tool={selectedTool}
                    categories={categories}
                    onSubmit={handleUpdateTool}
                    onClose={() => setShowEditModal(false)}
                />
            )}

            {/* Modal: Ver y gestionar instancias */}
            {showInstanceModal && selectedTool && (
                <InstanceManager
                    tool={selectedTool}
                    onClose={() => setShowInstanceModal(false)}
                    onInstanceUpdate={handleInstanceUpdate}
                />
            )}

            {/* Modal: Gestión de stock (agregar/dar de baja) */}
            {showStockModal && selectedTool && (
                <StockManager
                    tool={selectedTool}
                    type={modalType}
                    onUpdateStock={modalType === 'add-stock' ? updateStock : decommissionTool}
                    onClose={() => setShowStockModal(false)}
                    onSuccess={handleStockUpdateSuccess}
                />
            )}
        </div>
    );
};

export default InventoryManagement;
// inventory/InventoryManagement.jsx - PURE VERSION
import React, { useState, useEffect } from 'react';
import ToolList from './components/ToolList';
import ToolForm from './components/ToolForm';
import InstanceManager from './components/InstanceManager';
import StockManager from './components/StockManager';
import { useTools } from './hooks/useTools';
import { useCategories } from './hooks/useCategories';

const InventoryManagement = () => {
    // Modal states
    const [selectedTool, setSelectedTool] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showInstanceModal, setShowInstanceModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'add-stock' | 'decommission'

    // Filter states (UI only)
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    // Data hooks (pure API operations)
    const {
        tools,
        loading,
        loadTools,
        createTool,
        updateTool,
        deleteTool,
        updateStock,
        decommissionTool,
        filterTools
    } = useTools();

    const { categories, loadCategories } = useCategories();

    // Load initial data
    useEffect(() => {
        loadTools();
        loadCategories();
    }, [loadTools, loadCategories]);

    // Modal handlers (pure UI logic)
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

    // CRUD handlers (minimal frontend logic)
    const handleCreateTool = async (toolData) => {
        await createTool(toolData);
        closeAllModals();
    };

    const handleUpdateTool = async (toolId, toolData) => {
        await updateTool(toolId, toolData);
        closeAllModals();
    };

    const handleStockUpdateSuccess = () => {
        loadTools(); // Refresh data from backend
        closeAllModals();
    };


    // Get filtered tools for display
    const filteredTools = filterTools(searchTerm, categoryFilter);

    // Simple stats calculation for display (not business logic)
    const displayStats = {
        totalTools: tools.length,
        totalStock: tools.reduce((sum, tool) => sum + (tool.currentStock || 0), 0),
        lowStockTools: tools.filter(tool => (tool.currentStock || 0) <= 2).length,
        noStockTools: tools.filter(tool => (tool.currentStock || 0) === 0).length
    };

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

                {/* Quick Stats Display */}
                {displayStats.totalTools > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{displayStats.totalTools}</div>
                            <div className="text-sm text-gray-400">Total Herramientas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{displayStats.totalStock}</div>
                            <div className="text-sm text-gray-400">Stock Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-400">{displayStats.lowStockTools}</div>
                            <div className="text-sm text-gray-400">Stock Bajo</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-400">{displayStats.noStockTools}</div>
                            <div className="text-sm text-gray-400">Sin Stock</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Tool List */}
            <ToolList
                tools={filteredTools}
                categories={categories}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                onViewInstances={handleViewInstances}
                onEditTool={handleEditTool}
                onAddStock={(tool) => handleStockAction(tool, 'add-stock')}
                onDecommission={(tool) => handleStockAction(tool, 'decommission')}
                onAddNew={() => setShowAddModal(true)}
                onRefresh={loadTools}
            />

            {/* Modal: Add New Tool */}
            {showAddModal && (
                <ToolForm
                    mode="create"
                    categories={categories}
                    existingTools={tools}
                    onSubmit={handleCreateTool}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {/* Modal: Edit Existing Tool */}
            {showEditModal && selectedTool && (
                <ToolForm
                    mode="edit"
                    tool={selectedTool}
                    categories={categories}
                    existingTools={tools}
                    onSubmit={handleUpdateTool}
                    onClose={() => setShowEditModal(false)}
                />
            )}

            {/* Modal: View and Manage Instances */}
            {showInstanceModal && selectedTool && (
                <InstanceManager
                    tool={selectedTool}
                    onClose={() => setShowInstanceModal(false)}
                />
            )}

            {/* Modal: Stock Management */}
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
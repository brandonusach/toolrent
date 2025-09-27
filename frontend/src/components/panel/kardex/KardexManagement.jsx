import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, BarChart3, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { useKardex } from './hooks/useKardex';
import { useTools } from '../inventory/hooks/useTools';
import MovementsList from './components/MovementsList';
import MovementDetail from './components/MovementDetail';
import KardexByTool from './components/KardexByTool';
import DateRangeReport from './components/DateRangeReport';
import MovementFilters from './components/MovementFilters';

const KardexManagement = () => {
    const [activeView, setActiveView] = useState('list'); // 'list', 'byTool', 'dateRange', 'detail'
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [selectedTool, setSelectedTool] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        type: 'ALL',
        tool: 'ALL',
        dateStart: '',
        dateEnd: ''
    });

    const {
        movements,
        loading,
        error,
        loadMovements,
        getMovementStatistics,
        filterMovements
    } = useKardex();

    const { tools, loadTools } = useTools();

    // Load data on component mount
    useEffect(() => {
        loadMovements();
        loadTools();
    }, [loadMovements, loadTools]);

    // Get filtered movements
    const filteredMovements = filterMovements(filters.search, filters.type, filters.tool);

    // Get statistics
    const stats = getMovementStatistics();

    const handleViewDetail = (movement) => {
        setSelectedMovement(movement);
        setActiveView('detail');
    };

    const handleViewByTool = (tool) => {
        setSelectedTool(tool);
        setActiveView('byTool');
    };

    const handleFiltersChange = (newFilters) => {
        setFilters({ ...filters, ...newFilters });
    };

    const renderHeader = () => (
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 mb-8 border border-slate-700/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Gestión de Kardex</h1>
                    <p className="text-slate-400 mt-1">Consulta y auditoría de movimientos de inventario</p>
                </div>

                {/* View buttons */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveView('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeView === 'list'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        <Eye className="w-4 h-4" />
                        Lista General
                    </button>
                    <button
                        onClick={() => setActiveView('byTool')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeView === 'byTool'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Por Herramienta
                    </button>
                    <button
                        onClick={() => setActiveView('dateRange')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeView === 'dateRange'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Por Fechas
                    </button>
                </div>
            </div>

            {/* Statistics cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Movimientos</p>
                            <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-400" />
                    </div>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Préstamos</p>
                            <p className="text-2xl font-bold text-slate-100">{stats.byType['LOAN'] || 0}</p>
                        </div>
                        <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                            <div className="w-3 h-3 rounded bg-red-500"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Devoluciones</p>
                            <p className="text-2xl font-bold text-slate-100">{stats.byType['RETURN'] || 0}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Reparaciones</p>
                            <p className="text-2xl font-bold text-slate-100">{stats.byType['REPAIR'] || 0}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-yellow-400" />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <div className="bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-slate-700/50">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-slate-300">Cargando movimientos...</span>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-red-500/50">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <div>
                            <h3 className="text-red-400 font-medium">Error al cargar movimientos</h3>
                            <p className="text-slate-300 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={loadMovements}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            );
        }

        switch (activeView) {
            case 'list':
                return (
                    <>
                        <MovementFilters
                            filters={filters}
                            tools={tools}
                            onChange={handleFiltersChange}
                        />
                        <MovementsList
                            movements={filteredMovements}
                            onViewDetail={handleViewDetail}
                        />
                    </>
                );

            case 'byTool':
                return (
                    <KardexByTool
                        tools={tools}
                        selectedTool={selectedTool}
                        onSelectTool={setSelectedTool}
                        onViewDetail={handleViewDetail}
                    />
                );

            case 'dateRange':
                return (
                    <DateRangeReport
                        onViewDetail={handleViewDetail}
                    />
                );

            case 'detail':
                return (
                    <MovementDetail
                        movement={selectedMovement}
                        onBack={() => setActiveView('list')}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {renderHeader()}
            {renderContent()}
        </div>
    );
};

export default KardexManagement;
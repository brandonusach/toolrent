import React, { useState, useEffect } from 'react';
import { Package, Search, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useKardex } from '../hooks/useKardex';

const KardexByTool = ({ tools, selectedTool, onSelectTool, onViewDetail }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [toolMovements, setToolMovements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [auditReport, setAuditReport] = useState(null);

    const { getMovementsByTool, verifyStockConsistency, generateAuditReport } = useKardex();

    // Filter tools based on search
    const filteredTools = tools.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Load movements for selected tool
    useEffect(() => {
        if (selectedTool) {
            loadToolMovements();
            loadAuditReport();
        }
    }, [selectedTool]);

    const loadToolMovements = async () => {
        if (!selectedTool) return;

        setLoading(true);
        try {
            const movements = await getMovementsByTool(selectedTool.id);
            setToolMovements(movements);
        } catch (error) {
            console.error('Error loading tool movements:', error);
            setToolMovements([]);
        } finally {
            setLoading(false);
        }
    };

    const loadAuditReport = async () => {
        if (!selectedTool) return;

        try {
            const report = await generateAuditReport(selectedTool.id);
            setAuditReport(report);
        } catch (error) {
            console.error('Error loading audit report:', error);
            setAuditReport(null);
        }
    };

    const checkConsistency = async () => {
        if (!selectedTool) return;

        try {
            await verifyStockConsistency(selectedTool.id);
            await loadAuditReport(); // Reload to get updated consistency status
        } catch (error) {
            console.error('Error checking consistency:', error);
        }
    };

    const formatDateTime = (dateTime) => {
        return new Date(dateTime).toLocaleString('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMovementIcon = (type) => {
        switch (type) {
            case 'LOAN':
            case 'DECOMMISSION':
                return <TrendingDown className="w-4 h-4 text-red-400" />;
            case 'RETURN':
            case 'RESTOCK':
            case 'INITIAL_STOCK':
                return <TrendingUp className="w-4 h-4 text-green-400" />;
            default:
                return <Package className="w-4 h-4 text-slate-400" />;
        }
    };

    const getMovementLabel = (type) => {
        const labels = {
            INITIAL_STOCK: 'Stock Inicial',
            LOAN: 'Préstamo',
            RETURN: 'Devolución',
            REPAIR: 'Reparación',
            DECOMMISSION: 'Baja',
            RESTOCK: 'Reabastecimiento'
        };
        return labels[type] || type;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tools List */}
            <div className="lg:col-span-1">
                <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700/50">
                    <div className="p-4 border-b border-slate-700/50">
                        <h3 className="text-lg font-medium text-slate-100 mb-3">
                            Seleccionar Herramienta
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar herramienta..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {filteredTools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => onSelectTool(tool)}
                                className={`w-full p-4 text-left hover:bg-slate-700/30 border-b border-slate-700/50 transition-colors ${
                                    selectedTool?.id === tool.id ? 'bg-blue-500/20 border-blue-500/50' : ''
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-slate-100">{tool.name}</h4>
                                        <p className="text-sm text-slate-400">{tool.category?.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500">
                                                Stock: {tool.currentStock}/{tool.initialStock}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                tool.status === 'AVAILABLE'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {tool.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tool Details and Movements */}
            <div className="lg:col-span-2 space-y-6">
                {selectedTool ? (
                    <>
                        {/* Tool Summary */}
                        <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700/50 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-100">
                                    {selectedTool.name}
                                </h3>
                                <button
                                    onClick={checkConsistency}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Verificar Consistencia
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-slate-700/30 p-4 rounded-lg">
                                    <h4 className="text-sm text-slate-400 mb-1">Stock Actual</h4>
                                    <p className="text-2xl font-bold text-slate-100">
                                        {selectedTool.currentStock}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        de {selectedTool.initialStock} inicial
                                    </p>
                                </div>

                                <div className="bg-slate-700/30 p-4 rounded-lg">
                                    <h4 className="text-sm text-slate-400 mb-1">Total Movimientos</h4>
                                    <p className="text-2xl font-bold text-slate-100">
                                        {toolMovements.length}
                                    </p>
                                </div>

                                <div className="bg-slate-700/30 p-4 rounded-lg">
                                    <h4 className="text-sm text-slate-400 mb-1">Estado</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                                            selectedTool.status === 'AVAILABLE'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {selectedTool.status}
                                        </span>
                                        {auditReport?.isConsistent !== undefined && (
                                            <div className="flex items-center gap-1">
                                                {auditReport.isConsistent ? (
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                                )}
                                                <span className={`text-xs ${
                                                    auditReport.isConsistent ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                    {auditReport.isConsistent ? 'Consistente' : 'Inconsistente'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Movements List */}
                        <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700/50">
                            <div className="p-4 border-b border-slate-700/50">
                                <h3 className="text-lg font-medium text-slate-100">
                                    Historial de Movimientos
                                </h3>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                    <p className="text-slate-400">Cargando movimientos...</p>
                                </div>
                            ) : toolMovements.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                    <p className="text-slate-400">No hay movimientos registrados</p>
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-y-auto">
                                    {toolMovements.map((movement) => (
                                        <div
                                            key={movement.id}
                                            className="p-4 border-b border-slate-700/50 hover:bg-slate-700/20 cursor-pointer transition-colors"
                                            onClick={() => onViewDetail(movement)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {getMovementIcon(movement.type)}
                                                    <div>
                                                        <h4 className="font-medium text-slate-100">
                                                            {getMovementLabel(movement.type)}
                                                        </h4>
                                                        <p className="text-sm text-slate-400">
                                                            {formatDateTime(movement.createdAt)}
                                                        </p>
                                                        {movement.description && (
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                {movement.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-slate-300">
                                                            Cant: {movement.quantity}
                                                        </span>
                                                        <span className="text-sm text-slate-500">
                                                            Stock: {movement.stockBefore} → {movement.stockAfter}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700/50 p-8 text-center">
                        <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-300 mb-2">
                            Selecciona una herramienta
                        </h3>
                        <p className="text-slate-500">
                            Elige una herramienta de la lista para ver su historial de movimientos
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KardexByTool;
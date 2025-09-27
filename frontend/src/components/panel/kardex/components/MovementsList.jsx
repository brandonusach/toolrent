import React from 'react';
import { Eye, ArrowUp, ArrowDown, RotateCcw, Minus, Plus, Wrench } from 'lucide-react';

const MovementsList = ({ movements, onViewDetail }) => {
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
        const icons = {
            INITIAL_STOCK: <Plus className="w-4 h-4" />,
            LOAN: <ArrowDown className="w-4 h-4" />,
            RETURN: <ArrowUp className="w-4 h-4" />,
            REPAIR: <Wrench className="w-4 h-4" />,
            DECOMMISSION: <Minus className="w-4 h-4" />,
            RESTOCK: <Plus className="w-4 h-4" />
        };
        return icons[type] || <RotateCcw className="w-4 h-4" />;
    };

    const getMovementColor = (type) => {
        const colors = {
            INITIAL_STOCK: 'bg-blue-500/20 text-blue-400',
            LOAN: 'bg-red-500/20 text-red-400',
            RETURN: 'bg-green-500/20 text-green-400',
            REPAIR: 'bg-yellow-500/20 text-yellow-400',
            DECOMMISSION: 'bg-gray-500/20 text-gray-400',
            RESTOCK: 'bg-purple-500/20 text-purple-400'
        };
        return colors[type] || 'bg-slate-500/20 text-slate-400';
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

    const getStockChangeColor = (type) => {
        switch (type) {
            case 'INITIAL_STOCK':
            case 'RETURN':
            case 'RESTOCK':
                return 'text-green-400';
            case 'LOAN':
            case 'DECOMMISSION':
                return 'text-red-400';
            case 'REPAIR':
                return 'text-yellow-400';
            default:
                return 'text-slate-400';
        }
    };

    const getStockChangePrefix = (type) => {
        switch (type) {
            case 'INITIAL_STOCK':
            case 'RETURN':
            case 'RESTOCK':
                return '+';
            case 'LOAN':
            case 'DECOMMISSION':
                return '-';
            case 'REPAIR':
                return '=';
            default:
                return '';
        }
    };

    if (movements.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-slate-700/50 text-center">
                <RotateCcw className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No hay movimientos</h3>
                <p className="text-slate-500">No se encontraron movimientos con los filtros aplicados.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700/50">
            <div className="p-4 border-b border-slate-700/50">
                <h3 className="text-lg font-medium text-slate-100">
                    Movimientos del Kardex ({movements.length})
                </h3>
            </div>

            <div className="divide-y divide-slate-700/50">
                {movements.map((movement) => (
                    <div
                        key={movement.id}
                        className="p-4 hover:bg-slate-700/30 transition-colors group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                {/* Movement type icon */}
                                <div className={`p-2 rounded-lg ${getMovementColor(movement.type)}`}>
                                    {getMovementIcon(movement.type)}
                                </div>

                                {/* Movement details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-medium text-slate-100">
                                            {movement.toolName || 'Herramienta desconocida'}
                                        </h4>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getMovementColor(movement.type)}`}>
                                            {getMovementLabel(movement.type)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        {/* Quantity and stock change */}
                                        <div>
                                            <p className="text-slate-400 mb-1">Cantidad / Cambio</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-300 font-medium">
                                                    {movement.quantity}
                                                </span>
                                                <span className={`font-medium ${getStockChangeColor(movement.type)}`}>
                                                    ({getStockChangePrefix(movement.type)}{movement.type === 'REPAIR' ? '0' : movement.quantity})
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stock before/after */}
                                        <div>
                                            <p className="text-slate-400 mb-1">Stock: Antes → Después</p>
                                            <span className="text-slate-300">
                                                {movement.stockBefore} → {movement.stockAfter}
                                            </span>
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <p className="text-slate-400 mb-1">Fecha</p>
                                            <span className="text-slate-300">
                                                {formatDateTime(movement.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {movement.description && (
                                        <div className="mt-3">
                                            <p className="text-slate-400 text-sm mb-1">Descripción</p>
                                            <p className="text-slate-300 text-sm">
                                                {movement.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Related loan info - usando nueva estructura DTO */}
                                    {movement.relatedLoanId && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                                                Préstamo #{movement.relatedLoanId}
                                            </span>
                                            {movement.clientName && (
                                                <span className="text-xs text-slate-400">
                                                    Cliente: {movement.clientName}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Category info if available */}
                                    {movement.categoryName && (
                                        <div className="mt-1">
                                            <span className="text-xs text-slate-500">
                                                Categoría: {movement.categoryName}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onViewDetail(movement)}
                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                    title="Ver detalle"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MovementsList;
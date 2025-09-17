// inventory/components/StockManager.jsx
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const StockManager = ({ tool, type, onUpdateStock, onClose, onSuccess }) => {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isAddStock = type === 'add-stock';
    const isDecommission = type === 'decommission';

    const validateQuantity = () => {
        if (quantity <= 0) {
            setError('La cantidad debe ser mayor a 0');
            return false;
        }

        if (isDecommission && quantity > (tool.currentStock || 0)) {
            setError('No hay suficiente stock disponible');
            return false;
        }

        setError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateQuantity()) {
            return;
        }

        setLoading(true);
        try {
            await onUpdateStock(tool.id, quantity);

            const action = isAddStock ? 'agregadas' : 'dadas de baja';
            alert(`${quantity} unidad(es) ${action} exitosamente`);

            onSuccess();
        } catch (error) {
            console.error('Error updating stock:', error);
            setError(error.message || 'Error al actualizar el stock');
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        return isAddStock ? 'Agregar Stock' : 'Dar de Baja';
    };

    const getIcon = () => {
        return isAddStock ? TrendingUp : TrendingDown;
    };

    const getButtonClass = () => {
        return isAddStock
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-orange-600 hover:bg-orange-700';
    };

    const getActionText = () => {
        return isAddStock ? 'Agregar Stock' : 'Dar de Baja';
    };

    const calculateNewStock = () => {
        const currentStock = tool.currentStock || 0;
        if (isAddStock) {
            return currentStock + quantity;
        } else {
            return Math.max(0, currentStock - quantity);
        }
    };

    const Icon = getIcon();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center mb-4">
                    <Icon className="h-6 w-6 text-white mr-2" />
                    <h3 className="text-xl font-bold text-white">{getTitle()}</h3>
                </div>

                {/* Información de la herramienta */}
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                    <p className="text-gray-300 mb-2">
                        <span className="font-semibold">Herramienta:</span>
                        <span className="text-white ml-2">{tool.name}</span>
                    </p>
                    <p className="text-gray-300 mb-2">
                        <span className="font-semibold">Stock actual:</span>
                        <span className="text-white ml-2">{tool.currentStock || 0} unidades</span>
                    </p>
                    {isDecommission && (tool.currentStock || 0) <= 2 && (
                        <div className="flex items-center mt-2 p-2 bg-yellow-900 bg-opacity-30 rounded">
                            <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
                            <span className="text-yellow-300 text-sm">
                                Stock bajo - considere el impacto antes de dar de baja
                            </span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo de cantidad */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Cantidad {isAddStock ? 'a agregar' : 'a dar de baja'} *
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={isDecommission ? (tool.currentStock || 0) : undefined}
                            value={quantity}
                            onChange={(e) => {
                                setQuantity(parseInt(e.target.value) || 1);
                                setError(''); // Clear error on change
                            }}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none ${
                                error
                                    ? 'border-red-500 focus:border-red-400'
                                    : 'border-gray-600 focus:border-orange-500'
                            }`}
                            disabled={loading}
                        />
                        {error && (
                            <p className="text-red-400 text-xs mt-1">{error}</p>
                        )}
                    </div>

                    {/* Previsualización del resultado */}
                    <div className="p-3 bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-300">
                            <span className="font-medium">Stock después de la operación:</span>
                            <span className={`ml-2 font-bold ${
                                calculateNewStock() <= 2 ? 'text-red-400' : 'text-green-400'
                            }`}>
                                {calculateNewStock()} unidades
                            </span>
                        </p>

                        {calculateNewStock() === 0 && (
                            <div className="flex items-center mt-2 p-2 bg-red-900 bg-opacity-30 rounded">
                                <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                                <span className="text-red-300 text-xs">
                                    ¡Advertencia! La herramienta quedará sin stock
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={loading || !!error}
                            className={`flex-1 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${getButtonClass()}`}
                        >
                            <Icon className="h-4 w-4 mr-2" />
                            {loading ? 'Procesando...' : getActionText()}
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

                {/* Nota informativa adicional */}
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-400">
                        {isAddStock
                            ? 'Esta acción agregará nuevas instancias de la herramienta al inventario.'
                            : 'Esta acción marcará las instancias como dadas de baja permanentemente.'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StockManager;
// inventory/components/StockManager.jsx - PURE VERSION
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const StockManager = ({ tool, type, onUpdateStock, onClose, onSuccess }) => {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [serverErrors, setServerErrors] = useState({});

    const isAddStock = type === 'add-stock';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerErrors({});
        setLoading(true);

        try {
            // Send raw data to backend - let backend handle validation
            await onUpdateStock(tool.id, quantity);

            const action = isAddStock ? 'agregadas' : 'dadas de baja';
            alert(`${quantity} unidad(es) ${action} exitosamente`);

            onSuccess();
        } catch (error) {
            console.error('Error updating stock:', error);

            // Handle server errors
            if (error.response && error.response.data) {
                const errorData = error.response.data;

                if (typeof errorData === 'object' && errorData.fieldErrors) {
                    setServerErrors(errorData.fieldErrors);
                } else if (typeof errorData === 'string') {
                    alert(`Error: ${errorData}`);
                } else {
                    alert('Error: Unknown server error');
                }
            } else {
                alert(`Error: ${error.message || 'Error al actualizar el stock'}`);
            }
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

    const Icon = getIcon();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center mb-4">
                    <Icon className="h-6 w-6 text-white mr-2" />
                    <h3 className="text-xl font-bold text-white">{getTitle()}</h3>
                </div>

                {/* Tool Information */}
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                    <p className="text-gray-300 mb-2">
                        <span className="font-semibold">Herramienta:</span>
                        <span className="text-white ml-2">{tool.name}</span>
                    </p>
                    <p className="text-gray-300 mb-2">
                        <span className="font-semibold">Stock actual:</span>
                        <span className="text-white ml-2">{tool.currentStock || 0} unidades</span>
                    </p>
                    {/* Remove client-side warnings - let backend handle business logic */}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Quantity Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Cantidad {isAddStock ? 'a agregar' : 'a dar de baja'} *
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => {
                                setQuantity(parseInt(e.target.value) || 1);
                                setServerErrors({}); // Clear errors on change
                            }}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none ${
                                serverErrors.quantity
                                    ? 'border-red-500 focus:border-red-400'
                                    : 'border-gray-600 focus:border-orange-500'
                            }`}
                            disabled={loading}
                        />
                        {serverErrors.quantity && (
                            <p className="text-red-400 text-xs mt-1">{serverErrors.quantity}</p>
                        )}
                    </div>

                    {/* Remove preview section - let backend calculate and validate */}

                    {/* Buttons */}
                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={loading}
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

                {/* Informational Note */}
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
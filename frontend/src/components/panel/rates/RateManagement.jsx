import React, { useState, useEffect } from 'react';
import { Calculator, History, DollarSign, Settings } from 'lucide-react';

// Componentes
import RentRateConfig from './components/RentRateConfig';
import FineRateConfig from './components/FineRateConfig';
import ReplacementValues from './components/ReplacementValues';
import RateHistory from './components/RateHistory';

// Hooks
import { useRates } from './hooks/useRates';

// Constantes
import { RATE_TYPES, PERMISSIONS, hasPermission } from './utils/rateConstants';

const RateManagement = () => {
    // Por ahora asumimos que el usuario es admin
    const isAdmin = true;

    // State para tab activa
    const [activeTab, setActiveTab] = useState('rent');

    // Modal states
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedRateType, setSelectedRateType] = useState(null);

    // Data hooks
    const {
        rates,
        loading,
        error,
        loadRates,
        createRate,
        updateRate,
        deactivateRate,
        getCurrentRates,
        getRateHistory,
        calculateRepairCost,
        clearError
    } = useRates();

    // Cargar datos iniciales
    useEffect(() => {
        loadRates();
        getCurrentRates();
    }, [loadRates, getCurrentRates]);

    // Tabs de configuración
    const tabs = [
        {
            id: 'rent',
            name: 'Tarifa Arriendo',
            icon: DollarSign,
            component: RentRateConfig,
            description: 'Configurar tarifa diaria de arriendo'
        },
        {
            id: 'fine',
            name: 'Multa por Atraso',
            icon: Calculator,
            component: FineRateConfig,
            description: 'Configurar tarifa diaria de multa'
        },
        {
            id: 'replacement',
            name: 'Valores Reposición',
            icon: Settings,
            component: ReplacementValues,
            description: 'Configurar porcentaje de reparación'
        }
    ];

    const handleShowHistory = (rateType) => {
        setSelectedRateType(rateType);
        setShowHistoryModal(true);
    };

    const handleCloseHistory = () => {
        setShowHistoryModal(false);
        setSelectedRateType(null);
    };

    // Stats para mostrar en el header
    const currentRates = rates.current || {};
    const stats = {
        rentalRate: currentRates.RENTAL_RATE || 0,
        lateFeeRate: currentRates.LATE_FEE_RATE || 0,
        repairRate: currentRates.REPAIR_RATE || 0
    };

    if (!hasPermission(isAdmin ? 'admin' : 'user', PERMISSIONS.RATE.VIEW)) {
        return (
            <div className="p-6 bg-gray-900 min-h-screen">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-red-400 mb-2">No tiene permisos para acceder a la gestión de tarifas</p>
                        <p className="text-gray-400">Contacte al administrador para obtener acceso</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Gestión de Tarifas
                        </h1>
                        <p className="text-gray-400">
                            Administra las tarifas del sistema (solo Administradores)
                        </p>
                    </div>

                    <button
                        onClick={() => handleShowHistory()}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                        <History size={20} />
                        Ver Historial
                    </button>
                </div>

                {/* Current Rates Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Tarifa Arriendo</p>
                                <p className="text-3xl font-bold text-white">${stats.rentalRate.toLocaleString()}</p>
                                <p className="text-sm text-gray-400">por día</p>
                            </div>
                            <div className="bg-green-500/20 p-3 rounded-lg">
                                <DollarSign className="text-green-400" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Multa por Atraso</p>
                                <p className="text-3xl font-bold text-white">${stats.lateFeeRate.toLocaleString()}</p>
                                <p className="text-sm text-gray-400">por día</p>
                            </div>
                            <div className="bg-red-500/20 p-3 rounded-lg">
                                <Calculator className="text-red-400" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Tarifa Reparación</p>
                                <p className="text-3xl font-bold text-white">{stats.repairRate}%</p>
                                <p className="text-sm text-gray-400">del valor reposición</p>
                            </div>
                            <div className="bg-blue-500/20 p-3 rounded-lg">
                                <Settings className="text-blue-400" size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={clearError}
                            className="text-red-300 hover:text-red-100"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="mb-6">
                <nav className="flex space-x-1 bg-gray-800 p-1 rounded-xl">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.name}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-gray-800 rounded-xl border border-gray-700">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <span className="ml-4 text-gray-400">Cargando tarifas...</span>
                    </div>
                ) : (
                    <>
                        {activeTab === 'rent' && (
                            <RentRateConfig
                                currentRate={currentRates.RENTAL_RATE}
                                rates={rates}
                                onCreate={createRate}
                                onUpdate={updateRate}
                                onDeactivate={deactivateRate}
                                onShowHistory={() => handleShowHistory(RATE_TYPES.RENTAL_RATE)}
                                loading={loading}
                                isAdmin={isAdmin}
                            />
                        )}
                        {activeTab === 'fine' && (
                            <FineRateConfig
                                currentRate={currentRates.LATE_FEE_RATE}
                                rates={rates}
                                onCreate={createRate}
                                onUpdate={updateRate}
                                onDeactivate={deactivateRate}
                                onShowHistory={() => handleShowHistory(RATE_TYPES.LATE_FEE_RATE)}
                                loading={loading}
                                isAdmin={isAdmin}
                            />
                        )}
                        {activeTab === 'replacement' && (
                            <ReplacementValues
                                currentRate={currentRates.REPAIR_RATE}
                                rates={rates}
                                onCreate={createRate}
                                onUpdate={updateRate}
                                onDeactivate={deactivateRate}
                                onShowHistory={() => handleShowHistory(RATE_TYPES.REPAIR_RATE)}
                                onCalculateRepairCost={calculateRepairCost}
                                loading={loading}
                                isAdmin={isAdmin}
                            />
                        )}
                    </>
                )}
            </div>

            {/* History Modal */}
            {showHistoryModal && (
                <RateHistory
                    rateType={selectedRateType}
                    isOpen={showHistoryModal}
                    onClose={handleCloseHistory}
                    onGetHistory={getRateHistory}
                    rates={rates}
                />
            )}
        </div>
    );
};

export default RateManagement;
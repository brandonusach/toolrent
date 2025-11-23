// loans/LoanManagement.jsx - Contenedor principal siguiendo patrón del proyecto
import React, { useState, useEffect } from 'react';
import LoanForm from './components/LoanForm';
import ReturnForm from './components/ReturnForm';
import LoansList from './components/LoansList';
import OverdueLoans from './components/OverdueLoans';
import FineManagement from './components/FineManagement';
import { useLoans } from './hooks/useLoans';
import { useFines } from './hooks/useFines';
import {
    RefreshCw,
    Plus,
    AlertTriangle,
    BarChart3,
    DollarSign
} from 'lucide-react';

const LoanManagement = () => {
    // Modal states
    const [showFineModal, setShowFineModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);

    // Tab state
    const [activeTab, setActiveTab] = useState('active'); // active, overdue, history

    // Data hooks
    const {
        loans,
        activeLoans,
        overdueLoans,
        loading,
        loadLoans,
        loadActiveLoans,
        loadOverdueLoans,
        createLoan,
        returnLoan
    } = useLoans();

    const { loadFines } = useFines();

    // Load initial data
    useEffect(() => {
        loadLoans(); // Cargar todos los préstamos para el tab principal
        loadActiveLoans(); // Para las estadísticas
        loadOverdueLoans();
        loadFines();
    }, [loadLoans, loadActiveLoans, loadOverdueLoans, loadFines]);

    // Load data when tab changes
    useEffect(() => {
        if (activeTab === 'active') {
            loadLoans(); // Recargar todos los préstamos
        }
    }, [activeTab, loadLoans]);

    // Modal handlers
    const handleCreateLoan = () => {
        setShowCreateModal(true);
    };

    const handleReturnTool = (loan) => {
        setSelectedLoan(loan);
        setShowReturnModal(true);
    };

    const handleManageFines = () => {
        setShowFineModal(true);
    };

    const closeAllModals = () => {
        setShowCreateModal(false);
        setShowReturnModal(false);
        setShowFineModal(false);
        setSelectedLoan(null);
    };

    // CRUD handlers
    const handleLoanCreated = async () => {
        await loadLoans(); // Recargar todos los préstamos
        await loadActiveLoans(); // Recargar estadísticas
        closeAllModals();
    };

    const handleLoanReturned = async () => {
        await loadLoans(); // Recargar todos los préstamos
        await loadActiveLoans(); // Recargar estadísticas
        await loadOverdueLoans();
        closeAllModals();
    };

    const refreshData = async () => {
        await Promise.all([
            loadLoans(), // Cargar todos los préstamos
            loadActiveLoans(), // Para las estadísticas
            loadOverdueLoans()
        ]);
    };

    // Stats calculation for display
    const displayStats = {
        totalActive: activeLoans.length,
        totalOverdue: overdueLoans.length,
        overdueRate: activeLoans.length > 0
            ? ((overdueLoans.length / activeLoans.length) * 100).toFixed(1)
            : 0
    };

    return (
        <div className="p-6 bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Gestión de Préstamos y Devoluciones
                        </h1>
                        <p className="text-gray-400">
                            Control completo del ciclo de préstamos de herramientas
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleCreateLoan}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Nuevo Préstamo
                        </button>
                        <button
                            onClick={handleManageFines}
                            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                            <DollarSign className="h-5 w-5 mr-2" />
                            Gestionar Multas
                        </button>
                        <button
                            onClick={refreshData}
                            disabled={loading}
                            className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{displayStats.totalActive}</div>
                        <div className="text-sm text-gray-400">Préstamos Activos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{displayStats.totalOverdue}</div>
                        <div className="text-sm text-gray-400">Atrasados</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">{displayStats.overdueRate}%</div>
                        <div className="text-sm text-gray-400">Tasa de Atraso</div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
                <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg border border-gray-700">
                    {[
                        { id: 'active', label: 'Préstamos', icon: RefreshCw },
                        { id: 'overdue', label: 'Atrasados', icon: AlertTriangle },
                        { id: 'history', label: 'Historial', icon: BarChart3 }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-orange-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                            >
                                <Icon className="h-4 w-4 mr-2" />
                                {tab.label}
                                {tab.id === 'overdue' && displayStats.totalOverdue > 0 && (
                                    <span className="ml-2 bg-red-500 text-xs px-2 py-0.5 rounded-full">
                                        {displayStats.totalOverdue}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* Active Loans Tab */}
                {activeTab === 'active' && (
                    <LoansList
                        loans={loans}
                        loading={loading}
                        title="Lista de Préstamos"
                        emptyMessage="No hay préstamos disponibles"
                        onReturnTool={handleReturnTool}
                        onRefresh={loadLoans}
                        showReturnButton={true}
                    />
                )}

                {/* Overdue Loans Tab */}
                {activeTab === 'overdue' && (
                    <OverdueLoans
                        loans={overdueLoans}
                        loading={loading}
                        onReturnTool={handleReturnTool}
                        onRefresh={loadOverdueLoans}
                    />
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <LoansList
                        loans={loans}
                        loading={loading}
                        title="Historial Completo de Préstamos"
                        emptyMessage="No hay préstamos en el historial"
                        onRefresh={loadLoans}
                        showReturnButton={false}
                    />
                )}
            </div>

            {/* Modal: Create Loan */}
            {showCreateModal && (
                <LoanForm
                    onSubmit={createLoan}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleLoanCreated}
                />
            )}

            {/* Modal: Return Tool */}
            {showReturnModal && selectedLoan && (
                <ReturnForm
                    loan={selectedLoan}
                    onSubmit={returnLoan}
                    onClose={() => setShowReturnModal(false)}
                    onSuccess={handleLoanReturned}
                />
            )}

            {/* Modal: Fine Management */}
            {showFineModal && (
                <FineManagement
                    onClose={() => setShowFineModal(false)}
                    onSuccess={() => {
                        loadFines();
                        refreshData();
                    }}
                />
            )}
        </div>
    );
};

export default LoanManagement;
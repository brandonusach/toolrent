// loans/components/LoansList.jsx - Lista de préstamos con filtros y acciones
import React, { useState, useMemo } from 'react';
import {
    Search,
    RefreshCw,
    Package2,
    Calendar,
    User,
    AlertTriangle,
    CheckCircle,
    DollarSign,
    FileText,
    Clock,
    Loader
} from 'lucide-react';

const LoansList = ({
                       loans,
                       loading,
                       title = "Lista de Préstamos",
                       emptyMessage = "No hay préstamos",
                       onReturnTool,
                       onCalculateFine,
                       onRefresh,
                       showReturnButton = false
                   }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('loanDate');
    const [sortOrder, setSortOrder] = useState('desc');

    // Filtrar y ordenar préstamos
    const filteredLoans = useMemo(() => {
        if (!loans) return [];

        let filtered = loans.filter(loan => {
            const matchesSearch =
                loan.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.tool?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.id?.toString().includes(searchTerm);

            const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Ordenar
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Manejar fechas
            if (sortBy.includes('Date')) {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            // Manejar valores anidados
            if (sortBy === 'clientName') {
                aValue = a.client?.name || '';
                bValue = b.client?.name || '';
            } else if (sortBy === 'toolName') {
                aValue = a.tool?.name || '';
                bValue = b.tool?.name || '';
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [loans, searchTerm, statusFilter, sortBy, sortOrder]);

    const getStatusBadge = (status) => {
        const badges = {
            'ACTIVE': { color: 'bg-green-100 text-green-800', icon: Clock, label: 'Activo' },
            'RETURNED': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Devuelto' },
            'OVERDUE': { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Atrasado' },
            'DAMAGED': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Con Daños' }
        };

        const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock, label: status };
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="h-3 w-3 mr-1" />
                {badge.label}
            </span>
        );
    };

    const isOverdue = (loan) => {
        if (loan.status !== 'ACTIVE') return false;
        return new Date() > new Date(loan.agreedReturnDate);
    };

    const getDaysUntilReturn = (loan) => {
        const today = new Date();
        const returnDate = new Date(loan.agreedReturnDate);
        const diffTime = returnDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
                <div className="flex items-center justify-center">
                    <Loader className="h-8 w-8 animate-spin text-orange-500 mr-3" />
                    <span className="text-gray-300">Cargando préstamos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <button
                        onClick={onRefresh}
                        className="flex items-center px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Actualizar
                    </button>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, herramienta o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    {/* Filtro por estado */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="ACTIVE">Activos</option>
                        <option value="RETURNED">Devueltos</option>
                        <option value="OVERDUE">Atrasados</option>
                        <option value="DAMAGED">Con Daños</option>
                    </select>

                    {/* Ordenamiento */}
                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [field, order] = e.target.value.split('-');
                            setSortBy(field);
                            setSortOrder(order);
                        }}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="loanDate-desc">Fecha préstamo (Más reciente)</option>
                        <option value="loanDate-asc">Fecha préstamo (Más antigua)</option>
                        <option value="agreedReturnDate-asc">Fecha devolución (Próxima)</option>
                        <option value="agreedReturnDate-desc">Fecha devolución (Lejana)</option>
                        <option value="clientName-asc">Cliente (A-Z)</option>
                        <option value="clientName-desc">Cliente (Z-A)</option>
                        <option value="toolName-asc">Herramienta (A-Z)</option>
                        <option value="toolName-desc">Herramienta (Z-A)</option>
                    </select>
                </div>

                {/* Contador de resultados */}
                <div className="mt-4 text-sm text-gray-400">
                    Mostrando {filteredLoans.length} de {loans?.length || 0} préstamos
                </div>
            </div>

            {/* Lista */}
            <div className="divide-y divide-gray-700">
                {filteredLoans.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Package2 className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                        <p>{emptyMessage}</p>
                        {searchTerm && (
                            <p className="text-sm mt-2">
                                Intenta con otros términos de búsqueda
                            </p>
                        )}
                    </div>
                ) : (
                    filteredLoans.map((loan) => {
                        const overdue = isOverdue(loan);
                        const daysUntilReturn = getDaysUntilReturn(loan);

                        return (
                            <div key={loan.id} className="p-6 hover:bg-gray-750 transition-colors">
                                <div className="flex items-start justify-between">
                                    {/* Información principal */}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <span className="text-white font-medium">#{loan.id}</span>
                                            {getStatusBadge(loan.status)}
                                            {overdue && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-200">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    {Math.abs(daysUntilReturn)} días de atraso
                                                </span>
                                            )}
                                            {loan.status === 'ACTIVE' && !overdue && daysUntilReturn <= 3 && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900 text-yellow-200">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Vence en {daysUntilReturn} día(s)
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-400 flex items-center">
                                                    <User className="h-4 w-4 mr-1" />
                                                    Cliente:
                                                </span>
                                                <p className="text-white font-medium">{loan.client?.name}</p>
                                                <p className="text-gray-400 text-xs">{loan.client?.email}</p>
                                            </div>

                                            <div>
                                                <span className="text-gray-400 flex items-center">
                                                    <Package2 className="h-4 w-4 mr-1" />
                                                    Herramienta:
                                                </span>
                                                <p className="text-white font-medium">{loan.tool?.name}</p>
                                                <p className="text-gray-400 text-xs">Cantidad: {loan.quantity}</p>
                                            </div>

                                            <div>
                                                <span className="text-gray-400 flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    Fechas:
                                                </span>
                                                <p className="text-white text-xs">
                                                    Préstamo: {formatDate(loan.loanDate)}
                                                </p>
                                                <p className="text-white text-xs">
                                                    Devolución: {formatDate(loan.agreedReturnDate)}
                                                </p>
                                                {loan.actualReturnDate && (
                                                    <p className="text-green-400 text-xs">
                                                        Devuelto: {formatDate(loan.actualReturnDate)}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <span className="text-gray-400 flex items-center">
                                                    <DollarSign className="h-4 w-4 mr-1" />
                                                    Tarifa:
                                                </span>
                                                <p className="text-white font-medium">${loan.dailyRate}/día</p>
                                                {loan.status === 'ACTIVE' && (
                                                    <p className="text-gray-400 text-xs">
                                                        {Math.max(0, -daysUntilReturn + 1)} día(s) transcurrido(s)
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {loan.notes && (
                                            <div className="mt-3">
                                                <span className="text-gray-400 text-sm flex items-center">
                                                    <FileText className="h-4 w-4 mr-1" />
                                                    Notas:
                                                </span>
                                                <p className="text-gray-300 text-sm bg-gray-700 rounded p-2 mt-1">
                                                    {loan.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center space-x-2 ml-4">
                                        {showReturnButton && loan.status === 'ACTIVE' && onReturnTool && (
                                            <button
                                                onClick={() => onReturnTool(loan)}
                                                className="flex items-center px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
                                            >
                                                <Package2 className="h-4 w-4 mr-1" />
                                                Devolver
                                            </button>
                                        )}

                                        {onCalculateFine && (
                                            <button
                                                onClick={() => onCalculateFine(loan)}
                                                className="flex items-center px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                                            >
                                                <DollarSign className="h-4 w-4 mr-1" />
                                                Multas
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default LoansList;
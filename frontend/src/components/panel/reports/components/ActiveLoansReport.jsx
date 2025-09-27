// ActiveLoansReport.jsx - RF6.1: Listar préstamos activos y estado (vigentes, atrasados)
import React, { useState, useMemo } from 'react';
import { RefreshCw, AlertTriangle, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const ActiveLoansReport = ({ data, loading }) => {
    const [sortField, setSortField] = useState('daysOverdue');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Procesar y filtrar datos
    const processedData = useMemo(() => {
        if (!data || !data.loans) return { loans: [], summary: {} };

        let filteredLoans = [...data.loans];

        // Filtrar por estado
        if (filterStatus !== 'ALL') {
            filteredLoans = filteredLoans.filter(loan => loan.status === filterStatus);
        }

        // Filtrar por búsqueda
        if (searchTerm) {
            filteredLoans = filteredLoans.filter(loan =>
                loan.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.toolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Ordenar
        filteredLoans.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            if (sortField === 'daysOverdue' || sortField === 'quantity') {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
            } else if (sortField === 'agreedReturnDate' || sortField === 'loanDate') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else {
                aValue = String(aValue || '').toLowerCase();
                bValue = String(bValue || '').toLowerCase();
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return {
            loans: filteredLoans,
            summary: {
                ...data.summary,
                filtered: {
                    total: filteredLoans.length,
                    active: filteredLoans.filter(l => l.status === 'ACTIVE').length,
                    overdue: filteredLoans.filter(l => l.status === 'OVERDUE').length
                }
            }
        };
    }, [data, filterStatus, searchTerm, sortField, sortDirection]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field) => {
        if (sortField !== field) return ArrowUpDown;
        return sortDirection === 'asc' ? ArrowUp : ArrowDown;
    };

    const getStatusBadge = (loan) => {
        if (loan.status === 'OVERDUE') {
            return (
                <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-medium flex items-center gap-1 border border-red-500/20">
                    <AlertTriangle className="h-3 w-3" />
                    Atrasado ({loan.daysOverdue} días)
                </span>
            );
        } else {
            return (
                <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium flex items-center gap-1 border border-green-500/20">
                    <RefreshCw className="h-3 w-3" />
                    Vigente
                </span>
            );
        }
    };

    const getPriorityColor = (loan) => {
        if (loan.daysOverdue > 7) return 'border-l-red-500 bg-red-500/5';
        if (loan.daysOverdue > 3) return 'border-l-yellow-500 bg-yellow-500/5';
        return 'border-l-orange-500 bg-orange-500/5';
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                    <div className="h-32 bg-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (!data || !data.loans) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <RefreshCw className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                        No hay datos disponibles
                    </h3>
                    <p className="text-slate-400">
                        Los datos de préstamos activos se cargarán automáticamente.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header y Resumen */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-orange-500" />
                        Préstamos Activos
                    </h2>
                </div>

                {/* Resumen de estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-500/10 p-2 rounded-lg">
                                <RefreshCw className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-medium">Total</p>
                                <p className="text-2xl font-bold text-white">
                                    {processedData.summary.filtered?.total || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500/10 p-2 rounded-lg">
                                <RefreshCw className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-medium">Vigentes</p>
                                <p className="text-2xl font-bold text-white">
                                    {processedData.summary.filtered?.active || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-500/10 p-2 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-medium">Atrasados</p>
                                <p className="text-2xl font-bold text-white">
                                    {processedData.summary.filtered?.overdue || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-500/10 p-2 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-medium">Promedio Atraso</p>
                                <p className="text-2xl font-bold text-white">
                                    {(processedData.summary.avgDaysOverdue || 0).toFixed(1)} días
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros y Búsqueda */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, herramienta o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-slate-400"
                        />
                    </div>
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value="ACTIVE">Solo vigentes</option>
                            <option value="OVERDUE">Solo atrasados</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabla de Préstamos */}
            {processedData.loans.length === 0 ? (
                <div className="text-center py-12">
                    <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No se encontraron préstamos con los filtros aplicados</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-lg">
                        <thead className="bg-slate-800/50">
                            <tr>
                                {[
                                    { key: 'clientName', label: 'Cliente' },
                                    { key: 'toolName', label: 'Herramienta' },
                                    { key: 'quantity', label: 'Cantidad' },
                                    { key: 'loanDate', label: 'F. Préstamo' },
                                    { key: 'agreedReturnDate', label: 'F. Devolución' },
                                    { key: 'daysOverdue', label: 'Estado' }
                                ].map((column) => {
                                    const SortIcon = getSortIcon(column.key);
                                    return (
                                        <th
                                            key={column.key}
                                            className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors"
                                            onClick={() => handleSort(column.key)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {column.label}
                                                <SortIcon className="h-3 w-3" />
                                            </div>
                                        </th>
                                    );
                                })}
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Notas
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800/20 divide-y divide-slate-700">
                            {processedData.loans.map((loan) => (
                                <tr
                                    key={loan.id}
                                    className={`hover:bg-slate-700/30 border-l-4 ${getPriorityColor(loan)} transition-colors`}
                                >
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">
                                            {loan.clientName}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-white">
                                                {loan.toolName}
                                            </div>
                                            <div className="text-sm text-slate-400">
                                                {loan.categoryName}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {loan.quantity}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {new Date(loan.loanDate).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {new Date(loan.agreedReturnDate).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        {getStatusBadge(loan)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-300 max-w-xs">
                                        <div className="truncate" title={loan.notes}>
                                            {loan.notes || 'Sin notas'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ActiveLoansReport;

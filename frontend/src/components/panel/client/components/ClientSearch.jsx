import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, User, Hash, Phone, Mail, Calendar, RotateCcw } from 'lucide-react';

const ClientSearch = ({ onSearch, onClear }) => {
    const [searchCriteria, setSearchCriteria] = useState({
        general: '',
        name: '',
        rut: '',
        phone: '',
        email: '',
        status: 'ALL',
        dateFrom: '',
        dateTo: ''
    });

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    // Debounced search
    const [debouncedCriteria, setDebouncedCriteria] = useState(searchCriteria);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCriteria(searchCriteria);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchCriteria]);

    // Execute search when debounced criteria changes
    useEffect(() => {
        if (onSearch) {
            onSearch(debouncedCriteria);
        }
    }, [debouncedCriteria, onSearch]);

    // Count active filters
    useEffect(() => {
        const count = Object.entries(searchCriteria).filter(([key, value]) => {
            if (key === 'status' && value === 'ALL') return false;
            return value && value.toString().trim() !== '';
        }).length;
        setActiveFiltersCount(count);
    }, [searchCriteria]);

    const handleInputChange = useCallback((field, value) => {
        setSearchCriteria(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const clearAllFilters = useCallback(() => {
        const clearedCriteria = {
            general: '',
            name: '',
            rut: '',
            phone: '',
            email: '',
            status: 'ALL',
            dateFrom: '',
            dateTo: ''
        };
        setSearchCriteria(clearedCriteria);
        if (onClear) {
            onClear();
        }
    }, [onClear]);

    const formatRUTInput = (value) => {
        // Formatear RUT mientras el usuario escribe
        const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();
        if (cleaned.length <= 1) return cleaned;
        const body = cleaned.slice(0, -1);
        const dv = cleaned.slice(-1);
        const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formattedBody}-${dv}`;
    };

    const formatPhoneInput = (value) => {
        // Formatear teléfono mientras el usuario escribe
        const cleaned = value.replace(/[^0-9]/g, '');
        if (cleaned.length <= 1) return cleaned;
        if (cleaned.length === 9 && cleaned.startsWith('9')) {
            return cleaned.replace(/(\d{1})(\d{4})(\d{4})/, '$1 $2 $3');
        } else if (cleaned.length === 8) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
        }
        return cleaned;
    };

    const handleRUTChange = (value) => {
        const formatted = formatRUTInput(value);
        handleInputChange('rut', formatted);
    };

    const handlePhoneChange = (value) => {
        const formatted = formatPhoneInput(value);
        handleInputChange('phone', formatted);
    };

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700">
            {/* Main Search Bar */}
            <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* General Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, RUT, email o teléfono..."
                            value={searchCriteria.general}
                            onChange={(e) => handleInputChange('general', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                        {searchCriteria.general && (
                            <button
                                onClick={() => handleInputChange('general', '')}
                                className="absolute right-3 top-3 text-gray-400 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`px-4 py-3 rounded-lg border transition-colors duration-200 flex items-center gap-2 ${
                                showAdvancedFilters || activeFiltersCount > 0
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-600'
                            }`}
                        >
                            <Filter size={20} />
                            <span className="hidden sm:inline">Filtros</span>
                            {activeFiltersCount > 0 && (
                                <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>

                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="px-4 py-3 bg-red-600 border border-red-600 rounded-lg text-white hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
                            >
                                <RotateCcw size={20} />
                                <span className="hidden sm:inline">Limpiar</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
                <div className="border-t border-gray-700 p-6">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <Filter size={20} />
                        Búsqueda Avanzada
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Nombre específico */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                <User size={16} className="inline mr-1" />
                                Nombre
                            </label>
                            <input
                                type="text"
                                placeholder="Buscar por nombre exacto"
                                value={searchCriteria.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            />
                        </div>

                        {/* Email específico */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                <Mail size={16} className="inline mr-1" />
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="cliente@email.com"
                                value={searchCriteria.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            />
                        </div>

                        {/* Estado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Estado del Cliente
                            </label>
                            <select
                                value={searchCriteria.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                <option value="ALL">Todos los estados</option>
                                <option value="ACTIVE">Solo Activos</option>
                                <option value="RESTRICTED">Solo Restringidos</option>
                            </select>
                        </div>

                        {/* Fecha desde */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                <Calendar size={16} className="inline mr-1" />
                                Registrado desde
                            </label>
                            <input
                                type="date"
                                value={searchCriteria.dateFrom}
                                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            />
                        </div>

                        {/* Fecha hasta */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                <Calendar size={16} className="inline mr-1" />
                                Registrado hasta
                            </label>
                            <input
                                type="date"
                                value={searchCriteria.dateTo}
                                onChange={(e) => handleInputChange('dateTo', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Filter Summary */}
                    {activeFiltersCount > 0 && (
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-400 text-sm">
                                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientSearch;
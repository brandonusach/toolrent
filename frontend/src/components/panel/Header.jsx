import React from 'react';
import { Search, Bell } from 'lucide-react';

const Header = ({ user, isAdmin }) => {
    const getRoleDisplayName = () => {
        const roles = user.roles || [];
        if (roles.includes('administrator') || roles.includes('admin')) return 'Administrador';
        if (roles.includes('employee') || roles.includes('empleado')) return 'Empleado';
        return 'Usuario';
    };

    return (
        <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 p-6 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-white">Panel Principal</h1>
                <div className="flex items-center gap-2 mt-1">
                     <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                         isAdmin ? 'bg-red-500/20 text-red-300' : 'bg-sky-500/20 text-sky-300'
                     }`}>
                        {getRoleDisplayName()}
                    </span>
                    {isAdmin && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                            Acceso Total
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Buscar en el panel..."
                        className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all w-80"
                    />
                </div>
                <div className="relative">
                    <Bell className="h-6 w-6 text-slate-400 hover:text-white transition-colors cursor-pointer" />
                    <span className="absolute -top-1 -right-1.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse">
                        3
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
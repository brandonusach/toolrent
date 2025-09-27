import React from 'react';

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

            {/* Área derecha simplificada - sin buscador ni notificaciones */}
            <div className="flex items-center">
                <div className="text-right">
                    <p className="text-sm font-medium text-white">
                        {user.firstName ? `${user.firstName} ${user.lastName}` : user.username}
                    </p>
                    <p className="text-xs text-slate-400">
                        Sesión activa
                    </p>
                </div>
            </div>
        </header>
    );
};

export default Header;
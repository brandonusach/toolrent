import React from 'react';

const Header = ({ user }) => {
    return (
        <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 p-6 flex items-center justify-end">
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
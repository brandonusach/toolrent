// AccessDenied.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const AccessDenied = ({ userRole, sectionLabel, onNavigate }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-800/60 border border-slate-700/50 rounded-lg p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
            <p className="text-slate-400 mb-6 max-w-md">
                No tienes los permisos necesarios para acceder a la sección <strong className="text-white">{sectionLabel}</strong>.
            </p>
            <div className="bg-slate-900 p-4 rounded-lg text-left text-sm w-full max-w-md mb-8">
                <p className="text-slate-300"><strong className="font-medium text-slate-100">Tu rol actual:</strong> {userRole}</p>
                <p className="text-slate-400 mt-1">Esta sección requiere permisos de Administrador.</p>
            </div>
            <button
                onClick={onNavigate}
                className="bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-orange-700 transition-colors shadow-lg"
            >
                Volver al Dashboard
            </button>
        </div>
    );
};

export default AccessDenied;
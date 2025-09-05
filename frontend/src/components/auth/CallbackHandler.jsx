import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Shield } from 'lucide-react';

const CallbackHandler = () => {
    const { handleKeycloakCallback } = useAuth();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
            console.error('Error en callback de Keycloak:', error);
            // Redirigir al login con error
            window.location.href = '/?error=' + encodeURIComponent(error);
        } else if (code) {
            handleKeycloakCallback(code).then(result => {
                if (result.success) {
                    // Redirigir al dashboard
                    window.location.href = '/';
                } else {
                    // Redirigir al login con error
                    window.location.href = '/?error=' + encodeURIComponent(result.error);
                }
            });
        } else {
            // No hay código, redirigir al login
            window.location.href = '/';
        }
    }, [handleKeycloakCallback]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                    <Shield className="h-12 w-12 text-orange-500 animate-spin" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                    Procesando autenticación...
                </h2>
                <p className="text-gray-400">
                    Por favor espera mientras validamos tu sesión.
                </p>
            </div>
        </div>
    );
};

export default CallbackHandler;
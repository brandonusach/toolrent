import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

const CallbackHandler = () => {
    const { handleKeycloakCallback, isAuthenticated } = useAuth();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const processCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');

            // Si hay error en la URL
            if (error) {
                let errorMessage = decodeURIComponent(error);
                if (errorDescription) {
                    errorMessage += ': ' + decodeURIComponent(errorDescription);
                }

                setStatus('error');
                setMessage(errorMessage);

                // Redirigir después de mostrar el error
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
                return;
            }

            // Si no hay código, redirigir directamente
            if (!code) {
                console.log('No hay código de autorización, redirigiendo...');
                window.location.href = '/';
                return;
            }

            // Procesar el código
            try {
                setStatus('processing');
                setMessage('Validando código de autorización...');

                console.log('CallbackHandler: Procesando código:', code.substring(0, 10) + '...');

                const result = await handleKeycloakCallback(code, state);

                if (result.success) {
                    setStatus('success');
                    setMessage('Autenticación exitosa. Redirigiendo...');

                    // Redirigir al dashboard después de un breve delay
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                } else {
                    setStatus('error');
                    setMessage(result.error || 'Error en la autenticación');

                    // Redirigir al login con el error después de un delay
                    setTimeout(() => {
                        window.location.href = '/?error=' + encodeURIComponent(result.error);
                    }, 3000);
                }
            } catch (err) {
                console.error('Error procesando callback:', err);
                setStatus('error');
                setMessage('Error inesperado: ' + err.message);

                setTimeout(() => {
                    window.location.href = '/?error=' + encodeURIComponent('Error inesperado durante la autenticación');
                }, 3000);
            }
        };

        processCallback();
    }, [handleKeycloakCallback]);

    // Si ya está autenticado, redirigir inmediatamente
    useEffect(() => {
        if (isAuthenticated && status === 'success') {
            window.location.href = '/';
        }
    }, [isAuthenticated, status]);

    const getStatusIcon = () => {
        switch (status) {
            case 'processing':
                return <Shield className="h-12 w-12 text-orange-500 animate-spin" />;
            case 'success':
                return <CheckCircle className="h-12 w-12 text-green-500" />;
            case 'error':
                return <AlertCircle className="h-12 w-12 text-red-500" />;
            default:
                return <Shield className="h-12 w-12 text-orange-500 animate-spin" />;
        }
    };

    const getStatusTitle = () => {
        switch (status) {
            case 'processing':
                return 'Procesando autenticación...';
            case 'success':
                return 'Autenticación exitosa';
            case 'error':
                return 'Error de autenticación';
            default:
                return 'Procesando...';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'processing':
                return 'text-white';
            case 'success':
                return 'text-green-400';
            case 'error':
                return 'text-red-400';
            default:
                return 'text-white';
        }
    };

    const getBackgroundColor = () => {
        switch (status) {
            case 'success':
                return 'bg-green-900/20 border border-green-800';
            case 'error':
                return 'bg-red-900/20 border border-red-800';
            default:
                return 'bg-gray-800';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full p-8">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-6">
                        {getStatusIcon()}
                    </div>

                    <h2 className={`text-xl font-semibold mb-4 ${getStatusColor()}`}>
                        {getStatusTitle()}
                    </h2>

                    <div className={`p-4 rounded-lg mb-4 ${getBackgroundColor()}`}>
                        <p className="text-gray-300 text-sm">
                            {message}
                        </p>
                    </div>

                    {/* Información adicional según el estado */}
                    {status === 'processing' && (
                        <div className="text-gray-400 text-xs">
                            <p>Esto puede tomar unos segundos...</p>
                            <p className="mt-1">No cierres esta ventana.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-green-400 text-xs">
                            <p>¡Bienvenido al sistema ToolRent!</p>
                            <p className="mt-1">Serás redirigido automáticamente.</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-red-400 text-xs">
                            <p>Verifica tu conexión e intenta nuevamente.</p>
                            <p className="mt-1">Serás redirigido al login en unos segundos.</p>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="mt-3 text-orange-500 hover:text-orange-400 underline"
                            >
                                Regresar ahora
                            </button>
                        </div>
                    )}

                    {/* Debug info - solo en desarrollo */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-6 bg-gray-800 p-3 rounded text-xs text-left">
                            <div className="text-gray-400 mb-1">Debug Info:</div>
                            <div className="text-gray-300">Status: {status}</div>
                            <div className="text-gray-300">Authenticated: {isAuthenticated ? 'Sí' : 'No'}</div>
                            <div className="text-gray-300">URL: {window.location.href}</div>
                            <div className="text-gray-300">Params: {window.location.search || 'none'}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallbackHandler;
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Wrench, Shield } from 'lucide-react';

const LoginForm = () => {
    const [error, setError] = useState('');

    const {
        login,
        loading,
        systemInfo,
        systemInfoLoaded,
        canUseKeycloak,
        handleKeycloakCallback,
        callbackInProgress
    } = useAuth();

    // Manejar callback de Keycloak
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Limpiar URL inmediatamente para evitar reprocesamiento
        const cleanUrl = () => {
            window.history.replaceState({}, document.title, window.location.pathname);
        };

        // Mostrar error si viene en la URL
        if (error) {
            let errorMessage = decodeURIComponent(error);
            if (errorDescription) {
                errorMessage += ': ' + decodeURIComponent(errorDescription);
            }
            setError(errorMessage);
            cleanUrl();
            return;
        }

        // Procesar código de autorización
        if (code && state && systemInfoLoaded && !callbackInProgress) {
            console.log('Procesando callback de Keycloak...');

            handleKeycloakCallback(code, state)
                .then(result => {
                    if (!result.success) {
                        console.error('Error en callback:', result.error);
                        setError(result.error || 'Error en autenticación Keycloak');
                    }
                    // El éxito se maneja automáticamente por el contexto
                })
                .catch(err => {
                    console.error('Exception en callback:', err);
                    setError('Error procesando callback: ' + err.message);
                })
                .finally(() => {
                    cleanUrl();
                });
        } else if (code && !systemInfoLoaded) {
            // Esperar a que se cargue systemInfo si hay un código pendiente
            console.log('Código recibido pero systemInfo no cargado, esperando...');
        }
    }, [systemInfoLoaded, handleKeycloakCallback, callbackInProgress]);

    const handleKeycloakLogin = async () => {
        setError('');

        if (!canUseKeycloak) {
            setError('Keycloak no está disponible en este sistema');
            return;
        }

        console.log('Iniciando login con Keycloak...');
        const result = await login();

        if (!result.success && !result.redirect) {
            console.error('Error en login Keycloak:', result.error);
            setError(result.error || 'Error iniciando sesión con Keycloak');
        }
    };

    // Mostrar loading si no se ha cargado systemInfo o si está procesando callback
    if (!systemInfoLoaded || callbackInProgress) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <Shield className="h-12 w-12 text-orange-500 animate-spin" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                        {callbackInProgress ? 'Procesando autenticación...' : 'Cargando sistema...'}
                    </h2>
                    <p className="text-gray-400">
                        Por favor espera mientras {callbackInProgress ? 'validamos tu sesión' : 'cargamos la configuración'}.
                    </p>
                </div>
            </div>
        );
    }

    // Si Keycloak no está disponible, mostrar mensaje
    if (!canUseKeycloak) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="max-w-md w-full space-y-8 p-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-red-600 p-4 rounded-lg mr-4">
                                <Shield className="h-12 w-12 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">ToolRent</h1>
                                <p className="text-gray-400 text-sm">Sistema de Gestión</p>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Sistema No Disponible
                        </h2>
                        <div className="bg-red-900/20 border border-red-800 p-4 rounded-lg">
                            <p className="text-red-300">
                                La autenticación con Keycloak no está habilitada en este sistema.
                            </p>
                            <p className="text-red-400 text-sm mt-2">
                                Contacta al administrador del sistema para configurar Keycloak.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-orange-600 p-4 rounded-lg mr-4">
                            <Wrench className="h-12 w-12 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">ToolRent</h1>
                            <p className="text-gray-400 text-sm">Sistema de Gestión</p>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                        Iniciar Sesión
                    </h2>
                </div>

                {/* Información de Keycloak */}
                <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                        <Shield className="h-5 w-5 text-orange-500 mr-2" />
                        <span className="text-white font-medium">Autenticación Keycloak</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                        Serás redirigido al sistema de autenticación seguro de Keycloak.
                    </p>
                    {systemInfo?.keycloakUrl && (
                        <p className="text-gray-500 text-xs">
                            Servidor: {systemInfo.keycloakUrl}
                        </p>
                    )}
                </div>

                {/* Debug info - solo en desarrollo */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-gray-800 p-3 rounded text-xs">
                        <div className="text-gray-400">Debug Info:</div>
                        <div className="text-gray-300">SystemInfo loaded: {systemInfoLoaded ? 'SÍ' : 'NO'}</div>
                        <div className="text-gray-300">Keycloak enabled: {systemInfo?.keycloakEnabled ? 'SÍ' : 'NO'}</div>
                        <div className="text-gray-300">Keycloak URL: {systemInfo?.keycloakUrl || 'N/A'}</div>
                        <div className="text-gray-300">Callback in progress: {callbackInProgress ? 'SÍ' : 'NO'}</div>
                        <div className="text-gray-300">URL params: {window.location.search || 'none'}</div>
                    </div>
                )}

                {/* Mostrar errores */}
                {error && (
                    <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 p-3 rounded-lg">
                        <div className="font-medium mb-1">Error de autenticación:</div>
                        <div className="text-red-300">{error}</div>
                        {error.includes('expiró') && (
                            <div className="mt-2 text-xs text-red-400">
                                Tip: Los códigos de autorización solo son válidos por unos minutos.
                                Intenta iniciar sesión nuevamente.
                            </div>
                        )}
                    </div>
                )}

                {/* Botón de login */}
                <div>
                    <button
                        type="button"
                        onClick={handleKeycloakLogin}
                        disabled={loading || callbackInProgress || !canUseKeycloak}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading || callbackInProgress ? (
                            <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2 animate-spin" />
                                Procesando...
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2" />
                                Continuar con Keycloak
                            </div>
                        )}
                    </button>
                </div>

                {/* Información adicional */}
                <div className="text-center text-xs text-gray-500">
                    <p>Sistema de autenticación: Solo Keycloak</p>
                    <p className="mt-1">
                        Utiliza las credenciales configuradas en tu servidor Keycloak
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
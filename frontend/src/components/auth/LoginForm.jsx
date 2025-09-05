import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Wrench, Shield, User } from 'lucide-react';

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessingCallback, setIsProcessingCallback] = useState(false);

    const {
        login,
        loading,
        authMode,
        switchAuthMode,
        systemInfo,
        canUseKeycloak,
        handleKeycloakCallback
    } = useAuth();

    // Manejar callback de Keycloak al cargar - SOLO UNA VEZ
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        // Mostrar error si viene en la URL
        if (error) {
            setError(decodeURIComponent(error));
            // Limpiar la URL
            window.history.replaceState({}, document.title, '/');
            return;
        }

        // Procesar código de Keycloak si existe
        if (code && authMode === 'keycloak' && !isProcessingCallback) {
            setIsProcessingCallback(true);
            handleKeycloakCallback(code)
                .then(result => {
                    if (!result.success) {
                        setError(result.error || 'Error en autenticación Keycloak');
                    }
                    // Limpiar la URL
                    window.history.replaceState({}, document.title, '/');
                })
                .catch(err => {
                    setError('Error procesando callback: ' + err.message);
                    window.history.replaceState({}, document.title, '/');
                })
                .finally(() => {
                    setIsProcessingCallback(false);
                });
        }
    }, [authMode, handleKeycloakCallback, isProcessingCallback]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (authMode === 'legacy' && (!username || !password)) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (authMode === 'keycloak') {
            // Para Keycloak, no necesitamos username/password aquí
            const result = await login(null, null, 'keycloak');
            if (!result.success && !result.redirect) {
                setError(result.error);
            }
            return;
        }

        const result = await login(username, password, 'legacy');
        if (!result.success) {
            setError(result.error);
        }
    };

    // Mostrar loading si está procesando callback
    if (isProcessingCallback) {
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

                {/* Selector de modo de autenticación */}
                {canUseKeycloak && (
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <p className="text-gray-300 text-sm mb-3">Método de autenticación:</p>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => switchAuthMode('legacy')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                    authMode === 'legacy'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <User className="h-4 w-4 inline mr-2" />
                                Sistema Local
                            </button>
                            <button
                                type="button"
                                onClick={() => switchAuthMode('keycloak')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                    authMode === 'keycloak'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <Shield className="h-4 w-4 inline mr-2" />
                                Keycloak
                            </button>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {authMode === 'legacy' ? (
                        // Formulario tradicional
                        <div className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    required
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                    placeholder="Usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    ) : (
                        // Información para Keycloak
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <Shield className="h-5 w-5 text-orange-500 mr-2" />
                                <span className="text-white font-medium">Autenticación Keycloak</span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Serás redirigido al sistema de autenticación seguro de Keycloak.
                            </p>
                            {systemInfo?.keycloakUrl && (
                                <p className="text-gray-500 text-xs mt-2">
                                    Servidor: {systemInfo.keycloakUrl}
                                </p>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || isProcessingCallback}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading || isProcessingCallback ? (
                                'Iniciando sesión...'
                            ) : authMode === 'keycloak' ? (
                                <>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Continuar con Keycloak
                                </>
                            ) : (
                                <>
                                    <User className="h-4 w-4 mr-2" />
                                    Iniciar Sesión
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Información del sistema */}
                {systemInfo && (
                    <div className="text-center text-xs text-gray-500">
                        <p>Sistema: {systemInfo.keycloakEnabled ? 'Keycloak + Local' : 'Solo Local'}</p>
                        {authMode === 'legacy' && (
                            <div className="mt-2 bg-gray-800 p-2 rounded">
                                <p className="text-gray-400">Usuarios de prueba:</p>
                                <p className="text-gray-500">Admin: admin / admin | Empleado: employee / emp123</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginForm;
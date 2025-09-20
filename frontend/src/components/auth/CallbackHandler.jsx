import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

const CallbackHandler = () => {
    const { handleKeycloakCallback, isAuthenticated, user } = useAuth();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    const processedRef = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Prevenir múltiples ejecuciones
        if (processedRef.current) {
            console.log('Callback ya procesado, ignorando...');
            return;
        }

        const processCallback = async () => {
            // Marcar como procesado inmediatamente
            processedRef.current = true;

            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');

            console.log('CallbackHandler iniciando...');
            console.log('Code:', code?.substring(0, 20) + '...');
            console.log('State:', state);
            console.log('Error:', error);

            // Limpiar URL inmediatamente para prevenir reprocesamiento
            const cleanUrl = () => {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            };

            // Si hay error en la URL de Keycloak
            if (error) {
                let errorMessage = decodeURIComponent(error);
                if (errorDescription) {
                    errorMessage += ': ' + decodeURIComponent(errorDescription);
                }

                setStatus('error');
                setMessage(errorMessage);

                cleanUrl();

                // Redirigir después de mostrar el error
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 3000);
                return;
            }

            // Si no hay código, redirigir directamente
            if (!code) {
                console.log('No hay código de autorización, redirigiendo...');
                cleanUrl();
                navigate('/', { replace: true });
                return;
            }

            // Procesar el código UNA SOLA VEZ
            try {
                setStatus('processing');
                setMessage('Validando código de autorización...');

                console.log('Procesando código de autorización...');

                const result = await handleKeycloakCallback(code, state);

                if (result.success) {
                    setStatus('success');
                    setMessage('Autenticación exitosa. Redirigiendo...');
                    setUserInfo(result.user);

                    cleanUrl();

                    console.log('=== LOGIN COMPLETADO ===');
                    console.log('Usuario autenticado:', result.user?.username);
                    console.log('Rol asignado:', result.user?.role);

                    // Redirigir al dashboard después de un breve delay
                    setTimeout(() => {
                        // Usar navigate en lugar de window.location para mejor control
                        navigate('/', { replace: true, state: { loginSuccess: true } });
                    }, 1500);
                } else {
                    setStatus('error');
                    setMessage(result.error || 'Error en la autenticación');

                    cleanUrl();

                    // Redirigir al login con el error después de un delay
                    setTimeout(() => {
                        navigate('/', {
                            replace: true,
                            state: { error: result.error }
                        });
                    }, 3000);
                }
            } catch (err) {
                console.error('Exception en callback:', err);
                setStatus('error');
                setMessage('Error inesperado: ' + err.message);

                cleanUrl();

                setTimeout(() => {
                    navigate('/', {
                        replace: true,
                        state: { error: 'Error inesperado durante la autenticación' }
                    });
                }, 3000);
            }
        };

        // Pequeño delay para asegurar que el componente está montado
        const timeoutId = setTimeout(processCallback, 100);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [handleKeycloakCallback, navigate]);

    // Si ya está autenticado, redirigir inmediatamente
    useEffect(() => {
        if (isAuthenticated && user && status === 'success') {
            console.log('Usuario ya autenticado, redirigiendo al dashboard...');
            console.log('Usuario:', user.username, 'Rol:', user.role);
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, user, status, navigate]);

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

                    {/* Información del usuario en caso de éxito */}
                    {status === 'success' && userInfo && (
                        <div className="bg-green-900/20 border border-green-800 p-4 rounded-lg mb-4">
                            <p className="text-green-400 text-sm font-medium">
                                ¡Bienvenido, {userInfo.username}!
                            </p>
                            <p className="text-green-300 text-xs">
                                Rol: {userInfo.role}
                            </p>
                        </div>
                    )}

                    {/* Información adicional según el estado */}
                    {status === 'processing' && (
                        <div className="text-gray-400 text-xs">
                            <p>Validando con Keycloak...</p>
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
                            <p>Error procesando la autenticación.</p>
                            <p className="mt-1">Serás redirigido al login en unos segundos.</p>
                            <button
                                onClick={() => {
                                    navigate('/', { replace: true });
                                }}
                                className="mt-3 text-orange-500 hover:text-orange-400 underline"
                            >
                                Regresar ahora
                            </button>
                        </div>
                    )}

                    {/* Debug info - solo en desarrollo */}
                    {import.meta.env.DEV && (
                        <div className="mt-6 bg-gray-800 p-3 rounded text-xs text-left">
                            <div className="text-gray-400 mb-1">Debug Info:</div>
                            <div className="text-gray-300">Status: {status}</div>
                            <div className="text-gray-300">Processed: {processedRef.current ? 'Sí' : 'No'}</div>
                            <div className="text-gray-300">Authenticated: {isAuthenticated ? 'Sí' : 'No'}</div>
                            <div className="text-gray-300">User Role: {user?.role || 'none'}</div>
                            <div className="text-gray-300">Original URL: {window.location.search || 'none'}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallbackHandler;
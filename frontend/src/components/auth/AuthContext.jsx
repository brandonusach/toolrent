import React, { useState, createContext, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de AuthProvider');
    }
    return context;
};

// Fix: Use correct backend port (8081)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState(null);
    const [systemInfoLoaded, setSystemInfoLoaded] = useState(false);
    const [callbackInProgress, setCallbackInProgress] = useState(false);

    // Función para verificar la configuración del sistema
    const checkSystemInfo = async () => {
        console.log('Cargando información del sistema desde:', `${API_BASE_URL}/api/auth/system-info`);
        try {
            const url = `${API_BASE_URL}/api/auth/system-info`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status system-info:', response.status);

            if (response.ok) {
                const info = await response.json();
                console.log('System info cargada exitosamente:', info);
                setSystemInfo(info);
            } else {
                console.error('Error cargando system info. Status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                setSystemInfo({ keycloakEnabled: false, error: `HTTP ${response.status}` });
            }
        } catch (error) {
            console.error('Error en checkSystemInfo:', error);
            console.error('Posibles causas:');
            console.error('1. Backend no está ejecutándose en puerto 8081');
            console.error('2. CORS no configurado correctamente');
            console.error('3. URL del backend incorrecta:', API_BASE_URL);
            setSystemInfo({ keycloakEnabled: false, error: error.message });
        } finally {
            setSystemInfoLoaded(true);
        }
    };

    // Cargar system info al iniciar
    useEffect(() => {
        checkSystemInfo();
    }, []);

    // Verificar token guardado al inicializar
    useEffect(() => {
        const savedToken = localStorage.getItem('keycloak_token');
        const savedUser = localStorage.getItem('keycloak_user');

        if (savedToken && savedUser) {
            try {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Error parsing saved user data:', error);
                localStorage.removeItem('keycloak_token');
                localStorage.removeItem('keycloak_user');
            }
        }

        setLoading(false);
    }, []);

    // Generar state seguro para OAuth
    const generateState = () => {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    };

    // Iniciar login con Keycloak
    const startKeycloakLogin = async () => {
        if (!systemInfo?.keycloakEnabled) {
            const errorMsg = systemInfo?.error
                ? `Keycloak no está habilitado. Error: ${systemInfo.error}`
                : 'Keycloak no está habilitado en el sistema';
            console.error('Login fallido:', errorMsg);
            return { success: false, error: errorMsg };
        }

        try {
            setLoading(true);

            // Limpiar estados anteriores
            sessionStorage.clear();

            // Generar nuevo state
            const state = generateState();

            // Guardar state con timestamp
            const stateData = {
                state: state,
                timestamp: Date.now()
            };
            sessionStorage.setItem('oauth_state', JSON.stringify(stateData));

            console.log('Generando URL de Keycloak con state:', state.substring(0, 10) + '...');

            // Usar el endpoint correcto del backend
            const response = await fetch(`${API_BASE_URL}/api/auth/login-url`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status login-url:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('URL de login obtenida:', data.loginUrl);
                window.location.href = data.loginUrl;
                return { success: true, redirect: true };
            } else {
                const errorText = await response.text();
                console.error('Error obteniendo URL de login:', errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: `HTTP ${response.status}: ${errorText}` };
                }
                return { success: false, error: errorData.error || 'Error obteniendo URL de Keycloak' };
            }
        } catch (error) {
            console.error('Error iniciando login Keycloak:', error);
            return { success: false, error: `Error de conexión: ${error.message}` };
        } finally {
            setLoading(false);
        }
    };

    // Validar state parameter
    const validateState = (receivedState) => {
        console.log('Validando state parameter:', receivedState);

        if (!receivedState) {
            console.warn('No se recibió parámetro state en callback');
            const stateDataStr = sessionStorage.getItem('oauth_state');
            if (stateDataStr) {
                console.log('Hay state guardado pero no fue devuelto por Keycloak');
                sessionStorage.removeItem('oauth_state');

                if (import.meta.env.DEV) {
                    console.warn('DESARROLLO: Permitiendo callback sin state parameter');
                    return { valid: true, warning: 'State parameter no recibido (solo en desarrollo)' };
                }

                return { valid: false, error: 'Parámetro state no recibido de Keycloak' };
            } else {
                console.log('No hay state guardado, posible flujo directo');
                return { valid: true, warning: 'Flujo sin validación de state' };
            }
        }

        const stateDataStr = sessionStorage.getItem('oauth_state');
        if (!stateDataStr) {
            console.error('State recibido pero no hay datos guardados');
            return { valid: false, error: 'No se encontraron datos de state guardados' };
        }

        try {
            const stateData = JSON.parse(stateDataStr);
            const now = Date.now();
            const maxAge = 10 * 60 * 1000; // 10 minutos

            if (now - stateData.timestamp > maxAge) {
                console.error('State expirado');
                sessionStorage.removeItem('oauth_state');
                return { valid: false, error: 'La sesión de autenticación expiró. Intenta nuevamente.' };
            }

            if (stateData.state !== receivedState) {
                console.error('State mismatch:', {
                    expected: stateData.state?.substring(0, 10) + '...',
                    received: receivedState?.substring(0, 10) + '...'
                });
                return { valid: false, error: 'Parámetro state inválido (posible problema de seguridad)' };
            }

            console.log('State validado correctamente');
            return { valid: true };
        } catch (error) {
            console.error('Error parsing state data:', error);
            return { valid: false, error: 'Datos de state corruptos' };
        }
    };

    // Callback de Keycloak simplificado
    const handleKeycloakCallback = async (code, state) => {
        console.log('=== INICIANDO CALLBACK DE KEYCLOAK ===');
        console.log('Code recibido:', code?.substring(0, 10) + '...');
        console.log('State recibido:', state || 'NO RECIBIDO');

        if (callbackInProgress) {
            console.log('Callback ya en progreso, ignorando...');
            return { success: false, error: 'Callback ya en progreso' };
        }

        setCallbackInProgress(true);
        setLoading(true);

        try {
            // Validar state parameter
            const stateValidation = validateState(state);
            if (!stateValidation.valid) {
                console.error('Validación de state falló:', stateValidation.error);
                return { success: false, error: stateValidation.error };
            }

            if (stateValidation.warning) {
                console.warn('Advertencia de validación:', stateValidation.warning);
            }

            if (!systemInfo?.keycloakUrl) {
                console.error('Información de Keycloak no disponible');
                return { success: false, error: 'Configuración de Keycloak no disponible' };
            }

            const keycloakBaseUrl = systemInfo.keycloakUrl;
            const realm = systemInfo.realm || 'toolrent-realm';
            const clientId = systemInfo.clientId || 'toolrent-frontend';

            console.log('Intercambiando código por token...');

            // Preparar parámetros del token
            const tokenParams = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId,
                code: code,
                redirect_uri: `${window.location.origin}/callback`,
            });

            // Intercambiar código por token
            const tokenResponse = await fetch(
                `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                    },
                    body: tokenParams,
                }
            );

            console.log('Response status del token:', tokenResponse.status);

            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                console.error('Error en token exchange:', errorText);

                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: 'unknown', error_description: errorText };
                }

                let userFriendlyError = 'Error en intercambio de tokens';
                if (errorData.error === 'invalid_grant') {
                    userFriendlyError = 'El código de autorización expiró o ya fue utilizado. Por favor, intenta iniciar sesión nuevamente.';
                } else if (errorData.error === 'invalid_client') {
                    userFriendlyError = 'Configuración de cliente inválida. Contacta al administrador del sistema.';
                } else if (errorData.error === 'invalid_request') {
                    userFriendlyError = 'Solicitud inválida. Verifica la configuración de redirect_uri.';
                }

                return { success: false, error: userFriendlyError };
            }

            const tokenData = await tokenResponse.json();
            console.log('Token obtenido exitosamente');

            // Obtener información del usuario usando el endpoint correcto
            const userResponse = await fetch(`${API_BASE_URL}/api/auth/user-info`, {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Accept': 'application/json',
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                console.log('Información del usuario obtenida:', userData);

                const processedUser = {
                    username: userData.username,
                    email: userData.email,
                    name: userData.name,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.roles?.[0]?.authority?.replace('ROLE_', '') || 'user'
                };

                setToken(tokenData.access_token);
                setUser(processedUser);

                localStorage.setItem('keycloak_token', tokenData.access_token);
                localStorage.setItem('keycloak_user', JSON.stringify(processedUser));

                sessionStorage.removeItem('oauth_state');

                console.log('=== CALLBACK COMPLETADO EXITOSAMENTE ===');
                return { success: true };
            } else {
                const errorText = await userResponse.text();
                console.error('Error obteniendo info del usuario:', errorText);
                return { success: false, error: 'Error obteniendo información del usuario' };
            }
        } catch (error) {
            console.error('Error en callback de Keycloak:', error);
            return { success: false, error: 'Error en callback de Keycloak: ' + error.message };
        } finally {
            setCallbackInProgress(false);
            setLoading(false);
        }
    };

    // Logout
    const logout = async () => {
        console.log('Iniciando logout de Keycloak');

        try {
            // Usar el endpoint de logout del backend
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Limpiar datos locales antes de redirigir
                setToken(null);
                setUser(null);
                setCallbackInProgress(false);
                localStorage.removeItem('keycloak_token');
                localStorage.removeItem('keycloak_user');
                sessionStorage.clear();

                console.log('Redirigiendo a logout de Keycloak:', data.logoutUrl);
                window.location.href = data.logoutUrl;
                return;
            }
        } catch (error) {
            console.error('Error en logout de Keycloak:', error);
        }

        // Logout local como fallback
        setToken(null);
        setUser(null);
        setCallbackInProgress(false);
        localStorage.removeItem('keycloak_token');
        localStorage.removeItem('keycloak_user');
        sessionStorage.clear();

        console.log('Logout local completado');
    };

    // Authenticated fetch
    const authenticatedFetch = async (url, options = {}) => {
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        };

        try {
            const response = await fetch(url, config);
            if (response.status === 401) {
                console.log('Token expirado, cerrando sesión');
                logout();
            }
            return response;
        } catch (error) {
            console.error('Error en authenticatedFetch:', error);
            throw error;
        }
    };

    const value = {
        user,
        token,
        login: startKeycloakLogin,
        logout,
        loading,
        authenticatedFetch,
        systemInfo,
        systemInfoLoaded,
        handleKeycloakCallback,
        callbackInProgress,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'administrator' || user?.role === 'admin',
        canUseKeycloak: systemInfo?.keycloakEnabled || false
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
import React, { useState, createContext, useContext, useEffect, useRef } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de AuthProvider');
    }
    return context;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState(null);
    const [systemInfoLoaded, setSystemInfoLoaded] = useState(false);
    const [callbackInProgress, setCallbackInProgress] = useState(false);

    // Refs para prevenir procesamiento múltiple
    const callbackProcessingRef = useRef(false);
    const loginInProgressRef = useRef(false);

    // FUNCIÓN PARA LIMPIAR COMPLETAMENTE EL STORAGE (solo cuando sea necesario)
    const clearAllStorage = () => {
        localStorage.clear();
        sessionStorage.clear();
        console.log('Storage completamente limpiado');
    };

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
            setSystemInfo({ keycloakEnabled: false, error: error.message });
        } finally {
            setSystemInfoLoaded(true);
        }
    };

    // Cargar system info al iniciar
    useEffect(() => {
        checkSystemInfo();
    }, []);

    // VERIFICAR TOKEN GUARDADO AL INICIALIZAR - SIN LIMPIAR STORAGE
    useEffect(() => {
        console.log('=== VERIFICANDO AUTENTICACIÓN EXISTENTE ===');

        const savedToken = localStorage.getItem('keycloak_token');
        const savedUser = localStorage.getItem('keycloak_user');

        if (savedToken && savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                console.log('Token y usuario encontrados en storage:');
                console.log('Username:', userData.username);
                console.log('Role:', userData.role);

                setToken(savedToken);
                setUser(userData);

                console.log('Autenticación restaurada desde storage');
            } catch (error) {
                console.error('Error parsing saved user data:', error);
                // Solo limpiar si hay datos corruptos
                localStorage.removeItem('keycloak_token');
                localStorage.removeItem('keycloak_user');
            }
        } else {
            console.log('No se encontró autenticación previa');
        }

        setLoading(false);
    }, []);

    // Generar state más simple y confiable
    const generateState = () => {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    };

    // Iniciar login con Keycloak - PREVENIR MÚLTIPLES LLAMADAS
    const startKeycloakLogin = async () => {
        // Prevenir múltiples llamadas simultáneas
        if (loginInProgressRef.current) {
            console.log('Login ya en progreso, ignorando...');
            return { success: false, error: 'Login ya en progreso' };
        }

        loginInProgressRef.current = true;

        if (!systemInfo?.keycloakEnabled) {
            loginInProgressRef.current = false;
            const errorMsg = systemInfo?.error
                ? `Keycloak no está habilitado. Error: ${systemInfo.error}`
                : 'Keycloak no está habilitado en el sistema';
            console.error('Login fallido:', errorMsg);
            return { success: false, error: errorMsg };
        }

        try {
            setLoading(true);

            // Limpiar solo datos de OAuth (no toda la autenticación)
            localStorage.removeItem('oauth_state');
            sessionStorage.removeItem('oauth_state');

            // Generar state simple
            const state = generateState();
            console.log('Estado generado para login:', state);

            // Guardar state en localStorage
            localStorage.setItem('oauth_state', state);

            // Construir URL manualmente para tener más control
            const baseUrl = `${API_BASE_URL}/api/auth/login-url`;
            const params = new URLSearchParams({
                state: state,
                redirect_uri: `${window.location.origin}/callback`
            });

            console.log('Solicitando URL de login...');
            const response = await fetch(`${baseUrl}?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status login-url:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('URL de login obtenida, redirigiendo...');

                // Resetear flag antes de redireccionar
                loginInProgressRef.current = false;

                window.location.href = data.loginUrl;
                return { success: true, redirect: true };
            } else {
                const errorText = await response.text();
                console.error('Error obteniendo URL de login:', errorText);
                return { success: false, error: `Error obteniendo URL de Keycloak: ${errorText}` };
            }
        } catch (error) {
            console.error('Error iniciando login Keycloak:', error);
            return { success: false, error: `Error de conexión: ${error.message}` };
        } finally {
            loginInProgressRef.current = false;
            setLoading(false);
        }
    };

    // Validación de state simplificada
    const validateState = (receivedState) => {
        console.log('Validando state parameter:', receivedState);

        // En desarrollo, ser más permisivo con la validación
        if (import.meta.env.DEV) {
            console.log('MODO DESARROLLO: Validación de state relajada');
            // Solo limpiar OAuth state, no toda la autenticación
            localStorage.removeItem('oauth_state');
            sessionStorage.removeItem('oauth_state');
            return { valid: true, warning: 'State validation bypassed for development' };
        }

        if (!receivedState) {
            console.warn('No se recibió parámetro state');
            return { valid: true, warning: 'State parameter no recibido' };
        }

        const savedState = localStorage.getItem('oauth_state');

        if (!savedState) {
            console.warn('No hay state guardado');
            return { valid: true, warning: 'No hay state guardado' };
        }

        // Limpiar solo el state de OAuth
        localStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_state');

        if (savedState !== receivedState) {
            console.error('State mismatch:', {
                expected: savedState,
                received: receivedState
            });
            return {
                valid: false,
                error: `State inválido. Esperado: ${savedState}, Recibido: ${receivedState}`
            };
        }

        console.log('State validado correctamente');
        return { valid: true };
    };

    // Callback de Keycloak con protección contra múltiples llamadas
    const handleKeycloakCallback = async (code, state) => {
        console.log('=== INICIANDO CALLBACK DE KEYCLOAK ===');

        // CRÍTICO: Prevenir múltiples procesamientos del mismo código
        if (callbackProcessingRef.current) {
            console.log('Callback ya está siendo procesado, ignorando llamada duplicada...');
            return { success: false, error: 'Callback ya en procesamiento' };
        }

        // Marcar inmediatamente como en procesamiento
        callbackProcessingRef.current = true;
        setCallbackInProgress(true);
        setLoading(true);

        try {
            console.log('Code recibido:', code?.substring(0, 20) + '...');
            console.log('State recibido:', state);

            // Validar state parameter
            const stateValidation = validateState(state);
            if (!stateValidation.valid) {
                console.error('Validación de state falló:', stateValidation.error);
                return { success: false, error: stateValidation.error };
            }

            if (stateValidation.warning) {
                console.warn('Advertencia de validación:', stateValidation.warning);
            }

            // Usar el endpoint del backend para intercambio de token
            console.log('Enviando código al backend (SOLO UNA VEZ)...');

            const response = await fetch(`${API_BASE_URL}/api/auth/callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    state: state,
                    redirectUri: `${window.location.origin}/callback`
                })
            });

            console.log('Response status del callback:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error en callback:', errorText);

                let friendlyError = 'Error en autenticación';
                if (errorText.includes('Code not valid')) {
                    friendlyError = 'Código de autorización inválido, expirado o ya utilizado';
                }

                return {
                    success: false,
                    error: friendlyError
                };
            }

            const tokenData = await response.json();
            console.log('=== DATOS DEL TOKEN RECIBIDOS ===');
            console.log('Token data completo:', tokenData);
            console.log('Usuario recibido:', tokenData.user);
            console.log('Rol del usuario:', tokenData.user?.role);

            if (tokenData.access_token && tokenData.user) {
                // ESTABLECER USUARIO Y TOKEN
                console.log('=== ESTABLECIENDO USUARIO Y TOKEN ===');
                console.log('Rol que se va a establecer:', tokenData.user.role);

                setToken(tokenData.access_token);
                setUser(tokenData.user);

                // Guardar en localStorage para persistencia
                localStorage.setItem('keycloak_token', tokenData.access_token);
                localStorage.setItem('keycloak_user', JSON.stringify(tokenData.user));

                console.log('=== CALLBACK COMPLETADO EXITOSAMENTE ===');
                console.log('Usuario final establecido:', tokenData.user.username);
                console.log('Rol final establecido:', tokenData.user.role);

                return { success: true, user: tokenData.user };
            } else {
                return {
                    success: false,
                    error: 'Respuesta inválida del servidor'
                };
            }

        } catch (error) {
            console.error('Error en callback de Keycloak:', error);
            return {
                success: false,
                error: 'Error en callback de Keycloak: ' + error.message
            };
        } finally {
            // IMPORTANTE: Resetear flags al final
            callbackProcessingRef.current = false;
            setCallbackInProgress(false);
            setLoading(false);
        }
    };

    // Logout mejorado
    const logout = async () => {
        console.log('Iniciando logout de Keycloak');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Limpiar datos locales
                setToken(null);
                setUser(null);
                setCallbackInProgress(false);

                // Resetear refs
                callbackProcessingRef.current = false;
                loginInProgressRef.current = false;

                clearAllStorage();

                if (data.logoutUrl) {
                    console.log('Redirigiendo a logout de Keycloak:', data.logoutUrl);
                    window.location.href = data.logoutUrl;
                    return;
                }
            }
        } catch (error) {
            console.error('Error en logout de Keycloak:', error);
        }

        // Logout local como fallback
        setToken(null);
        setUser(null);
        setCallbackInProgress(false);
        callbackProcessingRef.current = false;
        loginInProgressRef.current = false;
        clearAllStorage();
        window.location.href = '/';
    };

    // DEBUG: Mostrar información del usuario actual
    useEffect(() => {
        if (user) {
            console.log('=== USUARIO ACTUAL EN CONTEXT ===');
            console.log('Username:', user.username);
            console.log('Role:', user.role);
            console.log('Roles:', user.roles);
            console.log('Is Admin:', user?.role === 'administrator');
        }
    }, [user]);

    const value = {
        user,
        token,
        login: startKeycloakLogin,
        logout,
        loading,
        systemInfo,
        systemInfoLoaded,
        handleKeycloakCallback,
        callbackInProgress,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'administrator',
        userRole: user?.role || 'none',
        canUseKeycloak: systemInfo?.keycloakEnabled || false
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
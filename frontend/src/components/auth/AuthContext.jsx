import React, { useState, createContext, useContext, useEffect } from 'react';

// Context para manejar la autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto de auth
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de AuthProvider');
    }
    return context;
};

// Configuración del backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

// Provider de autenticación
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [authMode, setAuthMode] = useState('legacy'); // 'legacy' o 'keycloak'
    const [systemInfo, setSystemInfo] = useState(null);

    // Verificar configuración del sistema al cargar
    useEffect(() => {
        checkSystemInfo();
    }, []);

    // Verificar si hay un token guardado al cargar la aplicación
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const savedAuthMode = localStorage.getItem('authMode') || 'legacy';

        if (savedToken && savedUser) {
            try {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
                setAuthMode(savedAuthMode);
            } catch (error) {
                console.error('Error parsing saved user data:', error);
                // Limpiar datos corruptos
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('authMode');
            }
        }
    }, []);

    // Función para verificar la configuración del sistema
    const checkSystemInfo = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/system-info`);
            if (response.ok) {
                const info = await response.json();
                setSystemInfo(info);
                // Auto-detectar modo preferido
                if (info.keycloakEnabled && authMode === 'legacy') {
                    console.log('Sistema Keycloak disponible, puedes cambiar al modo Keycloak');
                }
            }
        } catch (error) {
            console.log('No se pudo obtener información del sistema:', error);
            // Configurar info por defecto si falla
            setSystemInfo({ keycloakEnabled: false });
        }
    };

    // Función para login tradicional (JWT)
    const loginLegacy = async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                const userData = {
                    id: data.userId,
                    username: data.username,
                    role: data.role
                };

                setToken(data.token);
                setUser(userData);
                setAuthMode('legacy');

                // Guardar en localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('authMode', 'legacy');

                return { success: true, mode: 'legacy' };
            } else {
                const errorMessage = await response.text();
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('Error en login legacy:', error);
            return { success: false, error: 'Error de conexión' };
        }
    };

    // Función para obtener URL de login de Keycloak
    const getKeycloakLoginUrl = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/keycloak/login-url`);
            if (response.ok) {
                const data = await response.json();
                return { success: true, loginUrl: data.loginUrl };
            } else {
                const error = await response.json();
                return { success: false, error: error.error || 'Error obteniendo URL de Keycloak' };
            }
        } catch (error) {
            console.error('Error obteniendo URL de Keycloak:', error);
            return { success: false, error: 'Error de conexión con Keycloak' };
        }
    };

    // Función para procesar callback de Keycloak (cuando regresa del login)
    const handleKeycloakCallback = async (code) => {
        if (!systemInfo?.keycloakUrl) {
            return { success: false, error: 'Información de Keycloak no disponible' };
        }

        try {
            // Intercambiar código por token
            const tokenResponse = await fetch(`${systemInfo.keycloakUrl}/realms/toolrent-realm/protocol/openid-connect/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: 'toolrent-frontend',
                    code: code,
                    redirect_uri: `${window.location.origin}/callback`,
                }),
            });

            if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();

                // Obtener información del usuario
                const userResponse = await fetch(`${API_BASE_URL}/api/auth/keycloak/user-info`, {
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`
                    }
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();

                    const processedUser = {
                        username: userData.username,
                        email: userData.email,
                        name: userData.name,
                        role: userData.roles?.[0]?.authority?.replace('ROLE_', '') || 'employee'
                    };

                    setToken(tokenData.access_token);
                    setUser(processedUser);
                    setAuthMode('keycloak');

                    // Guardar en localStorage
                    localStorage.setItem('token', tokenData.access_token);
                    localStorage.setItem('user', JSON.stringify(processedUser));
                    localStorage.setItem('authMode', 'keycloak');

                    return { success: true, mode: 'keycloak' };
                } else {
                    console.error('Error obteniendo info del usuario:', await userResponse.text());
                    return { success: false, error: 'Error obteniendo información del usuario' };
                }
            } else {
                console.error('Error en token exchange:', await tokenResponse.text());
                return { success: false, error: 'Error en intercambio de tokens' };
            }
        } catch (error) {
            console.error('Error en callback de Keycloak:', error);
            return { success: false, error: 'Error en callback de Keycloak: ' + error.message };
        }
    };

    // Función principal de login que decide qué método usar
    const login = async (username, password, mode = authMode) => {
        setLoading(true);
        try {
            if (mode === 'keycloak') {
                const result = await getKeycloakLoginUrl();
                if (result.success) {
                    // Redirigir a Keycloak
                    window.location.href = result.loginUrl;
                    return { success: true, redirect: true };
                }
                return result;
            } else {
                return await loginLegacy(username, password);
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: 'Error inesperado durante el login' };
        } finally {
            setLoading(false);
        }
    };

    // Función para cambiar modo de autenticación
    const switchAuthMode = (mode) => {
        setAuthMode(mode);
        localStorage.setItem('authMode', mode);
    };

    // Función para hacer logout
    const logout = async () => {
        if (authMode === 'keycloak' && systemInfo?.keycloakUrl) {
            try {
                // Logout de Keycloak
                const logoutUrl = `${systemInfo.keycloakUrl}/realms/toolrent-realm/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
                window.location.href = logoutUrl;
            } catch (error) {
                console.error('Error en logout de Keycloak:', error);
            }
        }

        // Limpieza local
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('authMode');
    };

    // Función para hacer requests autenticadas
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

            // Si el token expiró, hacer logout
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
        login,
        logout,
        loading,
        authenticatedFetch,
        authMode,
        switchAuthMode,
        systemInfo,
        handleKeycloakCallback,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'ADMINISTRATOR' || user?.role === 'administrator' || user?.role === 'ADMIN',
        canUseKeycloak: systemInfo?.keycloakEnabled || false
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
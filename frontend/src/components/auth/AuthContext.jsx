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

// Provider de autenticación
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);

    // Verificar si hay un token guardado al cargar la aplicación
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
    }, []);

    // Función para hacer login
    const login = async (username, password) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
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

                // Guardar en localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(userData));

                return { success: true };
            } else {
                const errorMessage = await response.text();
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        } finally {
            setLoading(false);
        }
    };

    // Función para hacer logout
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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

        return fetch(url, config);
    };

    const value = {
        user,
        token,
        login,
        logout,
        loading,
        authenticatedFetch,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'ADMINISTRATOR' || user?.role === 'ADMIN' // Ajustamos para diferentes nombres de rol
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
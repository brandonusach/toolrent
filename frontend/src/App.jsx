import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import LoginForm from './components/auth/LoginForm';
import AdminPanel from './components/panel/AdminPanel';
import CallbackHandler from './components/auth/CallbackHandler';
import './App.css';

// Componente que decide qué mostrar según el estado de autenticación
const AppContent = () => {
    const { isAuthenticated, loading } = useAuth();

    // Mostrar loading mientras se inicializa
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="text-white mt-4">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="App">
            {isAuthenticated ? <AdminPanel /> : <LoginForm />}
        </div>
    );
};

// Componente de prueba simple para verificar que React funciona
const TestComponent = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center">
                <h1 className="text-white text-2xl">React está funcionando</h1>
                <p className="text-gray-400 mt-2">Si ves esto, el problema no es con React básico</p>
            </div>
        </div>
    );
};

// App principal envuelto en AuthProvider y Router
function App() {
    // return <TestComponent />;

    try {
        return (
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/callback" element={<CallbackHandler />} />
                        <Route path="/" element={<AppContent />} />
                    </Routes>
                </Router>
            </AuthProvider>
        );
    } catch (error) {
        console.error('Error en App:', error);
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <h1 className="text-red-500 text-2xl">Error en la aplicación</h1>
                    <p className="text-gray-400 mt-2">{error.message}</p>
                </div>
            </div>
        );
    }
}

export default App;
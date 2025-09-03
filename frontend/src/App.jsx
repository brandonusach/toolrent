import React from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import LoginForm from './components/auth/LoginForm';
import AdminPanel from './components/panel/AdminPanel';
import './App.css';

// Componente que decide qué mostrar según el estado de autenticación
const AppContent = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="App">
            {isAuthenticated ? <AdminPanel /> : <LoginForm />}
        </div>
    );
};

// App principal envuelto en AuthProvider
function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
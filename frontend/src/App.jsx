import React from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import LoginForm from './components/auth/LoginForm';
import UserManagement from './components/UserManagement';
import './App.css';

// Componente que decide qué mostrar según el estado de autenticación
const AppContent = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="App">
            {isAuthenticated ? <UserManagement /> : <LoginForm />}
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
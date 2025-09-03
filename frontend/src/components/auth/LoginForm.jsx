import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Wrench } from 'lucide-react';

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loading } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        const result = await login(username, password);
        if (!result.success) {
            setError(result.error);
        }
    };

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
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
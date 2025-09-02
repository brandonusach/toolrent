import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from './auth/AuthContext'; // Importar useAuth

const GestionUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [rol, setRol] = useState('EMPLOYEE');

    // Usar el contexto de autenticación
    const { logout, authenticatedFetch } = useAuth();

    const API_BASE = 'http://localhost:8080/api/users';

    const cargarUsuarios = async () => {
        setCargando(true);
        try {
            const respuesta = await authenticatedFetch(API_BASE);
            if (respuesta.ok) {
                const datos = await respuesta.json();
                setUsuarios(datos);
                setMensaje(`✅ ${datos.length} usuarios cargados`);
            } else {
                throw new Error(`Error ${respuesta.status}`);
            }
        } catch (err) {
            setMensaje('🔴 Error de conexión con el servidor');
        } finally {
            setCargando(false);
        }
    };

    const crearUsuario = async () => {
        if (!nombreUsuario || !contrasena) {
            setMensaje('🔴 Completa todos los campos');
            return;
        }

        setCargando(true);
        try {
            const respuesta = await authenticatedFetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: nombreUsuario,
                    password: contrasena,
                    role: rol
                })
            });

            if (respuesta.ok) {
                setMensaje(`✅ Usuario "${nombreUsuario}" creado`);
                setNombreUsuario('');
                setContrasena('');
                setRol('EMPLOYEE');
                cargarUsuarios();
            } else {
                throw new Error('Error al crear usuario');
            }
        } catch (err) {
            setMensaje('🔴 Error al crear usuario');
        } finally {
            setCargando(false);
        }
    };

    const eliminarUsuario = async (id) => {
        if (!confirm('¿Eliminar usuario?')) return;

        setCargando(true);
        try {
            const respuesta = await authenticatedFetch(`${API_BASE}/${id}`, {
                method: 'DELETE'
            });
            if (respuesta.ok) {
                setMensaje('✅ Usuario eliminado');
                cargarUsuarios();
            } else {
                throw new Error('Error al eliminar');
            }
        } catch (err) {
            setMensaje('🔴 Error al eliminar usuario');
        } finally {
            setCargando(false);
        }
    };

    // Función de logout corregida
    const salir = () => {
        if (confirm('¿Cerrar sesión?')) {
            logout(); // Usar la función logout del contexto
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    useEffect(() => {
        if (mensaje) {
            const timer = setTimeout(() => setMensaje(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded shadow">
                <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    <h1 className="text-xl font-bold">ToolRent - Usuarios</h1>
                </div>
                <button
                    onClick={salir}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded flex items-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Salir
                </button>
            </div>

            {/* Mensaje */}
            {mensaje && (
                <div className="mb-4 p-3 bg-gray-100 rounded">
                    {mensaje}
                </div>
            )}

            {/* Formulario */}
            <div className="bg-white p-4 rounded shadow mb-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Nuevo Usuario
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                        type="text"
                        placeholder="Usuario"
                        value={nombreUsuario}
                        onChange={(e) => setNombreUsuario(e.target.value)}
                        className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        disabled={cargando}
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        disabled={cargando}
                    />
                    <select
                        value={rol}
                        onChange={(e) => setRol(e.target.value)}
                        className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        disabled={cargando}
                    >
                        <option value="EMPLOYEE">Empleado</option>
                        <option value="ADMINISTRATOR">Administrador</option>
                    </select>
                    <button
                        onClick={crearUsuario}
                        disabled={cargando || !nombreUsuario || !contrasena}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
                    >
                        {cargando ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        Crear
                    </button>
                </div>
            </div>

            {/* Lista */}
            <div className="bg-white rounded shadow">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Usuarios ({usuarios.length})</h2>
                    <button
                        onClick={cargarUsuarios}
                        disabled={cargando}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                        Recargar
                    </button>
                </div>

                <div className="p-4">
                    {cargando ? (
                        <div className="text-center py-8">
                            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-gray-600">Cargando...</p>
                        </div>
                    ) : usuarios.length === 0 ? (
                        <div className="text-center py-8 text-gray-600">
                            No hay usuarios
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                            <tr className="border-b">
                                <th className="text-left py-2">ID</th>
                                <th className="text-left py-2">Usuario</th>
                                <th className="text-left py-2">Rol</th>
                                <th className="text-center py-2">Acción</th>
                            </tr>
                            </thead>
                            <tbody>
                            {usuarios.map((usuario) => (
                                <tr key={usuario.id} className="border-b hover:bg-gray-50">
                                    <td className="py-2">{usuario.id}</td>
                                    <td className="py-2">{usuario.username}</td>
                                    <td className="py-2">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                usuario.role === 'ADMINISTRATOR'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {usuario.role === 'ADMINISTRATOR' ? 'Admin' : 'Empleado'}
                                            </span>
                                    </td>
                                    <td className="py-2 text-center">
                                        <button
                                            onClick={() => eliminarUsuario(usuario.id)}
                                            disabled={cargando}
                                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-2 py-1 rounded text-sm flex items-center gap-1 mx-auto"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GestionUsuarios;
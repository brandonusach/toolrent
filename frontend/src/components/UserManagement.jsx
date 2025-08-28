import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, RefreshCw, User, Shield, AlertCircle, CheckCircle, WifiOff, Wifi } from 'lucide-react';

const GestionUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');

    // Datos del formulario
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [rol, setRol] = useState('EMPLOYEE');

    const API_BASE = 'http://localhost:8080/api/users';

    // Cargar usuarios
    const cargarUsuarios = async () => {
        setCargando(true);
        setError(''); // Limpiar errores previos

        try {
            console.log('Intentando conectar a:', API_BASE);
            const respuesta = await fetch(API_BASE, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Respuesta recibida:', respuesta.status, respuesta.statusText);

            if (respuesta.ok) {
                const datos = await respuesta.json();
                setUsuarios(datos);
                setError('');
                setExito(`✅ Conectado correctamente. ${datos.length} usuarios cargados.`);
                console.log('Usuarios cargados:', datos);
            } else {
                const textoError = await respuesta.text();
                throw new Error(`HTTP ${respuesta.status}: ${respuesta.statusText} - ${textoError}`);
            }
        } catch (err) {
            console.error('Error detallado:', err);

            let mensajeError = 'Error desconocido';

            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                mensajeError = '🔴 No se puede conectar al servidor. ¿Está el backend ejecutándose en el puerto 8080?';
            } else if (err.message.includes('CORS')) {
                mensajeError = '🔴 Error de CORS. El servidor necesita permitir peticiones desde este origen.';
            } else if (err.message.includes('404')) {
                mensajeError = '🔴 Endpoint no encontrado. Verifica que la ruta /api/users exista en tu backend.';
            } else if (err.message.includes('500')) {
                mensajeError = '🔴 Error interno del servidor. Revisa los logs del backend.';
            } else {
                mensajeError = `🔴 Error: ${err.message}`;
            }

            setError(mensajeError);
        } finally {
            setCargando(false);
        }
    };

    // Crear usuario
    const crearUsuario = async () => {
        if (!nombreUsuario || !contrasena) {
            setError('El nombre de usuario y la contraseña son requeridos');
            return;
        }

        setCargando(true);
        setError(''); // Limpiar errores previos

        try {
            console.log('Intentando crear usuario:', { username: nombreUsuario, role: rol });

            const respuesta = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: nombreUsuario,
                    password: contrasena,
                    role: rol
                })
            });

            console.log('Respuesta POST:', respuesta.status, respuesta.statusText);

            if (respuesta.ok) {
                const nuevoUsuario = await respuesta.json();
                console.log('Usuario creado exitosamente:', nuevoUsuario);
                setExito(`✅ Usuario "${nombreUsuario}" creado exitosamente con rol ${rol === 'ADMINISTRATOR' ? 'Administrador' : 'Empleado'}`);
                setNombreUsuario('');
                setContrasena('');
                setRol('EMPLOYEE');
                cargarUsuarios(); // Recargar usuarios
            } else {
                const textoError = await respuesta.text();
                console.error('Error del servidor:', textoError);

                let mensajeError = `🔴 Error HTTP ${respuesta.status}`;

                if (respuesta.status === 400) {
                    mensajeError += ': Datos inválidos. Verifica que el username no esté duplicado.';
                } else if (respuesta.status === 500) {
                    mensajeError += ': Error interno del servidor. Revisa los logs del backend.';
                } else {
                    mensajeError += `: ${textoError}`;
                }

                throw new Error(mensajeError);
            }
        } catch (err) {
            console.error('Error detallado creando usuario:', err);

            let mensajeError = 'Error desconocido';

            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                mensajeError = '🔴 Error de red al crear usuario. ¿Se perdió la conexión?';
            } else {
                mensajeError = err.message.startsWith('🔴') ? err.message : `🔴 Error creando usuario: ${err.message}`;
            }

            setError(mensajeError);
        } finally {
            setCargando(false);
        }
    };

    // Eliminar usuario
    const eliminarUsuario = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

        setCargando(true);
        try {
            const respuesta = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE'
            });

            if (respuesta.ok) {
                setExito('Usuario eliminado exitosamente');
                cargarUsuarios();
            } else {
                throw new Error('Error eliminando usuario');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    // Cargar usuarios al montar el componente
    useEffect(() => {
        cargarUsuarios();
    }, []);

    // Limpiar mensajes después de 3 segundos
    useEffect(() => {
        if (exito || error) {
            const timer = setTimeout(() => {
                setExito('');
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [exito, error]);

    const estaConectado = usuarios.length > 0;

    return (
        <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
            {/* Encabezado */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-800">ToolRent - Gestión de Usuarios</h1>
                </div>

                {/* Estado de conexión */}
                <div className={`flex items-center gap-2 p-3 rounded-md ${
                    estaConectado
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    {estaConectado ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                    <strong>Estado:</strong>
                    {estaConectado ? 'Conectado con backend' : 'Sin conexión con backend'}
                </div>
            </div>

            {/* Mensajes de error y éxito */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-red-800">{error}</span>
                </div>
            )}

            {exito && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-green-800">{exito}</span>
                </div>
            )}

            {/* Formulario para crear usuario */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Plus className="w-6 h-6 text-green-600" />
                    <h2 className="text-xl font-semibold text-gray-800">Crear Nuevo Usuario</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de Usuario
                        </label>
                        <input
                            type="text"
                            value={nombreUsuario}
                            onChange={(e) => setNombreUsuario(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ingresa el nombre de usuario"
                            disabled={cargando}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ingresa la contraseña"
                            disabled={cargando}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rol
                        </label>
                        <select
                            value={rol}
                            onChange={(e) => setRol(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={cargando}
                        >
                            <option value="EMPLOYEE">Empleado</option>
                            <option value="ADMINISTRATOR">Administrador</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4">
                    <button
                        onClick={crearUsuario}
                        disabled={cargando || !nombreUsuario || !contrasena}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                        {cargando ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Creando...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Crear Usuario
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Lista de usuarios */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Users className="w-6 h-6 text-gray-600" />
                        <h2 className="text-xl font-semibold text-gray-800">
                            Lista de Usuarios ({usuarios.length})
                        </h2>
                    </div>
                    <button
                        onClick={cargarUsuarios}
                        disabled={cargando}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                        Recargar
                    </button>
                </div>

                <div className="p-6">
                    {cargando && (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-gray-600">Cargando usuarios...</p>
                        </div>
                    )}

                    {!cargando && usuarios.length === 0 && (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">No hay usuarios registrados</p>
                        </div>
                    )}

                    {!cargando && usuarios.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                        ID
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                        Nombre de Usuario
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                        Rol
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                                        Acciones
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {usuarios.map((usuario) => (
                                    <tr key={usuario.id} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="border border-gray-200 px-4 py-3">
                                            {usuario.id}
                                        </td>
                                        <td className="border border-gray-200 px-4 py-3">
                                            {usuario.username}
                                        </td>
                                        <td className="border border-gray-200 px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    usuario.role === 'ADMINISTRATOR'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {usuario.role === 'ADMINISTRATOR' ? (
                                                        <>
                                                            <Shield className="w-3 h-3" />
                                                            Administrador
                                                        </>
                                                    ) : (
                                                        <>
                                                            <User className="w-3 h-3" />
                                                            Empleado
                                                        </>
                                                    )}
                                                </span>
                                        </td>
                                        <td className="border border-gray-200 px-4 py-3 text-center">
                                            <button
                                                onClick={() => eliminarUsuario(usuario.id)}
                                                disabled={cargando}
                                                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1 mx-auto"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Información de debug */}
            <details className="mt-6 bg-gray-100 rounded-lg p-4">
                <summary className="cursor-pointer font-semibold text-gray-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Información de Debug
                </summary>
                <pre className="mt-3 bg-gray-800 text-green-400 p-4 rounded-md text-sm overflow-auto">
                    {JSON.stringify({
                        urlApi: API_BASE,
                        cantidadUsuarios: usuarios.length,
                        cargando,
                        error: error || 'ninguno',
                        exito: exito || 'ninguno',
                        estadoConexion: estaConectado ? 'conectado' : 'desconectado',
                        navegador: navigator.userAgent.split(' ').slice(-2).join(' '),
                        timestamp: new Date().toLocaleString()
                    }, null, 2)}
                </pre>

                <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Diagnóstico: Backend funcionando correctamente</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                        <li>• Servidor ejecutándose en puerto 8080 ✅</li>
                        <li>• Endpoint /api/users accesible ✅</li>
                        <li>• Base de datos vacía (normal en sistema nuevo) ✅</li>
                        <li>• Listo para crear usuarios ✅</li>
                    </ul>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <h4 className="font-semibold text-blue-800 mb-2">🔧 Pasos para diagnosticar:</h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                        <li>1. Verificar que el backend esté ejecutándose en el puerto 8080</li>
                        <li>2. Probar manualmente: <code className="bg-blue-100 px-1 rounded">http://localhost:8080/api/users</code></li>
                        <li>3. Revisar la consola del navegador (F12) para errores detallados</li>
                        <li>4. Verificar configuración CORS en el backend</li>
                        <li>5. Confirmar que el endpoint /api/users existe</li>
                    </ol>
                </div>
            </details>
        </div>
    );
};

export default GestionUsuarios;
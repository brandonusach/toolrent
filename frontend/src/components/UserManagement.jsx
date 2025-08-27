import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, UserCheck, UserX, Search } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');

    // Form data
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'EMPLOYEE'
    });

    // API base URL - ajusta según tu configuración
    const API_BASE_URL = 'http://localhost:8080/api/users';

    // Fetch all users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) throw new Error('Error al cargar usuarios');
            const data = await response.json();
            setUsers(data);
            setError('');
        } catch (err) {
            setError('Error al conectar con el servidor: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Create or update user
    const handleSubmit = async () => {
        if (!formData.username || (!formData.password && !editingUser)) {
            setError('Por favor completa todos los campos requeridos');
            return;
        }

        setLoading(true);

        try {
            const url = editingUser ? `${API_BASE_URL}/${editingUser.id}` : API_BASE_URL;
            const method = editingUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error al guardar usuario');
            }

            setSuccess(editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
            resetForm();
            fetchUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete user
    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar usuario');

            setSuccess('Usuario eliminado correctamente');
            fetchUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({ username: '', password: '', role: 'EMPLOYEE' });
        setEditingUser(null);
        setShowForm(false);
    };

    // Start editing
    const startEdit = (user) => {
        setFormData({
            username: user.username,
            password: '', // Don't show password
            role: user.role
        });
        setEditingUser(user);
        setShowForm(true);
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'ALL' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    // Clear messages after 5 seconds
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Sistema de Usuarios</h1>
                                <p className="text-gray-600">ToolRent - Gestión de usuarios del sistema</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nuevo Usuario</span>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    placeholder="Buscar por username..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">Todos los roles</option>
                            <option value="ADMINISTRATOR">Administradores</option>
                            <option value="EMPLOYEE">Empleados</option>
                        </select>
                    </div>
                </div>

                {/* User Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                            <h2 className="text-xl font-bold mb-4">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                            <div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder={editingUser ? "Dejar vacío para mantener la actual" : ""}
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rol
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="EMPLOYEE">Empleado</option>
                                        <option value="ADMINISTRATOR">Administrador</option>
                                    </select>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {loading ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear')}
                                    </button>
                                    <button
                                        onClick={resetForm}
                                        className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Lista de Usuarios ({filteredUsers.length})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Cargando usuarios...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No se encontraron usuarios
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rol
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'ADMINISTRATOR'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'ADMINISTRATOR' ? (
                              <UserCheck className="h-3 w-3 mr-1" />
                          ) : (
                              <UserX className="h-3 w-3 mr-1" />
                          )}
                            {user.role === 'ADMINISTRATOR' ? 'Admin' : 'Empleado'}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => startEdit(user)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                    title="Editar usuario"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                    title="Eliminar usuario"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
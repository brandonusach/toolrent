import React, { useState } from 'react';
import {
    Wrench,
    RefreshCw,
    Users,
    DollarSign,
    FileText,
    BarChart3,
    Settings,
    Search,
    Bell,
    LogOut,
    Home,
    AlertTriangle
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import InventoryManagement from './inventory/InventoryManagement';

const AdminPanel = () => {
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState('dashboard');

    // Función mejorada para verificar si es admin
    const isUserAdmin = () => {
        if (!user?.role) return false;

        const role = user.role.toUpperCase();
        return role === 'ADMINISTRATOR' || role === 'ADMIN';
    };

    // Función para manejar el logout
    const handleLogout = () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            logout();
        }
    };

    // Configuración del menú según el rol
    const getMenuItems = () => {
        const commonItems = [
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'prestamos', icon: RefreshCw, label: 'Préstamos y Devoluciones' },
            { id: 'reportes', icon: BarChart3, label: 'Reportes y Consultas' }
        ];

        const adminOnlyItems = [
            { id: 'inventario', icon: Wrench, label: 'Gestión de Inventario' },
            { id: 'clientes', icon: Users, label: 'Gestión de Clientes' },
            { id: 'tarifas', icon: DollarSign, label: 'Tarifas y Montos' },
            { id: 'kardex', icon: FileText, label: 'Kardex y Movimientos' },
            { id: 'usuarios', icon: Settings, label: 'Usuarios y Roles' }
        ];

        if (isUserAdmin()) {
            return [...commonItems.slice(0, 1), ...adminOnlyItems, ...commonItems.slice(1)];
        }
        return commonItems;
    };

    // Función para obtener el nombre de visualización del rol
    const getRoleDisplayName = () => {
        const role = user?.role;
        if (!role) return 'Usuario';

        const normalizedRole = role.toUpperCase();

        if (normalizedRole === 'ADMINISTRATOR' || normalizedRole === 'ADMIN') {
            return 'Administrador';
        } else if (normalizedRole === 'EMPLOYEE' || normalizedRole === 'EMPLEADO') {
            return 'Empleado';
        }

        // Capitalizar primera letra para roles desconocidos
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    // Función para obtener las iniciales del usuario
    const getUserInitials = () => {
        if (user?.username) {
            return user.username.substring(0, 2).toUpperCase();
        }
        return 'US';
    };

    // Datos del dashboard
    const dashboardData = {
        herramientasDisponibles: 87,
        prestamosActivos: 24,
        clientesActivos: 156,
        prestamosAtrasados: 3
    };

    const prestamosRecientes = [
        { cliente: 'Juan Pérez', herramienta: 'Taladro Eléctrico', fecha: '2025-09-01', estado: 'Activo' },
        { cliente: 'María González', herramienta: 'Sierra Circular', fecha: '2025-09-02', estado: 'Atrasado' },
        { cliente: 'Carlos Ruiz', herramienta: 'Martillo Neumático', fecha: '2025-09-03', estado: 'Activo' }
    ];

    const herramientasMasPrestadas = [
        { nombre: 'Taladro Eléctrico', prestamos: 45 },
        { nombre: 'Sierra Circular', prestamos: 38 },
        { nombre: 'Martillo Neumático', prestamos: 32 },
        { nombre: 'Lijadora Orbital', prestamos: 28 }
    ];

    const isAdmin = isUserAdmin();

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Debug info - solo en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed top-4 right-4 bg-gray-800 p-3 rounded text-xs z-50 max-w-xs">
                    <div className="text-gray-400 mb-1">Debug - User Info:</div>
                    <div className="text-gray-300">Username: {user?.username || 'N/A'}</div>
                    <div className="text-gray-300">Raw Role: {user?.role || 'N/A'}</div>
                    <div className="text-gray-300">Is Admin: {isAdmin ? 'Sí' : 'NO'}</div>
                    <div className="text-gray-300">Display Name: {getRoleDisplayName()}</div>
                </div>
            )}

            {/* Sidebar */}
            <div className="w-80 bg-gray-800 shadow-xl flex flex-col">
                {/* Header del Sidebar */}
                <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center">
                        <div className="bg-orange-600 p-3 rounded-lg mr-4">
                            <Wrench className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">ToolRent</h1>
                            <p className="text-sm text-gray-400">Sistema de Gestión</p>
                        </div>
                    </div>
                </div>

                {/* Navegación */}
                <nav className="flex-1 p-4">
                    {getMenuItems().map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full flex items-center px-4 py-3 rounded-lg mb-2 transition-colors ${
                                    isActive
                                        ? 'bg-orange-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <Icon className="h-5 w-5 mr-3" />
                                <span className="text-sm font-medium">{item.label}</span>
                                {item.id === 'tarifas' || item.id === 'usuarios' ? (
                                    <span className="ml-auto h-2 w-2 bg-red-500 rounded-full"></span>
                                ) : null}
                            </button>
                        );
                    })}
                </nav>

                {/* User Info y Logout */}
                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                isAdmin ? 'bg-red-600' : 'bg-blue-600'
                            }`}>
                                {getUserInitials()}
                            </div>
                            <div className="ml-3">
                                <p className="text-white text-sm font-medium">{user?.username}</p>
                                <p className="text-gray-400 text-xs">{getRoleDisplayName()}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="bg-gray-800 border-b border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Panel Principal</h1>
                            <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    isAdmin
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {getRoleDisplayName()}
                                </span>
                                {/* Badge adicional para indicar el estado de admin */}
                                {isAdmin && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Acceso Completo
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 w-80"
                                />
                            </div>
                            <div className="relative">
                                <Bell className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer" />
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white font-bold">3</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 p-6 overflow-auto bg-gray-900">
                    {/* Dashboard */}
                    {activeSection === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Herramientas Disponibles</p>
                                            <p className="text-3xl font-bold text-white mt-1">{dashboardData.herramientasDisponibles}</p>
                                        </div>
                                        <div className="bg-blue-600 p-3 rounded-lg">
                                            <Wrench className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Préstamos Activos</p>
                                            <p className="text-3xl font-bold text-white mt-1">{dashboardData.prestamosActivos}</p>
                                        </div>
                                        <div className="bg-green-600 p-3 rounded-lg">
                                            <RefreshCw className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Clientes Activos</p>
                                            <p className="text-3xl font-bold text-white mt-1">{dashboardData.clientesActivos}</p>
                                        </div>
                                        <div className="bg-purple-600 p-3 rounded-lg">
                                            <Users className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Préstamos Atrasados</p>
                                            <p className="text-3xl font-bold text-white mt-1">{dashboardData.prestamosAtrasados}</p>
                                        </div>
                                        <div className="bg-red-600 p-3 rounded-lg">
                                            <AlertTriangle className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tables Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Préstamos Recientes */}
                                <div className="bg-gray-800 rounded-lg border border-gray-700">
                                    <div className="p-6 border-b border-gray-700">
                                        <h3 className="text-lg font-semibold text-white">Préstamos Recientes</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {prestamosRecientes.map((prestamo, index) => (
                                                <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-white">{prestamo.cliente}</p>
                                                        <p className="text-sm text-gray-400">{prestamo.herramienta}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-300">{prestamo.fecha}</p>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            prestamo.estado === 'Activo'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {prestamo.estado}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Herramientas Más Prestadas */}
                                <div className="bg-gray-800 rounded-lg border border-gray-700">
                                    <div className="p-6 border-b border-gray-700">
                                        <h3 className="text-lg font-semibold text-white">Herramientas Más Prestadas</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {herramientasMasPrestadas.map((herramienta, index) => (
                                                <div key={index} className="flex items-center justify-between">
                                                    <span className="text-white font-medium">{herramienta.nombre}</span>
                                                    <span className="text-gray-300 font-semibold">{herramienta.prestamos} préstamos</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Gestión de Inventario - Solo para Administradores */}
                    {activeSection === 'inventario' && isAdmin && (
                        <InventoryManagement />
                    )}

                    {/* Mensaje de acceso denegado para inventario */}
                    {activeSection === 'inventario' && !isAdmin && (
                        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">Gestión de Inventario</h2>
                            <p className="text-gray-400 mb-4">
                                No tienes permisos para acceder a esta sección. Solo disponible para Administradores.
                            </p>
                            <button
                                onClick={() => setActiveSection('dashboard')}
                                className="bg-orange-600 text-white py-2 px-6 rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                Volver al Dashboard
                            </button>
                        </div>
                    )}

                    {/* Otras secciones */}
                    {activeSection !== 'dashboard' && activeSection !== 'inventario' && (
                        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">
                                {getMenuItems().find(item => item.id === activeSection)?.label}
                            </h2>
                            <p className="text-gray-400">
                                {!isAdmin && ['clientes', 'tarifas', 'kardex', 'usuarios'].includes(activeSection)
                                    ? 'No tienes permisos para acceder a esta sección. Solo disponible para Administradores.'
                                    : 'Contenido de la sección en desarrollo...'}
                            </p>
                            {!isAdmin && ['clientes', 'tarifas', 'kardex', 'usuarios'].includes(activeSection) && (
                                <button
                                    onClick={() => setActiveSection('dashboard')}
                                    className="mt-4 bg-orange-600 text-white py-2 px-6 rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Volver al Dashboard
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminPanel;
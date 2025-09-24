import React, { useState } from 'react';
import { useKeycloak } from "@react-keycloak/web";
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
    AlertTriangle,
    Package,
    ClipboardList
} from 'lucide-react';
import InventoryManagement from './inventory/InventoryManagement';
import ClientManagement from './client/ClientManagement';
import RateManagement from './rates/RateManagement';

const AdminPanel = () => {
    const { keycloak } = useKeycloak();
    const [activeSection, setActiveSection] = useState('dashboard');

    // Obtener información del usuario desde Keycloak
    const getUserInfo = () => {
        return {
            username: keycloak.tokenParsed?.preferred_username || 'Usuario',
            email: keycloak.tokenParsed?.email || '',
            firstName: keycloak.tokenParsed?.given_name || '',
            lastName: keycloak.tokenParsed?.family_name || '',
            roles: keycloak.tokenParsed?.realm_access?.roles || []
        };
    };

    const user = getUserInfo();

    // Función corregida para verificar si es admin usando los roles exactos de Keycloak
    const isUserAdmin = () => {
        const userRoles = user.roles;
        // Buscar exactamente los roles que tienes en Keycloak (en minúscula)
        return userRoles.includes('administrator') ||
            userRoles.includes('admin') ||
            userRoles.includes('ADMINISTRATOR') ||
            userRoles.includes('ADMIN');
    };

    // Función para manejar el logout con Keycloak
    const handleLogout = () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            keycloak.logout({
                redirectUri: window.location.origin
            });
        }
    };

    // Configuración COMPLETA del menú con todas las épicas del proyecto
    const getAllMenuItems = () => {
        return [
            { id: 'dashboard', icon: Home, label: 'Dashboard', adminOnly: false },
            { id: 'inventario', icon: Wrench, label: 'Gestión de Inventario', adminOnly: true },
            { id: 'prestamos', icon: RefreshCw, label: 'Préstamos y Devoluciones', adminOnly: false },
            { id: 'clientes', icon: Users, label: 'Gestión de Clientes', adminOnly: true },
            { id: 'tarifas', icon: DollarSign, label: 'Tarifas y Montos', adminOnly: true },
            { id: 'kardex', icon: FileText, label: 'Kardex y Movimientos', adminOnly: true },
            { id: 'reportes', icon: BarChart3, label: 'Reportes y Consultas', adminOnly: false },
            { id: 'usuarios', icon: Settings, label: 'Usuarios y Roles', adminOnly: true }
        ];
    };

    // Función para obtener el nombre de visualización del rol
    const getRoleDisplayName = () => {
        const roles = user.roles;

        if (roles.includes('administrator') || roles.includes('ADMINISTRATOR') || roles.includes('admin') || roles.includes('ADMIN')) {
            return 'Administrador';
        } else if (roles.includes('employee') || roles.includes('EMPLOYEE') || roles.includes('empleado') || roles.includes('EMPLEADO')) {
            return 'Empleado';
        } else if (roles.includes('user') || roles.includes('USER') || roles.includes('usuario') || roles.includes('USUARIO')) {
            return 'Usuario';
        }

        return roles.length > 0 ? roles[0] : 'Usuario';
    };

    // Función para obtener las iniciales del usuario
    const getUserInitials = () => {
        if (user.firstName && user.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        } else if (user.username) {
            return user.username.substring(0, 2).toUpperCase();
        }
        return 'US';
    };

    const isAdmin = isUserAdmin();

    // Función para verificar si el usuario puede acceder a una sección
    const canAccess = (section) => {
        const menuItem = getAllMenuItems().find(item => item.id === section);
        if (!menuItem) return false;
        return !menuItem.adminOnly || isAdmin;
    };

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Debug info mejorado - solo en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed top-4 right-4 bg-gray-800 p-3 rounded text-xs z-50 max-w-xs">
                    <div className="text-gray-400 mb-1">Debug - Keycloak Info:</div>
                    <div className="text-gray-300">Username: {user.username}</div>
                    <div className="text-gray-300">Email: {user.email}</div>
                    <div className="text-gray-300">Roles: [{user.roles.join(', ')}]</div>
                    <div className="text-gray-300">Is Admin: {isAdmin ? 'SÍ' : 'NO'}</div>
                    <div className="text-gray-300">Display Name: {getRoleDisplayName()}</div>
                    <div className="text-gray-300">Authenticated: {keycloak.authenticated ? 'SÍ' : 'No'}</div>
                    <div className="text-gray-300">Can Access Current: {canAccess(activeSection) ? 'SÍ' : 'NO'}</div>
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

                {/* Navegación - TODAS las opciones visibles siempre */}
                <nav className="flex-1 p-4">
                    {getAllMenuItems().map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        const userCanAccess = canAccess(item.id);

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full flex items-center px-4 py-3 rounded-lg mb-2 transition-colors relative ${
                                    isActive
                                        ? 'bg-orange-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <Icon className="h-5 w-5 mr-3" />
                                <span className="text-sm font-medium">{item.label}</span>

                                {/* Indicador de restricción para empleados */}
                                {item.adminOnly && !isAdmin && (
                                    <div className="ml-auto flex items-center">
                                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    </div>
                                )}

                                {/* Indicador de admin only */}
                                {item.adminOnly && isAdmin && (
                                    <span className="ml-auto h-2 w-2 bg-red-500 rounded-full"></span>
                                )}
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
                                <p className="text-white text-sm font-medium">
                                    {user.firstName && user.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user.username}
                                </p>
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
                                {isAdmin && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Acceso Completo
                                    </span>
                                )}
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Keycloak
                                </span>
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

                {/* Main Content Area */}
                <main className="flex-1 p-6 overflow-auto bg-gray-900">
                    {/* Gestión de Inventario */}
                    {activeSection === 'inventario' && canAccess('inventario') && (
                        <InventoryManagement />
                    )}

                    {/* Gestión de Clientes */}
                    {activeSection === 'clientes' && canAccess('clientes') && (
                        <ClientManagement />
                    )}

                    {/* Gestión de Tarifas */}
                    {activeSection === 'tarifas' && canAccess('tarifas') && (
                        <RateManagement />
                    )}

                    {/* Mensaje de acceso denegado para secciones de admin */}
                    {!canAccess(activeSection) && (
                        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
                            <div className="mb-4">
                                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">
                                {getAllMenuItems().find(item => item.id === activeSection)?.label}
                            </h2>
                            <p className="text-gray-400 mb-4">
                                No tienes permisos para acceder a esta sección. Solo disponible para Administradores.
                            </p>
                            <div className="bg-gray-700 p-4 rounded-lg mb-6">
                                <p className="text-sm text-gray-300 mb-2">
                                    <strong>Tu rol actual:</strong> {getRoleDisplayName()}
                                </p>
                                <p className="text-sm text-gray-300">
                                    <strong>Roles en Keycloak:</strong> [{user.roles.join(', ')}]
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveSection('dashboard')}
                                className="bg-orange-600 text-white py-2 px-6 rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                Volver al Dashboard
                            </button>
                        </div>
                    )}

                    {/* Dashboard y otras secciones accesibles */}
                    {canAccess(activeSection) && !['inventario', 'clientes', 'tarifas'].includes(activeSection) && (
                        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">
                                {getAllMenuItems().find(item => item.id === activeSection)?.label}
                            </h2>
                            <p className="text-gray-400 mb-4">Sección en desarrollo...</p>

                            {/* Información adicional para el dashboard */}
                            {activeSection === 'dashboard' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                                    <div className="bg-gray-700 p-6 rounded-lg">
                                        <Package className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-white mb-2">Inventario</h3>
                                        <p className="text-gray-400">Gestión de herramientas disponibles</p>
                                        {!isAdmin && <p className="text-yellow-400 text-sm mt-2">Solo Administradores</p>}
                                    </div>

                                    <div className="bg-gray-700 p-6 rounded-lg">
                                        <RefreshCw className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-white mb-2">Préstamos</h3>
                                        <p className="text-gray-400">Control de préstamos y devoluciones</p>
                                        <p className="text-green-400 text-sm mt-2">Acceso permitido</p>
                                    </div>

                                    <div className="bg-gray-700 p-6 rounded-lg">
                                        <BarChart3 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-white mb-2">Reportes</h3>
                                        <p className="text-gray-400">Consultas y reportes del sistema</p>
                                        <p className="text-green-400 text-sm mt-2">Acceso permitido</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminPanel;
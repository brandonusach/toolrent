import React, { useState } from 'react';
import { useKeycloak } from "@react-keycloak/web";

// Importa los nuevos componentes
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardView from './DashboardView';
import AccessDenied from './AccessDenied';
import Placeholder from './Placeholder';

// Importa las vistas de gestión
import InventoryManagement from './inventory/InventoryManagement';
import ClientManagement from './client/ClientManagement';
import RateManagement from './rates/RateManagement';
import LoanManagement from './loans/LoanManagement';
import KardexManagement from "./kardex/KardexManagement.jsx";

const AdminPanel = () => {
    const { keycloak } = useKeycloak();
    const [activeSection, setActiveSection] = useState('dashboard');

    // --- Lógica de usuario (sin cambios) ---
    const getUserInfo = () => ({
        username: keycloak.tokenParsed?.preferred_username || 'Usuario',
        email: keycloak.tokenParsed?.email || '',
        firstName: keycloak.tokenParsed?.given_name || '',
        lastName: keycloak.tokenParsed?.family_name || '',
        roles: keycloak.tokenParsed?.realm_access?.roles || []
    });

    const user = getUserInfo();
    const isAdmin = user.roles.includes('administrator') || user.roles.includes('admin');

    const handleLogout = () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            keycloak.logout({ redirectUri: window.location.origin });
        }
    };

    // --- Renderizado del contenido principal ---
    const renderMainContent = () => {
        const sectionMap = {
            inventario: <InventoryManagement />,
            clientes: <ClientManagement />,
            tarifas: <RateManagement />,
            prestamos: <LoanManagement />,
            kardex: <KardexManagement />,
            dashboard: <DashboardView isAdmin={isAdmin} />,
        };

        const menuItem = Sidebar.menuItems.find(item => item.id === activeSection);
        const canAccess = !menuItem?.adminOnly || isAdmin;

        if (!canAccess) {
            return <AccessDenied userRole={user.roles.join(', ')} sectionLabel={menuItem?.label} onNavigate={() => setActiveSection('dashboard')} />;
        }

        return sectionMap[activeSection] || <Placeholder sectionLabel={menuItem?.label} />;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 flex">
            <Sidebar
                user={user}
                isAdmin={isAdmin}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                handleLogout={handleLogout}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header user={user} isAdmin={isAdmin} />
                <main className="flex-1 p-6 lg:p-8 overflow-auto">
                    {/* Contenedor con animación de entrada */}
                    <div className="animate-fadeIn">
                        {renderMainContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminPanel;
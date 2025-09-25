import React from 'react';
import { BarChart3, Package, RefreshCw, Users } from 'lucide-react';

// Un componente reutilizable para las tarjetas del dashboard
const StatCard = ({ icon: Icon, title, value, detail, color }) => (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 p-6 rounded-lg shadow-lg hover:border-orange-500/50 transition-all duration-300">
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500">{detail}</p>
            </div>
            <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </div>
    </div>
);

const DashboardView = ({ isAdmin }) => {
    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">Bienvenido al Dashboard</h2>
            <p className="text-slate-400 mb-8">Aquí tienes un resumen rápido del estado del sistema.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Package}
                    title="Inventario Total"
                    value="1,240"
                    detail="+15% este mes"
                    color="from-orange-500 to-orange-600"
                />
                <StatCard
                    icon={RefreshCw}
                    title="Préstamos Activos"
                    value="86"
                    detail="5 devoluciones pendientes"
                    color="from-sky-500 to-sky-600"
                />
                <StatCard
                    icon={Users}
                    title="Clientes Registrados"
                    value="312"
                    detail="+5 nuevos esta semana"
                    color="from-emerald-500 to-emerald-600"
                />
                <StatCard
                    icon={BarChart3}
                    title="Ingresos del Mes"
                    value="$4,850"
                    detail="Objetivo: $6,000"
                    color="from-purple-500 to-purple-600"
                />
            </div>

            {/* Puedes añadir más secciones aquí, como gráficos o tablas de actividad reciente */}
        </div>
    );
};

export default DashboardView;
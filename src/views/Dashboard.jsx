import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, Zap, CheckCircle, TrendingUp, MoreHorizontal
} from 'lucide-react';

export default function Dashboard() {
    const [selectionDate, setSelectionDate] = useState(new Date().toISOString().split('T')[0]);

    const stats = [
        { label: 'Leads Totales', value: '1,280', icon: Users, iconColor: 'text-blue-600', trend: '+12%', trendClass: 'bg-green-100 text-green-700' },
        { label: 'Nuevas Oportunidades', value: '45', icon: Zap, iconColor: 'text-amber-600', trend: '+5%', trendClass: 'bg-green-100 text-green-700' },
        { label: 'Ventas Cerradas', value: '28', icon: CheckCircle, iconColor: 'text-green-600', trend: '-2%', trendClass: 'bg-red-100 text-red-700' },
        { label: 'Valor Promedio', value: '$25,000', icon: TrendingUp, iconColor: 'text-indigo-600', trend: '+8%', trendClass: 'bg-green-100 text-green-700' },
    ];

    const [recentLeads, setRecentLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(true);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const res = await fetch('/api/leads?take=4');
                if (res.ok) {
                    const data = await res.json();
                    setRecentLeads(data.data || data);
                }
            } catch (err) {
                console.error("Error fetching leads", err);
            } finally {
                setLoadingLeads(false);
            }
        };
        fetchLeads();
    }, []);

    const statusColors = {
        NUEVO: 'bg-blue-100 text-blue-700',
        CONTACTADO: 'bg-amber-100 text-amber-700',
        CALIFICADO: 'bg-green-100 text-green-700',
        DESCARTADO: 'bg-red-100 text-red-700',
    };

    const upcomingTasks = [
        { title: 'Llamada con Bessie Cooper', due: 'Hoy, 2:00 PM', priorityColor: 'bg-red-500' },
        { title: 'Enviar contrato a Dianne', due: 'Mañana, 9:00 AM', priorityColor: 'bg-blue-500' },
        { title: 'Visita propiedad: Villa Marina', due: 'Jueves, 4:30 PM', priorityColor: 'bg-amber-500' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={selectionDate}
                        onChange={(e) => setSelectionDate(e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900"
                    />
                    <button className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                        Sincronizar
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.trendClass}`}>
                                    {stat.trend}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity / Leads Table */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Leads Recientes</h2>
                        <Link to="/leads" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Ver Todos</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-50">
                                    <th className="px-6 py-3">ID Lead / Contacto</th>
                                    <th className="px-6 py-3">Prioridad</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3">Asignado A</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loadingLeads ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">Cargando leads...</td>
                                    </tr>
                                ) : recentLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No hay leads recientes</td>
                                    </tr>
                                ) : recentLeads.map((lead, idx) => (
                                    <tr key={lead.id_lead || idx} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 text-xs shadow-sm">
                                                ID
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">#{lead.id_lead} (Contacto {lead.id_contacto})</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{lead.prioridad || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[lead.estado] || 'bg-gray-100 text-gray-700'}`}>
                                                {lead.estado || 'DESCONOCIDO'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[10px] font-bold">
                                                {lead.id_usuario_asignado || '?'}
                                            </div>
                                            <span className="text-sm text-gray-600 max-w-[100px] truncate" title={lead.notas_iniciales}>{lead.notas_iniciales || '-'}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions / Next Events */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col space-y-4">
                    <h2 className="font-semibold text-gray-900">Próximas Tareas</h2>
                    <div className="space-y-3">
                        {upcomingTasks.map((task, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3 border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-sm transition-all group">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${task.priorityColor}`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate tracking-tight">{task.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{task.due}</p>
                                </div>
                                <button className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-900 transition-all">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-2 py-2 px-4 border border-gray-200 text-gray-700 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        Crear Tarea
                    </button>
                </div>
            </div>
        </div>
    );
}

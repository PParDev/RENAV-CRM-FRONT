import React, { useState, useEffect } from 'react';
import {
    Users, MoreHorizontal, Plus, Search, Filter, Layers, Archive, Settings,
    Download, Mail, Phone, Calendar, MessageSquare, ChevronDown
} from 'lucide-react';

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    const fetchLeads = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/leads');
            if (!res.ok) throw new Error('Error fetching leads');
            const data = await res.json();
            setLeads(data.data || data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleCreateDemoLead = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_contacto: Math.floor(Math.random() * 100) + 1,
                    id_servicio_principal: 1,
                    estado: ['NUEVO', 'CONTACTADO', 'CALIFICADO', 'DESCARTADO'][Math.floor(Math.random() * 4)] || 'NUEVO',
                    prioridad: 'ALTA',
                    id_usuario_asignado: 1,
                    notas_iniciales: 'Lead de prueba'
                })
            });
            if (!res.ok) throw new Error('Error al crear lead');
            await fetchLeads();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const navItems = [
        { id: 'new', label: 'Nuevos leads' },
        { id: 'all', label: 'Todos los leads' },
        { id: 'territory', label: 'Leads por zona' },
        { id: 'recent', label: 'Modificados recientemente' },
        { id: 'uncontacted', label: 'Sin contactar' },
        { id: 'followup', label: 'Necesitan seguimiento' },
        { id: 'active', label: 'Activos' },
        { id: 'inactive', label: 'Inactivos' },
        { id: 'bounced', label: 'Leads rebotados' },
        { id: 'recycle', label: 'Papelera de reciclaje' },
    ];

    const getStatusColor = (estado) => {
        switch (estado) {
            case 'CALIFICADO': return 'bg-emerald-100 text-emerald-700'; // Qualified
            case 'DESCARTADO': return 'bg-rose-100 text-rose-700'; // Rejected
            case 'CONTACTADO':
            case 'NUEVO':
            default: return 'bg-gray-100 text-gray-500'; // Pending
        }
    };

    const getStatusLabel = (estado) => {
        switch (estado) {
            case 'CALIFICADO': return 'Calificado';
            case 'DESCARTADO': return 'Descartado';
            case 'CONTACTADO': return 'Contactado';
            case 'NUEVO':
            default: return 'Nuevo';
        }
    };

    return (
        <div className="flex bg-white -m-6 h-[calc(100vh-4rem)] overflow-hidden text-gray-900 border-t border-gray-100">
            {/* Secondary Sidebar */}
            <div className="w-56 border-r border-gray-100 flex flex-col py-4 overflow-y-auto custom-scrollbar flex-shrink-0">
                <nav className="flex-1 space-y-0.5 px-3">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === item.id
                                ? 'bg-blue-50 text-blue-700 relative before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-full before:py-1 before:bg-blue-600 before:rounded-r-md'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content Areas */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header Title */}
                <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 min-h-[72px]">
                    <h1 className="text-2xl font-bold">{leads.length} leads</h1>
                </div>

                {/* Top Action Bar */}
                <div className="px-6 pb-4 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-gray-50 transition-colors">
                            <Filter className="w-4 h-4 text-gray-400" /> Filtrar
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-gray-50 transition-colors">
                            <Layers className="w-4 h-4 text-gray-400" /> Agrupar por
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-gray-50 transition-colors">
                            <Archive className="w-4 h-4 text-gray-400" /> Acciones masivas
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-gray-50 transition-colors">
                            <Settings className="w-4 h-4 text-gray-400" /> Personalizar tabla
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 px-3 flex items-center gap-2 border border-gray-200 text-blue-600 font-medium text-sm rounded-lg shadow-sm hover:bg-gray-50 transition-colors mr-2">
                            <Download className="w-4 h-4" /> Exportar
                        </button>
                        <div className="flex">
                            <button
                                onClick={handleCreateDemoLead}
                                className="flex items-center gap-2 px-4 py-1.5 bg-[#0e74e8] text-white text-sm font-medium rounded-l-lg hover:bg-blue-600 transition shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Crear lead
                            </button>
                            <button className="px-2 py-1.5 bg-[#0e74e8] text-white text-sm border-l border-blue-400/30 rounded-r-lg hover:bg-blue-600 transition shadow-sm">
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                        <button className="p-1.5 border border-gray-200 text-gray-500 rounded-lg shadow-sm hover:bg-gray-50 transition-colors ml-1">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Search & Showing */}
                <div className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-t border-gray-100">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar leads"
                            className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-1 focus:border-blue-500 shadow-sm"
                        />
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        Mostrando
                        <select className="border border-gray-200 bg-gray-50 rounded-md p-1 pr-6 text-gray-700 text-xs focus:outline-none">
                            <option>10</option>
                            <option>20</option>
                            <option>50</option>
                        </select>
                        de {leads.length} resultados
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto bg-white custom-scrollbar w-full relative border-t border-gray-100">
                    <table className="w-full text-left whitespace-nowrap min-w-max">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="text-[10px] font-bold text-gray-500/80 uppercase tracking-widest border-b border-gray-100">
                                <th className="px-4 py-4 w-12 text-center">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer" />
                                </th>
                                <th className="px-4 py-4 w-64">Nombre del Lead</th>
                                <th className="px-4 py-4 w-48 text-center">Acciones Rápidas</th>
                                <th className="px-4 py-4 w-60">Correo</th>
                                <th className="px-4 py-4 w-32">Estado</th>
                                <th className="px-4 py-4 w-32">Próx. Actividad</th>
                                <th className="px-4 py-4 w-40">Etiquetas</th>
                                <th className="px-4 py-4 w-40">Vendedor Asignado</th>
                                <th className="px-4 py-4 text-center w-12"><Plus className="w-4 h-4 mx-auto cursor-pointer" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/70 text-sm">
                            {error && (
                                <tr>
                                    <td colSpan="9" className="p-4 text-center text-red-600 bg-red-50">{error}</td>
                                </tr>
                            )}
                            {loading && leads.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-gray-400">Cargando leads...</td>
                                </tr>
                            )}
                            {!loading && leads.length === 0 && !error && (
                                <tr>
                                    <td colSpan="9" className="p-16 text-center text-gray-500">
                                        <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                                        <p className="font-medium">No hay leads registrados</p>
                                    </td>
                                </tr>
                            )}
                            {leads.map((lead, idx) => (
                                <tr key={lead.id_lead || idx} className="hover:bg-gray-50/50 group transition-colors">
                                    <td className="px-4 py-4 text-center">
                                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer" />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={`https://i.pravatar.cc/150?u=${lead.id_contacto}`}
                                                alt="avatar"
                                                className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 object-cover"
                                            />
                                            <span className="font-medium text-gray-800 cursor-pointer">
                                                Contacto #{lead.id_contacto}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <button className="p-1.5 border border-gray-200 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors"><Mail className="w-3.5 h-3.5" /></button>
                                            <button className="p-1.5 border border-gray-200 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors"><Phone className="w-3.5 h-3.5" /></button>
                                            <button className="p-1.5 border border-gray-200 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors"><Calendar className="w-3.5 h-3.5" /></button>
                                            <button className="p-1.5 border border-gray-200 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors"><MessageSquare className="w-3.5 h-3.5" /></button>
                                            <MoreHorizontal className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 cursor-pointer" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                            contacto{lead.id_contacto}@example.com
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide flex w-max ${getStatusColor(lead.estado)}`}>
                                            {getStatusLabel(lead.estado)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-gray-600 font-medium text-[13px]">
                                        {Math.floor(lead.id_contacto * 7) % 900 + 100}
                                    </td>
                                    <td className="px-4 py-4 text-gray-500 text-[13px] font-medium cursor-pointer hover:text-gray-900 transition-colors">
                                        + Clic para agregar
                                    </td>
                                    <td className="px-4 py-4 text-gray-700 text-[13px]">
                                        Vendedor Designado
                                    </td>
                                    <td className="px-4 py-4"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

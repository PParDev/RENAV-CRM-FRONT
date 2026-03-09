import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, MoreHorizontal, Plus, Search, Filter, Layers, Archive, Settings,
    Download, Mail, Phone, Calendar, MessageSquare, ChevronDown
} from 'lucide-react';
import LeadChatDrawer from '../components/LeadChatDrawer.jsx';

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChatLead, setSelectedChatLead] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        telefono: '',
        origen: '',
        estado: 'NUEVO',
        prioridad: 'MEDIA',
        notas_iniciales: ''
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            // 1. Create Contact
            const resContact = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    correo: formData.correo || undefined,
                    telefono: formData.telefono || undefined,
                    origen: formData.origen || undefined,
                })
            });
            if (!resContact.ok) throw new Error('Error al crear el contacto');
            const contactData = await resContact.json();

            // 2. Create Lead
            const resLead = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_contacto: contactData.id_contacto,
                    estado: formData.estado,
                    prioridad: formData.prioridad,
                    notas_iniciales: formData.notas_iniciales || undefined,
                })
            });
            if (!resLead.ok) throw new Error('Error al crear el lead');

            setShowModal(false);
            setFormData({ nombre: '', correo: '', telefono: '', origen: '', estado: 'NUEVO', prioridad: 'MEDIA', notas_iniciales: '' });
            await fetchLeads();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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

    const filteredLeads = useMemo(() => {
        let result = leads;

        // Filtrar por pestaña del sidebar
        switch (activeTab) {
            case 'new':
            case 'uncontacted':
                result = result.filter(l => l.estado === 'NUEVO');
                break;
            case 'active':
                result = result.filter(l => l.estado === 'CONTACTADO' || l.estado === 'CALIFICADO');
                break;
            case 'inactive':
                result = result.filter(l => l.estado === 'DESCARTADO' || l.estado === 'PERDIDO');
                break;
            case 'recent':
                result = [...result].sort((a, b) => new Date(b.actualizado_en || b.creado_en) - new Date(a.actualizado_en || a.creado_en));
                break;
            case 'followup':
                result = result.filter(l => l.estado === 'CONTACTADO');
                break;
            case 'all':
            default:
                break;
        }

        // Filtrar por barra de busqueda
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(l =>
                l.contacto?.nombre?.toLowerCase().includes(query) ||
                l.contacto?.correo?.toLowerCase().includes(query) ||
                l.contacto?.telefono?.toLowerCase().includes(query) ||
                String(l.id_contacto).includes(query)
            );
        }

        return result;
    }, [leads, activeTab, searchQuery]);

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
                    <h1 className="text-2xl font-bold">
                        {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
                        {searchQuery && <span className="text-gray-400 text-lg font-normal ml-2">coincidiendo con "{searchQuery}"</span>}
                    </h1>
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
                                onClick={() => setShowModal(true)}
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
                            placeholder="Buscar por nombre, correo o ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm w-80 focus:outline-none focus:ring-1 focus:border-blue-500 shadow-sm transition-all"
                        />
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        Mostrando
                        <select className="border border-gray-200 bg-gray-50 rounded-md p-1 pr-6 text-gray-700 text-xs focus:outline-none">
                            <option>10</option>
                            <option>20</option>
                            <option>50</option>
                        </select>
                        de {filteredLeads.length} resultados
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
                                <th className="px-4 py-4 w-32">Prioridad</th>
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
                            {!loading && filteredLeads.length === 0 && !error && (
                                <tr>
                                    <td colSpan="9" className="p-16 text-center text-gray-500">
                                        <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                                        <p className="font-medium">No se encontraron leads</p>
                                        {searchQuery && <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda o cambia la categoría.</p>}
                                    </td>
                                </tr>
                            )}
                            {filteredLeads.map((lead, idx) => (
                                <tr key={lead.id_lead || idx} className="hover:bg-gray-50/50 group transition-colors cursor-pointer" onClick={() => setSelectedChatLead(lead)}>
                                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
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
                                                {lead.contacto?.nombre || `Contacto #${lead.id_contacto}`}
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
                                            {lead.contacto?.correo || 'Sin correo'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide flex w-max ${getStatusColor(lead.estado)}`}>
                                            {getStatusLabel(lead.estado)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-gray-600 font-medium text-[13px]">
                                        {lead.prioridad || 'MEDIA'}
                                    </td>
                                    <td className="px-4 py-4 text-gray-500 text-[13px] font-medium cursor-pointer hover:text-gray-900 transition-colors">
                                        + Clic para agregar
                                    </td>
                                    <td className="px-4 py-4 text-gray-700 text-[13px]">
                                        {lead.usuario_asignado?.nombre || 'Sin asignar'}
                                    </td>
                                    <td className="px-4 py-4"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal para Crear Lead */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Registrar Nuevo Lead</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSubmit} id="leadForm" className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                                    <input required name="nombre" value={formData.nombre} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Ej. Juan Pérez" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                        <input name="correo" value={formData.correo} onChange={handleInputChange} type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" placeholder="juan@ejemplo.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                        <input name="telefono" value={formData.telefono} onChange={handleInputChange} type="tel" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" placeholder="+52 ..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Origen / Medio</label>
                                        <input name="origen" value={formData.origen} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" placeholder="Ej. Facebook, WhatsApp" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                                        <select name="prioridad" value={formData.prioridad} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500">
                                            <option value="BAJA">Baja</option>
                                            <option value="MEDIA">Media</option>
                                            <option value="ALTA">Alta</option>
                                            <option value="URGENTE">Urgente</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select name="estado" value={formData.estado} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500">
                                        <option value="NUEVO">Nuevo</option>
                                        <option value="CONTACTADO">Contactado</option>
                                        <option value="CALIFICADO">Calificado</option>
                                        <option value="DESCARTADO">Descartado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas Iniciales</label>
                                    <textarea name="notas_iniciales" value={formData.notas_iniciales} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" placeholder="Detalles de lo que busca..." />
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit" form="leadForm" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
                                {submitting ? 'Guardando...' : 'Guardar Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Drawer */}
            <LeadChatDrawer
                lead={selectedChatLead}
                onClose={() => setSelectedChatLead(null)}
            />
        </div>
    );
}

import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, MoreHorizontal, Plus, Search, Filter, Layers, Settings,
    Download, Mail, Phone, Calendar, MessageSquare, ChevronDown, Check, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import LeadChatDrawer from '../components/LeadChatDrawer.jsx';
import * as XLSX from 'xlsx';

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChatLead, setSelectedChatLead] = useState(null);
    const [calendarModalLead, setCalendarModalLead] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Sorting
    const priorityWeights = { 'URGENTE': 4, 'ALTA': 3, 'MEDIA': 2, 'BAJA': 1 };
    const [prioritySort, setPrioritySort] = useState(null);

    // Columns
    const [visibleColumns, setVisibleColumns] = useState({
        name: true,
        actions: true,
        email: true,
        status: true,
        priority: true,
        tags: true,
        vendor: true
    });
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    // Grouping
    const [groupBy, setGroupBy] = useState(null);
    const [showGroupMenu, setShowGroupMenu] = useState(false);

    // Form Modal
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
            const res = await fetch('/api/leads?take=1000');
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

    const updateLeadPriority = async (id, newPriority) => {
        try {
            const res = await fetch(`/api/leads/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prioridad: newPriority })
            });
            if (!res.ok) throw new Error('Error al actualizar prioridad');
            setLeads(leads.map(l => l.id_lead === id ? { ...l, prioridad: newPriority } : l));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleExportExcel = () => {
        const dataToExport = filteredLeads.map(lead => ({
            'ID Lead': lead.id_lead,
            'Nombre': lead.contacto?.nombre || `Contacto #${lead.id_contacto}`,
            'Correo': lead.contacto?.correo || 'Sin correo',
            'Teléfono': lead.contacto?.telefono || 'Sin teléfono',
            'Estado': getStatusLabel(lead.estado),
            'Prioridad': lead.prioridad || 'MEDIA',
            'Vendedor Asignado': lead.usuario_asignado?.nombre || 'Sin asignar',
            'Fecha de Creación': new Date(lead.creado_en).toLocaleString()
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "LeadsExport");
        XLSX.writeFile(workbook, "RENAV_Leads_Export.xlsx");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const navItems = [
        { id: 'all', label: 'Todos los leads' },
        { id: 'new', label: 'Nuevos leads' },
        { id: 'active', label: 'Activos (En Proceso)' },
        { id: 'uncontacted', label: 'Sin contactar' },
        { id: 'followup', label: 'Necesitan seguimiento' },
        { id: 'recent', label: 'Modificados recientemente' },
        { id: 'inactive', label: 'Descartados / Inactivos' },
    ];

    const filteredLeads = useMemo(() => {
        let result = leads;
        switch (activeTab) {
            case 'new':
            case 'uncontacted': result = result.filter(l => l.estado === 'NUEVO'); break;
            case 'active': result = result.filter(l => l.estado === 'CONTACTADO' || l.estado === 'CALIFICADO'); break;
            case 'inactive': result = result.filter(l => l.estado === 'DESCARTADO' || l.estado === 'PERDIDO'); break;
            case 'recent': result = [...result].sort((a, b) => new Date(b.actualizado_en || b.creado_en) - new Date(a.actualizado_en || a.creado_en)); break;
            case 'followup': result = result.filter(l => l.estado === 'CONTACTADO'); break;
            case 'all': default: break;
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(l =>
                l.contacto?.nombre?.toLowerCase().includes(query) ||
                l.contacto?.correo?.toLowerCase().includes(query) ||
                l.contacto?.telefono?.toLowerCase().includes(query) ||
                String(l.id_contacto).includes(query)
            );
        }

        if (prioritySort) {
            result = [...result].sort((a, b) => {
                const w1 = priorityWeights[a.prioridad || 'MEDIA'];
                const w2 = priorityWeights[b.prioridad || 'MEDIA'];
                return prioritySort === 'desc' ? w2 - w1 : w1 - w2;
            });
        }

        if (groupBy) {
            result = [...result].sort((a, b) => {
                let valA = '', valB = '';
                if (groupBy === 'estado') {
                    valA = getStatusLabel(a.estado);
                    valB = getStatusLabel(b.estado);
                } else if (groupBy === 'prioridad') {
                    const w1 = priorityWeights[a.prioridad || 'MEDIA'];
                    const w2 = priorityWeights[b.prioridad || 'MEDIA'];
                    return w2 - w1;
                } else if (groupBy === 'vendedor') {
                    valA = a.usuario_asignado?.nombre || 'ZZZ Sin Asignar';
                    valB = b.usuario_asignado?.nombre || 'ZZZ Sin Asignar';
                }
                return valA.toString().localeCompare(valB.toString());
            });
        }

        return result;
    }, [leads, activeTab, searchQuery, prioritySort, groupBy]);

    // Calcular la paginación a partir de filteredLeads
    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
    const paginatedLeads = useMemo(() => {
        let safePage = currentPage;
        if (safePage > totalPages) safePage = totalPages;
        const start = (safePage - 1) * itemsPerPage;
        return filteredLeads.slice(start, start + itemsPerPage);
    }, [filteredLeads, currentPage, itemsPerPage, totalPages]);

    // Force page bounds when totalPages changes
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const handleSortPriority = () => {
        if (prioritySort === null) setPrioritySort('desc');
        else if (prioritySort === 'desc') setPrioritySort('asc');
        else setPrioritySort(null);
    };

    const getStatusColor = (estado) => {
        switch (estado) {
            case 'CALIFICADO': return 'bg-emerald-100 text-emerald-700';
            case 'DESCARTADO': return 'bg-rose-100 text-rose-700';
            case 'CONTACTADO':
            case 'NUEVO':
            default: return 'bg-gray-100 text-gray-500';
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

    const toggleColumn = (col) => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));

    return (
        <div className="flex bg-white -m-6 h-[calc(100vh-4rem)] overflow-hidden text-gray-900 border-t border-gray-100 relative">
            {/* Secondary Sidebar */}
            <div className="w-56 border-r border-gray-100 flex flex-col py-4 overflow-y-auto custom-scrollbar flex-shrink-0">
                <nav className="flex-1 space-y-0.5 px-3">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setCurrentPage(1); }}
                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === item.id
                                ? 'bg-[#0A1128] text-white relative shadow-md'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content Areas */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header Title */}
                <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 min-h-[72px]">
                    <h1 className="text-2xl font-bold">
                        {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
                        {searchQuery && <span className="text-gray-400 text-lg font-normal ml-2">coincidiendo con "{searchQuery}"</span>}
                    </h1>
                </div>

                {/* Top Action Bar */}
                <div className="px-6 pb-4 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 relative">
                    <div className="flex items-center gap-2 relative">
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-gray-50 transition-colors">
                            <Filter className="w-4 h-4 text-gray-400" /> Filtrar
                        </button>

                        {/* Group By Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowGroupMenu(!showGroupMenu); setShowColumnMenu(false); }}
                                className={`flex items-center gap-2 px-3 py-1.5 border text-sm font-medium rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors ${groupBy ? 'bg-[#0A1128] text-white border-[#0A1128]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Layers className={`w-4 h-4 ${groupBy ? 'text-white' : 'text-gray-400'}`} />
                                {groupBy ? `Agrupado` : 'Agrupar por'}
                            </button>
                            {showGroupMenu && (
                                <div className="absolute top-10 left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-30 p-2">
                                    <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide px-1.5">Agrupar Tabla</div>
                                    <button onClick={() => { setGroupBy(null); setShowGroupMenu(false); }} className={`w-full text-left flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded ${groupBy === null ? 'text-[#D4AF37] font-bold bg-[#D4AF37]/5' : 'text-gray-700'}`}>
                                        Sin agrupar
                                    </button>
                                    <button onClick={() => { setGroupBy('estado'); setShowGroupMenu(false); }} className={`w-full text-left flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded ${groupBy === 'estado' ? 'text-[#D4AF37] font-bold bg-[#D4AF37]/5' : 'text-gray-700'}`}>
                                        Por Estado del Lead
                                    </button>
                                    <button onClick={() => { setGroupBy('prioridad'); setShowGroupMenu(false); }} className={`w-full text-left flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded ${groupBy === 'prioridad' ? 'text-[#D4AF37] font-bold bg-[#D4AF37]/5' : 'text-gray-700'}`}>
                                        Por Nivel de Prioridad
                                    </button>
                                    <button onClick={() => { setGroupBy('vendedor'); setShowGroupMenu(false); }} className={`w-full text-left flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded ${groupBy === 'vendedor' ? 'text-[#D4AF37] font-bold bg-[#D4AF37]/5' : 'text-gray-700'}`}>
                                        Por Vendedor Asignado
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Table Customization Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowColumnMenu(!showColumnMenu); setShowGroupMenu(false); }}
                                className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-gray-50 transition-colors"
                            >
                                <Settings className="w-4 h-4 text-gray-400" /> Personalizar tabla
                            </button>
                            {showColumnMenu && (
                                <div className="absolute top-10 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-30 p-2">
                                    <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Columnas Visibles</div>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.name} onChange={() => toggleColumn('name')} /> Nombre del Lead
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.actions} onChange={() => toggleColumn('actions')} /> Acciones
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.email} onChange={() => toggleColumn('email')} /> Correo
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.status} onChange={() => toggleColumn('status')} /> Estado
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.priority} onChange={() => toggleColumn('priority')} /> Prioridad
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.tags} onChange={() => toggleColumn('tags')} /> Etiquetas
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.vendor} onChange={() => toggleColumn('vendor')} /> Vendedor Asignado
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={handleExportExcel} className="p-1.5 px-3 flex items-center gap-2 border border-gray-200 text-[#006400] font-medium text-sm rounded-lg shadow-sm hover:bg-green-50 transition-colors mr-2">
                            <Download className="w-4 h-4" /> Exportar Excel
                        </button>
                        <div className="flex">
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37] text-white text-sm font-medium rounded-l-lg hover:bg-[#b08f26] transition shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Crear lead
                            </button>
                            <button className="px-2 py-1.5 bg-[#D4AF37] text-white text-sm border-l border-white/20 rounded-r-lg hover:bg-[#b08f26] transition shadow-sm">
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
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
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm w-80 focus:outline-none focus:ring-1 focus:border-[#D4AF37] shadow-sm transition-all"
                        />
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        Mostrar
                        <select
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="border border-gray-200 bg-gray-50 rounded-md p-1 pr-6 text-gray-700 text-xs focus:outline-none"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        leads
                    </div>
                </div>

                {/* Table Area */}
                <div onClick={() => { setShowColumnMenu(false); setShowGroupMenu(false); }} className="flex-1 overflow-auto bg-white custom-scrollbar w-full relative border-t border-gray-100">
                    <table className="w-full text-left whitespace-nowrap min-w-max">
                        <thead className="sticky top-0 bg-white z-10 shadow-sm">
                            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                                <th className="px-4 py-4 w-12 text-center">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-[#0A1128] cursor-pointer focus:ring-[#0A1128]" />
                                </th>
                                {visibleColumns.name && <th className="px-4 py-4 w-64">Nombre del Lead</th>}
                                {visibleColumns.actions && <th className="px-4 py-4 w-48 text-center">Acciones</th>}
                                {visibleColumns.email && <th className="px-4 py-4 w-60">Correo</th>}
                                {visibleColumns.status && <th className="px-4 py-4 w-32">Estado</th>}
                                {visibleColumns.priority && (
                                    <th
                                        className="px-4 py-4 w-40 cursor-pointer hover:bg-gray-50 select-none transition-colors"
                                        onClick={handleSortPriority}
                                    >
                                        <div className="flex items-center gap-1">
                                            Prioridad
                                            {prioritySort === 'desc' ? <span className="text-[#D4AF37]">↓</span> : prioritySort === 'asc' ? <span className="text-[#D4AF37]">↑</span> : <span className="text-gray-300">↕</span>}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.tags && <th className="px-4 py-4 w-40">Etiquetas</th>}
                                {visibleColumns.vendor && <th className="px-4 py-4 w-40">Vendedor Asignado</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/70 text-sm">
                            {error && (
                                <tr><td colSpan="10" className="p-4 text-center text-red-600 bg-red-50">{error}</td></tr>
                            )}
                            {loading && leads.length === 0 && (
                                <tr><td colSpan="10" className="p-8 text-center text-gray-400">Cargando leads...</td></tr>
                            )}
                            {!loading && paginatedLeads.length === 0 && !error && (
                                <tr>
                                    <td colSpan="10" className="p-16 text-center text-gray-500">
                                        <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                                        <p className="font-medium">No se encontraron leads</p>
                                    </td>
                                </tr>
                            )}
                            {paginatedLeads.map((lead, idx) => {
                                let groupVal = null;
                                let showGroupHeader = false;

                                if (groupBy) {
                                    if (groupBy === 'estado') groupVal = getStatusLabel(lead.estado);
                                    else if (groupBy === 'prioridad') groupVal = lead.prioridad || 'MEDIA';
                                    else if (groupBy === 'vendedor') groupVal = lead.usuario_asignado?.nombre || 'Sin Asignar';

                                    const prevLead = idx > 0 ? paginatedLeads[idx - 1] : null;
                                    let prevGroupVal = null;
                                    if (prevLead) {
                                        if (groupBy === 'estado') prevGroupVal = getStatusLabel(prevLead.estado);
                                        else if (groupBy === 'prioridad') prevGroupVal = prevLead.prioridad || 'MEDIA';
                                        else if (groupBy === 'vendedor') prevGroupVal = prevLead.usuario_asignado?.nombre || 'Sin Asignar';
                                    }

                                    if (idx === 0 || groupVal !== prevGroupVal) {
                                        showGroupHeader = true;
                                    }
                                }

                                return (
                                    <React.Fragment key={lead.id_lead || idx}>
                                        {showGroupHeader && (
                                            <tr className="bg-gray-50/90 border-y border-gray-200/60 transition-colors hover:bg-gray-100/50">
                                                <td colSpan="10" className="px-5 py-3 font-bold text-[#0A1128] text-xs uppercase tracking-wider shadow-[inset_3px_0_0_0_#D4AF37]">
                                                    <div className="flex items-center gap-2">
                                                        <Layers className="w-4 h-4 text-[#D4AF37]" />
                                                        {groupBy === 'estado' ? 'Estado' : groupBy === 'prioridad' ? 'Prioridad' : 'Vendedor'}:
                                                        <span className="text-gray-600 ml-1 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-sm inline-block">{groupVal}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        <tr
                                            className={`group transition-all cursor-pointer ${selectedChatLead?.id_lead === lead.id_lead
                                                ? 'bg-gray-50/80 shadow-[inset_3px_0_0_0_#D4AF37]'
                                                : 'hover:bg-[#0A1128]/5'
                                                }`}
                                            onClick={() => setSelectedChatLead(lead)}
                                        >
                                            <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-[#0A1128] cursor-pointer focus:ring-[#0A1128]" />
                                            </td>
                                            {visibleColumns.name && (
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={`https://i.pravatar.cc/150?u=${lead.id_contacto}`}
                                                            alt="avatar"
                                                            className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 object-cover"
                                                        />
                                                        <span className="font-medium text-gray-800">
                                                            {lead.contacto?.nombre || `Contacto #${lead.id_contacto}`}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.actions && (
                                                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-2 text-gray-400">
                                                        {lead.contacto?.correo ? (
                                                            <a
                                                                href={`mailto:${lead.contacto.correo}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                title="Enviar correo"
                                                                className="p-1.5 flex items-center justify-center border border-gray-200 rounded-full hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37] transition-all"
                                                            >
                                                                <Mail className="w-3.5 h-3.5" />
                                                            </a>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); alert('Este contacto no tiene correo.'); }}
                                                                title="Sin correo"
                                                                className="p-1.5 flex items-center justify-center border border-gray-200 rounded-full opacity-40 cursor-not-allowed hover:bg-gray-100 transition-all"
                                                            >
                                                                <Mail className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}

                                                        {lead.contacto?.telefono ? (
                                                            <a
                                                                href={`tel:${lead.contacto.telefono}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                title="Llamar"
                                                                className="p-1.5 flex items-center justify-center border border-gray-200 rounded-full hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37] transition-all"
                                                            >
                                                                <Phone className="w-3.5 h-3.5" />
                                                            </a>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); alert('Este contacto no tiene teléfono.'); }}
                                                                title="Sin teléfono"
                                                                className="p-1.5 flex items-center justify-center border border-gray-200 rounded-full opacity-40 cursor-not-allowed hover:bg-gray-100 transition-all"
                                                            >
                                                                <Phone className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}

                                                        <button title="Expediente" onClick={(e) => { e.stopPropagation(); setCalendarModalLead(lead); }} className="p-1.5 flex items-center justify-center border border-gray-200 rounded-full hover:bg-[rgb(10,17,40)] hover:text-white hover:border-[#0A1128] transition-all"><Calendar className="w-3.5 h-3.5" /></button>
                                                        <button title="Chat" onClick={(e) => { e.stopPropagation(); setSelectedChatLead(lead); }} className="p-1.5 flex items-center justify-center border border-gray-200 rounded-full hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all"><MessageSquare className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.email && (
                                                <td className="px-4 py-4 text-gray-600">
                                                    {lead.contacto?.correo ? (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                            {lead.contacto?.correo}
                                                        </div>
                                                    ) : <span className="text-gray-400 italic text-xs">Sin correo</span>}
                                                </td>
                                            )}
                                            {visibleColumns.status && (
                                                <td className="px-4 py-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide flex w-max ${getStatusColor(lead.estado)}`}>
                                                        {getStatusLabel(lead.estado)}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.priority && (
                                                <td className="px-4 py-4 font-medium text-[13px]" onClick={e => e.stopPropagation()}>
                                                    <select
                                                        value={lead.prioridad || 'MEDIA'}
                                                        onChange={(e) => updateLeadPriority(lead.id_lead, e.target.value)}
                                                        className={`text-xs px-2 py-1 rounded font-bold border-none outline-none cursor-pointer appearance-none ${lead.prioridad === 'URGENTE' ? 'bg-red-100 text-red-700' :
                                                            lead.prioridad === 'ALTA' ? 'bg-orange-100 text-orange-700' :
                                                                lead.prioridad === 'BAJA' ? 'bg-gray-100 text-gray-500' :
                                                                    'bg-blue-100 text-blue-700'
                                                            }`}
                                                    >
                                                        <option value="BAJA">Baja</option>
                                                        <option value="MEDIA">Media</option>
                                                        <option value="ALTA">Alta</option>
                                                        <option value="URGENTE">Urgente</option>
                                                    </select>
                                                </td>
                                            )}
                                            {visibleColumns.tags && (
                                                <td className="px-4 py-4 text-gray-500 text-[13px] font-medium hover:text-gray-900 transition-colors">
                                                    + Clic para agregar
                                                </td>
                                            )}
                                            {visibleColumns.vendor && (
                                                <td className="px-4 py-4 text-gray-700 text-[13px]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-[#0A1128] text-[#D4AF37] flex items-center justify-center text-[10px] font-bold">
                                                            {lead.usuario_asignado?.nombre ? lead.usuario_asignado.nombre.charAt(0).toUpperCase() : '?'}
                                                        </span>
                                                        {lead.usuario_asignado?.nombre || 'Sin Asignar'}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-white flex-shrink-0">
                    <span className="text-sm text-gray-500 flex items-center font-medium">
                        {filteredLeads.length === 0
                            ? '0 resultados mostrados'
                            : `Mostrando ${((currentPage - 1) * itemsPerPage) + 1} al ${Math.min(currentPage * itemsPerPage, filteredLeads.length)} de ${filteredLeads.length} leads`
                        }
                    </span>
                    <div className="flex items-center gap-1.5 shadow-sm rounded-lg border border-gray-100 p-0.5 bg-gray-50/50">
                        <button
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1 rounded text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="px-3 text-sm font-medium text-gray-700 bg-transparent min-w-[70px] text-center">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-1 rounded text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal para Crear Lead */}
            {
                showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1128]/60 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-900">Registrar Nuevo Lead</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <form onSubmit={handleSubmit} id="leadForm" className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                                        <input required name="nombre" value={formData.nombre} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" placeholder="Ej. Juan Pérez" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                            <input name="correo" value={formData.correo} onChange={handleInputChange} type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37]" placeholder="juan@ejemplo.com" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                            <input name="telefono" value={formData.telefono} onChange={handleInputChange} type="tel" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37]" placeholder="+52 ..." />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Origen / Medio</label>
                                            <input name="origen" value={formData.origen} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37]" placeholder="Ej. Facebook, WhatsApp" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                                            <select name="prioridad" value={formData.prioridad} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37]">
                                                <option value="BAJA">Baja</option>
                                                <option value="MEDIA">Media</option>
                                                <option value="ALTA">Alta</option>
                                                <option value="URGENTE">Urgente</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                        <select name="estado" value={formData.estado} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37]">
                                            <option value="NUEVO">Nuevo</option>
                                            <option value="CONTACTADO">Contactado</option>
                                            <option value="CALIFICADO">Calificado</option>
                                            <option value="DESCARTADO">Descartado</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas Iniciales</label>
                                        <textarea name="notas_iniciales" value={formData.notas_iniciales} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37]" placeholder="Detalles de lo que busca..." />
                                    </div>
                                </form>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button type="submit" form="leadForm" disabled={submitting} className="px-4 py-2 text-sm font-medium text-[#0A1128] bg-[#D4AF37] hover:bg-[#b08f26] rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors">
                                    {submitting ? 'Guardando...' : 'Guardar Lead'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal de Calendario/Expediente Exclusivo */}
            {
                calendarModalLead && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1128]/60 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                            <div className="bg-[#0A1128] text-white px-6 py-4 flex justify-between items-center relative overflow-hidden">
                                <div className="relative z-10">
                                    <h2 className="text-xl font-bold font-serif italic text-[#D4AF37]">Expediente & Calendario</h2>
                                    <p className="text-sm text-gray-300">{calendarModalLead.contacto?.nombre || `Contacto #${calendarModalLead.id_contacto}`}</p>
                                </div>
                                <button onClick={() => setCalendarModalLead(null)} className="text-white hover:text-[#D4AF37] relative z-10 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                                {/* Decorative background logo */}
                                <div className="absolute right-0 top-0 opacity-10 text-[100px] font-serif pr-4 leading-none select-none">R</div>
                            </div>
                            <div className="p-6 bg-gray-50 flex flex-col items-center justify-center text-center min-h-[300px]">
                                <Calendar className="w-16 h-16 text-[#D4AF37] mb-4" />
                                <h3 className="text-xl font-bold text-[#0A1128] mb-2">Calendario de Actividades</h3>
                                <p className="text-gray-600 max-w-md">
                                    Aquí podrás agendar reuniones, registrar llamadas y llevar todo el historial exclusivo para <strong>{calendarModalLead.contacto?.nombre}</strong>.
                                </p>
                                <button onClick={() => setCalendarModalLead(null)} className="mt-6 px-6 py-2 bg-[#D4AF37] text-[#0A1128] font-bold rounded-lg shadow-md hover:bg-[#b08f26] transition-colors hover:-translate-y-0.5 transform">
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Chat Drawer */}
            <LeadChatDrawer
                lead={selectedChatLead}
                onClose={() => setSelectedChatLead(null)}
            />
        </div >
    );
}

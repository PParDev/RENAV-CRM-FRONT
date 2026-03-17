import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, MoreHorizontal, Plus, Search, Filter, Layers, Settings,
    Download, Upload, Mail, Phone, Calendar, MessageSquare, ChevronDown, Check, ChevronLeft, ChevronRight, X, LayoutGrid, List, Send,
    TrendingUp, AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Helper calculations for mock visual features
const getLeadScore = (lead) => {
    let score = 40;
    if (lead.prioridad === 'URGENTE') score += 40;
    if (lead.prioridad === 'ALTA') score += 25;
    if (lead.prioridad === 'BAJA') score -= 15;
    if (lead.contacto?.telefono) score += 10;
    if (lead.contacto?.correo) score += 10;
    return Math.min(100, Math.max(0, score + (lead.id_lead % 10)));
};

const getLeadValue = (lead) => {
    const base = [150000, 280000, 320000, 450000, 500000, 620000, 220000, 190000];
    return base[lead.id_lead % base.length];
};

const getDaysContact = (lead) => {
    const lastUpdate = new Date(lead.actualizado_en || lead.creado_en);
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
    return diff;
};

// Mock data for side panel features
const MOCK_CHATS = {
    1: [{ from: 'lead', text: 'Buenas tardes, vi su anuncio en Facebook sobre departamentos.', time: '12 mar, 2:10 pm' }, { from: 'agent', text: '¡Hola! Con gusto te ayudo. ¿Buscas para vivir o invertir?', time: '12 mar, 2:14 pm' }],
};
const MOCK_SUGGESTS = ['¿Confirmamos la cita?', 'Te envío el catálogo', '¿Dudas con crédito?'];

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // View state
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'

    // Filters state
    const [activeTab, setActiveTab] = useState('todos');
    const [kpiFilter, setKpiFilter] = useState('todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [fEstado, setFEstado] = useState('');
    const [fPrioridad, setFPrioridad] = useState('');
    const [fAsignado, setFAsignado] = useState('');

    // Selection & Bulk
    const [selectedLeads, setSelectedLeads] = useState(new Set());

    // Sort & Pagination
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Advanced Filters
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [advFilters, setAdvFilters] = useState({
        servicio: '', fechaDesde: '', fechaHasta: '', estatus_general: '',
        tipo_operacion: '', tipo_propiedad: '', ciudad: '', proyecto: '',
        estacionamientos: '', clasificacion: '', m2_terreno_min: '', m2_construccion_min: ''
    });

    // Modals & Panels
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activePanelLead, setActivePanelLead] = useState(null);
    const [panelTab, setPanelTab] = useState('chat'); // chat, info, actividad, score
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([]);

    const [formData, setFormData] = useState({
        nombre: '', correo: '', telefono: '', origen: '', estado: 'NUEVO', prioridad: 'MEDIA', notas_iniciales: ''
    });

    const handleCreateLead = async () => {
        try {
            if (!formData.nombre) return alert('El nombre es requerido');
            setSubmitting(true);

            // 1. Create Contact
            const contactRes = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    correo: formData.correo || undefined,
                    telefono: formData.telefono || undefined,
                    origen: formData.origen || undefined
                })
            });
            if (!contactRes.ok) throw new Error('Error creating contact');
            const contactData = await contactRes.json();

            // 2. Create Lead
            const leadRes = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_contacto: contactData.id_contacto || contactData.id,
                    estado: formData.estado,
                    prioridad: formData.prioridad,
                    notas_iniciales: formData.notas_iniciales
                })
            });
            if (!leadRes.ok) throw new Error('Error creating lead');

            // 3. Refresh list and close
            await fetchLeads();
            setShowModal(false);
            setFormData({ nombre: '', correo: '', telefono: '', origen: '', estado: 'NUEVO', prioridad: 'MEDIA', notas_iniciales: '' });
        } catch (err) {
            console.error(err);
            alert('Hubo un error al crear el lead');
        } finally {
            setSubmitting(false);
        }
    };

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/leads?take=1000');
            if (!res.ok) throw new Error('Error fetching leads');
            const data = await res.json();
            // Append calculated properties
            const enriched = (data.data || data).map(l => ({
                ...l,
                score: getLeadScore(l),
                valorEstimado: getLeadValue(l),
                diasContacto: getDaysContact(l)
            }));
            setLeads(enriched);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const openLeadPanel = async (lead) => {
        setActivePanelLead(lead);
        setPanelTab('chat');
        setChatMessages(MOCK_CHATS[lead.id_lead % 2] || []);

        try {
            const res = await fetch(`/api/leads/${lead.id_lead}`);
            if (res.ok) {
                const fullData = await res.json();
                setActivePanelLead(prev => ({ ...prev, ...fullData }));
            }
        } catch (e) {
            console.error('Error fetching lead details:', e);
        }
    };

    const handleAddActivity = async (tipo, descripcion) => {
        if (!descripcion.trim() || !activePanelLead) return;
        try {
            const res = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_lead: activePanelLead.id_lead,
                    tipo: tipo || 'NOTE',
                    descripcion: descripcion
                })
            });
            if (!res.ok) throw new Error('Error saving activity');

            // Refetch details
            const detailRes = await fetch(`/api/leads/${activePanelLead.id_lead}`);
            if (detailRes.ok) {
                const fullData = await detailRes.json();
                setActivePanelLead(prev => ({ ...prev, ...fullData }));
            }
        } catch (err) {
            console.error(err);
            alert('Error al guardar la actividad');
        }
    };

    // Filter logic
    const handleUpdateLeadStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/leads/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus })
            });
            if (!res.ok) throw new Error('Failed to update lead status');
            await fetchLeads();

            // update local active panel state if open
            if (activePanelLead?.id_lead === id) {
                setActivePanelLead(prev => ({ ...prev, estado: newStatus }));
            }
        } catch (err) {
            console.error(err);
            alert('Error al actualizar estado');
        }
    };

    const handleDeleteLead = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar permanentemente este lead?')) return;
        try {
            const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete lead');
            await fetchLeads();
            if (activePanelLead?.id_lead === id) setActivePanelLead(null);
        } catch (err) {
            console.error(err);
            alert('Error al eliminar lead');
        }
    };

    const filteredLeads = useMemo(() => {
        let result = leads;

        // KPI Filter
        if (kpiFilter === 'nuevo') result = result.filter(l => l.estado === 'NUEVO');
        if (kpiFilter === 'en_proceso') result = result.filter(l => l.estado === 'EN PROCESO' || l.estado === 'CALIFICADO');
        if (kpiFilter === 'urgente') result = result.filter(l => l.prioridad === 'URGENTE');

        // Tab Filter
        if (activeTab === 'nuevo') result = result.filter(l => l.estado === 'NUEVO');
        if (activeTab === 'en_proceso') result = result.filter(l => l.estado === 'EN PROCESO' || l.estado === 'CALIFICADO');
        if (activeTab === 'seguimiento') result = result.filter(l => l.diasContacto > 3 && l.estado !== 'DESCARTADO' && l.estado !== 'PERDIDO');
        if (activeTab === 'descartado') result = result.filter(l => l.estado === 'DESCARTADO' || l.estado === 'PERDIDO');

        // Dropdowns
        if (fEstado) result = result.filter(l => l.estado === fEstado);
        if (fPrioridad) result = result.filter(l => l.prioridad === fPrioridad);
        // Advanced Real Estate / General Filters
        if (advFilters.servicio) {
            result = result.filter(l => l.solicitudes?.some(s =>
                (s.servicio?.nombre || '').toUpperCase().includes(advFilters.servicio.toUpperCase()) ||
                (s.servicio?.codigo || '').toUpperCase().includes(advFilters.servicio.toUpperCase())
            ));
        }
        if (advFilters.fechaDesde) {
            const dateD = new Date(advFilters.fechaDesde + 'T00:00:00');
            result = result.filter(l => new Date(l.creado_en) >= dateD);
        }
        if (advFilters.fechaHasta) {
            const dateH = new Date(advFilters.fechaHasta + 'T23:59:59');
            result = result.filter(l => new Date(l.creado_en) <= dateH);
        }
        if (advFilters.estatus_general) {
            if (advFilters.estatus_general === 'NUEVO') result = result.filter(l => l.estado === 'NUEVO');
            if (advFilters.estatus_general === 'CERRADO') result = result.filter(l => l.estado === 'CALIFICADO' || l.estado === 'CERRADO' || l.estado === 'DESCARTADO' || l.estado === 'PERDIDO');
            if (advFilters.estatus_general === 'SEGUIMIENTO') result = result.filter(l => l.estado === 'EN PROCESO');
            if (advFilters.estatus_general === 'PAUSA') result = result.filter(l => l.estado === 'PAUSA');
        }

        // Real Estate specifics
        if (advFilters.tipo_operacion) {
            const op = advFilters.tipo_operacion.toUpperCase();
            result = result.filter(l => l.solicitudes?.some(s => (s.servicio?.nombre || '').toUpperCase().includes(op)));
        }
        if (advFilters.tipo_propiedad) {
            const tp = advFilters.tipo_propiedad.toUpperCase();
            result = result.filter(l => l.solicitudes?.some(s =>
                (s.bienes_raices?.tipo_inmueble?.nombre || '').toUpperCase() === tp ||
                (s.avaluo?.tipo_bien || '').toUpperCase() === tp ||
                (s.arquitectura?.subtipo_habitacional?.nombre || '').toUpperCase() === tp ||
                (s.construccion?.subtipo_habitacional?.nombre || '').toUpperCase() === tp
            ));
        }
        if (advFilters.ciudad) {
            const c = advFilters.ciudad.toLowerCase();
            result = result.filter(l => (l.contacto?.ciudad || '').toLowerCase().includes(c) || l.solicitudes?.some(s =>
                (s.bienes_raices?.ciudad || '').toLowerCase().includes(c) || (s.ciudad || '').toLowerCase().includes(c)
            ));
        }
        if (advFilters.clasificacion) {
            const cl = advFilters.clasificacion.toUpperCase();
            result = result.filter(l => l.solicitudes?.some(s =>
                (s.bienes_raices?.zona || '').toUpperCase().includes(cl) || (s.zona || '').toUpperCase().includes(cl) ||
                (s.arquitectura?.zona || '').toUpperCase().includes(cl) || (s.construccion?.zona || '').toUpperCase().includes(cl) ||
                (s.avaluo?.zona || '').toUpperCase().includes(cl)
            ));
        }
        if (advFilters.proyecto) {
            const p = advFilters.proyecto.toLowerCase();
            result = result.filter(l => l.solicitudes?.some(s =>
                (s.ubicacion_texto || '').toLowerCase().includes(p) || (s.bienes_raices?.ubicacion || '').toLowerCase().includes(p) ||
                (s.arquitectura?.ubicacion || '').toLowerCase().includes(p) || (s.construccion?.ubicacion || '').toLowerCase().includes(p) ||
                (s.avaluo?.ubicacion || '').toLowerCase().includes(p)
            ));
        }
        if (advFilters.estacionamientos) {
            const est = parseInt(advFilters.estacionamientos);
            result = result.filter(l => l.solicitudes?.some(s => (s.bienes_raices?.estacionamientos || 0) >= est));
        }
        if (advFilters.m2_terreno_min) {
            const min = parseFloat(advFilters.m2_terreno_min);
            result = result.filter(l => l.solicitudes?.some(s =>
                parseFloat(s.bienes_raices?.superficie_m2 || 0) >= min ||
                parseFloat(s.arquitectura?.superficie_m2 || 0) >= min ||
                parseFloat(s.construccion?.superficie_m2 || 0) >= min ||
                parseFloat(s.avaluo?.superficie_m2 || 0) >= min
            ));
        }
        if (advFilters.m2_construccion_min) {
            const min = parseFloat(advFilters.m2_construccion_min);
            result = result.filter(l => l.solicitudes?.some(s =>
                parseFloat(s.bienes_raices?.m2_construidos_requeridos || 0) >= min ||
                parseFloat(s.avaluo?.superficie_construida_m2 || 0) >= min
            ));
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l =>
                l.contacto?.nombre?.toLowerCase().includes(q) ||
                l.contacto?.correo?.toLowerCase().includes(q) ||
                String(l.id_lead).includes(q)
            );
        }

        // Sorting
        if (sortConfig.key) {
            result = [...result].sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (sortConfig.key === 'nombre') {
                    aVal = a.contacto?.nombre || ''; bVal = b.contacto?.nombre || '';
                } else if (sortConfig.key === 'asignado') {
                    aVal = a.usuario_asignado?.nombre || ''; bVal = b.usuario_asignado?.nombre || '';
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [leads, kpiFilter, activeTab, fEstado, fPrioridad, fAsignado, searchQuery, sortConfig]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // Pagination
    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
    const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages || 1);
    }, [totalPages, currentPage]);

    // Derived statistics for KPIs
    const stats = useMemo(() => {
        const counts = { total: leads.length, nuevo: 0, proceso: 0, urgente: 0 };
        leads.forEach(l => {
            if (l.estado === 'NUEVO') counts.nuevo++;
            if (l.estado === 'EN PROCESO' || l.estado === 'CALIFICADO') counts.proceso++;
            if (l.prioridad === 'URGENTE') counts.urgente++;
        });
        return counts;
    }, [leads]);

    const uniqueAgents = useMemo(() => {
        const agents = new Set(leads.map(l => l.usuario_asignado?.nombre || 'Sin Asignar'));
        return Array.from(agents).filter(Boolean);
    }, [leads]);

    // Checkbox toggles
    const toggleAll = (e) => {
        if (e.target.checked) setSelectedLeads(new Set(paginatedLeads.map(l => l.id_lead)));
        else setSelectedLeads(new Set());
    };
    const toggleRow = (id, e) => {
        e?.stopPropagation();
        const newSet = new Set(selectedLeads);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedLeads(newSet);
    };

    const handleExportExcel = () => {
        const d = filteredLeads.map(l => ({
            'ID': l.id_lead,
            'Nombre': l.contacto?.nombre,
            'Correo': l.contacto?.correo,
            'Estado': l.estado,
            'Prioridad': l.prioridad,
            'Score': l.score,
            'Valor Est.': l.valorEstimado,
            'Asignado': l.usuario_asignado?.nombre || ''
        }));
        const ws = XLSX.utils.json_to_sheet(d);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leads");
        XLSX.writeFile(wb, "Leads_CRM.xlsx");
    };

    const getScoreClasses = (score) => {
        if (score >= 70) return 'bg-[#16a34a]';
        if (score >= 40) return 'bg-[#d97706]';
        return 'bg-[#dc2626]';
    };

    const getStatusBadge = (estado) => {
        switch (estado) {
            case 'CALIFICADO':
            case 'CERRADO': return 'bg-[#dcfce7] text-[#166534]';
            case 'DESCARTADO':
            case 'PERDIDO': return 'bg-[#f3f4f6] text-[#6b7280]';
            case 'EN PROCESO': return 'bg-[#fef3c7] text-[#92400e]';
            case 'NUEVO':
            default: return 'bg-[#e0f2fe] text-[#0369a1]';
        }
    };

    const getPriorityBadge = (prio) => {
        switch (prio) {
            case 'URGENTE': return 'bg-[#fee2e2] text-[#991b1b]';
            case 'ALTA': return 'bg-[#fef3c7] text-[#92400e]';
            case 'MEDIA': return 'bg-[#e0f2fe] text-[#0369a1]';
            case 'BAJA':
            default: return 'bg-[#f3f4f6] text-[#6b7280]';
        }
    };

    const handleChatSend = () => {
        if (!chatInput.trim()) return;
        setChatMessages(prev => [...prev, { from: 'agent', text: chatInput, time: 'Ahora' }]);
        setChatInput('');
    };

    // Kanban Grouping
    const kanbanColumns = ['NUEVO', 'EN PROCESO', 'CALIFICADO', 'CERRADO', 'DESCARTADO', 'PERDIDO'];

    return (
        <div className="flex bg-[#fafafa] -m-6 min-h-[calc(100vh-4rem)] text-gray-900 overflow-hidden">
            {/* Main Content (Table / Kanban + Filters) */}
            <div className={`p-6 flex-1 flex flex-col gap-6 overflow-y-auto transition-all duration-300`}>
                {/* Header Top Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">CRM › Leads</div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">Módulo de Leads</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportExcel} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50 flex items-center gap-1.5 shadow-sm">
                            <Download className="w-4 h-4" /> Exportar
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50 flex items-center gap-1.5 shadow-sm">
                            <Upload className="w-4 h-4" /> Importar
                        </button>
                        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-[#1a1a2e] text-white text-sm font-medium rounded-md hover:bg-[#282846] transition-colors shadow-sm flex items-center gap-1.5">
                            <Plus className="w-4 h-4" /> Crear lead
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${kpiFilter === 'todos' ? 'border-gray-800 bg-gray-50' : 'border-transparent bg-white shadow-sm hover:border-gray-200'}`} onClick={() => setKpiFilter('todos')}>
                        <div className="text-sm text-gray-500 mb-2">Total leads</div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <TrendingUp className="w-3.5 h-3.5" /> 17% vs mes anterior
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${kpiFilter === 'nuevo' ? 'border-gray-800 bg-gray-50' : 'border-transparent bg-white shadow-sm hover:border-gray-200'}`} onClick={() => setKpiFilter('nuevo')}>
                        <div className="text-sm text-gray-500 mb-2">Sin contactar</div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.nuevo}</div>
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <TrendingUp className="w-3.5 h-3.5" /> 2 esta semana
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${kpiFilter === 'en_proceso' ? 'border-gray-800 bg-gray-50' : 'border-transparent bg-white shadow-sm hover:border-gray-200'}`} onClick={() => setKpiFilter('en_proceso')}>
                        <div className="text-sm text-gray-500 mb-2">En proceso</div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.proceso}</div>
                        <div className="text-xs text-gray-500 font-medium h-[18px] flex items-center">Sin cambios</div>
                    </div>
                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${kpiFilter === 'urgente' ? 'border-gray-800 bg-gray-50' : 'border-transparent bg-white shadow-sm hover:border-gray-200'}`} onClick={() => setKpiFilter('urgente')}>
                        <div className="text-sm text-gray-500 mb-2">Urgentes</div>
                        <div className="text-3xl font-bold text-red-600 mb-1">{stats.urgente}</div>
                        <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                            <TrendingUp className="w-3.5 h-3.5" /> 1 hoy
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-4 shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            <div className="relative w-full max-w-[280px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, correo o ID..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#1a1a2e] focus:border-[#1a1a2e] shadow-sm"
                                />
                            </div>
                            <select className="py-2 px-3 border border-gray-200 rounded-lg text-[13px] bg-white shadow-sm" value={fEstado} onChange={e => setFEstado(e.target.value)}>
                                <option value="">Estado</option>
                                <option value="NUEVO">Nuevo</option>
                                <option value="EN PROCESO">En Proceso</option>
                                <option value="CALIFICADO">Calificado</option>
                                <option value="DESCARTADO">Descartado</option>
                                <option value="PERDIDO">Perdido</option>
                                <option value="CERRADO">Cerrado</option>
                            </select>
                            <select className="py-2 px-3 border border-gray-200 rounded-lg text-[13px] bg-white shadow-sm" value={fPrioridad} onChange={e => setFPrioridad(e.target.value)}>
                                <option value="">Prioridad</option>
                                <option value="URGENTE">Urgente</option>
                                <option value="ALTA">Alta</option>
                                <option value="MEDIA">Media</option>
                                <option value="BAJA">Baja</option>
                            </select>
                            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`px-3 py-2 border rounded-lg text-[13px] flex items-center gap-2 shadow-sm transition-colors ${showAdvancedFilters ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                <Filter className="w-4 h-4" /> Filtros Avanzados
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[13px] text-gray-500">Mostrando {filteredLeads.length} leads</span>
                            <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white">
                                <button onClick={() => setViewMode('table')} className={`p-1.5 px-3 transition-colors text-[13px] font-medium flex gap-2 items-center ${viewMode === 'table' ? 'bg-gray-100 text-gray-900 border-b-2 border-[#1a1a2e]' : 'text-gray-500 hover:bg-gray-50 border-b-2 border-transparent'}`}>
                                    <List className="w-4 h-4" /> Tabla
                                </button>
                                <button onClick={() => setViewMode('kanban')} className={`p-1.5 px-3 border-l border-gray-200 transition-colors text-[13px] font-medium flex gap-2 items-center ${viewMode === 'kanban' ? 'bg-gray-100 text-gray-900 border-b-2 border-[#1a1a2e]' : 'text-gray-500 hover:bg-gray-50 border-b-2 border-transparent'}`}>
                                    <LayoutGrid className="w-4 h-4" /> Kanban
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showAdvancedFilters && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-in slide-in-from-top-2">
                            <h3 className="text-[13px] font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Filtros Avanzados</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase mb-1.5">Estatus General</label>
                                    <select value={advFilters.estatus_general} onChange={e => setAdvFilters({ ...advFilters, estatus_general: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1a1a2e]">
                                        <option value="">Cualquiera</option>
                                        <option value="NUEVO">Nuevo</option>
                                        <option value="SEGUIMIENTO">En Seguimiento</option>
                                        <option value="CERRADO">Cerrado</option>
                                        <option value="PAUSA">En Pausa</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase mb-1.5">Servicio</label>
                                    <select value={advFilters.servicio} onChange={e => setAdvFilters({ ...advFilters, servicio: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1a1a2e]">
                                        <option value="">Todos</option>
                                        <option value="BIENES RAICES">Bienes Raíces</option>
                                        <option value="AVALUO">Avalúo</option>
                                        <option value="DISEÑO Y ARQUITECTURA">Diseño y Arquitectura</option>
                                        <option value="CONSTRUCCION Y MANTENIMIENTO">Construcción</option>
                                    </select>
                                </div>
                                <div><label className="block text-[11px] font-medium text-gray-500 uppercase mb-1.5">Fecha Desde</label><input type="date" value={advFilters.fechaDesde} onChange={e => setAdvFilters({ ...advFilters, fechaDesde: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50 focus:bg-white" /></div>
                                <div><label className="block text-[11px] font-medium text-gray-500 uppercase mb-1.5">Fecha Hasta</label><input type="date" value={advFilters.fechaHasta} onChange={e => setAdvFilters({ ...advFilters, fechaHasta: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50 focus:bg-white" /></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-3 pt-3 border-t border-gray-100">
                                <div className="col-span-1 md:col-span-3 lg:col-span-4 xl:col-span-6 mb-1">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Inmueble Ideal</h4>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Operación</label>
                                    <select value={advFilters.tipo_operacion} onChange={e => setAdvFilters({ ...advFilters, tipo_operacion: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50">
                                        <option value="">Cualquiera</option><option value="VENTA">Venta</option><option value="RENTA">Renta</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Tipo Propiedad</label>
                                    <select value={advFilters.tipo_propiedad} onChange={e => setAdvFilters({ ...advFilters, tipo_propiedad: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50">
                                        <option value="">Cualquiera</option><option value="CASA">Casa</option><option value="DEPARTAMENTO">Departamento</option><option value="LOCAL">Local</option><option value="OFICINA">Oficina</option><option value="TERRENO">Terreno</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Ciudad</label>
                                    <input type="text" placeholder="Ej. Tepic" value={advFilters.ciudad} onChange={e => setAdvFilters({ ...advFilters, ciudad: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Clasificación</label>
                                    <select value={advFilters.clasificacion} onChange={e => setAdvFilters({ ...advFilters, clasificacion: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50">
                                        <option value="">Todas</option><option value="HABITACIONAL">Habitacional</option><option value="COMERCIAL">Comercial</option><option value="INDUSTRIAL">Industrial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Proyecto</label>
                                    <input type="text" placeholder="Nombre proyecto" value={advFilters.proyecto} onChange={e => setAdvFilters({ ...advFilters, proyecto: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Estacionamientos</label>
                                    <input type="number" min="0" placeholder="Min." value={advFilters.estacionamientos} onChange={e => setAdvFilters({ ...advFilters, estacionamientos: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">M2 Terreno (mín)</label>
                                    <input type="number" min="0" placeholder="Ej. 120" value={advFilters.m2_terreno_min} onChange={e => setAdvFilters({ ...advFilters, m2_terreno_min: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">M2 Const. (mín)</label>
                                    <input type="number" min="0" placeholder="Ej. 80" value={advFilters.m2_construccion_min} onChange={e => setAdvFilters({ ...advFilters, m2_construccion_min: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50" />
                                </div>
                            </div>
                            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100 gap-2">
                                <button onClick={() => setAdvFilters({ servicio: '', fechaDesde: '', fechaHasta: '', estatus_general: '', tipo_operacion: '', tipo_propiedad: '', ciudad: '', proyecto: '', estacionamientos: '', clasificacion: '', m2_terreno_min: '', m2_construccion_min: '' })} className="px-4 py-2 text-[12px] text-gray-500 hover:text-gray-800 font-medium">Limpiar Todo</button>
                                <button onClick={() => setShowAdvancedFilters(false)} className="px-4 py-2 text-[12px] bg-[#1a1a2e] text-white rounded-lg hover:bg-[#282846] font-medium">Aplicar Filtros</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Table / Kanban area */}
                {viewMode === 'table' ? (
                    <div className="bg-white border text-[13px] border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                        <div className="overflow-x-auto flex-1 custom-scrollbar relative">
                            <table className="w-full text-left whitespace-nowrap min-w-max h-max">
                                <thead className="bg-[#f8f9fa] border-b border-gray-200 sticky top-0 z-10 w-full">
                                    <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        <th className="px-4 py-3 w-10 text-center"><input type="checkbox" checked={selectedLeads.size === paginatedLeads.length && paginatedLeads.length > 0} onChange={toggleAll} className="rounded border-gray-300 w-3.5 h-3.5" /></th>
                                        <th className="px-4 py-3 cursor-pointer hover:text-gray-800" onClick={() => handleSort('nombre')}>LEAD</th>
                                        <th className="px-4 py-3 cursor-pointer hover:text-gray-800" onClick={() => handleSort('score')}>SCORE</th>
                                        <th className="px-4 py-3 cursor-pointer hover:text-gray-800" onClick={() => handleSort('valorEstimado')}>VALOR EST.</th>
                                        <th className="px-4 py-3 cursor-pointer hover:text-gray-800" onClick={() => handleSort('estado')}>ESTADO</th>
                                        <th className="px-4 py-3 cursor-pointer hover:text-gray-800" onClick={() => handleSort('prioridad')}>PRIORIDAD</th>
                                        {!activePanelLead && <th className="px-4 py-3 cursor-pointer hover:text-gray-800" onClick={() => handleSort('diasContacto')}>CONTACTO</th>}
                                        {!activePanelLead && <th className="px-4 py-3">ACCIONES</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedLeads.map(lead => {
                                        const initials = lead.contacto?.nombre ? lead.contacto.nombre.substring(0, 2).toUpperCase() : 'LD';
                                        const isSelected = selectedLeads.has(lead.id_lead);
                                        const isActive = activePanelLead?.id_lead === lead.id_lead;
                                        return (
                                            <tr key={lead.id_lead} onClick={() => openLeadPanel(lead)} className={`hover:bg-gray-50 transition-colors cursor-pointer ${isActive ? 'bg-[#e0f2fe]' : isSelected ? 'bg-blue-50/20' : ''}`}>
                                                <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" checked={isSelected} onChange={(e) => toggleRow(lead.id_lead, e)} className="rounded border-gray-300 w-3.5 h-3.5" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold border border-indigo-200/50 shrink-0">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-gray-900 truncate">{lead.contacto?.nombre || 'Contacto'}</div>
                                                            <div className="text-[11px] text-gray-500 truncate">{lead.contacto?.correo || 'Sin correo'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 w-full max-w-[70px]">
                                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                                                            <div className={`h-full rounded-full ${getScoreClasses(lead.score)}`} style={{ width: `${lead.score}%` }}></div>
                                                        </div>
                                                        <span className="text-[11px] font-bold text-gray-500 shrink-0">{lead.score}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-gray-700">
                                                    ${lead.valorEstimado.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(lead.estado)}`}>
                                                        {lead.estado}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${getPriorityBadge(lead.prioridad)}`}>
                                                        {lead.prioridad || 'MEDIA'}
                                                    </span>
                                                </td>
                                                {!activePanelLead && (
                                                    <td className="px-4 py-3 text-[12px]">
                                                        {lead.diasContacto <= 1 && <span className="text-gray-500">Hoy</span>}
                                                        {lead.diasContacto > 1 && lead.diasContacto <= 3 && <span className="text-gray-500">Hace {lead.diasContacto}d</span>}
                                                        {lead.diasContacto > 3 && lead.diasContacto <= 7 && <span className="text-[#d97706] font-medium">Hace {lead.diasContacto}d</span>}
                                                        {lead.diasContacto > 7 && (
                                                            <div className="flex items-center gap-1 text-[#dc2626] font-bold">
                                                                Hace {lead.diasContacto}d <AlertTriangle className="w-3.5 h-3.5" />
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                                {!activePanelLead && (
                                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => { if (lead.contacto?.correo) window.location.href = `mailto:${lead.contacto.correo}` }}
                                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm hover:shadow"
                                                            >
                                                                <Mail className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => { if (lead.contacto?.telefono) window.location.href = `tel:${lead.contacto.telefono}` }}
                                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-600 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm hover:shadow"
                                                            >
                                                                <Phone className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openLeadPanel(lead)}
                                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm hover:shadow"
                                                            >
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Footer */}
                        <div className="px-5 py-2.5 border-t border-gray-200 bg-[#f8f9fa] flex items-center justify-between shrink-0">
                            <span className="text-[12px] text-gray-500">
                                {filteredLeads.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredLeads.length)} de ${filteredLeads.length} leads` : '0 leads'}
                            </span>
                            <div className="flex items-center gap-1">
                                <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 rounded bg-white text-gray-600 border border-gray-300 shadow-sm disabled:opacity-40 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
                                <span className="text-[12px] font-medium px-2">{currentPage} / {totalPages}</span>
                                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 rounded bg-white text-gray-600 border border-gray-300 shadow-sm disabled:opacity-40 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* KANBAN VIEW */
                    <div className="flex gap-4 overflow-x-auto pb-2 flex-1 items-start min-h-0 custom-scrollbar">
                        {kanbanColumns.map(status => {
                            const colLeads = filteredLeads.filter(l => l.estado === status);
                            return (
                                <div key={status} className="bg-[#f8f9fa] rounded-xl w-[260px] shrink-0 flex flex-col border border-gray-200/80 shadow-sm h-full max-h-full">
                                    <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-200/80 shrink-0">
                                        <div className="text-[11px] font-bold text-gray-600 tracking-wider uppercase">{status}</div>
                                        <div className="bg-white border border-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{colLeads.length}</div>
                                    </div>
                                    <div className="p-2.5 flex flex-col gap-2.5 overflow-y-auto flex-1 custom-scrollbar">
                                        {colLeads.map(lead => (
                                            <div key={lead.id_lead} onClick={() => openLeadPanel(lead)} className={`bg-white border text-left rounded-lg p-3 shadow-sm transition-all cursor-pointer group ${activePanelLead?.id_lead === lead.id_lead ? 'border-[#1a1a2e] ring-1 ring-[#1a1a2e]' : 'border-gray-200 hover:border-gray-400 hover:shadow-md'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide ${getPriorityBadge(lead.prioridad)}`}>{lead.prioridad || 'MEDIA'}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-5 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0"><div className={`h-full rounded-full ${getScoreClasses(lead.score)}`} style={{ width: `${lead.score}%` }}></div></div>
                                                        <span className="text-[10px] font-bold text-gray-500">{lead.score}</span>
                                                    </div>
                                                </div>
                                                <div className="font-semibold text-[13px] text-gray-900 mb-0.5">{lead.contacto?.nombre || 'Contacto'}</div>
                                                <div className="text-[11px] text-gray-500 mb-3 truncate">{lead.contacto?.correo || 'Sin correo'}</div>
                                                <div className="flex items-center justify-between mt-auto border-t border-gray-100/80 pt-2">
                                                    <div className="font-semibold text-[#166534] text-[12px]">${lead.valorEstimado.toLocaleString()}</div>
                                                    <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[9px] font-medium border border-gray-200">
                                                        {lead.usuario_asignado?.nombre ? lead.usuario_asignado.nombre.substring(0, 2).toUpperCase() : '?'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {colLeads.length === 0 && <div className="text-center p-6 text-[12px] text-gray-400 font-medium">Sin leads</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SPLIT VIEW LOGIC: Detailed Panel Right Sidebar */}
            {activePanelLead && (
                <div className="w-[450px] border-l border-gray-200 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)] bg-white flex flex-col shrink-0 h-full overflow-hidden animate-in slide-in-from-right-10 duration-200">
                    <div className="flex items-center justify-between p-4 px-5 border-b border-gray-200 bg-[#f8f9fa] shrink-0">
                        <div>
                            <div className="font-semibold text-[15px]">{activePanelLead.contacto?.nombre || 'Lead'}</div>
                            <div className="text-[12px] text-gray-500">{activePanelLead.contacto?.correo || 'Sin correo'} · {activePanelLead.estado}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleDeleteLead(activePanelLead.id_lead)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors" title="Eliminar lead">
                                <AlertTriangle className="w-5 h-5" />
                            </button>
                            <button onClick={() => setActivePanelLead(null)} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-5 border-b border-gray-100 shrink-0">
                        <div className="flex gap-4 items-start mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a1a2e]/10 to-[#1a1a2e]/5 text-[#1a1a2e] flex items-center justify-center text-[18px] font-bold border border-[#1a1a2e]/20 shrink-0">
                                {activePanelLead.contacto?.nombre ? activePanelLead.contacto.nombre.substring(0, 2).toUpperCase() : 'LD'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wide ${getPriorityBadge(activePanelLead.prioridad)}`}>
                                        {activePanelLead.prioridad || 'MEDIA'}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] uppercase font-bold rounded-md">
                                        Score {activePanelLead.score}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="text-[11px] text-gray-500 bg-gray-50 px-2 py-1 border border-gray-200 rounded flex items-center gap-1.5">
                                        <Users className="w-3 h-3" /> Asignado a: <span className="font-medium text-gray-800">{activePanelLead.usuario_asignado?.nombre || 'Nadie'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[11px] text-gray-400 mb-0.5">Valor est.</div>
                                <div className="text-[16px] font-bold text-[#166534]">${activePanelLead.valorEstimado.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            <button className="flex-1 px-3 py-1.5 bg-[#1a1a2e] text-white rounded-md text-[12px] font-medium flex justify-center items-center gap-1.5 hover:bg-[#16213e] transition-colors">
                                <Mail className="w-3.5 h-3.5" /> Correo
                            </button>
                            <button className="flex-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md text-[12px] font-medium flex justify-center items-center gap-1.5 hover:bg-gray-50 transition-colors">
                                <Phone className="w-3.5 h-3.5" /> Llamar
                            </button>
                            <button className="flex-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md text-[12px] font-medium flex justify-center items-center gap-1.5 hover:bg-gray-50 transition-colors">
                                <Calendar className="w-3.5 h-3.5" /> Cita
                            </button>
                        </div>
                    </div>

                    <div className="flex border-b border-gray-200 px-2 shrink-0 bg-gray-50/50">
                        {['chat', 'info', 'actividad', 'score'].map(t => (
                            <button key={t} onClick={() => setPanelTab(t)} className={`px-4 py-3 text-[12px] font-medium capitalize border-b-[2px] transition-all
                                ${panelTab === t ? 'border-[#1a1a2e] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-hidden relative bg-white">
                        {/* Tab Content - CHAT */}
                        {panelTab === 'chat' && (
                            <div className="h-full flex flex-col absolute inset-0">
                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#fcfcfc] custom-scrollbar">
                                    {chatMessages.length === 0 ? (
                                        <div className="text-center text-gray-400 text-[12px] p-6 mt-10">Sin mensajes aún.<br />Envía el primer mensaje para inciar.</div>
                                    ) : chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex flex-col gap-1 max-w-[85%] ${msg.from === 'agent' ? 'self-end items-end' : 'self-start items-start'}`}>
                                            <div className={`p-2.5 px-3.5 rounded-2xl text-[13px] leading-snug border shadow-sm ${msg.from === 'agent' ? 'bg-[#1a1a2e] text-white border-transparent rounded-br-none' : 'bg-white border-gray-200 text-gray-800 rounded-bl-none'}`}>
                                                {msg.text}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-medium px-1.5">
                                                {msg.from === 'agent' ? 'Tú' : 'Lead'} • {msg.time}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200 p-3 bg-white shrink-0">
                                    <div className="flex gap-2 mb-2 overflow-x-auto custom-scrollbar pb-1">
                                        {MOCK_SUGGESTS.map(s => <button key={s} onClick={() => setChatInput(s)} className="whitespace-nowrap px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-full text-[11px] hover:bg-blue-50 hover:text-blue-700 transition-colors">{s}</button>)}
                                    </div>
                                    <div className="flex gap-2">
                                        <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() } }}
                                            placeholder="Redactar mensaje..." className="flex-1 p-2.5 min-h-[40px] max-h-[100px] bg-gray-50 text-[13px] border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-gray-300" />
                                        <button onClick={handleChatSend} className="bg-[#1a1a2e] text-white p-2.5 rounded-lg h-min hover:bg-[#16213e]"><Send className="w-4 h-4 text-white hover:translate-x-0.5 transition-transform" /></button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content - INFO */}
                        {panelTab === 'info' && (
                            <div className="h-full overflow-y-auto p-5 custom-scrollbar text-[13px]">
                                <div className="mb-6">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Pipeline Status</h4>
                                    <div className="flex items-center w-full justify-between">
                                        {['Nuevo', 'Contactado', 'En proceso', 'Calificado'].map((st, i) => {
                                            const mapEst = { 'NUEVO': 0, 'CONTACTADO': 1, 'EN PROCESO': 2, 'CALIFICADO': 3, 'DESCARTADO': -1 };
                                            const dbKeys = ['NUEVO', 'CONTACTADO', 'EN PROCESO', 'CALIFICADO'];
                                            const v = mapEst[activePanelLead.estado] || 0;
                                            return (
                                                <div key={st} onClick={() => handleUpdateLeadStatus(activePanelLead.id_lead, dbKeys[i])} className="flex-1 flex flex-col items-center relative cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded-full z-10 border-2 bg-white transition-all ${i < v ? 'border-[#1a1a2e] bg-[#1a1a2e]' : i === v ? 'border-[#1a1a2e] ring-4 ring-[#1a1a2e]/20' : 'border-gray-300 group-hover:border-[#1a1a2e]'}`}></div>
                                                    {i < 3 && <div className={`absolute left-1/2 right-[-50%] top-[7px] h-[2px] z-0 ${i < v ? 'bg-[#1a1a2e]' : 'bg-gray-200'}`}></div>}
                                                    <span className={`text-[10px] font-medium mt-2 transition-colors ${i <= v ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>{st}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Detalles Generales</h4>
                                    <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Email</span> <span className="font-medium truncate ml-2">{activePanelLead.contacto?.correo || 'N/A'}</span></div>
                                    <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Teléfono</span> <span className="font-medium truncate ml-2">{activePanelLead.contacto?.telefono || 'N/A'}</span></div>
                                    <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Origen</span> <span className="font-medium text-blue-600 truncate ml-2">{activePanelLead.contacto?.origen || 'Orgánico / API'}</span></div>
                                    <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-500">Servicio</span> <span className="font-medium truncate ml-2">{activePanelLead.servicio_principal?.nombre || 'General'}</span></div>
                                    <div className="flex justify-between pb-2"><span className="text-gray-500">Notas</span> <span className="font-medium text-gray-700 truncate max-w-[200px] ml-2" title={activePanelLead.notas_iniciales}>{activePanelLead.notas_iniciales || 'Ninguna'}</span></div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content - ACTIVIDAD */}
                        {panelTab === 'actividad' && (
                            <div className="h-full overflow-y-auto p-5 custom-scrollbar bg-gray-50/50">
                                <div className="mb-4">
                                    <textarea id="activityInput" className="w-full border border-gray-200 rounded-lg p-3 text-[13px] focus:outline-none focus:border-gray-400 bg-white" placeholder="Escribir una nota interna..." rows="2"></textarea>
                                    <div className="flex justify-end mt-2">
                                        <button onClick={() => {
                                            const input = document.getElementById('activityInput');
                                            handleAddActivity('NOTE', input.value);
                                            input.value = '';
                                        }} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[11px] rounded font-medium transition-colors">Guardar nota</button>
                                    </div>
                                </div>
                                <div className="space-y-0.5 relative pl-3 border-l-2 border-gray-200 ml-3">
                                    {activePanelLead.actividades?.map((act) => (
                                        <div key={act.id_actividad} className="relative mb-6 last:mb-0">
                                            <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-blue-100 border-[3px] border-white focus:outline-none"></div>
                                            <div className="text-[12px] bg-white p-3 border border-gray-100 shadow-sm rounded-lg">
                                                <div className="font-medium text-gray-800 mb-1">{act.tipo === 'NOTE' ? 'Nota interna agregada' : act.tipo}</div>
                                                <div className="text-gray-600 leading-snug break-words whitespace-pre-wrap">{act.descripcion}</div>
                                                <div className="text-[10px] text-gray-400 mt-2">Agregado el {new Date(act.creada_en).toLocaleDateString('es-MX')}</div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Default history item simulating creation */}
                                    <div className="relative mb-6">
                                        <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-green-100 border-[3px] border-white"></div>
                                        <div className="text-[12px] bg-white p-3 border border-gray-100 shadow-sm rounded-lg">
                                            <div className="font-medium text-gray-800 mb-1">Lead creado en el sistema</div>
                                            <div className="text-[10px] text-gray-400">El {new Date(activePanelLead.creado_en).toLocaleString('es-MX')} por API/Webhook</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content - SCORE */}
                        {panelTab === 'score' && (
                            <div className="h-full overflow-y-auto p-5 custom-scrollbar text-[13px]">
                                <div className="flex items-center gap-5 border border-gray-200 rounded-xl p-4 shadow-sm bg-gradient-to-r from-white to-gray-50/50 mb-6">
                                    <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-xl font-bold bg-white
                                        ${activePanelLead.score >= 70 ? 'border-green-500 text-green-700' : activePanelLead.score >= 40 ? 'border-orange-500 text-orange-700' : 'border-red-500 text-red-700'}`}>
                                        {activePanelLead.score}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 text-base">{activePanelLead.score > 70 ? 'Lead muy prometedor' : 'Lead estándar'}</div>
                                        <div className="text-gray-500 text-[12px]">Top 15% de todos los leads</div>
                                    </div>
                                </div>
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Factores de Calificación</h4>
                                <div className="space-y-4">
                                    {[{ lbl: 'Presupuesto', v: 90, c: 'bg-green-500' }, { lbl: 'Tiempo de respuesta', v: 85, c: 'bg-green-500' }, { lbl: 'Completitud de info', v: 65, c: 'bg-orange-500' }].map(f => (
                                        <div key={f.lbl}>
                                            <div className="flex justify-between text-[11px] mb-1 font-medium"><span className="text-gray-600">{f.lbl}</span><span className="text-gray-900">{f.v}</span></div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${f.c}`} style={{ width: `${f.v}%` }}></div></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Crear Lead Inicial */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-4 px-5 border-b border-gray-100">
                            <h2 className="text-[15px] font-bold text-gray-900">Crear nuevo lead</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-800 rounded bg-gray-50 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-3.5">
                            <div><label className="text-[11px] font-semibold text-gray-600 uppercase">Nombre</label><input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="w-full mt-1 p-2 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:border-gray-500 bg-gray-50 focus:bg-white transition-colors" placeholder="Ej. Juan Pérez" /></div>
                            <div><label className="text-[11px] font-semibold text-gray-600 uppercase">Correo</label><input type="email" value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })} className="w-full mt-1 p-2 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:border-gray-500 bg-gray-50 focus:bg-white transition-colors" placeholder="juan@ejemplo.com" /></div>
                            <div><label className="text-[11px] font-semibold text-gray-600 uppercase">Teléfono</label><input type="tel" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className="w-full mt-1 p-2 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:border-gray-500 bg-gray-50 focus:bg-white transition-colors" placeholder="+52 ..." /></div>
                            <div>
                                <label className="text-[11px] font-semibold text-gray-600 uppercase">Prioridad Inicial</label>
                                <select value={formData.prioridad} onChange={e => setFormData({ ...formData, prioridad: e.target.value })} className="w-full mt-1 p-2 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:border-gray-500 bg-gray-50 focus:bg-white transition-colors">
                                    <option value="URGENTE">Urgente</option><option value="ALTA">Alta</option><option value="MEDIA">Media</option><option value="BAJA">Baja</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-[#f8f9fa] flex justify-end gap-2 shrink-0">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                            <button className="px-4 py-2 bg-[#1a1a2e] text-white rounded-md text-[13px] font-medium hover:bg-[#16213e] flex items-center gap-2" disabled={submitting} onClick={handleCreateLead}>
                                {submitting ? 'Guardando...' : 'Guardar Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

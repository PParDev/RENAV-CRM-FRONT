import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, MoreHorizontal, Plus, Search, Filter, Layers, Settings,
    Download, Upload, Mail, Phone, Calendar, MessageSquare, ChevronDown, Check, ChevronLeft, ChevronRight, X, LayoutGrid, List, Send,
    TrendingUp, AlertTriangle, Edit, Trash2, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';



export default function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // View state
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

    // Filters state
    const [kpiFilter, setKpiFilter] = useState('todos'); // todos, nuevo, sin_correo, con_telefono
    const [searchQuery, setSearchQuery] = useState('');
    const [fOrigen, setFOrigen] = useState('');
    const [fCiudad, setFCiudad] = useState('');

    // Selection & Bulk
    const [selectedContacts, setSelectedContacts] = useState(new Set());

    // Sort & Pagination
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Advanced Filters
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [advFilters, setAdvFilters] = useState({
        fechaDesde: '', fechaHasta: '', tieneCorreo: '', tieneTelefono: ''
    });

    // Modals & Panels
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activePanelContact, setActivePanelContact] = useState(null);
    const [panelTab, setPanelTab] = useState('info'); // info, notas

    const [formData, setFormData] = useState({ id_contacto: null, nombre: '', correo: '', telefono: '', origen: '', ciudad: '' });

    const uniqueOrigins = useMemo(() => {
        const origins = contacts.map(c => c.origen?.trim()).filter(Boolean);
        return [...new Set(origins)].sort();
    }, [contacts]);

    const uniqueCities = useMemo(() => {
        const cities = contacts.map(c => c.ciudad?.trim()).filter(Boolean);
        return [...new Set(cities)].sort();
    }, [contacts]);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/contacts?take=1000');
            if (!res.ok) throw new Error('Error fetching contacts');
            const data = await res.json();

            setContacts(data.data || data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const openContactPanel = async (contact) => {
        setActivePanelContact(contact);
        setPanelTab('info');
    };

    const handleCreateOrUpdateContact = async (e) => {
        if (e) e.preventDefault();
        try {
            if (!formData.nombre) return alert('El nombre es requerido');
            setSubmitting(true);

            const isEditing = !!formData.id_contacto;
            const url = isEditing ? `/api/contacts/${formData.id_contacto}` : '/api/contacts';
            const method = isEditing ? 'PATCH' : 'POST';

            const payload = {
                nombre: formData.nombre,
                correo: formData.correo || undefined,
                telefono: formData.telefono || undefined,
                origen: formData.origen || undefined,
                ciudad: formData.ciudad || undefined
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Error saving contact');

            await fetchContacts();

            // If the panel is open for this contact, update it
            if (activePanelContact && activePanelContact.id_contacto === formData.id_contacto) {
                const updatedContact = { ...activePanelContact, ...payload };
                setActivePanelContact(updatedContact);
            }

            setShowModal(false);
            setFormData({ id_contacto: null, nombre: '', correo: '', telefono: '', origen: '', ciudad: '' });
        } catch (err) {
            console.error(err);
            alert('Hubo un error al guardar el contacto');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteContact = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar permanentemente este contacto y sus leads asociados?')) return;
        try {
            const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete contact');
            await fetchContacts();
            if (activePanelContact?.id_contacto === id) setActivePanelContact(null);

            // Remove from selected Set if it was there
            if (selectedContacts.has(id)) {
                const newSet = new Set(selectedContacts);
                newSet.delete(id);
                setSelectedContacts(newSet);
            }
        } catch (err) {
            console.error(err);
            alert('Error al eliminar contacto');
        }
    };

    const filteredContacts = useMemo(() => {
        let result = contacts;

        // KPI Filter
        if (kpiFilter === 'nuevo') {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            result = result.filter(c => new Date(c.creado_en) >= lastWeek);
        }
        if (kpiFilter === 'sin_correo') result = result.filter(c => !c.correo);
        if (kpiFilter === 'con_telefono') result = result.filter(c => !!c.telefono);

        // Dropdowns
        if (fOrigen) result = result.filter(c => c.origen === fOrigen);
        if (fCiudad) result = result.filter(c => c.ciudad === fCiudad);

        // Advanced Filters
        if (advFilters.fechaDesde) {
            const dateD = new Date(advFilters.fechaDesde + 'T00:00:00');
            result = result.filter(c => new Date(c.creado_en) >= dateD);
        }
        if (advFilters.fechaHasta) {
            const dateH = new Date(advFilters.fechaHasta + 'T23:59:59');
            result = result.filter(c => new Date(c.creado_en) <= dateH);
        }
        if (advFilters.tieneCorreo === 'SI') result = result.filter(c => !!c.correo);
        if (advFilters.tieneCorreo === 'NO') result = result.filter(c => !c.correo);
        if (advFilters.tieneTelefono === 'SI') result = result.filter(c => !!c.telefono);
        if (advFilters.tieneTelefono === 'NO') result = result.filter(c => !c.telefono);

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.nombre?.toLowerCase().includes(q) ||
                c.correo?.toLowerCase().includes(q) ||
                c.telefono?.toLowerCase().includes(q) ||
                c.ciudad?.toLowerCase().includes(q) ||
                c.origen?.toLowerCase().includes(q) ||
                String(c.id_contacto).includes(q)
            );
        }

        // Sorting
        if (sortConfig.key) {
            result = [...result].sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (!aVal) return 1;
                if (!bVal) return -1;

                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default sort by id desc
            result = [...result].sort((a, b) => b.id_contacto - a.id_contacto);
        }

        return result;
    }, [contacts, kpiFilter, searchQuery, fOrigen, fCiudad, advFilters, sortConfig]);

    const stats = useMemo(() => {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        return {
            total: contacts.length,
            nuevos: contacts.filter(c => new Date(c.creado_en) >= lastWeek).length,
            sin_correo: contacts.filter(c => !c.correo).length,
            con_telefono: contacts.filter(c => !!c.telefono).length
        };
    }, [contacts]);

    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage) || 1;
    const paginatedContacts = useMemo(() => {
        let safePage = currentPage;
        if (safePage > totalPages) safePage = totalPages;
        const start = (safePage - 1) * itemsPerPage;
        return filteredContacts.slice(start, start + itemsPerPage);
    }, [filteredContacts, currentPage, itemsPerPage, totalPages]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            setSortConfig({ key: null, direction: 'asc' });
            return;
        }
        setSortConfig({ key, direction });
    };

    const toggleAllContacts = () => {
        if (selectedContacts.size === paginatedContacts.length && paginatedContacts.length > 0) {
            setSelectedContacts(new Set());
        } else {
            const newSet = new Set(selectedContacts);
            paginatedContacts.forEach(c => newSet.add(c.id_contacto));
            setSelectedContacts(newSet);
        }
    };

    const toggleRow = (id, e) => {
        e?.stopPropagation();
        const newSet = new Set(selectedContacts);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedContacts(newSet);
    };

    const handleExportExcel = () => {
        const d = filteredContacts.map(c => ({
            'ID': c.id_contacto,
            'Nombre': c.nombre,
            'Correo': c.correo || 'Sin correo',
            'Teléfono': c.telefono || 'Sin teléfono',
            'Origen': c.origen || 'No especificado',
            'Ciudad': c.ciudad || 'No especificada',
            'Fecha Registro': new Date(c.creado_en).toLocaleDateString()
        }));
        const ws = XLSX.utils.json_to_sheet(d);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Contactos");
        XLSX.writeFile(wb, "Contactos_CRM.xlsx");
    };



    const openEditModal = (contact, e) => {
        if (e) e.stopPropagation();
        setFormData({
            id_contacto: contact.id_contacto,
            nombre: contact.nombre,
            correo: contact.correo || '',
            telefono: contact.telefono || '',
            origen: contact.origen || '',
            ciudad: contact.ciudad || ''
        });
        setShowModal(true);
    };

    return (
        <div className="flex bg-[#fafafa] -m-6 min-h-[calc(100vh-4rem)] text-gray-900 overflow-hidden relative">
            {/* Main Content (Table / Grid + Filters) */}
            <div className={`p-6 flex-1 flex flex-col gap-6 overflow-y-auto transition-all duration-300`}>
                {/* Header Top Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">CRM › Contactos</div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">Directorio de Contactos</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportExcel} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50 flex items-center gap-1.5 shadow-sm">
                            <Download className="w-4 h-4" /> Exportar
                        </button>
                        <button onClick={() => {
                            setFormData({ id_contacto: null, nombre: '', correo: '', telefono: '', origen: '', ciudad: '' });
                            setShowModal(true);
                        }} className="px-4 py-2 bg-[#1a1a2e] text-white text-sm font-medium rounded-md hover:bg-[#282846] transition-colors shadow-sm flex items-center gap-1.5">
                            <Plus className="w-4 h-4" /> Nuevo Contacto
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${kpiFilter === 'todos' ? 'border-[#1a1a2e] bg-[#f8f9fa]' : 'border-transparent bg-white shadow-sm hover:border-gray-200'}`} onClick={() => setKpiFilter('todos')}>
                        <div className="text-sm text-gray-500 mb-2">Total Contactos</div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
                        <div className="text-xs text-gray-500 font-medium">En base de datos</div>
                    </div>
                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${kpiFilter === 'nuevo' ? 'border-[#1a1a2e] bg-[#f8f9fa]' : 'border-transparent bg-white shadow-sm hover:border-gray-200'}`} onClick={() => setKpiFilter('nuevo')}>
                        <div className="text-sm text-gray-500 mb-2">Nuevos (7 días)</div>
                        <div className="text-3xl font-bold text-[#16a34a] mb-1">{stats.nuevos}</div>
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <TrendingUp className="w-3.5 h-3.5" /> Registros recientes
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${kpiFilter === 'sin_correo' ? 'border-[#1a1a2e] bg-[#f8f9fa]' : 'border-transparent bg-white shadow-sm hover:border-gray-200'}`} onClick={() => setKpiFilter('sin_correo')}>
                        <div className="text-sm text-gray-500 mb-2">Sin Correo</div>
                        <div className="text-3xl font-bold text-[#d97706] mb-1">{stats.sin_correo}</div>
                        <div className="text-xs text-[#d97706] font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Faltan datos clave
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${kpiFilter === 'con_telefono' ? 'border-[#1a1a2e] bg-[#f8f9fa]' : 'border-transparent bg-white shadow-sm hover:border-gray-200'}`} onClick={() => setKpiFilter('con_telefono')}>
                        <div className="text-sm text-gray-500 mb-2">Con Teléfono</div>
                        <div className="text-3xl font-bold text-[#4f46e5] mb-1">{stats.con_telefono}</div>
                        <div className="flex items-center gap-1 text-xs text-[#4f46e5] font-medium">
                            <Phone className="w-3.5 h-3.5" /> Listos para contactar
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
                                    placeholder="Buscar por nombre, correo o ciudad..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#1a1a2e] focus:border-[#1a1a2e] shadow-sm"
                                />
                            </div>
                            <select className="py-2 px-3 border border-gray-200 rounded-lg text-[13px] bg-white shadow-sm" value={fOrigen} onChange={e => setFOrigen(e.target.value)}>
                                <option value="">Cualquier origen</option>
                                {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <select className="py-2 px-3 border border-gray-200 rounded-lg text-[13px] bg-white shadow-sm" value={fCiudad} onChange={e => setFCiudad(e.target.value)}>
                                <option value="">Cualquier ciudad</option>
                                {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`px-3 py-2 border rounded-lg text-[13px] flex items-center gap-2 shadow-sm transition-colors ${showAdvancedFilters ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                <Filter className="w-4 h-4" /> Más Filtros
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            {selectedContacts.size > 0 && (
                                <button onClick={() => {
                                    if (window.confirm(`¿Eliminar ${selectedContacts.size} contactos seleccionados?`)) {
                                        Array.from(selectedContacts).forEach(handleDeleteContact);
                                    }
                                }} className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-[13px] flex items-center gap-2 shadow-sm font-medium">
                                    <Trash2 className="w-4 h-4" /> Eliminar Selección
                                </button>
                            )}
                            <span className="text-[13px] text-gray-500 hidden sm:inline-block">Mostrando {filteredContacts.length} res.</span>
                            <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white">
                                <button onClick={() => setViewMode('table')} className={`p-1.5 px-3 transition-colors text-[13px] font-medium flex gap-2 items-center ${viewMode === 'table' ? 'bg-gray-100 text-gray-900 border-b-2 border-[#1a1a2e]' : 'text-gray-500 hover:bg-gray-50 border-b-2 border-transparent'}`}>
                                    <List className="w-4 h-4" /> Tabla
                                </button>
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 px-3 border-l border-gray-200 transition-colors text-[13px] font-medium flex gap-2 items-center ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900 border-b-2 border-[#1a1a2e]' : 'text-gray-500 hover:bg-gray-50 border-b-2 border-transparent'}`}>
                                    <LayoutGrid className="w-4 h-4" /> Cuadrícula
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showAdvancedFilters && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-in slide-in-from-top-2">
                            <h3 className="text-[13px] font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Filtros Avanzados</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase mb-1.5">Fecha Desde</label>
                                    <input type="date" className="w-full text-[13px] border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1a1a2e]" value={advFilters.fechaDesde} onChange={e => setAdvFilters({ ...advFilters, fechaDesde: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase mb-1.5">Fecha Hasta</label>
                                    <input type="date" className="w-full text-[13px] border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1a1a2e]" value={advFilters.fechaHasta} onChange={e => setAdvFilters({ ...advFilters, fechaHasta: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase mb-1.5">¿Tiene Correo?</label>
                                    <select className="w-full text-[13px] border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1a1a2e]" value={advFilters.tieneCorreo} onChange={e => setAdvFilters({ ...advFilters, tieneCorreo: e.target.value })}>
                                        <option value="">Ambos</option>
                                        <option value="SI">Sí, registrados</option>
                                        <option value="NO">No registrados</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase mb-1.5">¿Tiene Teléfono?</label>
                                    <select className="w-full text-[13px] border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1a1a2e]" value={advFilters.tieneTelefono} onChange={e => setAdvFilters({ ...advFilters, tieneTelefono: e.target.value })}>
                                        <option value="">Ambos</option>
                                        <option value="SI">Sí, registrados</option>
                                        <option value="NO">No registrados</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100 gap-2">
                                <button onClick={() => setAdvFilters({ fechaDesde: '', fechaHasta: '', tieneCorreo: '', tieneTelefono: '' })} className="px-4 py-2 text-[12px] text-gray-500 hover:text-gray-800 font-medium">Limpiar Todo</button>
                                <button onClick={() => setShowAdvancedFilters(false)} className="px-4 py-2 text-[12px] bg-[#1a1a2e] text-white rounded-lg hover:bg-[#282846] font-medium">Aplicar Filtros</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1a2e]"></div>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-red-100">
                        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Error al cargar</h3>
                        <p className="text-gray-500 text-[13px]">{error}</p>
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[15px] font-bold text-gray-900 mb-1">No hay contactos</h3>
                        <p className="text-gray-500 text-[13px] max-w-sm mb-4">No se encontraron contactos que coincidan con los filtros actuales.</p>
                        <button onClick={() => {
                            setSearchQuery(''); setFOrigen(''); setFCiudad(''); setKpiFilter('todos');
                            setAdvFilters({ fechaDesde: '', fechaHasta: '', tieneCorreo: '', tieneTelefono: '' });
                        }} className="text-[13px] font-medium text-blue-600 hover:text-blue-700">Limpiar todos los filtros</button>
                    </div>
                ) : (
                    <>
                        {/* Table View */}
                        {viewMode === 'table' && (
                            <div className="bg-white border flex-1 border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="overflow-x-auto flex-1 custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#f8f9fa] border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
                                                <th className="px-4 py-3 font-bold w-12 text-center">
                                                    <input type="checkbox" checked={selectedContacts.size === paginatedContacts.length && paginatedContacts.length > 0} onChange={toggleAllContacts} className="rounded border-gray-300 text-[#1a1a2e] focus:ring-[#1a1a2e] w-4 h-4 align-middle" />
                                                </th>
                                                <th className="px-5 py-3 font-bold cursor-pointer hover:bg-gray-100 transition-colors min-w-[220px]" onClick={() => handleSort('nombre')}>
                                                    <div className="flex items-center gap-1.5">CONTACTO {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? <ChevronDown className="w-3 h-3 rotate-180" /> : <ChevronDown className="w-3 h-3" />)}</div>
                                                </th>

                                                <th className="px-5 py-3 font-bold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('correo')}>
                                                    <div className="flex items-center gap-1.5">CORREO {sortConfig.key === 'correo' && (sortConfig.direction === 'asc' ? <ChevronDown className="w-3 h-3 rotate-180" /> : <ChevronDown className="w-3 h-3" />)}</div>
                                                </th>
                                                <th className="px-5 py-3 font-bold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('telefono')}>
                                                    <div className="flex items-center gap-1.5">TELÉFONO {sortConfig.key === 'telefono' && (sortConfig.direction === 'asc' ? <ChevronDown className="w-3 h-3 rotate-180" /> : <ChevronDown className="w-3 h-3" />)}</div>
                                                </th>
                                                <th className="px-5 py-3 font-bold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('origen')}>
                                                    <div className="flex items-center gap-1.5">ORIGEN {sortConfig.key === 'origen' && (sortConfig.direction === 'asc' ? <ChevronDown className="w-3 h-3 rotate-180" /> : <ChevronDown className="w-3 h-3" />)}</div>
                                                </th>
                                                <th className="px-5 py-3 font-bold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('ciudad')}>
                                                    <div className="flex items-center gap-1.5">CIUDAD {sortConfig.key === 'ciudad' && (sortConfig.direction === 'asc' ? <ChevronDown className="w-3 h-3 rotate-180" /> : <ChevronDown className="w-3 h-3" />)}</div>
                                                </th>
                                                <th className="px-5 py-3 font-bold text-center w-32">ACCIONES</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedContacts.map(c => {
                                                const isSelected = selectedContacts.has(c.id_contacto);
                                                const isActive = activePanelContact?.id_contacto === c.id_contacto;

                                                return (
                                                    <tr key={c.id_contacto} onClick={() => openContactPanel(c)} className={`hover:bg-[#f8f9fc] transition-colors cursor-pointer group ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50/80' : ''} ${isActive ? 'bg-[#f0f4ff] border-l-2 border-l-[#1a1a2e]' : 'border-l-2 border-l-transparent'}`}>
                                                        <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                                            <input type="checkbox" checked={isSelected} onChange={(e) => toggleRow(c.id_contacto, e)} className="rounded border-gray-300 text-[#1a1a2e] focus:ring-[#1a1a2e] w-4 h-4 align-middle" />
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#282846] text-white flex items-center justify-center font-bold text-[13px] shadow-sm shrink-0">
                                                                    {c.nombre?.substring(0, 2).toUpperCase() || 'CX'}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="text-[13px] font-bold text-gray-900 truncate">{c.nombre}</div>
                                                                    <div className="text-[11px] text-gray-500 mt-0.5 truncate">#{c.id_contacto}</div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-3.5">
                                                            {c.correo ? (
                                                                <a href={`mailto:${c.correo}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-[#1a1a2e] truncate max-w-[200px]">
                                                                    <Mail className="w-3 h-3 text-gray-400" /> {c.correo}
                                                                </a>
                                                            ) : <span className="text-[11px] text-gray-400 italic">Sin correo</span>}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            {c.telefono ? (
                                                                <a href={`tel:${c.telefono}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-[#1a1a2e] truncate max-w-[200px]">
                                                                    <Phone className="w-3 h-3 text-gray-400" /> {c.telefono}
                                                                </a>
                                                            ) : <span className="text-[11px] text-gray-400 italic">Sin teléfono</span>}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            {c.origen ? (
                                                                <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-700 uppercase tracking-wide border border-gray-200">{c.origen}</span>
                                                            ) : <span className="text-gray-400 text-[12px]">-</span>}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-[12px] text-gray-600 font-medium">
                                                            {c.ciudad ? (
                                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {c.ciudad}</span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-center">
                                                            <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {c.correo && (
                                                                    <button onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${c.correo}`; }} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 transition-colors bg-white shadow-sm" title="Enviar correo">
                                                                        <Mail className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                                {c.telefono && (
                                                                    <button onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${c.telefono}`; }} className="p-1.5 hover:bg-green-50 rounded-md text-gray-400 hover:text-green-600 border border-transparent hover:border-green-200 transition-colors bg-white shadow-sm" title="Llamar">
                                                                        <Phone className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Table */}
                                <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-white shrink-0">
                                    <div className="text-[12px] text-gray-500">
                                        Mostrando <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredContacts.length)}</span> de {filteredContacts.length}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="text-[12px] border border-gray-200 rounded p-1 text-gray-600 bg-gray-50 focus:outline-none">
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                        </select>
                                        <div className="flex gap-1 ml-2">
                                            <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                            <button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grid View */}
                        {viewMode === 'grid' && (
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4 custom-scrollbar">
                                    {paginatedContacts.map(c => {
                                        const isActive = activePanelContact?.id_contacto === c.id_contacto;
                                        return (
                                            <div key={c.id_contacto} onClick={() => openContactPanel(c)} className={`bg-white border rounded-xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col gap-4 relative group hover:border-[#1a1a2e]/30 ${isActive ? 'ring-2 ring-[#1a1a2e] border-transparent shadow-md' : 'border-gray-200 shadow-sm'}`}>
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#282846] text-white flex items-center justify-center font-bold text-[14px] shadow-sm shrink-0">
                                                        {c.nombre?.substring(0, 2).toUpperCase() || 'CX'}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                        <h3 className="font-bold text-[14px] text-gray-900 truncate" title={c.nombre}>{c.nombre}</h3>
                                                        <p className="text-[11px] text-gray-500">#{c.id_contacto}</p>
                                                    </div>
                                                    <button onClick={(e) => openEditModal(c, e)} className="p-1.5 text-gray-400 hover:text-[#1a1a2e] hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 absolute top-4 right-4">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-center gap-2 text-[12px] text-gray-600">
                                                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span className="truncate">{c.correo || <i className="text-gray-400">Sin correo</i>}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[12px] text-gray-600">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span className="truncate">{c.telefono || <i className="text-gray-400">Sin teléfono</i>}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[12px] text-gray-600">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span className="truncate">{c.ciudad || <i className="text-gray-400">Sin ciudad</i>}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                                                    {c.origen ? (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-bold rounded uppercase truncate max-w-[120px]">{c.origen}</span>
                                                    ) : <span></span>}
                                                    <span className="text-gray-400">{new Date(c.creado_en).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Pagination Grid */}
                                <div className="mt-4 border border-gray-100 px-5 py-3 flex items-center justify-between bg-white rounded-xl shadow-sm shrink-0">
                                    <div className="text-[12px] text-gray-500">
                                        Pág. {currentPage} de {totalPages}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                        <button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Side Panel Document Overlay */}
            {activePanelContact && (
                <div className="w-[400px] bg-white border-l border-gray-200 shadow-2xl flex flex-col absolute right-0 top-0 bottom-0 z-40 transform transition-transform duration-300 ease-out translate-x-0 overflow-hidden">
                    {/* Panel Header */}
                    <div className="p-5 border-b border-gray-200 bg-[#fbfbfc] shrink-0">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#282846] text-white flex items-center justify-center font-bold text-[18px] shadow-sm shrink-0">
                                    {activePanelContact.nombre?.substring(0, 2).toUpperCase() || 'CX'}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[16px] font-bold text-gray-900 truncate leading-tight">{activePanelContact.nombre}</h2>
                                    <div className="text-[12px] text-gray-500 mt-0.5">ID: {activePanelContact.id_contacto}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={(e) => openEditModal(activePanelContact, e)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors" title="Editar">
                                <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteContact(activePanelContact.id_contacto)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="w-px h-5 bg-gray-300 mx-1"></div>
                            <button onClick={() => setActivePanelContact(null)} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors bg-white border border-gray-200 shadow-sm" title="Cerrar panel">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex border-b border-gray-200 shrink-0 bg-white px-2">
                        <button onClick={() => setPanelTab('info')} className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${panelTab === 'info' ? 'border-[#1a1a2e] text-[#1a1a2e]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Información</button>
                        <button onClick={() => setPanelTab('notas')} className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${panelTab === 'notas' ? 'border-[#1a1a2e] text-[#1a1a2e]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Notas / Bitácora</button>
                    </div>

                    <div className="p-5 overflow-y-auto flex-1 custom-scrollbar bg-white">
                        {panelTab === 'info' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => { if (activePanelContact.correo) window.location.href = `mailto:${activePanelContact.correo}` }} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Mail className="w-4 h-4" /></div>
                                        <span className="text-[12px] font-medium text-gray-700">Enviar Correo</span>
                                    </button>
                                    <button onClick={() => { if (activePanelContact.telefono) window.location.href = `tel:${activePanelContact.telefono}` }} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm gap-2">
                                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><Phone className="w-4 h-4" /></div>
                                        <span className="text-[12px] font-medium text-gray-700">Llamar</span>
                                    </button>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div>
                                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Datos de Contacto</h4>
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] text-gray-500 font-medium">Correo Electrónico</span>
                                                <span className="text-[13px] font-medium text-gray-900">{activePanelContact.correo || 'No especificado'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] text-gray-500 font-medium">Teléfono</span>
                                                <span className="text-[13px] font-medium text-gray-900">{activePanelContact.telefono || 'No especificado'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] text-gray-500 font-medium">Ubicación (Ciudad)</span>
                                                <span className="text-[13px] font-medium text-gray-900">{activePanelContact.ciudad || 'No especificado'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Detalles de Registro</h4>
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] text-gray-500 font-medium">Origen de captación</span>
                                                <span className="text-[13px] font-medium text-gray-900">{activePanelContact.origen || 'No especificado'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] text-gray-500 font-medium">Fecha de registro</span>
                                                <span className="text-[13px] font-medium text-gray-900">{new Date(activePanelContact.creado_en).toLocaleDateString('es-MX')}</span>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {panelTab === 'notas' && (
                            <div className="flex flex-col h-full animate-in fade-in duration-200">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[12px] text-blue-800 mb-4 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                                    <span>Para gestionar negociaciones o notas ligadas a servicios, ingresa desde el módulo de Leads / Oportunidades. Aquí verás pronto historial general.</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-xl opacity-70">
                                    <Calendar className="w-8 h-8 text-gray-300 mb-3" />
                                    <div className="text-[13px] font-semibold text-gray-600">Historial no disponible</div>
                                    <div className="text-[11px] text-gray-400 mt-1 max-w-[200px]">Próximamente podrás agregar recordatorios directos al contacto general.</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Crear / Editar Contacto */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1a2e]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#f8f9fa] shrink-0">
                            <h2 className="text-[16px] font-bold text-gray-900">{formData.id_contacto ? 'Editar Contacto' : 'Crear Nuevo Contacto'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar bg-white">
                            <form id="contactModalForm" onSubmit={handleCreateOrUpdateContact} className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-bold text-gray-700 uppercase mb-1">Nombre Completo *</label>
                                    <input required type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a2e] focus:ring-1 focus:ring-[#1a1a2e] text-[13px]" placeholder="Ej. Juan Pérez" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[12px] font-bold text-gray-700 uppercase mb-1">Correo Electrónico</label>
                                        <input type="email" value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a2e] text-[13px]" placeholder="correo@ejemplo.com" />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-bold text-gray-700 uppercase mb-1">Teléfono</label>
                                        <input type="tel" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a2e] text-[13px]" placeholder="+52 ..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[12px] font-bold text-gray-700 uppercase mb-1">Origen / Campaña</label>
                                        <input type="text" value={formData.origen} onChange={e => setFormData({ ...formData, origen: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a2e] text-[13px]" placeholder="Ej. Facebook Ads" />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-bold text-gray-700 uppercase mb-1">Ciudad</label>
                                        <input type="text" value={formData.ciudad} onChange={e => setFormData({ ...formData, ciudad: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a2e] text-[13px]" placeholder="Ej. CDMX" />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-[#f8f9fa] flex justify-end gap-3 shrink-0">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[13px] font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                                Cancelar
                            </button>
                            <button form="contactModalForm" type="submit" disabled={submitting} className="px-4 py-2 text-[13px] font-medium text-white bg-[#1a1a2e] hover:bg-[#282846] rounded-lg disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2">
                                {submitting ? 'Guardando...' : 'Guardar Contacto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

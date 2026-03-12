import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, MoreHorizontal, Plus, Search, Filter, Layers, Settings,
    Download, Mail, Phone, Calendar, MessageSquare, ChevronDown, Check, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Columns
    const [visibleColumns, setVisibleColumns] = useState({
        name: true,
        actions: true,
        email: true,
        phone: true,
        origin: true,
        city: true,
        date: true
    });
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    // Form Modal
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        telefono: '',
        origen: '',
        ciudad: ''
    });

    const fetchContacts = async () => {
        try {
            setLoading(true);
            setError(null);
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

    const handleExportExcel = () => {
        const dataToExport = filteredContacts.map(c => ({
            'ID Contacto': c.id_contacto,
            'Nombre': c.nombre,
            'Correo': c.correo || 'Sin correo',
            'Teléfono': c.telefono || 'Sin teléfono',
            'Origen': c.origen || 'No especificado',
            'Ciudad': c.ciudad || 'No especificada',
            'Fecha de Creación': new Date(c.creado_en).toLocaleString()
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "ContactsExport");
        XLSX.writeFile(workbook, "RENAV_Contacts_Export.xlsx");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    correo: formData.correo || undefined,
                    telefono: formData.telefono || undefined,
                    origen: formData.origen || undefined,
                    ciudad: formData.ciudad || undefined,
                })
            });
            if (!res.ok) throw new Error('Error al crear el contacto');
            
            setShowModal(false);
            setFormData({ nombre: '', correo: '', telefono: '', origen: '', ciudad: '' });
            await fetchContacts();
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
        { id: 'all', label: 'Todos los contactos' },
        { id: 'recent', label: 'Agregados recientemente' },
        { id: 'has_leads', label: 'Con negociaciones activas' },
    ];

    const filteredContacts = useMemo(() => {
        let result = contacts;
        
        if (activeTab === 'recent') {
            result = [...result].sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.nombre?.toLowerCase().includes(query) ||
                c.correo?.toLowerCase().includes(query) ||
                c.telefono?.toLowerCase().includes(query) ||
                c.ciudad?.toLowerCase().includes(query) ||
                String(c.id_contacto).includes(query)
            );
        }

        return result;
    }, [contacts, activeTab, searchQuery]);

    // Calcular la paginación
    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage) || 1;
    const paginatedContacts = useMemo(() => {
        let safePage = currentPage;
        if (safePage > totalPages) safePage = totalPages;
        const start = (safePage - 1) * itemsPerPage;
        return filteredContacts.slice(start, start + itemsPerPage);
    }, [filteredContacts, currentPage, itemsPerPage, totalPages]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

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
                        {filteredContacts.length} {filteredContacts.length === 1 ? 'contacto' : 'contactos'}
                        {searchQuery && <span className="text-gray-400 text-lg font-normal ml-2">coincidiendo con "{searchQuery}"</span>}
                    </h1>
                </div>

                {/* Top Action Bar */}
                <div className="px-6 pb-4 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 relative">
                    <div className="flex items-center gap-2 relative">
                        {/* Table Customization Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowColumnMenu(!showColumnMenu)}
                                className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-gray-50 transition-colors"
                            >
                                <Settings className="w-4 h-4 text-gray-400" /> Personalizar tabla
                            </button>
                            {showColumnMenu && (
                                <div className="absolute top-10 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-30 p-2">
                                    <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Columnas Visibles</div>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.name} onChange={() => toggleColumn('name')} /> Nombre Integrado
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.actions} onChange={() => toggleColumn('actions')} /> Acciones
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.email} onChange={() => toggleColumn('email')} /> Correo
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.phone} onChange={() => toggleColumn('phone')} /> Teléfono
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.origin} onChange={() => toggleColumn('origin')} /> Origen
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.city} onChange={() => toggleColumn('city')} /> Ciudad
                                    </label>
                                    <label className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.date} onChange={() => toggleColumn('date')} /> Fecha de Registro
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
                                className="flex items-center gap-2 px-4 py-1.5 bg-[#000000] text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Nuevo Contacto
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
                            placeholder="Buscar contacto por nombre, teléfono..."
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
                        contactos
                    </div>
                </div>

                {/* Table Area */}
                <div onClick={() => setShowColumnMenu(false)} className="flex-1 overflow-auto bg-white custom-scrollbar w-full relative border-t border-gray-100">
                    <table className="w-full text-left whitespace-nowrap min-w-max">
                        <thead className="sticky top-0 bg-white z-10 shadow-sm border-b border-gray-100">
                            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                <th className="px-4 py-4 w-12 text-center">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-[#0A1128] cursor-pointer focus:ring-[#0A1128]" />
                                </th>
                                {visibleColumns.name && <th className="px-4 py-4 w-64">Nombre del Contacto</th>}
                                {visibleColumns.actions && <th className="px-4 py-4 w-32 text-center">Acciones</th>}
                                {visibleColumns.email && <th className="px-4 py-4 w-48">Correo</th>}
                                {visibleColumns.phone && <th className="px-4 py-4 w-40">Teléfono</th>}
                                {visibleColumns.origin && <th className="px-4 py-4 w-40">Origen</th>}
                                {visibleColumns.city && <th className="px-4 py-4 w-40">Ciudad</th>}
                                {visibleColumns.date && <th className="px-4 py-4 w-40">Fecha Registro</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/70 text-sm">
                            {error && (
                                <tr><td colSpan="10" className="p-4 text-center text-red-600 bg-red-50">{error}</td></tr>
                            )}
                            {loading && contacts.length === 0 && (
                                <tr><td colSpan="10" className="p-8 text-center text-gray-400">Cargando contactos...</td></tr>
                            )}
                            {!loading && paginatedContacts.length === 0 && !error && (
                                <tr>
                                    <td colSpan="10" className="p-16 text-center text-gray-500">
                                        <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                                        <p className="font-medium">No se encontraron contactos</p>
                                    </td>
                                </tr>
                            )}
                            {paginatedContacts.map((contact, idx) => (
                                <tr
                                    key={contact.id_contacto || idx}
                                    className={'group transition-all hover:bg-[#0A1128]/5 cursor-pointer'}
                                >
                                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-[#0A1128] cursor-pointer focus:ring-[#0A1128]" />
                                    </td>
                                    {visibleColumns.name && (
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(contact.nombre)}&background=F3F4F6&color=111827`}
                                                    alt="avatar"
                                                    className="w-8 h-8 rounded-full border border-gray-200"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">
                                                        {contact.nombre}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400">ID: {contact.id_contacto}</span>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.actions && (
                                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                {contact.correo ? (
                                                    <a
                                                        href={`mailto:${contact.correo}`}
                                                        title="Enviar correo"
                                                        className="p-1.5 flex items-center justify-center border border-gray-200 rounded-full hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37] transition-all"
                                                    >
                                                        <Mail className="w-3.5 h-3.5" />
                                                    </a>
                                                ) : <span className="p-1.5 inline-block w-[30px] rounded-full"></span>}

                                                {contact.telefono ? (
                                                    <a
                                                        href={`tel:${contact.telefono}`}
                                                        title="Llamar"
                                                        className="p-1.5 flex items-center justify-center border border-gray-200 rounded-full hover:bg-black hover:text-white hover:border-black transition-all"
                                                    >
                                                        <Phone className="w-3.5 h-3.5" />
                                                    </a>
                                                ) : <span className="p-1.5 inline-block w-[30px] rounded-full"></span>}
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.email && (
                                        <td className="px-4 py-4 text-gray-600">
                                            {contact.correo ? contact.correo : <span className="text-gray-400 italic text-xs">Sin correo</span>}
                                        </td>
                                    )}
                                    {visibleColumns.phone && (
                                        <td className="px-4 py-4 text-gray-600 font-medium">
                                            {contact.telefono ? contact.telefono : <span className="text-gray-400 font-normal italic text-xs">Sin teléfono</span>}
                                        </td>
                                    )}
                                    {visibleColumns.origin && (
                                        <td className="px-4 py-4">
                                            {contact.origen ? (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-md border border-gray-200">
                                                    {contact.origen}
                                                </span>
                                            ) : <span className="text-gray-400 italic text-xs">-</span>}
                                        </td>
                                    )}
                                    {visibleColumns.city && (
                                        <td className="px-4 py-4 text-gray-600">
                                            {contact.ciudad ? contact.ciudad : <span className="text-gray-400 italic text-xs">-</span>}
                                        </td>
                                    )}
                                    {visibleColumns.date && (
                                        <td className="px-4 py-4 text-gray-500 text-[12.5px]">
                                            {new Date(contact.creado_en).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-white flex-shrink-0">
                    <span className="text-sm text-gray-500 flex items-center font-medium">
                        {filteredContacts.length === 0
                            ? '0 resultados mostrados'
                            : `Mostrando ${((currentPage - 1) * itemsPerPage) + 1} al ${Math.min(currentPage * itemsPerPage, filteredContacts.length)} de ${filteredContacts.length} contactos`
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

            {/* Modal para Crear Contacto */}
            {
                showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1128]/60 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-900">Registrar Nuevo Contacto Libre</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar bg-white">
                                <p className="text-sm text-gray-500 mb-6">
                                    Crea un contacto directamente en la libreta. Podrás ligarle múltiples leads (negociaciones) de distintos servicios después.
                                </p>
                                <form onSubmit={handleSubmit} id="contactForm" className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                                        <input required name="nombre" value={formData.nombre} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" placeholder="Ej. Ana Martínez" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                            <input name="correo" value={formData.correo} onChange={handleInputChange} type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37]" placeholder="ana@ejemplo.com" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                            <input name="telefono" value={formData.telefono} onChange={handleInputChange} type="tel" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37]" placeholder="+52 ..." />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Origen / Medio</label>
                                            <input name="origen" value={formData.origen} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37]" placeholder="Ej. Feria inmobiliaria" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                                            <input name="ciudad" value={formData.ciudad} onChange={handleInputChange} type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#D4AF37]" placeholder="Ej. Guadalajara" />
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button type="submit" form="contactForm" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors">
                                    {submitting ? 'Guardando...' : 'Guardar Contacto'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

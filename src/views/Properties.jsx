import React, { useState, useEffect, useMemo } from 'react';
import {
    Home, Search, Plus, Download, LayoutGrid, List,
    Building2, MapPin, X, Check, ChevronLeft, ChevronRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusBadge = (nombre) => {
    const n = (nombre || '').toUpperCase();
    if (n.includes('DISPONIBLE')) return 'bg-emerald-100 text-emerald-700';
    if (n.includes('VENDID'))     return 'bg-sky-100 text-sky-700';
    if (n.includes('APARTAD'))    return 'bg-amber-100 text-amber-700';
    if (n.includes('RESERVAD'))   return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-500';
};

const formatCurrency = (amount, currency = 'MXN') => {
    if (!amount) return '—';
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency || 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// ─── Gradient palettes for image placeholder (assigned by id) ────────────────

const CARD_GRADIENTS = [
    'from-slate-700 to-slate-900',
    'from-blue-800 to-indigo-900',
    'from-stone-600 to-stone-800',
    'from-zinc-700 to-zinc-900',
    'from-neutral-700 to-neutral-900',
    'from-sky-800 to-blue-900',
];

// ─── Property Card (Grid view) ────────────────────────────────────────────────

function PropertyCard({ unit, isSelected, onSelect, onOpen }) {
    const [imgError, setImgError] = useState(false);
    const statusName = unit.estado_unidad?.nombre || '';
    const gradient   = CARD_GRADIENTS[unit.id_unidad % CARD_GRADIENTS.length];
    const hasImage   = unit.imagen_url && !imgError;

    return (
        <div
            onClick={() => onOpen(unit)}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
        >
            {/* ── Image / Placeholder ── */}
            <div className="relative h-44 w-full overflow-hidden">
                {hasImage ? (
                    <img
                        src={unit.imagen_url}
                        alt={unit.codigo_unidad || 'Propiedad'}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
                        <Home className="w-10 h-10 text-white/20" />
                        <span className="text-white/30 text-[10px] uppercase tracking-widest font-medium">
                            {unit.tipo_inmueble?.nombre || 'Propiedad'}
                        </span>
                    </div>
                )}

                {/* Overlay: checkbox (top-left) + badge (top-right) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                <div
                    onClick={e => { e.stopPropagation(); onSelect(unit.id_unidad); }}
                    className={`absolute top-2.5 left-2.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors pointer-events-auto shadow
                        ${isSelected ? 'bg-white border-white' : 'border-white/70 bg-black/20 backdrop-blur-sm'}`}
                >
                    {isSelected && <Check className="w-3 h-3 text-[#1a1a2e]" />}
                </div>

                <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${getStatusBadge(statusName)}`}>
                    {statusName || 'Sin estado'}
                </span>
            </div>

            {/* ── Body ── */}
            <div className="p-3">
                <div className="font-semibold text-gray-900 text-sm truncate mb-0.5">
                    {unit.codigo_unidad || `Unidad #${unit.id_unidad}`}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <Building2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{unit.desarrollo?.nombre || '—'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-gray-400 mb-0.5">Tipo</div>
                        <div className="font-medium text-gray-700 truncate">{unit.tipo_inmueble?.nombre || '—'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-gray-400 mb-0.5">m² Const.</div>
                        <div className="font-medium text-gray-700">
                            {unit.m2_construccion ? `${unit.m2_construccion} m²` : '—'}
                        </div>
                    </div>
                </div>

                <div className="pt-2.5 border-t border-gray-100">
                    <div className="text-[10px] text-gray-400 mb-0.5">Precio lista</div>
                    <div className="font-bold text-emerald-700 text-sm">
                        {formatCurrency(unit.precios_lista, unit.moneda)}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Form initial state ───────────────────────────────────────────────────────

const EMPTY_FORM = {
    id_desarrollo: '',
    codigo_unidad: '',
    id_tipo_inmueble: '',
    id_tipo_propiedad: '',
    id_estado_unidad: '',
    descripcion: '',
    direccion: '',
    m2_terreno: '',
    m2_construccion: '',
    moneda: 'MXN',
    precios_lista: '',
    fecha_obtencion: '',
    fecha_terminacion: '',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Properties() {
    // ── Data ──────────────────────────────────────────────────────────────────
    const [units, setUnits]               = useState([]);
    const [developments, setDevelopments] = useState([]);
    const [tiposInmueble, setTiposInmueble]   = useState([]);
    const [estadosUnidad, setEstadosUnidad]   = useState([]);
    const [tiposPropiedad, setTiposPropiedad] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    // ── UI ────────────────────────────────────────────────────────────────────
    const [viewMode, setViewMode]       = useState('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [fDesarrollo, setFDesarrollo] = useState('');
    const [fEstado, setFEstado]         = useState('');
    const [fTipo, setFTipo]             = useState('');

    const [selectedUnits, setSelectedUnits] = useState(new Set());
    const [sortConfig, setSortConfig]       = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage]     = useState(1);
    const ITEMS_PER_PAGE = 12;

    const [activePanel, setActivePanel] = useState(null);

    // ── Modal ─────────────────────────────────────────────────────────────────
    const [showModal, setShowModal]   = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData]     = useState(EMPTY_FORM);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const [uRes, dRes, tiRes, esRes, tpRes] = await Promise.all([
                fetch('/api/inventory/units?take=500'),
                fetch('/api/inventory/developments?take=500'),
                fetch('/api/catalogs/tipos-inmueble'),
                fetch('/api/catalogs/estados-unidad'),
                fetch('/api/catalogs/tipos-propiedad'),
            ]);
            const [uData, dData, tiData, esData, tpData] = await Promise.all([
                uRes.json(), dRes.json(), tiRes.json(), esRes.json(), tpRes.json(),
            ]);
            setUnits(uData.data || uData);
            setDevelopments(dData.data || dData);
            setTiposInmueble(tiData);
            setEstadosUnidad(esData);
            setTiposPropiedad(tpData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const kpis = useMemo(() => {
        const total       = units.length;
        const disponibles = units.filter(u => (u.estado_unidad?.nombre || '').toUpperCase().includes('DISPONIBLE')).length;
        const vendidas    = units.filter(u => (u.estado_unidad?.nombre || '').toUpperCase().includes('VENDID')).length;
        const apartadas   = units.filter(u => (u.estado_unidad?.nombre || '').toUpperCase().includes('APARTAD')).length;
        return { total, disponibles, vendidas, apartadas };
    }, [units]);

    // ── Filtered + Sorted ─────────────────────────────────────────────────────
    const filteredUnits = useMemo(() => {
        let data = [...units];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(u =>
                (u.codigo_unidad || '').toLowerCase().includes(q) ||
                (u.descripcion   || '').toLowerCase().includes(q) ||
                (u.direccion     || '').toLowerCase().includes(q) ||
                (u.desarrollo?.nombre || '').toLowerCase().includes(q)
            );
        }

        if (fDesarrollo) data = data.filter(u => String(u.id_desarrollo)    === fDesarrollo);
        if (fEstado)     data = data.filter(u => String(u.id_estado_unidad) === fEstado);
        if (fTipo)       data = data.filter(u => String(u.id_tipo_inmueble) === fTipo);

        if (sortConfig.key) {
            data.sort((a, b) => {
                let aVal = a[sortConfig.key] ?? '';
                let bVal = b[sortConfig.key] ?? '';
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ?  1 : -1;
                return 0;
            });
        }

        return data;
    }, [units, searchQuery, fDesarrollo, fEstado, fTipo, sortConfig]);

    const totalPages     = Math.ceil(filteredUnits.length / ITEMS_PER_PAGE);
    const paginatedUnits = filteredUnits.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSort = (key) => {
        setSortConfig(prev =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' }
        );
    };

    const toggleSelect = (id) => {
        setSelectedUnits(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedUnits.size === paginatedUnits.length && paginatedUnits.length > 0) {
            setSelectedUnits(new Set());
        } else {
            setSelectedUnits(new Set(paginatedUnits.map(u => u.id_unidad)));
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.id_desarrollo) return;
        try {
            setSubmitting(true);
            const payload = Object.fromEntries(
                Object.entries(formData).filter(([, v]) => v !== '' && v !== null)
            );
            const numericFields = [
                'id_desarrollo', 'id_tipo_inmueble', 'id_tipo_propiedad',
                'id_estado_unidad', 'm2_terreno', 'm2_construccion', 'precios_lista',
            ];
            numericFields.forEach(k => { if (payload[k]) payload[k] = Number(payload[k]); });

            const res = await fetch('/api/inventory/units', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Error al guardar');
            }
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchAll();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = () => {
        const rows = filteredUnits.map(u => ({
            Código:           u.codigo_unidad || '',
            Desarrollo:       u.desarrollo?.nombre || '',
            'Tipo inmueble':  u.tipo_inmueble?.nombre || '',
            Dirección:        u.direccion || '',
            'm² Terreno':     u.m2_terreno || '',
            'm² Construcción':u.m2_construccion || '',
            'Precio lista':   u.precios_lista || '',
            Moneda:           u.moneda || '',
            Estado:           u.estado_unidad?.nombre || '',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Propiedades');
        XLSX.writeFile(wb, 'propiedades.xlsx');
    };

    // ── Loading / Error ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-red-500">
                <span className="text-sm">Error: {error}</span>
                <button onClick={fetchAll} className="text-sm underline text-blue-600">Reintentar</button>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-5">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total',        value: kpis.total,       color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-100'  },
                    { label: 'Disponibles',  value: kpis.disponibles, color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-100'},
                    { label: 'Vendidas',     value: kpis.vendidas,    color: 'text-sky-600',    bg: 'bg-sky-50',     border: 'border-sky-100'   },
                    { label: 'Apartadas',    value: kpis.apartadas,   color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-100' },
                ].map(kpi => (
                    <div key={kpi.label} className={`bg-white border ${kpi.border} rounded-xl p-4 shadow-sm`}>
                        <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Main panel + side panel */}
            <div className="flex gap-4">

                {/* Main panel */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-w-0">

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">

                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por código, dirección, desarrollo..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Filters */}
                        <select
                            value={fDesarrollo}
                            onChange={e => { setFDesarrollo(e.target.value); setCurrentPage(1); }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-600 bg-white"
                        >
                            <option value="">Todos los desarrollos</option>
                            {developments.map(d => (
                                <option key={d.id_desarrollo} value={d.id_desarrollo}>{d.nombre}</option>
                            ))}
                        </select>

                        <select
                            value={fEstado}
                            onChange={e => { setFEstado(e.target.value); setCurrentPage(1); }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-600 bg-white"
                        >
                            <option value="">Todos los estados</option>
                            {estadosUnidad.map(est => (
                                <option key={est.id_estado_unidad} value={est.id_estado_unidad}>{est.nombre}</option>
                            ))}
                        </select>

                        <select
                            value={fTipo}
                            onChange={e => { setFTipo(e.target.value); setCurrentPage(1); }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-600 bg-white"
                        >
                            <option value="">Todos los tipos</option>
                            {tiposInmueble.map(t => (
                                <option key={t.id_tipo_inmueble} value={t.id_tipo_inmueble}>{t.nombre}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-1.5 ml-auto">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Exportar</span>
                            </button>
                            <button
                                onClick={() => setViewMode(v => v === 'table' ? 'grid' : 'table')}
                                className="p-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                title={viewMode === 'table' ? 'Ver en tarjetas' : 'Ver en tabla'}
                            >
                                {viewMode === 'table' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#0A1128] text-white rounded-lg hover:bg-[#0A1128]/90 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Nueva Propiedad</span>
                            </button>
                        </div>
                    </div>

                    {/* Results info */}
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>{filteredUnits.length} propiedades encontradas</span>
                        {selectedUnits.size > 0 && (
                            <span className="text-blue-600 font-medium">{selectedUnits.size} seleccionadas</span>
                        )}
                    </div>

                    {/* ── TABLE VIEW ─────────────────────────────────────────── */}
                    {viewMode === 'table' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                                        <th className="pl-4 pr-2 py-3 w-8">
                                            <div
                                                onClick={toggleSelectAll}
                                                className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors
                                                    ${selectedUnits.size === paginatedUnits.length && paginatedUnits.length > 0
                                                        ? 'bg-[#1a1a2e] border-[#1a1a2e]'
                                                        : 'border-gray-300'}`}
                                            >
                                                {selectedUnits.size === paginatedUnits.length && paginatedUnits.length > 0 && (
                                                    <Check className="w-2.5 h-2.5 text-white" />
                                                )}
                                            </div>
                                        </th>
                                        {[
                                            { key: 'codigo_unidad',    label: 'Código'      },
                                            { key: null,               label: 'Desarrollo'  },
                                            { key: null,               label: 'Tipo'        },
                                            { key: 'direccion',        label: 'Dirección'   },
                                            { key: 'm2_construccion',  label: 'm²'          },
                                            { key: 'precios_lista',    label: 'Precio'      },
                                            { key: null,               label: 'Estado'      },
                                        ].map(col => (
                                            <th
                                                key={col.label}
                                                onClick={() => col.key && handleSort(col.key)}
                                                className={`px-3 py-3 text-left whitespace-nowrap ${col.key ? 'cursor-pointer hover:text-gray-700' : ''}`}
                                            >
                                                {col.label}
                                                {col.key && sortConfig.key === col.key && (
                                                    <span className="ml-1 text-blue-500">
                                                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedUnits.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-16 text-gray-400 text-sm">
                                                No se encontraron propiedades.
                                            </td>
                                        </tr>
                                    ) : paginatedUnits.map(unit => (
                                        <tr
                                            key={unit.id_unidad}
                                            onClick={() => setActivePanel(unit)}
                                            className={`border-t border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors
                                                ${activePanel?.id_unidad === unit.id_unidad ? 'bg-blue-50/60' : ''}`}
                                        >
                                            <td
                                                className="pl-4 pr-2 py-3"
                                                onClick={e => { e.stopPropagation(); toggleSelect(unit.id_unidad); }}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                                                    ${selectedUnits.has(unit.id_unidad) ? 'bg-[#1a1a2e] border-[#1a1a2e]' : 'border-gray-300'}`}>
                                                    {selectedUnits.has(unit.id_unidad) && <Check className="w-2.5 h-2.5 text-white" />}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                                                {unit.codigo_unidad || <span className="text-gray-400 italic text-xs">Sin código</span>}
                                            </td>
                                            <td className="px-3 py-3 text-gray-600 max-w-[160px] truncate">
                                                {unit.desarrollo?.nombre || '—'}
                                            </td>
                                            <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                                                {unit.tipo_inmueble?.nombre || '—'}
                                            </td>
                                            <td className="px-3 py-3 text-gray-500 max-w-[200px] truncate">
                                                {unit.direccion || '—'}
                                            </td>
                                            <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                                                {unit.m2_construccion ? `${unit.m2_construccion} m²` : '—'}
                                            </td>
                                            <td className="px-3 py-3 font-semibold text-emerald-700 whitespace-nowrap">
                                                {formatCurrency(unit.precios_lista, unit.moneda)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${getStatusBadge(unit.estado_unidad?.nombre)}`}>
                                                    {unit.estado_unidad?.nombre || '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    ) : (
                    /* ── GRID VIEW ──────────────────────────────────────────── */
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {paginatedUnits.length === 0 ? (
                                <div className="col-span-full text-center py-16 text-gray-400 text-sm">
                                    No se encontraron propiedades.
                                </div>
                            ) : paginatedUnits.map(unit => (
                                <PropertyCard
                                    key={unit.id_unidad}
                                    unit={unit}
                                    isSelected={selectedUnits.has(unit.id_unidad)}
                                    onSelect={toggleSelect}
                                    onOpen={setActivePanel}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                            <span className="text-xs text-gray-500">
                                Página {currentPage} de {totalPages}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                                    if (page < 1 || page > totalPages) return null;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                                                ${currentPage === page
                                                    ? 'bg-[#0A1128] text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── SIDE PANEL ──────────────────────────────────────────── */}
                {activePanel && (
                    <div className="w-80 shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col self-start sticky top-0">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-[#0A1128]">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
                                    <Home className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-white text-sm truncate">
                                        {activePanel.codigo_unidad || `Unidad #${activePanel.id_unidad}`}
                                    </div>
                                    <div className="text-xs text-white/60 truncate">{activePanel.desarrollo?.nombre || '—'}</div>
                                </div>
                            </div>
                            <button onClick={() => setActivePanel(null)} className="text-white/60 hover:text-white transition-colors ml-2 shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar p-4 space-y-4">
                            {/* Status badge */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Estado</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(activePanel.estado_unidad?.nombre)}`}>
                                    {activePanel.estado_unidad?.nombre || '—'}
                                </span>
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Tipo inmueble',   value: activePanel.tipo_inmueble?.nombre },
                                    { label: 'Tipo propiedad',  value: activePanel.tipo_propiedad?.descripcion },
                                    { label: 'm² Terreno',      value: activePanel.m2_terreno      ? `${activePanel.m2_terreno} m²`      : null },
                                    { label: 'm² Construcción', value: activePanel.m2_construccion ? `${activePanel.m2_construccion} m²` : null },
                                    { label: 'Moneda',          value: activePanel.moneda },
                                    { label: 'Tipología',       value: activePanel.tipologia?.nombre },
                                ].map(item => (
                                    <div key={item.label} className="bg-gray-50 rounded-lg p-2.5">
                                        <div className="text-[10px] text-gray-400 mb-0.5">{item.label}</div>
                                        <div className="text-xs font-medium text-gray-700">{item.value || '—'}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Price highlight */}
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                <div className="text-xs text-emerald-600 mb-0.5">Precio Lista</div>
                                <div className="text-lg font-bold text-emerald-700">
                                    {formatCurrency(activePanel.precios_lista, activePanel.moneda)}
                                </div>
                            </div>

                            {/* Address */}
                            {activePanel.direccion && (
                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    <span>{activePanel.direccion}</span>
                                </div>
                            )}

                            {/* Description */}
                            {activePanel.descripcion && (
                                <div>
                                    <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Descripción</div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{activePanel.descripcion}</p>
                                </div>
                            )}

                            {/* Dates */}
                            {(activePanel.fecha_obtencion || activePanel.fecha_terminacion) && (
                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                    {activePanel.fecha_obtencion && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">Fecha obtención</span>
                                            <span className="text-gray-700 font-medium">
                                                {new Date(activePanel.fecha_obtencion).toLocaleDateString('es-MX')}
                                            </span>
                                        </div>
                                    )}
                                    {activePanel.fecha_terminacion && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">Fecha terminación</span>
                                            <span className="text-gray-700 font-medium">
                                                {new Date(activePanel.fecha_terminacion).toLocaleDateString('es-MX')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── CREATE MODAL ────────────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                        {/* Modal header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Nueva Propiedad</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Ingresa los datos de la nueva unidad</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">

                            {/* Desarrollo (required) */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Desarrollo <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="id_desarrollo"
                                    value={formData.id_desarrollo}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
                                >
                                    <option value="">Seleccionar desarrollo...</option>
                                    {developments.map(d => (
                                        <option key={d.id_desarrollo} value={d.id_desarrollo}>{d.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Código + Tipo inmueble */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Código de unidad</label>
                                    <input
                                        type="text"
                                        name="codigo_unidad"
                                        value={formData.codigo_unidad}
                                        onChange={handleFormChange}
                                        placeholder="Ej. CASA-01"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipo de inmueble</label>
                                    <select
                                        name="id_tipo_inmueble"
                                        value={formData.id_tipo_inmueble}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {tiposInmueble.map(t => (
                                            <option key={t.id_tipo_inmueble} value={t.id_tipo_inmueble}>{t.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Tipo propiedad + Estado */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipo de propiedad</label>
                                    <select
                                        name="id_tipo_propiedad"
                                        value={formData.id_tipo_propiedad}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {tiposPropiedad.map(t => (
                                            <option key={t.id_tipo_propiedad} value={t.id_tipo_propiedad}>{t.descripcion}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Estado de la unidad</label>
                                    <select
                                        name="id_estado_unidad"
                                        value={formData.id_estado_unidad}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {estadosUnidad.map(est => (
                                            <option key={est.id_estado_unidad} value={est.id_estado_unidad}>{est.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Dirección */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Dirección</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formData.direccion}
                                    onChange={handleFormChange}
                                    placeholder="Calle, número, colonia..."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                />
                            </div>

                            {/* m² terreno + m² construcción */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">m² Terreno</label>
                                    <input
                                        type="number"
                                        name="m2_terreno"
                                        value={formData.m2_terreno}
                                        onChange={handleFormChange}
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">m² Construcción</label>
                                    <input
                                        type="number"
                                        name="m2_construccion"
                                        value={formData.m2_construccion}
                                        onChange={handleFormChange}
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                    />
                                </div>
                            </div>

                            {/* Moneda + Precio lista */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Moneda</label>
                                    <select
                                        name="moneda"
                                        value={formData.moneda}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
                                    >
                                        <option value="MXN">MXN</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Precio lista</label>
                                    <input
                                        type="number"
                                        name="precios_lista"
                                        value={formData.precios_lista}
                                        onChange={handleFormChange}
                                        placeholder="0"
                                        min="0"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                    />
                                </div>
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Fecha de obtención</label>
                                    <input
                                        type="date"
                                        name="fecha_obtencion"
                                        value={formData.fecha_obtencion}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Fecha de terminación</label>
                                    <input
                                        type="date"
                                        name="fecha_terminacion"
                                        value={formData.fecha_terminacion}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                    />
                                </div>
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleFormChange}
                                    rows={3}
                                    placeholder="Descripción de la propiedad..."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
                                />
                            </div>
                        </form>

                        {/* Modal footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !formData.id_desarrollo}
                                className="px-5 py-2 text-sm font-medium bg-[#0A1128] text-white rounded-lg hover:bg-[#0A1128]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitting ? 'Guardando...' : 'Guardar Propiedad'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

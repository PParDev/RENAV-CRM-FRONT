import { useState, useEffect, useMemo, useRef } from 'react';
import {
    Home, Search, Plus, Download, LayoutGrid, List,
    Building2, MapPin, X, Check, ChevronLeft, ChevronRight,
    ImagePlus, Pencil, Trash2, Mail, Phone, User,
    AlertTriangle, CheckCheck, Loader2, Info, ArrowUpRight,
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
        style: 'currency', currency: currency || 'MXN',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
};

const getImages = (imagen_url) => {
    if (!imagen_url) return [];
    try {
        const parsed = JSON.parse(imagen_url);
        return Array.isArray(parsed) ? parsed : [imagen_url];
    } catch { return [imagen_url]; }
};

const CARD_GRADIENTS = [
    'from-slate-700 to-slate-900', 'from-blue-800 to-indigo-900',
    'from-stone-600 to-stone-800', 'from-zinc-700 to-zinc-900',
    'from-neutral-700 to-neutral-900', 'from-sky-800 to-blue-900',
];

const pad = (n, digits) => String(n).padStart(digits, '0');

// ─── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({ unit, isSelected, onSelect, onOpen, onEdit }) {
    const [imgIdx, setImgIdx]     = useState(0);
    const [imgError, setImgError] = useState(false);
    const statusName = unit.estado_unidad?.nombre || '';
    const gradient   = CARD_GRADIENTS[unit.id_unidad % CARD_GRADIENTS.length];
    const images     = getImages(unit.imagen_url);
    const hasImages  = images.length > 0 && !imgError;

    const prevImg = (e) => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length); };
    const nextImg = (e) => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length); };

    return (
        <div onClick={() => onOpen(unit)}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
            <div className="relative h-44 w-full overflow-hidden group">
                {hasImages ? (
                    <img src={images[imgIdx]} alt={unit.codigo_unidad || 'Propiedad'}
                        onError={() => setImgError(true)} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
                        <Home className="w-10 h-10 text-white/20" />
                        <span className="text-white/30 text-[10px] uppercase tracking-widest font-medium">
                            {unit.tipo_inmueble?.nombre || 'Propiedad'}
                        </span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                {images.length > 1 && (
                    <>
                        <button onClick={prevImg} className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={nextImg} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
                            {imgIdx + 1}/{images.length}
                        </span>
                    </>
                )}
                <div onClick={e => { e.stopPropagation(); onSelect(unit.id_unidad); }}
                    className={`absolute top-2.5 left-2.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shadow
                        ${isSelected ? 'bg-white border-white' : 'border-white/70 bg-black/20 backdrop-blur-sm'}`}>
                    {isSelected && <Check className="w-3 h-3 text-[#1a1a2e]" />}
                </div>
                <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${getStatusBadge(statusName)}`}>
                    {statusName || 'Sin estado'}
                </span>
            </div>
            <div className="p-3">
                <div className="font-semibold text-gray-900 text-sm truncate mb-0.5">
                    {unit.codigo_unidad || `Unidad #${unit.id_unidad}`}
                </div>
                {unit.descripcion && (
                    <div className="text-xs text-gray-500 truncate mb-1">{unit.descripcion}</div>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
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
                        <div className="font-medium text-gray-700">{unit.m2_construccion ? `${unit.m2_construccion} m²` : '—'}</div>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                    <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Precio lista</div>
                        <div className="font-bold text-emerald-700 text-sm">{formatCurrency(unit.precios_lista, unit.moneda)}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); onEdit(unit); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Confirm Delete ────────────────────────────────────────────────────────────

function ConfirmDelete({ label, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">¿Eliminar?</div>
                        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
                </div>
            </div>
        </div>
    );
}

const SectionLabel = ({ children }) => (
    <div className="flex items-center gap-2 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{children}</span>
        <div className="flex-1 h-px bg-gray-100" />
    </div>
);

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white";
const F = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        {children}
    </div>
);

// ─── Form initial states ───────────────────────────────────────────────────────

const EMPTY_DEVELOPER   = { nombre: '', ubicacion: '', email: '', telefono: '' };
const EMPTY_DEVELOPMENT = {
    nombre: '', id_desarrollador: '', ciudad: '', alcance: 'LOCAL',
    id_estado_relac_des: '', nivel_certeza_legal: '', cat_estado_doc: '', id_origen_proyecto: '',
    porcentaje_comision: '', comision_vendedor: '',
    metodo_contado: '', metodo_hipotecario: '', metodo_financiamiento: '',
};
const EMPTY_UNIT = {
    quantity: '1', bulk_prefix: 'UNIT-', bulk_start: '1', bulk_digits: '3',
    id_desarrollo: '', codigo_unidad: '', descripcion: '', nivel_piso: '',
    tipo_proyecto: 'RESIDENCIAL',
    id_tipo_inmueble: '', id_tipo_propiedad: '', id_estado_unidad: '',
    m2_terreno: '', m2_construccion: '', moneda: 'MXN', precios_lista: '',
    porcentaje_comision: '',
    direccion: '', fecha_obtencion: '', fecha_terminacion: '',
};

const EMPTY_BULK_ROW = () => ({
    codigo: '', nivel_piso: '', descripcion: '',
    id_tipo_inmueble: '', id_estado_unidad: '',
    m2_construccion: '', m2_terreno: '', precios_lista: '',
});

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Properties() {

    const [tab, setTab] = useState('inventario');

    // ── data ───────────────────────────────────────────────────────────────────
    const [units, setUnits]               = useState([]);
    const [developments, setDevelopments] = useState([]);
    const [developers, setDevelopers]     = useState([]);
    const [tiposInmueble, setTiposInmueble]   = useState([]);
    const [estadosUnidad, setEstadosUnidad]   = useState([]);
    const [tiposPropiedad, setTiposPropiedad] = useState([]);
    const [estadosRelacDes, setEstadosRelacDes]   = useState([]);
    const [nivelesCerteza, setNivelesCerteza]     = useState([]);
    const [estadosDoc, setEstadosDoc]             = useState([]);
    const [origenesProyecto, setOrigenesProyecto] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    // ── inventory UI ───────────────────────────────────────────────────────────
    const [viewMode, setViewMode]       = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [fDesarrollo, setFDesarrollo] = useState('');
    const [fEstado, setFEstado]         = useState('');
    const [fTipo, setFTipo]             = useState('');
    const [selectedUnits, setSelectedUnits] = useState(new Set());
    const [sortConfig, setSortConfig]       = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage]     = useState(1);
    const [activePanel, setActivePanel]     = useState(null);
    const ITEMS_PER_PAGE = 12;

    // ── unit modal ─────────────────────────────────────────────────────────────
    const [showUnitModal, setShowUnitModal]   = useState(false);
    const [unitModalMode, setUnitModalMode]   = useState('create');
    const [editingUnit, setEditingUnit]       = useState(null);
    const [unitForm, setUnitForm]             = useState(EMPTY_UNIT);
    const [imagePreviews, setImagePreviews]   = useState([]);
    const [submittingUnit, setSubmittingUnit] = useState(false);
    const [bulkProgress, setBulkProgress]     = useState(null);
    const [bulkDone, setBulkDone]             = useState(false);
    const [bulkRows, setBulkRows]             = useState([]);  // per-unit overrides
    const importRef                           = useRef(null);

    // ── developer modal ────────────────────────────────────────────────────────
    const [devSearchQuery, setDevSearchQuery]   = useState('');
    const [showDevModal, setShowDevModal]       = useState(false);
    const [devModalMode, setDevModalMode]       = useState('create');
    const [editingDev, setEditingDev]           = useState(null);
    const [devForm, setDevForm]                 = useState(EMPTY_DEVELOPER);
    const [submittingDev, setSubmittingDev]     = useState(false);
    const [deleteDev, setDeleteDev]             = useState(null);

    // ── development modal ──────────────────────────────────────────────────────
    const [develSearchQuery, setDevelSearchQuery]     = useState('');
    const [showDevelopModal, setShowDevelopModal]     = useState(false);
    const [developModalMode, setDevelopModalMode]     = useState('create');
    const [editingDevelop, setEditingDevelop]         = useState(null);
    const [developForm, setDevelopForm]               = useState(EMPTY_DEVELOPMENT);
    const [submittingDevelop, setSubmittingDevelop]   = useState(false);
    const [deleteDevelop, setDeleteDevelop]           = useState(null);

    // ── fetch ──────────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        try {
            setLoading(true); setError(null);
            const [uRes, dRes, devRes, tiRes, esRes, tpRes, erRes, ncRes, edRes, opRes] = await Promise.all([
                fetch('/api/inventory/units?take=500'),
                fetch('/api/inventory/developments?take=500'),
                fetch('/api/inventory/developers'),
                fetch('/api/catalogs/tipos-inmueble'),
                fetch('/api/catalogs/estados-unidad'),
                fetch('/api/catalogs/tipos-propiedad'),
                fetch('/api/catalogs/estados-relacion-desarrollador'),
                fetch('/api/catalogs/niveles-certeza-legal'),
                fetch('/api/catalogs/estados-documentacion'),
                fetch('/api/catalogs/origenes-proyecto'),
            ]);
            const [uData, dData, devData, tiData, esData, tpData, erData, ncData, edData, opData] = await Promise.all([
                uRes.json(), dRes.json(), devRes.json(), tiRes.json(), esRes.json(), tpRes.json(),
                erRes.json(), ncRes.json(), edRes.json(), opRes.json(),
            ]);
            setUnits(uData.data || uData);
            setDevelopments(dData.data || dData);
            setDevelopers(devData.data || devData);
            setTiposInmueble(tiData);
            setEstadosUnidad(esData);
            setTiposPropiedad(tpData);
            setEstadosRelacDes(erData);
            setNivelesCerteza(ncData);
            setEstadosDoc(edData);
            setOrigenesProyecto(opData);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    // ── auto-DISPONIBLE ────────────────────────────────────────────────────────
    useEffect(() => {
        if (showUnitModal && unitModalMode === 'create' && estadosUnidad.length > 0 && !unitForm.id_estado_unidad) {
            const disp = estadosUnidad.find(e => e.nombre.toUpperCase().includes('DISPONIBLE'));
            if (disp) setUnitForm(p => ({ ...p, id_estado_unidad: String(disp.id_estado_unidad) }));
        }
    }, [showUnitModal, unitModalMode, estadosUnidad]);

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const kpis = useMemo(() => ({
        total:       units.length,
        disponibles: units.filter(u => (u.estado_unidad?.nombre || '').toUpperCase().includes('DISPONIBLE')).length,
        vendidas:    units.filter(u => (u.estado_unidad?.nombre || '').toUpperCase().includes('VENDID')).length,
        apartadas:   units.filter(u => (u.estado_unidad?.nombre || '').toUpperCase().includes('APARTAD')).length,
    }), [units]);

    // ── filtered units ─────────────────────────────────────────────────────────
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
                let aVal = a[sortConfig.key] ?? ''; let bVal = b[sortConfig.key] ?? '';
                if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
                return aVal < bVal ? (sortConfig.direction === 'asc' ? -1 : 1) : aVal > bVal ? (sortConfig.direction === 'asc' ? 1 : -1) : 0;
            });
        }
        return data;
    }, [units, searchQuery, fDesarrollo, fEstado, fTipo, sortConfig]);

    const totalPages     = Math.ceil(filteredUnits.length / ITEMS_PER_PAGE);
    const paginatedUnits = filteredUnits.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const filteredDevs = useMemo(() => {
        if (!devSearchQuery) return developers;
        const q = devSearchQuery.toLowerCase();
        return developers.filter(d => (d.nombre || '').toLowerCase().includes(q) || (d.ubicacion || '').toLowerCase().includes(q));
    }, [developers, devSearchQuery]);

    const filteredDevelopments = useMemo(() => {
        if (!develSearchQuery) return developments;
        const q = develSearchQuery.toLowerCase();
        return developments.filter(d => (d.nombre || '').toLowerCase().includes(q) || (d.desarrollador?.nombre || '').toLowerCase().includes(q));
    }, [developments, develSearchQuery]);

    // ── helpers ────────────────────────────────────────────────────────────────
    const handleSort     = (key) => setSortConfig(p => p.key === key ? { key, direction: p.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
    const toggleSelect   = (id) => setSelectedUnits(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
    const toggleSelectAll = () => setSelectedUnits(selectedUnits.size === paginatedUnits.length && paginatedUnits.length > 0 ? new Set() : new Set(paginatedUnits.map(u => u.id_unidad)));

    const closeUnitModal = () => {
        setShowUnitModal(false); setUnitModalMode('create'); setEditingUnit(null);
        setUnitForm(EMPTY_UNIT); setImagePreviews([]); setBulkProgress(null); setBulkDone(false); setBulkRows([]);
    };

    const openEditUnit = (unit) => {
        setUnitModalMode('edit'); setEditingUnit(unit);
        setUnitForm({
            ...EMPTY_UNIT,
            id_desarrollo:      String(unit.id_desarrollo    || ''),
            codigo_unidad:      unit.codigo_unidad           || '',
            nivel_piso:         unit.nivel_piso              || '',
            descripcion:        unit.descripcion             || '',
            tipo_proyecto:      unit.tipo_proyecto           || 'RESIDENCIAL',
            id_tipo_inmueble:   String(unit.id_tipo_inmueble  || ''),
            id_tipo_propiedad:  String(unit.id_tipo_propiedad || ''),
            id_estado_unidad:   String(unit.id_estado_unidad  || ''),
            m2_terreno:         unit.m2_terreno              ?? '',
            m2_construccion:    unit.m2_construccion         ?? '',
            moneda:             unit.moneda                  || 'MXN',
            precios_lista:      unit.precios_lista           ?? '',
            porcentaje_comision: unit.porcentaje_comision    ?? '',
            direccion:          unit.direccion               || '',
            fecha_obtencion:    unit.fecha_obtencion   ? unit.fecha_obtencion.substring(0, 10)   : '',
            fecha_terminacion:  unit.fecha_terminacion ? unit.fecha_terminacion.substring(0, 10) : '',
        });
        setImagePreviews(getImages(unit.imagen_url));
        setShowUnitModal(true);
    };

    const handleImageChange = (e) => {
        Array.from(e.target.files || []).forEach(file => {
            const reader = new FileReader();
            reader.onload = ev => setImagePreviews(p => [...p, ev.target.result]);
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    // ── bulk preview codes ─────────────────────────────────────────────────────
    const bulkPreviewCodes = useMemo(() => {
        const qty   = Math.min(500, Math.max(1, Number(unitForm.quantity) || 1));
        const start = Math.max(1, Number(unitForm.bulk_start) || 1);
        const digits = Math.max(2, String(start + qty - 1).length);
        return Array.from({ length: qty }, (_, i) => `${unitForm.bulk_prefix}${pad(start + i, digits)}`);
    }, [unitForm.quantity, unitForm.bulk_prefix, unitForm.bulk_start]);

    const isBulk = unitModalMode === 'create' && Number(unitForm.quantity) > 1;

    // Sync per-unit rows when bulk codes regenerate.
    // Preserves all user-edited per-row values; only sets code for NEW rows.
    useEffect(() => {
        if (!isBulk) { setBulkRows([]); return; }
        setBulkRows(prev =>
            bulkPreviewCodes.map((code, i) =>
                prev[i]
                    ? { ...EMPTY_BULK_ROW(), ...prev[i], codigo: code }  // update code, keep other edits
                    : { ...EMPTY_BULK_ROW(), codigo: code }
            )
        );
    }, [bulkPreviewCodes, isBulk]);

    // ── unit submit ────────────────────────────────────────────────────────────
    const handleUnitSubmit = async () => {
        if (!unitForm.id_desarrollo || bulkProgress) return;
        const NUMERIC = ['id_desarrollo', 'id_tipo_inmueble', 'id_tipo_propiedad', 'id_estado_unidad', 'm2_terreno', 'm2_construccion', 'precios_lista', 'porcentaje_comision'];
        const buildPayload = (overrides = {}) => {
            const merged = { ...unitForm, ...overrides };
            const p = Object.fromEntries(Object.entries(merged).filter(([k, v]) => !['quantity','bulk_prefix','bulk_start','bulk_digits'].includes(k) && v !== '' && v !== null));
            NUMERIC.forEach(k => { if (p[k]) p[k] = Number(p[k]); });
            return p;
        };
        try {
            setSubmittingUnit(true);
            if (unitModalMode === 'edit') {
                const p = buildPayload();
                if (imagePreviews.length > 0) p.imagen_url = JSON.stringify(imagePreviews);
                const res = await fetch(`/api/inventory/units/${editingUnit.id_unidad}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
                if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Error al guardar');
                closeUnitModal(); fetchAll();
            } else if (!isBulk) {
                const p = buildPayload();
                if (imagePreviews.length > 0) p.imagen_url = JSON.stringify(imagePreviews);
                const res = await fetch('/api/inventory/units', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
                if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Error al crear');
                closeUnitModal(); fetchAll();
            } else {
                const unitsPayload = bulkRows.map(row => {
                    // Only non-empty row values override the shared base form.
                    // Empty cells mean "inherit from base".
                    const ov = {};
                    if (row.codigo)            ov.codigo_unidad    = row.codigo;
                    if (row.nivel_piso)        ov.nivel_piso       = row.nivel_piso;
                    if (row.descripcion)       ov.descripcion      = row.descripcion;
                    if (row.id_tipo_inmueble)  ov.id_tipo_inmueble = row.id_tipo_inmueble;
                    if (row.id_estado_unidad)  ov.id_estado_unidad = row.id_estado_unidad;
                    if (row.m2_construccion)   ov.m2_construccion  = row.m2_construccion;
                    if (row.m2_terreno)        ov.m2_terreno       = row.m2_terreno;
                    if (row.precios_lista)     ov.precios_lista    = row.precios_lista;
                    return buildPayload(ov);
                });
                setBulkProgress({ done: 0, total: unitsPayload.length });
                const res = await fetch('/api/inventory/units/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ units: unitsPayload }) });
                if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Error al crear unidades');
                setBulkProgress({ done: unitsPayload.length, total: unitsPayload.length });
                setBulkDone(true);
                fetchAll();
            }
        } catch (err) { alert(err.message); setBulkProgress(null); }
        finally { setSubmittingUnit(false); }
    };

    const handleExport = () => {
        const rows = filteredUnits.map(u => ({
            Código: u.codigo_unidad || '', Descripción: u.descripcion || '',
            Desarrollo: u.desarrollo?.nombre || '', 'Tipo inmueble': u.tipo_inmueble?.nombre || '',
            Ubicación: u.direccion || '', 'm² Terreno': u.m2_terreno || '', 'm² Construcción': u.m2_construccion || '',
            'Precio lista': u.precios_lista || '', Moneda: u.moneda || '', Estado: u.estado_unidad?.nombre || '',
            'Fecha obtención': u.fecha_obtencion || '', 'Fecha terminación': u.fecha_terminacion || '',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Propiedades');
        XLSX.writeFile(wb, 'propiedades.xlsx');
    };

    // ── bulk helpers ───────────────────────────────────────────────────────────
    const addBulkRow = () =>
        setUnitForm(p => ({ ...p, quantity: String(Math.min(500, Number(p.quantity) + 1)) }));

    const updateRow = (i, field, value) =>
        setBulkRows(prev => prev.map((r, j) => j === i ? { ...r, [field]: value } : r));

    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const wb   = XLSX.read(ev.target.result, { type: 'binary' });
                const ws   = wb.Sheets[wb.SheetNames[0]];
                const [headers, ...rawRows] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                if (!headers || rawRows.length === 0) { alert('El archivo no contiene datos.'); return; }
                const h   = headers.map(c => String(c).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
                const col = (...keys) => h.findIndex(c => keys.some(k => c.includes(k)));
                const cCodigo = col('codigo', 'code');
                const cNivel  = col('nivel', 'piso', 'floor');
                const cM2C    = col('constr', 'm2c', 'cons');
                const cM2T    = col('terreno', 'm2t');
                const cPrecio = col('precio', 'price', 'lista');
                const cDesc   = col('descr', 'desc', 'nombre');
                const imported = rawRows
                    .filter(row => row.some(v => v !== ''))
                    .map((row, i) => ({
                        ...EMPTY_BULK_ROW(),
                        codigo:         cCodigo >= 0 ? String(row[cCodigo] || '') : `${unitForm.bulk_prefix}${pad(Number(unitForm.bulk_start) + i, Number(unitForm.bulk_digits) || 3)}`,
                        nivel_piso:     cNivel  >= 0 ? String(row[cNivel]  || '') : '',
                        m2_construccion: cM2C   >= 0 ? String(row[cM2C]   || '') : '',
                        m2_terreno:     cM2T    >= 0 ? String(row[cM2T]   || '') : '',
                        precios_lista:  cPrecio >= 0 ? String(row[cPrecio] || '') : '',
                        descripcion:    cDesc   >= 0 ? String(row[cDesc]  || '') : '',
                    }));
                if (imported.length > 0) {
                    setBulkRows(imported);
                    setUnitForm(p => ({ ...p, quantity: String(imported.length) }));
                }
            } catch (err) { alert('Error al leer el archivo: ' + err.message); }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    // ── developers CRUD ────────────────────────────────────────────────────────
    const closeDevModal = () => { setShowDevModal(false); setDevModalMode('create'); setEditingDev(null); setDevForm(EMPTY_DEVELOPER); };
    const openEditDev   = (d) => { setDevModalMode('edit'); setEditingDev(d); setDevForm({ nombre: d.nombre || '', ubicacion: d.ubicacion || '', email: d.email || '', telefono: d.telefono || '' }); setShowDevModal(true); };
    const handleDevSubmit = async (e) => {
        e.preventDefault(); if (!devForm.nombre.trim()) return;
        try {
            setSubmittingDev(true);
            const p = Object.fromEntries(Object.entries(devForm).filter(([, v]) => v !== ''));
            const url = devModalMode === 'edit' ? `/api/inventory/developers/${editingDev.id_desarrollador}` : '/api/inventory/developers';
            const res = await fetch(url, { method: devModalMode === 'edit' ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Error');
            closeDevModal(); fetchAll();
        } catch (err) { alert(err.message); } finally { setSubmittingDev(false); }
    };
    const handleDevDelete = async (id) => {
        try { await fetch(`/api/inventory/developers/${id}`, { method: 'DELETE' }); setDeleteDev(null); fetchAll(); }
        catch (err) { alert(err.message); }
    };

    // ── developments CRUD ──────────────────────────────────────────────────────
    const closeDevelopModal = () => { setShowDevelopModal(false); setDevelopModalMode('create'); setEditingDevelop(null); setDevelopForm(EMPTY_DEVELOPMENT); };
    const openEditDevelop   = (d) => {
        setDevelopModalMode('edit'); setEditingDevelop(d);
        setDevelopForm({
            nombre: d.nombre || '', id_desarrollador: String(d.id_desarrollador || ''), ciudad: String(d.ciudad || ''),
            alcance: d.alcance || 'LOCAL',
            id_estado_relac_des:  String(d.id_estado_relac_des  || ''),
            nivel_certeza_legal:  String(d.nivel_certeza_legal  || ''),
            cat_estado_doc:       String(d.cat_estado_doc       || ''),
            id_origen_proyecto:   String(d.id_origen_proyecto   || ''),
            porcentaje_comision: d.porcentaje_comision ?? '', comision_vendedor: d.comision_vendedor ?? '',
            metodo_contado: d.metodo_contado || '', metodo_hipotecario: d.metodo_hipotecario || '', metodo_financiamiento: d.metodo_financiamiento || '',
        });
        setShowDevelopModal(true);
    };
    const handleDevelopSubmit = async (e) => {
        e.preventDefault(); if (!developForm.nombre.trim()) return;
        try {
            setSubmittingDevelop(true);
            const p = Object.fromEntries(Object.entries(developForm).filter(([, v]) => v !== ''));
            ['id_desarrollador', 'ciudad', 'id_estado_relac_des', 'nivel_certeza_legal', 'cat_estado_doc', 'id_origen_proyecto', 'porcentaje_comision', 'comision_vendedor'].forEach(k => { if (p[k]) p[k] = Number(p[k]); });
            const url = developModalMode === 'edit' ? `/api/inventory/developments/${editingDevelop.id_desarrollo}` : '/api/inventory/developments';
            const res = await fetch(url, { method: developModalMode === 'edit' ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Error');
            closeDevelopModal(); fetchAll();
        } catch (err) { alert(err.message); } finally { setSubmittingDevelop(false); }
    };
    const handleDevelopDelete = async (id) => {
        try { await fetch(`/api/inventory/developments/${id}`, { method: 'DELETE' }); setDeleteDevelop(null); fetchAll(); }
        catch (err) { alert(err.message); }
    };

    // ─── Loading / Error ───────────────────────────────────────────────────────
    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
    if (error)   return <div className="flex items-center justify-center h-64 gap-3 text-red-500 text-sm">Error: {error} <button onClick={fetchAll} className="underline text-blue-600">Reintentar</button></div>;

    return (
        <div className="flex flex-col gap-5">

            {/* TAB BAR */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit self-start">
                {[
                    { key: 'inventario',      label: 'Inventario',      icon: <Home className="w-3.5 h-3.5" /> },
                    { key: 'desarrollos',     label: 'Desarrollos',     icon: <Building2 className="w-3.5 h-3.5" /> },
                    { key: 'desarrolladores', label: 'Desarrolladores', icon: <User className="w-3.5 h-3.5" /> },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                            ${tab === t.key ? 'bg-white text-[#0A1128] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* ═══════════════ TAB: INVENTARIO ═══════════════ */}
            {tab === 'inventario' && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Total',       value: kpis.total,       color: 'text-blue-600',    border: 'border-blue-100'    },
                            { label: 'Disponibles', value: kpis.disponibles, color: 'text-emerald-600', border: 'border-emerald-100' },
                            { label: 'Vendidas',    value: kpis.vendidas,    color: 'text-sky-600',     border: 'border-sky-100'     },
                            { label: 'Apartadas',   value: kpis.apartadas,   color: 'text-amber-600',   border: 'border-amber-100'   },
                        ].map(k => (
                            <div key={k.label} className={`bg-white border ${k.border} rounded-xl p-4 shadow-sm`}>
                                <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-w-0">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
                                <div className="relative flex-1 min-w-[180px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        placeholder="Buscar por código, descripción o desarrollo..."
                                        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                                    {searchQuery && <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
                                </div>
                                <select value={fDesarrollo} onChange={e => { setFDesarrollo(e.target.value); setCurrentPage(1); }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none text-gray-600 bg-white">
                                    <option value="">Todos los desarrollos</option>
                                    {developments.map(d => <option key={d.id_desarrollo} value={d.id_desarrollo}>{d.nombre}</option>)}
                                </select>
                                <select value={fEstado} onChange={e => { setFEstado(e.target.value); setCurrentPage(1); }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none text-gray-600 bg-white">
                                    <option value="">Todos los estados</option>
                                    {estadosUnidad.map(est => <option key={est.id_estado_unidad} value={est.id_estado_unidad}>{est.nombre}</option>)}
                                </select>
                                <select value={fTipo} onChange={e => { setFTipo(e.target.value); setCurrentPage(1); }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none text-gray-600 bg-white">
                                    <option value="">Todos los tipos</option>
                                    {tiposInmueble.map(t => <option key={t.id_tipo_inmueble} value={t.id_tipo_inmueble}>{t.nombre}</option>)}
                                </select>
                                <div className="flex items-center gap-1.5 ml-auto">
                                    <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <Download className="w-4 h-4" /><span className="hidden sm:inline">Exportar</span>
                                    </button>
                                    <button onClick={() => setViewMode(v => v === 'table' ? 'grid' : 'table')} className="p-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        {viewMode === 'table' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => setShowUnitModal(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#0A1128] text-white rounded-lg hover:bg-[#0A1128]/90 transition-colors">
                                        <Plus className="w-4 h-4" />Nueva Propiedad
                                    </button>
                                </div>
                            </div>
                            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                <span>{filteredUnits.length} propiedades</span>
                                {selectedUnits.size > 0 && <span className="text-blue-600 font-medium">{selectedUnits.size} seleccionadas</span>}
                            </div>

                            {/* Table */}
                            {viewMode === 'table' ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                                                <th className="pl-4 pr-2 py-3 w-8">
                                                    <div onClick={toggleSelectAll} className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${selectedUnits.size === paginatedUnits.length && paginatedUnits.length > 0 ? 'bg-[#1a1a2e] border-[#1a1a2e]' : 'border-gray-300'}`}>
                                                        {selectedUnits.size === paginatedUnits.length && paginatedUnits.length > 0 && <Check className="w-2.5 h-2.5 text-white" />}
                                                    </div>
                                                </th>
                                                {[{k:'codigo_unidad',l:'Código'},{k:'descripcion',l:'Descripción'},{k:null,l:'Desarrollo'},{k:null,l:'Tipo'},{k:'direccion',l:'Ubicación'},{k:'m2_construccion',l:'m²'},{k:'precios_lista',l:'Precio'},{k:null,l:'Estado'},{k:null,l:''}].map(col => (
                                                    <th key={col.l} onClick={() => col.k && handleSort(col.k)} className={`px-3 py-3 text-left whitespace-nowrap ${col.k ? 'cursor-pointer hover:text-gray-700' : ''}`}>
                                                        {col.l}{col.k && sortConfig.key === col.k && <span className="ml-1 text-blue-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedUnits.length === 0
                                                ? <tr><td colSpan={10} className="text-center py-16 text-gray-400 text-sm">No se encontraron propiedades.</td></tr>
                                                : paginatedUnits.map(unit => (
                                                    <tr key={unit.id_unidad} onClick={() => setActivePanel(unit)}
                                                        className={`border-t border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors ${activePanel?.id_unidad === unit.id_unidad ? 'bg-blue-50/60' : ''}`}>
                                                        <td className="pl-4 pr-2 py-3" onClick={e => { e.stopPropagation(); toggleSelect(unit.id_unidad); }}>
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedUnits.has(unit.id_unidad) ? 'bg-[#1a1a2e] border-[#1a1a2e]' : 'border-gray-300'}`}>
                                                                {selectedUnits.has(unit.id_unidad) && <Check className="w-2.5 h-2.5 text-white" />}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{unit.codigo_unidad || <span className="text-gray-400 italic text-xs">—</span>}</td>
                                                        <td className="px-3 py-3 text-gray-600 max-w-[180px] truncate">{unit.descripcion || '—'}</td>
                                                        <td className="px-3 py-3 text-gray-600 max-w-[140px] truncate">{unit.desarrollo?.nombre || '—'}</td>
                                                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{unit.tipo_inmueble?.nombre || '—'}</td>
                                                        <td className="px-3 py-3 text-gray-500 max-w-[160px] truncate">{unit.direccion || '—'}</td>
                                                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{unit.m2_construccion ? `${unit.m2_construccion} m²` : '—'}</td>
                                                        <td className="px-3 py-3 font-semibold text-emerald-700 whitespace-nowrap">{formatCurrency(unit.precios_lista, unit.moneda)}</td>
                                                        <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(unit.estado_unidad?.nombre)}`}>{unit.estado_unidad?.nombre || '—'}</span></td>
                                                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                                                            <button onClick={() => openEditUnit(unit)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {paginatedUnits.length === 0
                                        ? <div className="col-span-full text-center py-16 text-gray-400 text-sm">No se encontraron propiedades.</div>
                                        : paginatedUnits.map(unit => (
                                            <PropertyCard key={unit.id_unidad} unit={unit} isSelected={selectedUnits.has(unit.id_unidad)}
                                                onSelect={toggleSelect} onOpen={setActivePanel} onEdit={openEditUnit} />
                                        ))}
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                                    <span className="text-xs text-gray-500">Página {currentPage} de {totalPages}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const page = currentPage <= 3 ? i + 1 : currentPage + i - 2; if (page < 1 || page > totalPages) return null; return <button key={page} onClick={() => setCurrentPage(page)} className={`w-7 h-7 rounded-lg text-xs font-medium ${currentPage === page ? 'bg-[#0A1128] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>; })}
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Side panel */}
                        {activePanel && (
                            <div className="w-80 shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col self-start sticky top-0">
                                <div className="flex items-center justify-between p-4 bg-[#0A1128]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><Home className="w-4 h-4 text-white" /></div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-white text-sm truncate">{activePanel.codigo_unidad || `Unidad #${activePanel.id_unidad}`}</div>
                                            <div className="text-xs text-white/60 truncate">{activePanel.desarrollo?.nombre || '—'}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setActivePanel(null)} className="text-white/60 hover:text-white ml-2 shrink-0"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="overflow-y-auto p-4 space-y-3">
                                    {activePanel.descripcion && <p className="text-sm text-gray-700 font-medium">{activePanel.descripcion}</p>}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">Estado</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(activePanel.estado_unidad?.nombre)}`}>{activePanel.estado_unidad?.nombre || '—'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[{l:'Tipo inmueble',v:activePanel.tipo_inmueble?.nombre},{l:'Tipo proyecto',v:activePanel.tipo_proyecto},{l:'Tipo propiedad',v:activePanel.tipo_propiedad?.descripcion},{l:'m² Terreno',v:activePanel.m2_terreno?`${activePanel.m2_terreno} m²`:null},{l:'m² Construcción',v:activePanel.m2_construccion?`${activePanel.m2_construccion} m²`:null},{l:'% Comisión',v:activePanel.porcentaje_comision?`${activePanel.porcentaje_comision}%`:null},{l:'F. obtención',v:activePanel.fecha_obtencion?new Date(activePanel.fecha_obtencion).toLocaleDateString('es-MX'):null},{l:'F. terminación',v:activePanel.fecha_terminacion?new Date(activePanel.fecha_terminacion).toLocaleDateString('es-MX'):null}].map(item => (
                                            <div key={item.l} className="bg-gray-50 rounded-lg p-2.5">
                                                <div className="text-[10px] text-gray-400 mb-0.5">{item.l}</div>
                                                <div className="text-xs font-medium text-gray-700">{item.v || '—'}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                        <div className="text-xs text-emerald-600 mb-0.5">Precio Lista</div>
                                        <div className="text-lg font-bold text-emerald-700">{formatCurrency(activePanel.precios_lista, activePanel.moneda)}</div>
                                    </div>
                                    {activePanel.direccion && (
                                        <div className="flex items-start gap-2 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /><span>{activePanel.direccion}</span>
                                        </div>
                                    )}
                                    <button onClick={() => openEditUnit(activePanel)}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#0A1128] border border-[#0A1128]/20 rounded-lg hover:bg-[#0A1128]/5 transition-colors">
                                        <Pencil className="w-3.5 h-3.5" />Editar propiedad
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ═══════════════ TAB: DESARROLLOS ═══════════════ */}
            {tab === 'desarrollos' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={develSearchQuery} onChange={e => setDevelSearchQuery(e.target.value)} placeholder="Buscar desarrollo o desarrollador..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                        </div>
                        <button onClick={() => setShowDevelopModal(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#0A1128] text-white rounded-lg hover:bg-[#0A1128]/90 transition-colors ml-auto">
                            <Plus className="w-4 h-4" />Nuevo Desarrollo
                        </button>
                    </div>
                    <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-500">{filteredDevelopments.length} desarrollos</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">{['Nombre','Desarrollador','Alcance','% Com. empresa','% Com. vendedor','Métodos de pago','Unidades',''].map(h => <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>)}</tr></thead>
                            <tbody>
                                {filteredDevelopments.length === 0
                                    ? <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">No hay desarrollos registrados.</td></tr>
                                    : filteredDevelopments.map(d => (
                                        <tr key={d.id_desarrollo} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{d.nombre}</td>
                                            <td className="px-4 py-3 text-gray-600">{d.desarrollador?.nombre || <span className="text-gray-400 italic text-xs">Sin asignar</span>}</td>
                                            <td className="px-4 py-3">
                                                {d.alcance
                                                    ? <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.alcance === 'NACIONAL' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{d.alcance}</span>
                                                    : <span className="text-gray-400">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{d.porcentaje_comision != null ? `${d.porcentaje_comision}%` : '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{d.comision_vendedor != null ? `${d.comision_vendedor}%` : '—'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1 flex-wrap">
                                                    {d.metodo_contado        && <span className="bg-emerald-50 text-emerald-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">Contado</span>}
                                                    {d.metodo_hipotecario    && <span className="bg-blue-50 text-blue-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">Hipotecario</span>}
                                                    {d.metodo_financiamiento && <span className="bg-violet-50 text-violet-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">Financiamiento</span>}
                                                    {!d.metodo_contado && !d.metodo_hipotecario && !d.metodo_financiamiento && <span className="text-gray-400 text-xs">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{units.filter(u => u.id_desarrollo === d.id_desarrollo).length}</span></td>
                                            <td className="px-4 py-3"><div className="flex items-center gap-1">
                                                <button onClick={() => openEditDevelop(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setDeleteDevelop(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div></td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══════════════ TAB: DESARROLLADORES ═══════════════ */}
            {tab === 'desarrolladores' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={devSearchQuery} onChange={e => setDevSearchQuery(e.target.value)} placeholder="Buscar desarrollador..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                        </div>
                        <button onClick={() => setShowDevModal(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#0A1128] text-white rounded-lg hover:bg-[#0A1128]/90 transition-colors ml-auto">
                            <Plus className="w-4 h-4" />Nuevo Desarrollador
                        </button>
                    </div>
                    <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-500">{filteredDevs.length} desarrolladores</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">{['Nombre','Ubicación','Email','Teléfono','Desarrollos',''].map(h => <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>)}</tr></thead>
                            <tbody>
                                {filteredDevs.length === 0
                                    ? <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No hay desarrolladores registrados.</td></tr>
                                    : filteredDevs.map(d => (
                                        <tr key={d.id_desarrollador} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{d.nombre}</td>
                                            <td className="px-4 py-3 text-gray-600">{d.ubicacion || '—'}</td>
                                            <td className="px-4 py-3">{d.email ? <a href={`mailto:${d.email}`} className="flex items-center gap-1 text-blue-600 hover:underline text-sm"><Mail className="w-3 h-3" />{d.email}</a> : <span className="text-gray-400">—</span>}</td>
                                            <td className="px-4 py-3 text-gray-600">{d.telefono ? <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" />{d.telefono}</span> : '—'}</td>
                                            <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{developments.filter(dev => dev.id_desarrollador === d.id_desarrollador).length}</span></td>
                                            <td className="px-4 py-3"><div className="flex items-center gap-1">
                                                <button onClick={() => openEditDev(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setDeleteDev(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div></td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                MODAL UNIFICADO — ALTA DE PROPIEDADES
                cantidad = 1 → unidad individual
                cantidad > 1 → alta masiva con código automático
            ═══════════════════════════════════════════════════════════════ */}
            {showUnitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col ${unitModalMode === 'create' ? 'max-w-5xl max-h-[95vh]' : 'max-w-2xl max-h-[92vh]'}`}>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isBulk ? 'bg-violet-100' : 'bg-[#0A1128]/5'}`}>
                                    <Home className={`w-5 h-5 ${isBulk ? 'text-violet-600' : 'text-[#0A1128]'}`} />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        {unitModalMode === 'edit'
                                            ? `Editar — ${editingUnit?.codigo_unidad || `#${editingUnit?.id_unidad}`}`
                                            : isBulk
                                                ? `Alta masiva · ${unitForm.quantity} unidades`
                                                : 'Nueva Propiedad'}
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {unitModalMode === 'edit' ? 'Modifica los campos que necesites' : 'Ajusta la cantidad para crear una o varias unidades con los mismos datos base'}
                                    </p>
                                </div>
                            </div>
                            {!bulkProgress && <button onClick={closeUnitModal} className="text-gray-400 hover:text-gray-600 ml-2 shrink-0"><X className="w-5 h-5" /></button>}
                        </div>

                        {/* Done state */}
                        {bulkDone ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCheck className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-lg font-semibold text-gray-900">¡Lote creado exitosamente!</div>
                                    <div className="text-sm text-gray-500 mt-1">{unitForm.quantity} unidades agregadas al inventario.</div>
                                </div>
                                <button onClick={closeUnitModal} className="px-6 py-2 text-sm font-medium bg-[#0A1128] text-white rounded-lg hover:bg-[#0A1128]/90 transition-colors">
                                    Ver inventario
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* ════════════════ CREATE MODE ════════════════ */}
                                {unitModalMode === 'create' ? (
                                    <div className="flex-1 overflow-y-auto">

                                        {/* SECTION 1 — Datos compartidos */}
                                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-5 space-y-4">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                Datos compartidos por todas las unidades
                                            </div>

                                            {/* Desarrollo + Moneda */}
                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="col-span-3">
                                                    <F label="Desarrollo" required>
                                                        <select value={unitForm.id_desarrollo} onChange={e => setUnitForm(p => ({ ...p, id_desarrollo: e.target.value }))} className={inputCls}>
                                                            <option value="">Seleccionar desarrollo…</option>
                                                            {developments.map(d => <option key={d.id_desarrollo} value={d.id_desarrollo}>{d.nombre}</option>)}
                                                        </select>
                                                    </F>
                                                </div>
                                                <F label="Moneda">
                                                    <select value={unitForm.moneda} onChange={e => setUnitForm(p => ({ ...p, moneda: e.target.value }))} className={inputCls}>
                                                        <option value="MXN">MXN</option>
                                                        <option value="USD">USD</option>
                                                    </select>
                                                </F>
                                            </div>

                                            {/* Clasificación */}
                                            <div className="grid grid-cols-4 gap-4">
                                                <F label="Tipo inmueble (base)">
                                                    <select value={unitForm.id_tipo_inmueble} onChange={e => setUnitForm(p => ({ ...p, id_tipo_inmueble: e.target.value }))} className={inputCls}>
                                                        <option value="">Seleccionar…</option>
                                                        {tiposInmueble.map(t => <option key={t.id_tipo_inmueble} value={t.id_tipo_inmueble}>{t.nombre}</option>)}
                                                    </select>
                                                </F>
                                                <F label="Tipo de proyecto">
                                                    <select value={unitForm.tipo_proyecto} onChange={e => setUnitForm(p => ({ ...p, tipo_proyecto: e.target.value }))} className={inputCls}>
                                                        <option value="RESIDENCIAL">RESIDENCIAL</option>
                                                        <option value="COMERCIAL">COMERCIAL</option>
                                                        <option value="INDUSTRIAL">INDUSTRIAL</option>
                                                        <option value="MIXTO">MIXTO</option>
                                                        <option value="TURISTICO">TURÍSTICO</option>
                                                    </select>
                                                </F>
                                                <F label="Tipo de propiedad">
                                                    <select value={unitForm.id_tipo_propiedad} onChange={e => setUnitForm(p => ({ ...p, id_tipo_propiedad: e.target.value }))} className={inputCls}>
                                                        <option value="">Seleccionar…</option>
                                                        {tiposPropiedad.map(t => <option key={t.id_tipo_propiedad} value={t.id_tipo_propiedad}>{t.descripcion}</option>)}
                                                    </select>
                                                </F>
                                                <F label="Estado (base)">
                                                    <select value={unitForm.id_estado_unidad} onChange={e => setUnitForm(p => ({ ...p, id_estado_unidad: e.target.value }))} className={inputCls}>
                                                        <option value="">Seleccionar…</option>
                                                        {estadosUnidad.map(est => <option key={est.id_estado_unidad} value={est.id_estado_unidad}>{est.nombre}</option>)}
                                                    </select>
                                                </F>
                                            </div>

                                            {/* Superficie, precio, comisión y fechas */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <F label="m² Terreno (base)">
                                                    <input type="text" inputMode="decimal" placeholder="0"
                                                        value={unitForm.m2_terreno} onChange={e => setUnitForm(p => ({ ...p, m2_terreno: e.target.value }))} className={inputCls} />
                                                </F>
                                                <F label="m² Construcción (base)">
                                                    <input type="text" inputMode="decimal" placeholder="0"
                                                        value={unitForm.m2_construccion} onChange={e => setUnitForm(p => ({ ...p, m2_construccion: e.target.value }))} className={inputCls} />
                                                </F>
                                                <F label="Precio lista (base)">
                                                    <input type="text" inputMode="decimal" placeholder="0"
                                                        value={unitForm.precios_lista} onChange={e => setUnitForm(p => ({ ...p, precios_lista: e.target.value }))} className={inputCls} />
                                                </F>
                                                <F label="% Comisión">
                                                    <div className="relative">
                                                        <input type="text" inputMode="decimal" placeholder="Ej. 6"
                                                            value={unitForm.porcentaje_comision} onChange={e => setUnitForm(p => ({ ...p, porcentaje_comision: e.target.value }))} className={inputCls} />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                                                    </div>
                                                </F>
                                                <F label="Fecha obtención">
                                                    <input type="date" value={unitForm.fecha_obtencion} onChange={e => setUnitForm(p => ({ ...p, fecha_obtencion: e.target.value }))} className={inputCls} />
                                                </F>
                                                <F label="Fecha terminación">
                                                    <input type="date" value={unitForm.fecha_terminacion} onChange={e => setUnitForm(p => ({ ...p, fecha_terminacion: e.target.value }))} className={inputCls} />
                                                </F>
                                            </div>
                                        </div>

                                        {/* SECTION 2 — Unidades */}
                                        <div className="px-6 py-5 space-y-3">
                                            {/* Header row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Unidades</span>
                                                    <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">{unitForm.quantity}</span>
                                                </div>
                                                <button type="button" onClick={() => importRef.current?.click()}
                                                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium">
                                                    <ArrowUpRight className="w-3.5 h-3.5" />Importar desde Excel/CSV
                                                </button>
                                                <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
                                            </div>

                                            {/* Info box */}
                                            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-start gap-2">
                                                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                                <p className="text-xs text-blue-600">Las celdas vacías heredan el valor base. Edita solo las que difieran del resto. Puedes pegar desde Excel directo en la tabla.</p>
                                            </div>

                                            {/* Controls: stepper + code pattern */}
                                            <div className="flex flex-wrap items-end gap-4">
                                                <div>
                                                    <div className="text-xs font-medium text-gray-700 mb-1.5">Cantidad</div>
                                                    <div className="flex items-center gap-1">
                                                        <button type="button" onClick={() => setUnitForm(p => ({ ...p, quantity: String(Math.max(1, Number(p.quantity) - 1)) }))}
                                                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-bold leading-none">−</button>
                                                        <input type="text" inputMode="numeric" value={unitForm.quantity}
                                                            onChange={e => setUnitForm(p => ({ ...p, quantity: String(Math.min(500, Math.max(1, Number(e.target.value) || 1))) }))}
                                                            className="w-14 text-center border border-gray-200 rounded-lg py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white" />
                                                        <button type="button" onClick={() => setUnitForm(p => ({ ...p, quantity: String(Math.min(500, Number(p.quantity) + 1)) }))}
                                                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-bold leading-none">+</button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-700 mb-1.5">Prefijo código</div>
                                                    <input type="text" placeholder="UNIT-" value={unitForm.bulk_prefix}
                                                        onChange={e => setUnitForm(p => ({ ...p, bulk_prefix: e.target.value }))}
                                                        className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-700 mb-1.5">Núm. inicial</div>
                                                    <input type="text" inputMode="numeric" value={unitForm.bulk_start}
                                                        onChange={e => setUnitForm(p => ({ ...p, bulk_start: e.target.value }))}
                                                        className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                                                </div>
                                            </div>

                                            {/* Per-unit table */}
                                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '280px' }}>
                                                    <table className="w-full text-xs" style={{ minWidth: '700px' }}>
                                                        <thead className="sticky top-0 bg-gray-50 z-10">
                                                            <tr className="text-gray-500 uppercase tracking-wide border-b border-gray-200">
                                                                <th className="px-2 py-2.5 text-center w-8 font-semibold">#</th>
                                                                <th className="px-2 py-2.5 text-left font-semibold">Código</th>
                                                                <th className="px-2 py-2.5 text-left font-semibold">Tipo inmueble</th>
                                                                <th className="px-2 py-2.5 text-left font-semibold">m² Constr.</th>
                                                                <th className="px-2 py-2.5 text-left font-semibold">m² Terreno</th>
                                                                <th className="px-2 py-2.5 text-left font-semibold">Precio lista</th>
                                                                <th className="px-2 py-2.5 text-left font-semibold">Estado</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {bulkRows.map((row, i) => {
                                                                const baseTipoNombre   = tiposInmueble.find(t => String(t.id_tipo_inmueble)  === unitForm.id_tipo_inmueble)?.nombre;
                                                                const baseEstadoNombre = estadosUnidad.find(e => String(e.id_estado_unidad) === unitForm.id_estado_unidad)?.nombre;
                                                                return (
                                                                <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                                    <td className="px-2 py-1.5 text-gray-400 font-medium text-center">{i + 1}</td>
                                                                    <td className="px-1 py-1.5">
                                                                        <input type="text" value={row.codigo} onChange={e => updateRow(i, 'codigo', e.target.value)}
                                                                            className="w-full min-w-[80px] border border-gray-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 bg-white" />
                                                                    </td>
                                                                    <td className="px-1 py-1.5">
                                                                        <select value={row.id_tipo_inmueble} onChange={e => updateRow(i, 'id_tipo_inmueble', e.target.value)}
                                                                            className="w-full min-w-[110px] border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 bg-gray-50">
                                                                            <option value="">{baseTipoNombre ? `↳ ${baseTipoNombre}` : '— sin base'}</option>
                                                                            {tiposInmueble.map(t => <option key={t.id_tipo_inmueble} value={t.id_tipo_inmueble}>{t.nombre}</option>)}
                                                                        </select>
                                                                    </td>
                                                                    <td className="px-1 py-1.5">
                                                                        <input type="text" inputMode="decimal" placeholder={unitForm.m2_construccion || '—'} value={row.m2_construccion} onChange={e => updateRow(i, 'm2_construccion', e.target.value)}
                                                                            className="w-full min-w-[70px] border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 bg-gray-50" />
                                                                    </td>
                                                                    <td className="px-1 py-1.5">
                                                                        <input type="text" inputMode="decimal" placeholder={unitForm.m2_terreno || '—'} value={row.m2_terreno} onChange={e => updateRow(i, 'm2_terreno', e.target.value)}
                                                                            className="w-full min-w-[70px] border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 bg-gray-50" />
                                                                    </td>
                                                                    <td className="px-1 py-1.5">
                                                                        <input type="text" inputMode="decimal" placeholder={unitForm.precios_lista || '—'} value={row.precios_lista} onChange={e => updateRow(i, 'precios_lista', e.target.value)}
                                                                            className="w-full min-w-[80px] border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 bg-white" />
                                                                    </td>
                                                                    <td className="px-1 py-1.5">
                                                                        <select value={row.id_estado_unidad} onChange={e => updateRow(i, 'id_estado_unidad', e.target.value)}
                                                                            className="w-full min-w-[100px] border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 bg-gray-50">
                                                                            <option value="">{baseEstadoNombre ? `↳ ${baseEstadoNombre}` : '— sin base'}</option>
                                                                            {estadosUnidad.map(est => <option key={est.id_estado_unidad} value={est.id_estado_unidad}>{est.nombre}</option>)}
                                                                        </select>
                                                                    </td>
                                                                </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="border-t border-gray-100 px-3 py-2">
                                                    <button type="button" onClick={addBulkRow}
                                                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium">
                                                        <Plus className="w-3.5 h-3.5" />Agregar fila
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-xs text-gray-400">Los campos vacíos usan el valor base · Puedes pegar desde Excel directo en la tabla</p>

                                            {/* Progress bar */}
                                            {bulkProgress && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                                        <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />Creando unidades…</span>
                                                        <span>{bulkProgress.done}/{bulkProgress.total}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                                        <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* ════════════════ EDIT MODE ════════════════ */
                                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                                        {/* Desarrollo */}
                                        <div className="space-y-3">
                                            <SectionLabel>Desarrollo</SectionLabel>
                                            <F label="Desarrollo" required>
                                                <select value={unitForm.id_desarrollo} onChange={e => setUnitForm(p => ({ ...p, id_desarrollo: e.target.value }))} className={inputCls}>
                                                    <option value="">Seleccionar desarrollo…</option>
                                                    {developments.map(d => <option key={d.id_desarrollo} value={d.id_desarrollo}>{d.nombre}</option>)}
                                                </select>
                                            </F>
                                        </div>

                                        {/* Identificación: 3 cols */}
                                        <div className="space-y-3">
                                            <SectionLabel>Identificación</SectionLabel>
                                            <div className="grid grid-cols-3 gap-4">
                                                <F label="Código de unidad">
                                                    <input type="text" placeholder="Ej. CASA-01"
                                                        value={unitForm.codigo_unidad} onChange={e => setUnitForm(p => ({ ...p, codigo_unidad: e.target.value }))} className={inputCls} />
                                                </F>
                                                <F label="Nivel / Piso">
                                                    <input type="text" placeholder="Ej. PB, 1, 3A"
                                                        value={unitForm.nivel_piso} onChange={e => setUnitForm(p => ({ ...p, nivel_piso: e.target.value }))} className={inputCls} />
                                                </F>
                                                <F label="Descripción / Nombre">
                                                    <input type="text" placeholder="Ej. Estudio B #408, Casa base + cochera…"
                                                        value={unitForm.descripcion} onChange={e => setUnitForm(p => ({ ...p, descripcion: e.target.value }))} className={inputCls} />
                                                </F>
                                            </div>
                                        </div>

                                        {/* Clasificación */}
                                        <div className="space-y-3">
                                            <SectionLabel>Clasificación</SectionLabel>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <F label="Tipo de inmueble">
                                                    <select value={unitForm.id_tipo_inmueble} onChange={e => setUnitForm(p => ({ ...p, id_tipo_inmueble: e.target.value }))} className={inputCls}>
                                                        <option value="">Seleccionar…</option>
                                                        {tiposInmueble.map(t => <option key={t.id_tipo_inmueble} value={t.id_tipo_inmueble}>{t.nombre}</option>)}
                                                    </select>
                                                </F>
                                                <F label="Tipo de proyecto">
                                                    <select value={unitForm.tipo_proyecto} onChange={e => setUnitForm(p => ({ ...p, tipo_proyecto: e.target.value }))} className={inputCls}>
                                                        <option value="RESIDENCIAL">RESIDENCIAL</option>
                                                        <option value="COMERCIAL">COMERCIAL</option>
                                                        <option value="INDUSTRIAL">INDUSTRIAL</option>
                                                        <option value="MIXTO">MIXTO</option>
                                                        <option value="TURISTICO">TURÍSTICO</option>
                                                    </select>
                                                </F>
                                                <F label="Tipo de propiedad">
                                                    <select value={unitForm.id_tipo_propiedad} onChange={e => setUnitForm(p => ({ ...p, id_tipo_propiedad: e.target.value }))} className={inputCls}>
                                                        <option value="">Seleccionar…</option>
                                                        {tiposPropiedad.map(t => <option key={t.id_tipo_propiedad} value={t.id_tipo_propiedad}>{t.descripcion}</option>)}
                                                    </select>
                                                </F>
                                                <F label="Estado">
                                                    <select value={unitForm.id_estado_unidad} onChange={e => setUnitForm(p => ({ ...p, id_estado_unidad: e.target.value }))} className={inputCls}>
                                                        <option value="">Seleccionar…</option>
                                                        {estadosUnidad.map(est => <option key={est.id_estado_unidad} value={est.id_estado_unidad}>{est.nombre}</option>)}
                                                    </select>
                                                </F>
                                            </div>
                                        </div>

                                        {/* Superficie y precio */}
                                        <div className="space-y-3">
                                            <SectionLabel>Superficie y precio</SectionLabel>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                <F label="m² Terreno">
                                                    <input type="text" inputMode="decimal" placeholder="0"
                                                        value={unitForm.m2_terreno} onChange={e => setUnitForm(p => ({ ...p, m2_terreno: e.target.value }))} className={inputCls} />
                                                </F>
                                                <F label="m² Construcción">
                                                    <input type="text" inputMode="decimal" placeholder="0"
                                                        value={unitForm.m2_construccion} onChange={e => setUnitForm(p => ({ ...p, m2_construccion: e.target.value }))} className={inputCls} />
                                                </F>
                                                <F label="Moneda">
                                                    <select value={unitForm.moneda} onChange={e => setUnitForm(p => ({ ...p, moneda: e.target.value }))} className={inputCls}>
                                                        <option value="MXN">MXN</option>
                                                        <option value="USD">USD</option>
                                                    </select>
                                                </F>
                                                <F label="Precio lista">
                                                    <input type="text" inputMode="decimal" placeholder="0"
                                                        value={unitForm.precios_lista} onChange={e => setUnitForm(p => ({ ...p, precios_lista: e.target.value }))} className={inputCls} />
                                                </F>
                                                <F label="% Comisión (esta unidad)">
                                                    <div className="relative">
                                                        <input type="text" inputMode="decimal" placeholder="Ej. 6"
                                                            value={unitForm.porcentaje_comision} onChange={e => setUnitForm(p => ({ ...p, porcentaje_comision: e.target.value }))} className={inputCls} />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                                                    </div>
                                                </F>
                                                <F label="Comisión calculada">
                                                    <div className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`}>
                                                        {unitForm.precios_lista && unitForm.porcentaje_comision
                                                            ? formatCurrency(Number(unitForm.precios_lista) * (Number(unitForm.porcentaje_comision) / 100))
                                                            : '—'}
                                                    </div>
                                                </F>
                                            </div>
                                        </div>

                                        {/* Ubicación y fechas */}
                                        <div className="space-y-3">
                                            <SectionLabel>Ubicación y fechas</SectionLabel>
                                            <F label="Ubicación / Dirección">
                                                <input type="text" placeholder="Ej. Amado Nervo 240, Col. Centro…"
                                                    value={unitForm.direccion} onChange={e => setUnitForm(p => ({ ...p, direccion: e.target.value }))} className={inputCls} />
                                            </F>
                                            <div className="grid grid-cols-2 gap-4">
                                                <F label="Fecha de obtención">
                                                    <input type="date" value={unitForm.fecha_obtencion} onChange={e => setUnitForm(p => ({ ...p, fecha_obtencion: e.target.value }))} className={inputCls} />
                                                </F>
                                                <F label="Fecha de terminación">
                                                    <input type="date" value={unitForm.fecha_terminacion} onChange={e => setUnitForm(p => ({ ...p, fecha_terminacion: e.target.value }))} className={inputCls} />
                                                </F>
                                            </div>
                                        </div>

                                        {/* Imágenes */}
                                        <div className="space-y-3">
                                            <SectionLabel>Imágenes{imagePreviews.length > 0 ? ` (${imagePreviews.length})` : ''}</SectionLabel>
                                            <div className="grid grid-cols-4 gap-2">
                                                {imagePreviews.map((src, idx) => (
                                                    <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video">
                                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setImagePreviews(p => p.filter((_, i) => i !== idx))}
                                                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-lg aspect-video cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                                                    <ImagePlus className="w-4 h-4 text-gray-300" />
                                                    <span className="text-[10px] text-gray-400">Añadir</span>
                                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
                                    <button onClick={closeUnitModal} disabled={!!bulkProgress}
                                        className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                                        Cancelar
                                    </button>
                                    <button onClick={handleUnitSubmit}
                                        disabled={submittingUnit || !unitForm.id_desarrollo || !!bulkProgress}
                                        className={`flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                            ${unitModalMode === 'create' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-[#0A1128] hover:bg-[#0A1128]/90'}`}>
                                        {submittingUnit && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {unitModalMode === 'edit' ? 'Guardar cambios' : `Crear ${unitForm.quantity} ${Number(unitForm.quantity) === 1 ? 'unidad' : 'unidades'}`}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── MODAL: Nuevo / Editar Desarrollo ── */}
            {showDevelopModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">{developModalMode === 'edit' ? 'Editar Desarrollo' : 'Nuevo Desarrollo'}</h2>
                            <button onClick={closeDevelopModal} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
                            <F label="Nombre del desarrollo" required>
                                <input type="text" placeholder="Ej. Residencial Los Pinos" value={developForm.nombre}
                                    onChange={e => setDevelopForm(p => ({ ...p, nombre: e.target.value }))} className={inputCls} />
                            </F>
                            <F label="Desarrollador">
                                <select value={developForm.id_desarrollador} onChange={e => setDevelopForm(p => ({ ...p, id_desarrollador: e.target.value }))} className={inputCls}>
                                    <option value="">Sin asignar</option>
                                    {developers.map(d => <option key={d.id_desarrollador} value={d.id_desarrollador}>{d.nombre}</option>)}
                                </select>
                            </F>
                            <F label="Alcance del proyecto">
                                <select value={developForm.alcance} onChange={e => setDevelopForm(p => ({ ...p, alcance: e.target.value }))} className={inputCls}>
                                    <option value="LOCAL">LOCAL</option>
                                    <option value="NACIONAL">NACIONAL</option>
                                </select>
                            </F>
                            <div className="grid grid-cols-2 gap-4">
                                <F label="Estado relación desarrollador">
                                    <select value={developForm.id_estado_relac_des} onChange={e => setDevelopForm(p => ({ ...p, id_estado_relac_des: e.target.value }))} className={inputCls}>
                                        <option value="">Seleccionar…</option>
                                        {estadosRelacDes.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                                    </select>
                                </F>
                                <F label="Origen del proyecto">
                                    <select value={developForm.id_origen_proyecto} onChange={e => setDevelopForm(p => ({ ...p, id_origen_proyecto: e.target.value }))} className={inputCls}>
                                        <option value="">Seleccionar…</option>
                                        {origenesProyecto.map(o => <option key={o.id_origen_proyecto} value={o.id_origen_proyecto}>{o.nombre}</option>)}
                                    </select>
                                </F>
                                <F label="Nivel certeza legal">
                                    <select value={developForm.nivel_certeza_legal} onChange={e => setDevelopForm(p => ({ ...p, nivel_certeza_legal: e.target.value }))} className={inputCls}>
                                        <option value="">Seleccionar…</option>
                                        {nivelesCerteza.map(n => <option key={n.id_nivel} value={n.id_nivel}>{n.nombre}</option>)}
                                    </select>
                                </F>
                                <F label="Estado documentación">
                                    <select value={developForm.cat_estado_doc} onChange={e => setDevelopForm(p => ({ ...p, cat_estado_doc: e.target.value }))} className={inputCls}>
                                        <option value="">Seleccionar…</option>
                                        {estadosDoc.map(e => <option key={e.id_estado_doc} value={e.id_estado_doc}>{e.nombre}</option>)}
                                    </select>
                                </F>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <F label="% Comisión (empresa)">
                                    <div className="relative">
                                        <input type="text" inputMode="decimal" placeholder="Ej. 6"
                                            value={developForm.porcentaje_comision} onChange={e => setDevelopForm(p => ({ ...p, porcentaje_comision: e.target.value }))} className={inputCls} />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                                    </div>
                                </F>
                                <F label="% Comisión vendedor">
                                    <div className="relative">
                                        <input type="text" inputMode="decimal" placeholder="Ej. 30"
                                            value={developForm.comision_vendedor} onChange={e => setDevelopForm(p => ({ ...p, comision_vendedor: e.target.value }))} className={inputCls} />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                                    </div>
                                </F>
                            </div>
                            <div className="pt-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Métodos de pago</span>
                                    <div className="flex-1 h-px bg-gray-100" />
                                </div>
                                <div className="space-y-3">
                                    <F label="Contado">
                                        <textarea rows={2} placeholder="Ej. Contado con 90% enganche, 0% mensualidad y entrega del 10%"
                                            value={developForm.metodo_contado} onChange={e => setDevelopForm(p => ({ ...p, metodo_contado: e.target.value }))}
                                            className={`${inputCls} resize-none`} />
                                    </F>
                                    <F label="Crédito hipotecario">
                                        <textarea rows={2} placeholder="Ej. 12 meses con un enganche del 25%, 50% de mensualidad y 25% de entrega"
                                            value={developForm.metodo_hipotecario} onChange={e => setDevelopForm(p => ({ ...p, metodo_hipotecario: e.target.value }))}
                                            className={`${inputCls} resize-none`} />
                                    </F>
                                    <F label="Financiamiento propio">
                                        <textarea rows={2} placeholder="Ej. 30% de enganche más 70% a la escritura O 20% enganche + 40% meses + 40% entrega"
                                            value={developForm.metodo_financiamiento} onChange={e => setDevelopForm(p => ({ ...p, metodo_financiamiento: e.target.value }))}
                                            className={`${inputCls} resize-none`} />
                                    </F>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                            <button onClick={closeDevelopModal} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                            <button onClick={handleDevelopSubmit} disabled={submittingDevelop || !developForm.nombre.trim()}
                                className="px-5 py-2 text-sm font-medium bg-[#0A1128] text-white rounded-lg hover:bg-[#0A1128]/90 disabled:opacity-50 transition-colors">
                                {submittingDevelop ? 'Guardando…' : developModalMode === 'edit' ? 'Guardar cambios' : 'Crear desarrollo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: Nuevo / Editar Desarrollador ── */}
            {showDevModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">{devModalMode === 'edit' ? 'Editar Desarrollador' : 'Nuevo Desarrollador'}</h2>
                            <button onClick={closeDevModal} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <F label="Nombre" required>
                                <input type="text" placeholder="Nombre del desarrollador / empresa" value={devForm.nombre}
                                    onChange={e => setDevForm(p => ({ ...p, nombre: e.target.value }))} className={inputCls} />
                            </F>
                            <F label="Ubicación">
                                <input type="text" placeholder="Ciudad o estado" value={devForm.ubicacion}
                                    onChange={e => setDevForm(p => ({ ...p, ubicacion: e.target.value }))} className={inputCls} />
                            </F>
                            <div className="grid grid-cols-2 gap-4">
                                <F label="Email">
                                    <input type="email" placeholder="correo@empresa.com" value={devForm.email}
                                        onChange={e => setDevForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                                </F>
                                <F label="Teléfono">
                                    <input type="tel" placeholder="+52 800 000 0000" value={devForm.telefono}
                                        onChange={e => setDevForm(p => ({ ...p, telefono: e.target.value }))} className={inputCls} />
                                </F>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                            <button onClick={closeDevModal} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                            <button onClick={handleDevSubmit} disabled={submittingDev || !devForm.nombre.trim()}
                                className="px-5 py-2 text-sm font-medium bg-[#0A1128] text-white rounded-lg hover:bg-[#0A1128]/90 disabled:opacity-50 transition-colors">
                                {submittingDev ? 'Guardando…' : devModalMode === 'edit' ? 'Guardar cambios' : 'Crear desarrollador'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm deletes ── */}
            {deleteDev && (
                <ConfirmDelete label={`¿Eliminar desarrollador "${deleteDev.nombre}"? Esta acción no se puede deshacer.`}
                    onConfirm={() => handleDevDelete(deleteDev.id_desarrollador)} onCancel={() => setDeleteDev(null)} />
            )}
            {deleteDevelop && (
                <ConfirmDelete label={`¿Eliminar desarrollo "${deleteDevelop.nombre}"? Se eliminarán también todas sus unidades.`}
                    onConfirm={() => handleDevelopDelete(deleteDevelop.id_desarrollo)} onCancel={() => setDeleteDevelop(null)} />
            )}
        </div>
    );
}

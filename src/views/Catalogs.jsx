import { useState, useEffect } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Search, AlertTriangle, X, Loader2, Database } from 'lucide-react';

// ─── Catalog definitions ──────────────────────────────────────────────────────
// Each entry maps a catalog to its endpoint, primary-key field, and editable fields.

const CATALOGS = [
    // ── Inventario ──────────────────────────────────────────────────────────────
    {
        key: 'estados-unidad', label: 'Estados de unidad', group: 'Inventario',
        endpoint: '/api/catalogs/estados-unidad', pk: 'id_estado_unidad',
        fields: [
            { key: 'codigo',  label: 'Código', required: true },
            { key: 'nombre',  label: 'Nombre', required: true },
        ],
    },
    {
        key: 'tipos-inmueble', label: 'Tipos de inmueble', group: 'Inventario',
        endpoint: '/api/catalogs/tipos-inmueble', pk: 'id_tipo_inmueble',
        fields: [
            { key: 'codigo', label: 'Código', required: true },
            { key: 'nombre', label: 'Nombre', required: true },
        ],
    },
    {
        key: 'tipos-propiedad', label: 'Tipos de propiedad', group: 'Inventario',
        endpoint: '/api/catalogs/tipos-propiedad', pk: 'id_tipo_propiedad',
        fields: [
            { key: 'tenencia',   label: 'Tenencia' },
            { key: 'uso',        label: 'Uso' },
            { key: 'tipologia',  label: 'Tipología' },
            { key: 'descripcion', label: 'Descripción' },
        ],
    },
    {
        key: 'tipos-proyecto', label: 'Tipos de proyecto', group: 'Inventario',
        endpoint: '/api/catalogs/tipos-proyecto', pk: 'id_tipo_proyecto',
        fields: [
            { key: 'codigo', label: 'Código', required: true },
            { key: 'nombre', label: 'Nombre', required: true },
        ],
    },
    {
        key: 'origenes-proyecto', label: 'Orígenes de proyecto', group: 'Inventario',
        endpoint: '/api/catalogs/origenes-proyecto', pk: 'id_origen_proyecto',
        fields: [
            { key: 'codigo', label: 'Código', required: true },
            { key: 'nombre', label: 'Nombre', required: true },
        ],
    },
    {
        key: 'niveles-certeza-legal', label: 'Niveles certeza legal', group: 'Inventario',
        endpoint: '/api/catalogs/niveles-certeza-legal', pk: 'id_nivel',
        fields: [
            { key: 'codigo', label: 'Código', required: true },
            { key: 'nombre', label: 'Nombre', required: true },
        ],
    },
    {
        key: 'estados-documentacion', label: 'Estados de documentación', group: 'Inventario',
        endpoint: '/api/catalogs/estados-documentacion', pk: 'id_estado_doc',
        fields: [
            { key: 'codigo', label: 'Código', required: true },
            { key: 'nombre', label: 'Nombre', required: true },
        ],
    },
    {
        key: 'estados-relacion-desarrollador', label: 'Rel. desarrollador', group: 'Inventario',
        endpoint: '/api/catalogs/estados-relacion-desarrollador', pk: 'id_estado',
        fields: [
            { key: 'codigo', label: 'Código', required: true },
            { key: 'nombre', label: 'Nombre', required: true },
        ],
    },
    // ── CRM ──────────────────────────────────────────────────────────────────────
    {
        key: 'servicios', label: 'Servicios', group: 'CRM',
        endpoint: '/api/catalogs/servicios', pk: 'id_servicio',
        fields: [
            { key: 'codigo', label: 'Código',  required: true },
            { key: 'nombre', label: 'Nombre',  required: true },
            { key: 'activo', label: 'Estado',  type: 'boolean' },
        ],
    },
    {
        key: 'metodos-pago', label: 'Métodos de pago', group: 'CRM',
        endpoint: '/api/catalogs/metodos-pago', pk: 'id_metodo_pago',
        fields: [
            { key: 'codigo', label: 'Código', required: true },
            { key: 'nombre', label: 'Nombre', required: true },
        ],
    },
    {
        key: 'subtipos-habitacional', label: 'Subtipos habitacional', group: 'CRM',
        endpoint: '/api/catalogs/subtipos-habitacional', pk: 'id_subtipo',
        fields: [
            { key: 'codigo', label: 'Código', required: true },
            { key: 'nombre', label: 'Nombre', required: true },
        ],
    },
];

const GROUPS = ['Inventario', 'CRM'];

const emptyForm = (cat) =>
    Object.fromEntries(cat.fields.map(f => [f.key, f.type === 'boolean' ? true : '']));

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white';

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Catalogs() {
    const [selectedKey, setSelectedKey]     = useState(CATALOGS[0].key);
    const [items, setItems]                 = useState([]);
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState(null);
    const [search, setSearch]               = useState('');

    const [modal, setModal]                 = useState(null);  // { mode:'add'|'edit', item?, form:{} }
    const [saving, setSaving]               = useState(false);
    const [deleteTarget, setDeleteTarget]   = useState(null);
    const [deleting, setDeleting]           = useState(false);

    const cat = CATALOGS.find(c => c.key === selectedKey);

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchItems = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(cat.endpoint);
            if (!res.ok) throw new Error('Error al cargar el catálogo');
            setItems(await res.json());
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { setSearch(''); fetchItems(); }, [selectedKey]);

    // ── Modal helpers ────────────────────────────────────────────────────────
    const openAdd = () => setModal({ mode: 'add', form: emptyForm(cat) });

    const openEdit = (item) => {
        const form = Object.fromEntries(
            cat.fields.map(f => [f.key, item[f.key] ?? (f.type === 'boolean' ? true : '')])
        );
        setModal({ mode: 'edit', item, form });
    };

    const closeModal = () => { if (!saving) setModal(null); };

    const setField = (key, value) =>
        setModal(p => ({ ...p, form: { ...p.form, [key]: value } }));

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const { mode, item, form } = modal;
            // Filter out empty strings (treat '' as "not provided")
            const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
            const url    = mode === 'edit' ? `${cat.endpoint}/${item[cat.pk]}` : cat.endpoint;
            const method = mode === 'edit' ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            if (!res.ok) {
                const { message } = await res.json().catch(() => ({}));
                throw new Error(message || 'Error al guardar');
            }
            setModal(null); fetchItems();
        } catch (e) { alert(e.message); }
        finally { setSaving(false); }
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteTarget || deleting) return;
        setDeleting(true);
        try {
            const res = await fetch(`${cat.endpoint}/${deleteTarget[cat.pk]}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar. Es posible que este registro esté en uso.');
            setDeleteTarget(null); fetchItems();
        } catch (e) { alert(e.message); }
        finally { setDeleting(false); }
    };

    // ── Filter ───────────────────────────────────────────────────────────────
    const filtered = items.filter(item =>
        cat.fields.some(f =>
            String(item[f.key] ?? '').toLowerCase().includes(search.toLowerCase())
        )
    );

    // ── Is form valid? ────────────────────────────────────────────────────────
    const isValid = modal
        ? cat.fields.filter(f => f.required).every(f => modal.form[f.key]?.toString().trim())
        : false;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-5 min-h-full">

            {/* ── Left nav ── */}
            <div className="w-52 shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden self-start sticky top-0">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-[#0A1128]">
                    <Database className="w-4 h-4 text-white/60" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/80">Catálogos</span>
                </div>
                <div className="py-1.5">
                    {GROUPS.map(group => (
                        <div key={group}>
                            <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                {group}
                            </div>
                            {CATALOGS.filter(c => c.group === group).map(c => (
                                <button
                                    key={c.key}
                                    onClick={() => setSelectedKey(c.key)}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors border-l-2 ${
                                        selectedKey === c.key
                                            ? 'bg-blue-50 text-blue-700 font-medium border-blue-500'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                                    }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right panel ── */}
            <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col min-w-0 overflow-hidden">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">{cat.label}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {loading ? 'Cargando…' : `${filtered.length} de ${items.length} entradas`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar…"
                                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-44"
                            />
                        </div>
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#0A1128] text-white rounded-lg hover:bg-[#0A1128]/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />Nuevo
                        </button>
                    </div>
                </div>

                {/* Body */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-24">
                        <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
                    </div>
                ) : error ? (
                    <div className="flex-1 flex items-center justify-center py-24 flex-col gap-3 text-sm text-red-500">
                        <AlertTriangle className="w-6 h-6" />
                        {error}
                        <button onClick={fetchItems} className="text-blue-600 underline text-xs">Reintentar</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                                    <th className="pl-5 pr-3 py-3 text-left w-10 font-medium text-gray-300">#</th>
                                    {cat.fields.map(f => (
                                        <th key={f.key} className="px-4 py-3 text-left font-medium">{f.label}</th>
                                    ))}
                                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={cat.fields.length + 2} className="text-center py-20 text-gray-400 text-sm">
                                            {search ? 'Sin coincidencias.' : 'Este catálogo está vacío. Crea el primer registro.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((item, i) => (
                                        <tr key={item[cat.pk]} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors group">
                                            <td className="pl-5 pr-3 py-3 text-gray-300 text-xs tabular-nums">{i + 1}</td>
                                            {cat.fields.map(f => (
                                                <td key={f.key} className="px-4 py-3 text-gray-700">
                                                    {f.type === 'boolean' ? (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            item[f.key]
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {item[f.key] ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    ) : (
                                                        item[f.key] != null && item[f.key] !== ''
                                                            ? item[f.key]
                                                            : <span className="text-gray-300 text-xs">—</span>
                                                    )}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(item)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Modal: Add / Edit ── */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#0A1128]/5 flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-[#0A1128]" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900">
                                        {modal.mode === 'add' ? 'Nuevo registro' : 'Editar registro'}
                                    </h2>
                                    <p className="text-xs text-gray-400">{cat.label}</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            {cat.fields.map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                        {f.label}
                                        {f.required && <span className="text-red-500 ml-0.5">*</span>}
                                    </label>
                                    {f.type === 'boolean' ? (
                                        <select
                                            value={modal.form[f.key] ? 'true' : 'false'}
                                            onChange={e => setField(f.key, e.target.value === 'true')}
                                            className={inputCls}
                                        >
                                            <option value="true">Activo</option>
                                            <option value="false">Inactivo</option>
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={modal.form[f.key]}
                                            onChange={e => setField(f.key, e.target.value)}
                                            placeholder={f.label}
                                            className={inputCls}
                                            autoFocus={cat.fields.indexOf(f) === 0}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={closeModal} disabled={saving}
                                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !isValid}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-[#0A1128] text-white rounded-lg hover:bg-[#0A1128]/90 disabled:opacity-50 transition-colors"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {modal.mode === 'add' ? 'Crear' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm Delete ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900">¿Eliminar registro?</div>
                                <div className="text-sm text-gray-500 mt-1">
                                    Esta acción es permanente y puede afectar registros que ya usen este catálogo (propiedades, leads, etc.).
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                                Cancelar
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

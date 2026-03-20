import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Users, MoreHorizontal, Plus, Search, Filter, Download, Upload,
    Mail, Phone, Calendar, MessageSquare, ChevronLeft,
    ChevronRight, X, LayoutGrid, List, Send, AlertTriangle,
    Check, Trash2, UserCheck, Tag, ArrowLeft, StickyNote, Clock,
    Bot, Loader2, Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── OpenRouter AI config ──────────────────────────────────────────────────
// NOTE: move this to an env variable (VITE_OPENROUTER_KEY) before production
const OPENROUTER_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ─── Helpers ───────────────────────────────────────────────────────────────
const getLeadScore = (lead) => {
    let score = 40;
    if (lead.prioridad === 'URGENTE') score += 40;
    else if (lead.prioridad === 'ALTA') score += 25;
    else if (lead.prioridad === 'BAJA') score -= 15;
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
    const diff = Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24));
    return diff;
};

const MOCK_SUGGESTS = ['¿Confirmamos la cita?', 'Te envío el catálogo', '¿Dudas con crédito?'];

// ─── Badge helpers ──────────────────────────────────────────────────────────
const getStatusBadge = (estado) => {
    switch (estado) {
        case 'CALIFICADO':
        case 'CERRADO': return 'bg-emerald-100 text-emerald-700';
        case 'DESCARTADO':
        case 'PERDIDO': return 'bg-gray-100 text-gray-500';
        case 'EN PROCESO': return 'bg-amber-100 text-amber-700';
        default: return 'bg-sky-100 text-sky-700';
    }
};

const getPriorityBadge = (prio) => {
    switch (prio) {
        case 'URGENTE': return 'bg-red-100 text-red-700';
        case 'ALTA': return 'bg-amber-100 text-amber-700';
        case 'MEDIA': return 'bg-sky-100 text-sky-700';
        default: return 'bg-gray-100 text-gray-500';
    }
};

const getScoreColor = (score) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
};

// ─── Subcomponent: Mobile Card ──────────────────────────────────────────────
function LeadCard({ lead, isActive, isSelected, onSelect, onOpen }) {
    const initials = lead.contacto?.nombre?.substring(0, 2).toUpperCase() || 'LD';
    return (
        <div
            onClick={() => onOpen(lead)}
            className={`bg-white border rounded-xl p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer
                ${isActive ? 'border-[#1a1a2e] ring-1 ring-[#1a1a2e]' : 'border-gray-200'}`}
        >
            <div className="flex items-start gap-3">
                <div onClick={e => { e.stopPropagation(); onSelect(lead.id_lead); }} className="mt-0.5">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-[#1a1a2e] border-[#1a1a2e]' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold border border-indigo-200/50 shrink-0">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-semibold text-gray-900 text-[14px] truncate">{lead.contacto?.nombre || 'Contacto'}</div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${getPriorityBadge(lead.prioridad)}`}>
                            {lead.prioridad || 'MEDIA'}
                        </span>
                    </div>
                    <div className="text-[12px] text-gray-500 truncate mb-2">{lead.contacto?.correo || 'Sin correo'}</div>
                    <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(lead.estado)}`}>
                            {lead.estado}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${getScoreColor(lead.score)}`} style={{ width: `${lead.score}%` }} />
                                </div>
                                <span className="text-[11px] font-bold text-gray-500">{lead.score}</span>
                            </div>
                            <span className="text-[12px] font-semibold text-emerald-700">${lead.valorEstimado.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Subcomponent: Bulk Action Bar ─────────────────────────────────────────
function BulkBar({ count, onClear, onDelete, onAssign, onChangeStatus }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:sticky lg:bottom-auto bg-[#1a1a2e] text-white px-4 py-3 flex items-center gap-3 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mr-auto">
                <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[11px] font-bold">{count}</div>
                <span className="text-[13px] font-medium">seleccionados</span>
            </div>
            <button onClick={onAssign} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[12px] font-medium transition-colors">
                <UserCheck className="w-3.5 h-3.5" /> Asignar
            </button>
            <button onClick={onChangeStatus} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[12px] font-medium transition-colors">
                <Tag className="w-3.5 h-3.5" /> Estado
            </button>
            <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-[12px] font-medium transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
            <button onClick={onClear} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [viewMode, setViewMode] = useState('table');
    const [activeTab, setActiveTab] = useState('todos');
    const [kpiFilter, setKpiFilter] = useState('todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [fEstado, setFEstado] = useState('');
    const [fPrioridad, setFPrioridad] = useState('');
    const [selectedLeads, setSelectedLeads] = useState(new Set());
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
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
    const [panelTab, setPanelTab] = useState('chat');
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const [activityInput, setActivityInput] = useState('');
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showBulkStatusMenu, setShowBulkStatusMenu] = useState(false);
    const chatScrollRef = useRef(null);

    // AI & client simulation
    const [aiLoading, setAiLoading] = useState(false);
    const [showSimModal, setShowSimModal] = useState(false);
    const [simInput, setSimInput] = useState('');
    const [simSubmitting, setSimSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '', correo: '', telefono: '', origen: '', estado: 'NUEVO', prioridad: 'MEDIA', notas_iniciales: ''
    });

    // ── API calls ────────────────────────────────────────────────────────────
    const fetchLeads = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/leads?take=1000');
            if (!res.ok) throw new Error('Error fetching leads');
            const data = await res.json();
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

    useEffect(() => { fetchLeads(); }, []);

    const openLeadPanel = async (lead) => {
        setActivePanelLead(lead);
        setPanelTab('chat');
        try {
            const res = await fetch(`/api/leads/${lead.id_lead}`);
            if (res.ok) {
                const fullData = await res.json();
                setActivePanelLead(prev => ({ ...prev, ...fullData }));
            }
        } catch (e) { console.error('Error fetching lead details:', e); }
    };

    const handleCreateLead = async () => {
        if (!formData.nombre) return alert('El nombre es requerido');
        setSubmitting(true);
        try {
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

    const handleUpdateLeadStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/leads/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus })
            });
            if (!res.ok) throw new Error('Failed to update lead status');
            setLeads(prev => prev.map(l => l.id_lead === id ? { ...l, estado: newStatus } : l));
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
            setLeads(prev => prev.filter(l => l.id_lead !== id));
            if (activePanelLead?.id_lead === id) setActivePanelLead(null);
        } catch (err) {
            console.error(err);
            alert('Error al eliminar lead');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`¿Eliminar ${selectedLeads.size} lead(s)?`)) return;
        for (const id of selectedLeads) {
            await fetch(`/api/leads/${id}`, { method: 'DELETE' });
        }
        setLeads(prev => prev.filter(l => !selectedLeads.has(l.id_lead)));
        setSelectedLeads(new Set());
    };

    const handleBulkChangeStatus = async (newStatus) => {
        for (const id of selectedLeads) {
            await fetch(`/api/leads/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus })
            });
        }
        setLeads(prev => prev.map(l => selectedLeads.has(l.id_lead) ? { ...l, estado: newStatus } : l));
        setSelectedLeads(new Set());
        setShowBulkStatusMenu(false);
    };

    const handleAddActivity = async () => {
        const desc = activityInput.trim();
        if (!desc || !activePanelLead) return;
        try {
            const res = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_lead: activePanelLead.id_lead, tipo: 'NOTE', descripcion: desc })
            });
            if (!res.ok) throw new Error('Error saving activity');
            setActivityInput('');
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

    // Chat
    useEffect(() => {
        if (activePanelLead?.mensajes) {
            const chats = [...activePanelLead.mensajes]
                .sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en))
                .map(a => ({
                    id: a.id_mensaje,
                    from: a.es_entrante ? 'lead' : 'agent',
                    isAI: a.canal === 'AI',
                    text: a.texto,
                    time: new Date(a.creado_en).toLocaleString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true })
                }));
            setChatMessages(chats);
        } else {
            setChatMessages([]);
        }
    }, [activePanelLead?.mensajes]);

    useEffect(() => {
        if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }, [chatMessages, aiLoading]);

    const handleChatSend = async () => {
        const text = chatInput.trim();
        if (!text || !activePanelLead || aiLoading) return;
        setChatInput('');
        try {
            // 1. Save agent message to DB
            const res = await fetch('/api/mensajes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_lead: activePanelLead.id_lead, es_entrante: false, canal: 'WEB', texto: text })
            });
            if (!res.ok) throw new Error('Error saving chat message');

            // Refresh lead to show agent message
            const detailRes = await fetch(`/api/leads/${activePanelLead.id_lead}`);
            if (detailRes.ok) {
                const detailData = await detailRes.json();
                setActivePanelLead(prev => ({ ...prev, ...detailData }));
            }

            // 2. Call OpenRouter AI — responds as the CRM agent
            setAiLoading(true);

            // client msgs = 'user', agent/AI msgs = 'assistant'
            const historyForAI = chatMessages.map(m => ({
                role: m.from === 'lead' ? 'user' : 'assistant',
                content: m.text,
            }));

            const aiRes = await fetch(OPENROUTER_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'RENAV CRM',
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: `Eres un asistente de atención al cliente de RENAV Real Estate Group. Estás respondiendo en nombre del equipo comercial al lead "${activePanelLead.contacto?.nombre || 'cliente'}". Su estado en el CRM es "${activePanelLead.estado}" y prioridad "${activePanelLead.prioridad}". Responde de forma profesional, amable y orientada a cerrar la venta. Sé breve (1-3 oraciones). Habla siempre en español.`,
                        },
                        ...historyForAI,
                        { role: 'user', content: text },
                    ],
                }),
            });

            if (aiRes.ok) {
                const aiData = await aiRes.json();
                const aiText = aiData.choices?.[0]?.message?.content?.trim() || 'Gracias por contactarnos, con gusto te atendemos.';

                // 3. Save AI response as OUTGOING message (the AI responds as the agent)
                await fetch('/api/mensajes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_lead: activePanelLead.id_lead, es_entrante: false, canal: 'AI', texto: aiText }),
                });

                const r2 = await fetch(`/api/leads/${activePanelLead.id_lead}`);
                if (r2.ok) {
                    const rData = await r2.json();
                    setActivePanelLead(prev => ({ ...prev, ...rData }));
                }
            }
        } catch (err) {
            console.error(err);
            alert('Error al enviar el mensaje');
        } finally {
            setAiLoading(false);
        }
    };

    // ── Simulate client message + auto AI response ─────────────────────────
    const handleSimSubmit = async () => {
        const text = simInput.trim();
        if (!text || !activePanelLead) return;
        try {
            setSimSubmitting(true);

            // 1. Save client message (incoming)
            const res = await fetch('/api/mensajes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_lead: activePanelLead.id_lead,
                    es_entrante: true,
                    canal: 'WEB',
                    texto: text,
                }),
            });
            if (!res.ok) throw new Error('Error al guardar el mensaje');
            setSimInput('');
            setShowSimModal(false);

            // Refresh to show client message immediately
            const r = await fetch(`/api/leads/${activePanelLead.id_lead}`);
            if (r.ok) {
                const data = await r.json();
                setActivePanelLead(prev => ({ ...prev, ...data }));
            }

            // 2. Call AI to respond as agent to the client's message
            setAiLoading(true);

            const historyForAI = chatMessages.map(m => ({
                role: m.from === 'lead' ? 'user' : 'assistant',
                content: m.text,
            }));

            const aiRes = await fetch(OPENROUTER_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'RENAV CRM',
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: `Eres un asistente de atención al cliente de RENAV Real Estate Group. Responde en nombre del equipo comercial al lead "${activePanelLead.contacto?.nombre || 'cliente'}". Estado en CRM: "${activePanelLead.estado}", prioridad: "${activePanelLead.prioridad}". Sé profesional, amable y orientado a cerrar la venta. Máximo 2-3 oraciones. Responde siempre en español.`,
                        },
                        ...historyForAI,
                        { role: 'user', content: text },
                    ],
                }),
            });

            if (aiRes.ok) {
                const aiData = await aiRes.json();
                const aiText = aiData.choices?.[0]?.message?.content?.trim() || 'Gracias por contactarnos, con gusto le atendemos.';

                await fetch('/api/mensajes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_lead: activePanelLead.id_lead,
                        es_entrante: false,
                        canal: 'AI',
                        texto: aiText,
                    }),
                });

                const r2 = await fetch(`/api/leads/${activePanelLead.id_lead}`);
                if (r2.ok) {
                    const rData = await r2.json();
                    setActivePanelLead(prev => ({ ...prev, ...rData }));
                }
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setSimSubmitting(false);
            setAiLoading(false);
        }
    };

    // ── Filtering & sorting ──────────────────────────────────────────────────
    const filteredLeads = useMemo(() => {
        let result = leads;
        if (kpiFilter === 'nuevo') result = result.filter(l => l.estado === 'NUEVO');
        else if (kpiFilter === 'en_proceso') result = result.filter(l => l.estado === 'EN PROCESO' || l.estado === 'CALIFICADO');
        else if (kpiFilter === 'urgente') result = result.filter(l => l.prioridad === 'URGENTE');

        if (activeTab === 'nuevo') result = result.filter(l => l.estado === 'NUEVO');
        else if (activeTab === 'en_proceso') result = result.filter(l => l.estado === 'EN PROCESO' || l.estado === 'CALIFICADO');
        else if (activeTab === 'seguimiento') result = result.filter(l => l.diasContacto > 3 && l.estado !== 'DESCARTADO' && l.estado !== 'PERDIDO');
        else if (activeTab === 'descartado') result = result.filter(l => l.estado === 'DESCARTADO' || l.estado === 'PERDIDO');

        if (fEstado) result = result.filter(l => l.estado === fEstado);
        if (fPrioridad) result = result.filter(l => l.prioridad === fPrioridad);

        if (advFilters.servicio) result = result.filter(l => l.solicitudes?.some(s => (s.servicio?.nombre || '').toUpperCase().includes(advFilters.servicio.toUpperCase())));
        if (advFilters.fechaDesde) result = result.filter(l => new Date(l.creado_en) >= new Date(advFilters.fechaDesde + 'T00:00:00'));
        if (advFilters.fechaHasta) result = result.filter(l => new Date(l.creado_en) <= new Date(advFilters.fechaHasta + 'T23:59:59'));
        if (advFilters.estatus_general) {
            const eg = advFilters.estatus_general;
            if (eg === 'NUEVO') result = result.filter(l => l.estado === 'NUEVO');
            else if (eg === 'CERRADO') result = result.filter(l => ['CALIFICADO', 'CERRADO', 'DESCARTADO', 'PERDIDO'].includes(l.estado));
            else if (eg === 'SEGUIMIENTO') result = result.filter(l => l.estado === 'EN PROCESO');
        }
        if (advFilters.tipo_operacion) result = result.filter(l => l.solicitudes?.some(s => (s.servicio?.nombre || '').toUpperCase().includes(advFilters.tipo_operacion.toUpperCase())));
        if (advFilters.tipo_propiedad) {
            const tp = advFilters.tipo_propiedad.toUpperCase();
            result = result.filter(l => l.solicitudes?.some(s => (s.bienes_raices?.tipo_inmueble?.nombre || '').toUpperCase() === tp));
        }
        if (advFilters.ciudad) {
            const c = advFilters.ciudad.toLowerCase();
            result = result.filter(l => (l.contacto?.ciudad || '').toLowerCase().includes(c) || l.solicitudes?.some(s => (s.bienes_raices?.ciudad || '').toLowerCase().includes(c)));
        }
        if (advFilters.clasificacion) {
            const cl = advFilters.clasificacion.toUpperCase();
            result = result.filter(l => l.solicitudes?.some(s => (s.bienes_raices?.zona || '').toUpperCase().includes(cl)));
        }
        if (advFilters.proyecto) {
            const p = advFilters.proyecto.toLowerCase();
            result = result.filter(l => l.solicitudes?.some(s => (s.ubicacion_texto || '').toLowerCase().includes(p)));
        }
        if (advFilters.estacionamientos) result = result.filter(l => l.solicitudes?.some(s => (s.bienes_raices?.estacionamientos || 0) >= parseInt(advFilters.estacionamientos)));
        if (advFilters.m2_terreno_min) result = result.filter(l => l.solicitudes?.some(s => parseFloat(s.bienes_raices?.superficie_m2 || 0) >= parseFloat(advFilters.m2_terreno_min)));
        if (advFilters.m2_construccion_min) result = result.filter(l => l.solicitudes?.some(s => parseFloat(s.bienes_raices?.m2_construidos_requeridos || 0) >= parseFloat(advFilters.m2_construccion_min)));

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l =>
                l.contacto?.nombre?.toLowerCase().includes(q) ||
                l.contacto?.correo?.toLowerCase().includes(q) ||
                String(l.id_lead).includes(q)
            );
        }

        if (sortConfig.key) {
            result = [...result].sort((a, b) => {
                let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
                if (sortConfig.key === 'nombre') { aVal = a.contacto?.nombre || ''; bVal = b.contacto?.nombre || ''; }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [leads, kpiFilter, activeTab, fEstado, fPrioridad, searchQuery, sortConfig, advFilters]);

    const handleSort = (key) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
    const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages || 1); }, [totalPages, currentPage]);

    const stats = useMemo(() => {
        const counts = { total: leads.length, nuevo: 0, proceso: 0, urgente: 0 };
        leads.forEach(l => {
            if (l.estado === 'NUEVO') counts.nuevo++;
            if (l.estado === 'EN PROCESO' || l.estado === 'CALIFICADO') counts.proceso++;
            if (l.prioridad === 'URGENTE') counts.urgente++;
        });
        return counts;
    }, [leads]);

    const toggleAll = (e) => {
        if (e.target.checked) setSelectedLeads(new Set(paginatedLeads.map(l => l.id_lead)));
        else setSelectedLeads(new Set());
    };
    const toggleRow = (id, e) => {
        e?.stopPropagation();
        setSelectedLeads(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleExportExcel = () => {
        const d = filteredLeads.map(l => ({
            ID: l.id_lead, Nombre: l.contacto?.nombre, Correo: l.contacto?.correo,
            Estado: l.estado, Prioridad: l.prioridad, Score: l.score,
            'Valor Est.': l.valorEstimado, Asignado: l.usuario_asignado?.nombre || ''
        }));
        const ws = XLSX.utils.json_to_sheet(d);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Leads');
        XLSX.writeFile(wb, 'Leads_CRM.xlsx');
    };

    const clearAdvFilters = () => setAdvFilters({
        servicio: '', fechaDesde: '', fechaHasta: '', estatus_general: '',
        tipo_operacion: '', tipo_propiedad: '', ciudad: '', proyecto: '',
        estacionamientos: '', clasificacion: '', m2_terreno_min: '', m2_construccion_min: ''
    });

    const kanbanColumns = ['NUEVO', 'EN PROCESO', 'CALIFICADO', 'CERRADO', 'DESCARTADO', 'PERDIDO'];

    // ── Contact action helpers ───────────────────────────────────────────────
    const callLead = (lead) => {
        if (lead?.contacto?.telefono) window.location.href = `tel:${lead.contacto.telefono}`;
        else alert('Este lead no tiene teléfono registrado');
    };
    const emailLead = (lead) => {
        if (lead?.contacto?.correo) window.location.href = `mailto:${lead.contacto.correo}`;
        else alert('Este lead no tiene correo registrado');
    };
    const scheduleLead = (lead) => {
        const subject = encodeURIComponent(`Cita con ${lead?.contacto?.nombre || 'Lead'}`);
        const body = encodeURIComponent(`Hola, quisiera agendar una cita para revisar propiedades.`);
        window.open(`mailto:${lead?.contacto?.correo || ''}?subject=${subject}&body=${body}`);
    };
    const discardLead = async (lead) => {
        if (!window.confirm(`¿Descartar al lead ${lead.contacto?.nombre}?`)) return;
        await handleUpdateLeadStatus(lead.id_lead, 'DESCARTADO');
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex bg-[#fafafa] -m-6 min-h-[calc(100vh-4rem)] text-gray-900 border-t border-transparent relative">

            {/* ── Main column ─────────────────────────────────────────────── */}
            <div className={`flex-1 flex flex-col gap-4 p-4 sm:p-6 transition-all duration-300 min-w-0 ${activePanelLead ? 'lg:max-w-[calc(100%-450px)]' : ''}`}>

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                    <div>
                        <div className="text-xs text-gray-500 mb-0.5">CRM › Leads</div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1a2e]">Módulo de Leads</h1>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={handleExportExcel}
                            className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg bg-white hover:bg-gray-50 flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Exportar</span>
                        </button>
                        <label className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg bg-white hover:bg-gray-50 flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Importar</span>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    alert(`Archivo "${file.name}" seleccionado. Funcionalidad de importación próximamente.`);
                                    e.target.value = '';
                                }}
                            />
                        </label>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-3 py-2 bg-[#1a1a2e] text-white text-sm font-medium rounded-lg hover:bg-[#282846] transition-colors shadow-sm flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" /> Crear lead
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                    {[
                        { key: 'todos', label: 'Total leads', value: stats.total, detail: '↑ 17% vs mes anterior', color: 'text-emerald-600' },
                        { key: 'nuevo', label: 'Sin contactar', value: stats.nuevo, detail: '↑ 2 esta semana', color: 'text-emerald-600' },
                        { key: 'en_proceso', label: 'En proceso', value: stats.proceso, detail: 'Sin cambios', color: 'text-gray-400' },
                        { key: 'urgente', label: 'Urgentes', value: stats.urgente, detail: '↑ 1 hoy', color: 'text-red-600', valueColor: 'text-red-600' },
                    ].map(kpi => (
                        <div
                            key={kpi.key}
                            onClick={() => setKpiFilter(kpi.key)}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer
                                ${kpiFilter === kpi.key ? 'border-gray-800 bg-gray-50' : 'border-transparent bg-white shadow-sm hover:border-gray-200'}`}
                        >
                            <div className="text-xs text-gray-500 mb-1.5">{kpi.label}</div>
                            <div className={`text-2xl sm:text-3xl font-bold mb-1 ${kpi.valueColor || 'text-gray-900'}`}>{kpi.value}</div>
                            <div className={`text-xs font-medium ${kpi.color}`}>{kpi.detail}</div>
                        </div>
                    ))}
                </div>

                {/* Tab bar */}
                <div className="flex border-b border-gray-200 shrink-0 -mb-2 overflow-x-auto">
                    {[
                        { key: 'todos', label: 'Todos' },
                        { key: 'nuevo', label: 'Sin contactar' },
                        { key: 'en_proceso', label: 'En proceso' },
                        { key: 'seguimiento', label: 'Seguimiento' },
                        { key: 'descartado', label: 'Descartados' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                            className={`px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors
                                ${activeTab === tab.key ? 'border-[#1a1a2e] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-3 shrink-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Search - full width on mobile */}
                        <div className={`relative ${showMobileSearch ? 'flex-1' : 'hidden sm:flex'} sm:w-auto sm:max-w-[260px] sm:flex-1`}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar nombre, correo o ID..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#1a1a2e] focus:border-[#1a1a2e] shadow-sm"
                                autoFocus={showMobileSearch}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Mobile search toggle */}
                        <button
                            onClick={() => setShowMobileSearch(v => !v)}
                            className="sm:hidden p-2 border border-gray-200 rounded-lg bg-white shadow-sm"
                        >
                            <Search className="w-4 h-4 text-gray-500" />
                        </button>

                        <select
                            className="py-2 px-3 border border-gray-200 rounded-lg text-[13px] bg-white shadow-sm"
                            value={fEstado}
                            onChange={e => { setFEstado(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">Estado</option>
                            <option value="NUEVO">Nuevo</option>
                            <option value="EN PROCESO">En Proceso</option>
                            <option value="CALIFICADO">Calificado</option>
                            <option value="DESCARTADO">Descartado</option>
                            <option value="PERDIDO">Perdido</option>
                            <option value="CERRADO">Cerrado</option>
                        </select>

                        <select
                            className="py-2 px-3 border border-gray-200 rounded-lg text-[13px] bg-white shadow-sm"
                            value={fPrioridad}
                            onChange={e => { setFPrioridad(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">Prioridad</option>
                            <option value="URGENTE">Urgente</option>
                            <option value="ALTA">Alta</option>
                            <option value="MEDIA">Media</option>
                            <option value="BAJA">Baja</option>
                        </select>

                        <button
                            onClick={() => setShowAdvancedFilters(v => !v)}
                            className={`px-3 py-2 border rounded-lg text-[13px] flex items-center gap-1.5 shadow-sm transition-colors
                                ${showAdvancedFilters ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Filter className="w-4 h-4" />
                            <span className="hidden sm:inline">Filtros</span>
                            {Object.values(advFilters).some(Boolean) && (
                                <span className="w-4 h-4 rounded-full bg-[#1a1a2e] text-white text-[9px] flex items-center justify-center font-bold">
                                    {Object.values(advFilters).filter(Boolean).length}
                                </span>
                            )}
                        </button>

                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-[13px] text-gray-500 hidden sm:inline">{filteredLeads.length} leads</span>
                            <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 px-3 transition-colors flex gap-1.5 items-center text-[13px] font-medium
                                        ${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-50'}`}
                                    title="Vista tabla"
                                >
                                    <List className="w-4 h-4" />
                                    <span className="hidden sm:inline">Tabla</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`p-2 px-3 border-l border-gray-200 transition-colors flex gap-1.5 items-center text-[13px] font-medium
                                        ${viewMode === 'kanban' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-50'}`}
                                    title="Vista kanban"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    <span className="hidden sm:inline">Kanban</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[13px] font-bold text-gray-800">Filtros Avanzados</h3>
                                {Object.values(advFilters).some(Boolean) && (
                                    <button onClick={clearAdvFilters} className="text-[12px] text-gray-500 hover:text-gray-800 underline">Limpiar todo</button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase mb-1">Estatus General</label>
                                    <select value={advFilters.estatus_general} onChange={e => setAdvFilters(p => ({ ...p, estatus_general: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1a1a2e]">
                                        <option value="">Cualquiera</option>
                                        <option value="NUEVO">Nuevo</option>
                                        <option value="SEGUIMIENTO">En Seguimiento</option>
                                        <option value="CERRADO">Cerrado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase mb-1">Servicio</label>
                                    <select value={advFilters.servicio} onChange={e => setAdvFilters(p => ({ ...p, servicio: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1a1a2e]">
                                        <option value="">Todos</option>
                                        <option value="BIENES RAICES">Bienes Raíces</option>
                                        <option value="AVALUO">Avalúo</option>
                                        <option value="DISEÑO Y ARQUITECTURA">Diseño y Arquitectura</option>
                                        <option value="CONSTRUCCION">Construcción</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase mb-1">Fecha Desde</label>
                                    <input type="date" value={advFilters.fechaDesde} onChange={e => setAdvFilters(p => ({ ...p, fechaDesde: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50 focus:bg-white focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 uppercase mb-1">Fecha Hasta</label>
                                    <input type="date" value={advFilters.fechaHasta} onChange={e => setAdvFilters(p => ({ ...p, fechaHasta: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50 focus:bg-white focus:outline-none" />
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-3">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Inmueble Ideal</div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">Operación</label>
                                        <select value={advFilters.tipo_operacion} onChange={e => setAdvFilters(p => ({ ...p, tipo_operacion: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50">
                                            <option value="">Cualquiera</option><option value="VENTA">Venta</option><option value="RENTA">Renta</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">Tipo</label>
                                        <select value={advFilters.tipo_propiedad} onChange={e => setAdvFilters(p => ({ ...p, tipo_propiedad: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50">
                                            <option value="">Cualquiera</option><option value="CASA">Casa</option><option value="DEPARTAMENTO">Depto.</option><option value="LOCAL">Local</option><option value="TERRENO">Terreno</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">Ciudad</label>
                                        <input type="text" placeholder="Ej. Tepic" value={advFilters.ciudad} onChange={e => setAdvFilters(p => ({ ...p, ciudad: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">Clasificación</label>
                                        <select value={advFilters.clasificacion} onChange={e => setAdvFilters(p => ({ ...p, clasificacion: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50">
                                            <option value="">Todas</option><option value="HABITACIONAL">Habitacional</option><option value="COMERCIAL">Comercial</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">M² Terreno (mín)</label>
                                        <input type="number" min="0" placeholder="Ej. 120" value={advFilters.m2_terreno_min} onChange={e => setAdvFilters(p => ({ ...p, m2_terreno_min: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">M² Const. (mín)</label>
                                        <input type="number" min="0" placeholder="Ej. 80" value={advFilters.m2_construccion_min} onChange={e => setAdvFilters(p => ({ ...p, m2_construccion_min: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end mt-3 pt-3 border-t border-gray-100 gap-2">
                                <button onClick={() => setShowAdvancedFilters(false)} className="px-4 py-2 text-[12px] bg-[#1a1a2e] text-white rounded-lg hover:bg-[#282846] font-medium">Aplicar</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading / Error */}
                {loading && (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-[#1a1a2e] border-t-transparent rounded-full animate-spin" />
                            <span className="text-[13px] text-gray-500">Cargando leads...</span>
                        </div>
                    </div>
                )}
                {error && !loading && (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <div className="text-center">
                            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                            <p className="text-[13px] text-gray-600 mb-3">{error}</p>
                            <button onClick={fetchLeads} className="px-4 py-2 bg-[#1a1a2e] text-white text-[13px] rounded-lg hover:bg-[#282846]">Reintentar</button>
                        </div>
                    </div>
                )}

                {/* Table view */}
                {!loading && !error && viewMode === 'table' && (
                    <>
                        {/* Desktop table */}
                        <div className="hidden sm:flex bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-col flex-1 min-h-0">
                            <div className="overflow-x-auto flex-1 relative">
                                <table className="w-full text-left text-[13px] whitespace-nowrap min-w-[600px]">
                                    <thead className="bg-[#f8f9fa] border-b border-gray-200 sticky top-0 z-10">
                                        <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            <th className="px-4 py-3 w-10">
                                                <input type="checkbox" checked={selectedLeads.size === paginatedLeads.length && paginatedLeads.length > 0} onChange={toggleAll} className="rounded border-gray-300 w-3.5 h-3.5" />
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-gray-800" onClick={() => handleSort('nombre')}>
                                                Lead {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-gray-800" onClick={() => handleSort('score')}>
                                                Score {sortConfig.key === 'score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-gray-800" onClick={() => handleSort('valorEstimado')}>
                                                Valor Est. {sortConfig.key === 'valorEstimado' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-gray-800" onClick={() => handleSort('estado')}>Estado</th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-gray-800" onClick={() => handleSort('prioridad')}>Prioridad</th>
                                            {!activePanelLead && <th className="px-4 py-3">Contacto</th>}
                                            {!activePanelLead && <th className="px-4 py-3">Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedLeads.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-16 text-[13px] text-gray-400">
                                                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                    No se encontraron leads con los filtros actuales
                                                </td>
                                            </tr>
                                        ) : paginatedLeads.map(lead => {
                                            const initials = lead.contacto?.nombre?.substring(0, 2).toUpperCase() || 'LD';
                                            const isSelected = selectedLeads.has(lead.id_lead);
                                            const isActive = activePanelLead?.id_lead === lead.id_lead;
                                            return (
                                                <tr
                                                    key={lead.id_lead}
                                                    onClick={() => openLeadPanel(lead)}
                                                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${isActive ? 'bg-sky-50' : isSelected ? 'bg-blue-50/30' : ''}`}
                                                >
                                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
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
                                                        <div className="flex items-center gap-2 w-[72px]">
                                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${getScoreColor(lead.score)}`} style={{ width: `${lead.score}%` }} />
                                                            </div>
                                                            <span className="text-[11px] font-bold text-gray-500 w-6 text-right">{lead.score}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-gray-700">${lead.valorEstimado.toLocaleString()}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(lead.estado)}`}>{lead.estado}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getPriorityBadge(lead.prioridad)}`}>{lead.prioridad || 'MEDIA'}</span>
                                                    </td>
                                                    {!activePanelLead && (
                                                        <td className="px-4 py-3 text-[12px]">
                                                            {lead.diasContacto <= 1 && <span className="text-gray-500">Hoy</span>}
                                                            {lead.diasContacto > 1 && lead.diasContacto <= 3 && <span className="text-gray-500">Hace {lead.diasContacto}d</span>}
                                                            {lead.diasContacto > 3 && lead.diasContacto <= 7 && <span className="text-amber-600 font-medium">Hace {lead.diasContacto}d</span>}
                                                            {lead.diasContacto > 7 && (
                                                                <span className="flex items-center gap-1 text-red-600 font-bold">
                                                                    Hace {lead.diasContacto}d <AlertTriangle className="w-3.5 h-3.5" />
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                    {!activePanelLead && (
                                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                            <div className="flex items-center gap-1.5">
                                                                <button onClick={() => emailLead(lead)} title="Enviar correo" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-all">
                                                                    <Mail className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => callLead(lead)} title="Llamar" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-emerald-600 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-all">
                                                                    <Phone className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => openLeadPanel(lead)} title="Ver detalles" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-all">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            <div className="px-5 py-2.5 border-t border-gray-200 bg-[#f8f9fa] flex items-center justify-between shrink-0">
                                <span className="text-[12px] text-gray-500">
                                    {filteredLeads.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredLeads.length)} de ${filteredLeads.length}` : '0 leads'}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 rounded bg-white border border-gray-300 shadow-sm disabled:opacity-40 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
                                    <span className="text-[12px] font-medium px-2">{currentPage} / {totalPages}</span>
                                    <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 rounded bg-white border border-gray-300 shadow-sm disabled:opacity-40 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile card list */}
                        <div className="flex sm:hidden flex-col gap-3 flex-1">
                            {paginatedLeads.length === 0 ? (
                                <div className="text-center py-16 text-[13px] text-gray-400">
                                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    No se encontraron leads
                                </div>
                            ) : (
                                <>
                                    {paginatedLeads.map(lead => (
                                        <LeadCard
                                            key={lead.id_lead}
                                            lead={lead}
                                            isActive={activePanelLead?.id_lead === lead.id_lead}
                                            isSelected={selectedLeads.has(lead.id_lead)}
                                            onSelect={(id) => toggleRow(id)}
                                            onOpen={openLeadPanel}
                                        />
                                    ))}
                                    {/* Mobile Pagination */}
                                    <div className="flex items-center justify-between py-3 px-1">
                                        <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg bg-white text-[13px] disabled:opacity-40 shadow-sm">
                                            <ChevronLeft className="w-4 h-4" /> Anterior
                                        </button>
                                        <span className="text-[12px] text-gray-500">{currentPage} / {totalPages}</span>
                                        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg bg-white text-[13px] disabled:opacity-40 shadow-sm">
                                            Siguiente <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}

                {/* Kanban view */}
                {!loading && !error && viewMode === 'kanban' && (
                    <div className="flex gap-3 overflow-x-auto pb-4 flex-1 items-start min-h-0">
                        {kanbanColumns.map(status => {
                            const colLeads = filteredLeads.filter(l => l.estado === status);
                            return (
                                <div key={status} className="bg-[#f8f9fa] rounded-xl w-[240px] sm:w-[260px] shrink-0 flex flex-col border border-gray-200/80 shadow-sm max-h-[600px]">
                                    <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-200/80 shrink-0">
                                        <span className="text-[11px] font-bold text-gray-600 tracking-wider uppercase">{status}</span>
                                        <span className="bg-white border border-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{colLeads.length}</span>
                                    </div>
                                    <div className="p-2.5 flex flex-col gap-2 overflow-y-auto flex-1">
                                        {colLeads.map(lead => (
                                            <div
                                                key={lead.id_lead}
                                                onClick={() => openLeadPanel(lead)}
                                                className={`bg-white border text-left rounded-lg p-3 shadow-sm transition-all cursor-pointer
                                                    ${activePanelLead?.id_lead === lead.id_lead ? 'border-[#1a1a2e] ring-1 ring-[#1a1a2e]' : 'border-gray-200 hover:border-gray-400 hover:shadow-md'}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${getPriorityBadge(lead.prioridad)}`}>{lead.prioridad || 'MEDIA'}</span>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${getScoreColor(lead.score)}`} style={{ width: `${lead.score}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-500">{lead.score}</span>
                                                    </div>
                                                </div>
                                                <div className="font-semibold text-[13px] text-gray-900 mb-0.5 truncate">{lead.contacto?.nombre || 'Contacto'}</div>
                                                <div className="text-[11px] text-gray-500 mb-2 truncate">{lead.contacto?.correo || 'Sin correo'}</div>
                                                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                                                    <span className="font-semibold text-emerald-700 text-[12px]">${lead.valorEstimado.toLocaleString()}</span>
                                                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[9px] font-bold border border-gray-200">
                                                        {lead.usuario_asignado?.nombre?.substring(0, 2).toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {colLeads.length === 0 && (
                                            <div className="text-center p-6 text-[12px] text-gray-400">Sin leads</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Detail Panel ────────────────────────────────────────────── */}
            {activePanelLead && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden
                    lg:sticky lg:top-0 lg:w-[450px] lg:h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-4rem)]
                    lg:border-l lg:border-gray-200 lg:shadow-[-8px_0_20px_-10px_rgba(0,0,0,0.06)]
                    lg:z-auto lg:inset-auto lg:shrink-0">

                    {/* Panel Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#f8f9fa] shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <button onClick={() => setActivePanelLead(null)} className="lg:hidden p-1.5 rounded-md hover:bg-gray-200 text-gray-500 shrink-0">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                                <div className="font-semibold text-[15px] truncate">{activePanelLead.contacto?.nombre || 'Lead'}</div>
                                <div className="text-[11px] text-gray-500 truncate">{activePanelLead.contacto?.correo || 'Sin correo'} · {activePanelLead.estado}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => discardLead(activePanelLead)} title="Descartar lead" className="p-1.5 rounded-md hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-colors">
                                <Tag className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDeleteLead(activePanelLead.id_lead)} title="Eliminar lead" className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setActivePanelLead(null)} className="hidden lg:flex p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Lead Summary */}
                    <div className="p-4 border-b border-gray-100 shrink-0">
                        <div className="flex gap-3 items-start mb-4">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1a1a2e]/10 to-[#1a1a2e]/5 text-[#1a1a2e] flex items-center justify-center text-[16px] font-bold border border-[#1a1a2e]/20 shrink-0">
                                {activePanelLead.contacto?.nombre?.substring(0, 2).toUpperCase() || 'LD'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${getPriorityBadge(activePanelLead.prioridad)}`}>
                                        {activePanelLead.prioridad || 'MEDIA'}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] uppercase font-bold rounded-md">
                                        Score {activePanelLead.score}
                                    </span>
                                </div>
                                <div className="text-[11px] text-gray-500">
                                    Asignado: <span className="font-medium text-gray-800">{activePanelLead.usuario_asignado?.nombre || 'Nadie'}</span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-[10px] text-gray-400 mb-0.5">Valor est.</div>
                                <div className="text-[15px] font-bold text-emerald-700">${activePanelLead.valorEstimado?.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="grid grid-cols-4 gap-2">
                            <button
                                onClick={() => emailLead(activePanelLead)}
                                className="flex flex-col items-center gap-1 px-2 py-2 bg-[#1a1a2e] text-white rounded-lg text-[11px] font-medium hover:bg-[#16213e] transition-colors"
                            >
                                <Mail className="w-4 h-4" /> Correo
                            </button>
                            <button
                                onClick={() => callLead(activePanelLead)}
                                className="flex flex-col items-center gap-1 px-2 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-[11px] font-medium hover:bg-gray-50 transition-colors"
                            >
                                <Phone className="w-4 h-4" /> Llamar
                            </button>
                            <button
                                onClick={() => scheduleLead(activePanelLead)}
                                className="flex flex-col items-center gap-1 px-2 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-[11px] font-medium hover:bg-gray-50 transition-colors"
                            >
                                <Calendar className="w-4 h-4" /> Cita
                            </button>
                            <button
                                onClick={() => discardLead(activePanelLead)}
                                className="flex flex-col items-center gap-1 px-2 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-[11px] font-medium hover:bg-red-50 transition-colors"
                            >
                                <X className="w-4 h-4" /> Descartar
                            </button>
                        </div>
                    </div>

                    {/* Panel Tabs */}
                    <div className="flex border-b border-gray-200 bg-gray-50/50 shrink-0 overflow-x-auto">
                        {['chat', 'info', 'actividad', 'score'].map(t => (
                            <button
                                key={t}
                                onClick={() => setPanelTab(t)}
                                className={`px-4 py-3 text-[12px] font-medium capitalize whitespace-nowrap border-b-2 transition-colors flex-1
                                    ${panelTab === t ? 'border-[#1a1a2e] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                            >
                                {t === 'chat' ? 'Chat' : t === 'info' ? 'Info' : t === 'actividad' ? 'Actividad' : 'Score'}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden bg-white">

                        {/* Chat */}
                        {panelTab === 'chat' && (
                            <div className="h-full flex flex-col">
                                {/* AI banner */}
                                <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-violet-50 border-b border-violet-100 shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                                        <span className="text-[11px] text-violet-700 font-medium">IA activa — simula respuestas del cliente</span>
                                    </div>
                                    <button
                                        onClick={() => setShowSimModal(true)}
                                        className="text-[10px] font-semibold text-violet-600 hover:text-violet-800 border border-violet-200 rounded-full px-2 py-0.5 bg-white hover:bg-violet-50 transition-colors whitespace-nowrap"
                                    >
                                        + Simular mensaje
                                    </button>
                                </div>

                                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#fcfcfc]">
                                    {chatMessages.length === 0 ? (
                                        <div className="text-center text-gray-400 text-[12px] p-6 mt-10">
                                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            Sin mensajes aún.<br />Envía el primer mensaje para iniciar.
                                        </div>
                                    ) : chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex flex-col gap-1 max-w-[85%] ${msg.from === 'agent' ? 'self-end items-end' : 'self-start items-start'}`}>
                                            <div className={`p-2.5 px-3.5 rounded-2xl text-[13px] leading-snug border shadow-sm
                                                ${msg.from === 'agent'
                                                    ? msg.isAI
                                                        ? 'bg-violet-600 text-white border-transparent rounded-br-none'
                                                        : 'bg-[#1a1a2e] text-white border-transparent rounded-br-none'
                                                    : 'bg-white border-gray-200 text-gray-800 rounded-bl-none'}`}>
                                                {msg.text}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 px-1">
                                                {msg.from === 'agent'
                                                    ? msg.isAI
                                                        ? <><Bot className="w-3 h-3 text-violet-400" /><span className="text-violet-500 font-medium">IA</span></>
                                                        : 'Tú'
                                                    : 'Lead'}
                                                {' '}• {msg.time}
                                            </div>
                                        </div>
                                    ))}

                                    {/* AI typing indicator */}
                                    {aiLoading && (
                                        <div className="self-start flex flex-col gap-1 max-w-[85%]">
                                            <div className="px-4 py-3 bg-violet-50 border border-violet-200 rounded-2xl rounded-bl-none flex items-center gap-2">
                                                <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
                                                <span className="text-[12px] text-violet-600">Generando respuesta...</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-violet-400 px-1">
                                                <Bot className="w-3 h-3" /> IA
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-gray-200 p-3 bg-white shrink-0">
                                    <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                                        {MOCK_SUGGESTS.map(s => (
                                            <button key={s} onClick={() => setChatInput(s)} className="whitespace-nowrap px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-full text-[11px] hover:bg-blue-50 hover:text-blue-700 transition-colors">
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <textarea
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                                            placeholder="Redactar mensaje..."
                                            rows={1}
                                            disabled={aiLoading}
                                            className="flex-1 p-2.5 min-h-[40px] max-h-[80px] bg-gray-50 text-[13px] border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-gray-300 disabled:opacity-50"
                                        />
                                        <button
                                            onClick={handleChatSend}
                                            disabled={aiLoading || !chatInput.trim()}
                                            className="bg-[#1a1a2e] text-white p-2.5 rounded-lg hover:bg-[#16213e] transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {aiLoading
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Send className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Info */}
                        {panelTab === 'info' && (
                            <div className="h-full overflow-y-auto p-5 text-[13px]">
                                {/* Pipeline */}
                                <div className="mb-6">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Pipeline</h4>
                                    <div className="flex items-center w-full">
                                        {['NUEVO', 'EN PROCESO', 'CALIFICADO', 'CERRADO'].map((st, i) => {
                                            const labels = { 'NUEVO': 'Nuevo', 'EN PROCESO': 'En proceso', 'CALIFICADO': 'Calificado', 'CERRADO': 'Cerrado' };
                                            const order = ['NUEVO', 'EN PROCESO', 'CALIFICADO', 'CERRADO'];
                                            const currentIndex = order.indexOf(activePanelLead.estado);
                                            const isComplete = i < currentIndex;
                                            const isCurrent = i === currentIndex;
                                            return (
                                                <div key={st} onClick={() => handleUpdateLeadStatus(activePanelLead.id_lead, st)} className="flex-1 flex flex-col items-center relative cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded-full z-10 border-2 transition-all
                                                        ${isComplete ? 'border-[#1a1a2e] bg-[#1a1a2e]' : isCurrent ? 'border-[#1a1a2e] ring-4 ring-[#1a1a2e]/20 bg-white' : 'border-gray-300 bg-white group-hover:border-[#1a1a2e]'}`} />
                                                    {i < 3 && (
                                                        <div className={`absolute left-1/2 right-[-50%] top-[7px] h-[2px] z-0 ${isComplete ? 'bg-[#1a1a2e]' : 'bg-gray-200'}`} />
                                                    )}
                                                    <span className={`text-[10px] font-medium mt-2 text-center transition-colors ${i <= currentIndex ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>
                                                        {labels[st]}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Change status */}
                                <div className="mb-6">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Cambiar Estado</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['NUEVO', 'EN PROCESO', 'CALIFICADO', 'CERRADO', 'DESCARTADO', 'PERDIDO'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleUpdateLeadStatus(activePanelLead.id_lead, s)}
                                                className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors
                                                    ${activePanelLead.estado === s
                                                        ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 pt-4 border-t border-gray-100">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Datos de Contacto</h4>
                                    {[
                                        { label: 'Email', value: activePanelLead.contacto?.correo, action: () => emailLead(activePanelLead), actionLabel: '✉' },
                                        { label: 'Teléfono', value: activePanelLead.contacto?.telefono, action: () => callLead(activePanelLead), actionLabel: '☏' },
                                        { label: 'Origen', value: activePanelLead.contacto?.origen || 'Orgánico / API' },
                                        { label: 'Servicio', value: activePanelLead.servicio_principal?.nombre || 'General' },
                                        { label: 'Creado', value: activePanelLead.creado_en ? new Date(activePanelLead.creado_en).toLocaleDateString('es-MX') : 'N/A' },
                                        { label: 'Notas', value: activePanelLead.notas_iniciales || 'Ninguna' },
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between items-center border-b border-gray-100 pb-2 gap-2">
                                            <span className="text-gray-500 shrink-0">{item.label}</span>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="font-medium text-gray-800 truncate">{item.value || 'N/A'}</span>
                                                {item.action && item.value && (
                                                    <button onClick={item.action} className="text-gray-400 hover:text-blue-600 shrink-0 text-[13px]">{item.actionLabel}</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actividad */}
                        {panelTab === 'actividad' && (
                            <div className="h-full overflow-y-auto p-4 bg-gray-50/50">
                                {/* Add note */}
                                <div className="mb-5 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                                    <textarea
                                        value={activityInput}
                                        onChange={e => setActivityInput(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg p-3 text-[13px] focus:outline-none focus:border-gray-400 bg-gray-50 focus:bg-white resize-none"
                                        placeholder="Escribir una nota interna..."
                                        rows={2}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={handleAddActivity}
                                            disabled={!activityInput.trim()}
                                            className="px-3 py-1.5 bg-[#1a1a2e] text-white text-[11px] rounded-lg hover:bg-[#282846] font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5"
                                        >
                                            <StickyNote className="w-3.5 h-3.5" /> Guardar nota
                                        </button>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="relative pl-4 border-l-2 border-gray-200 ml-3 space-y-5">
                                    {activePanelLead.actividades?.map((act) => (
                                        <div key={act.id_actividad} className="relative">
                                            <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-blue-100 border-[3px] border-white" />
                                            <div className="text-[12px] bg-white p-3 border border-gray-100 shadow-sm rounded-lg">
                                                <div className="font-medium text-gray-800 mb-1">{act.tipo === 'NOTE' ? 'Nota interna' : act.tipo}</div>
                                                <div className="text-gray-600 leading-snug break-words whitespace-pre-wrap">{act.descripcion}</div>
                                                <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(act.creada_en).toLocaleString('es-MX')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-100 border-[3px] border-white" />
                                        <div className="text-[12px] bg-white p-3 border border-gray-100 shadow-sm rounded-lg">
                                            <div className="font-medium text-gray-800 mb-1">Lead creado en el sistema</div>
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {activePanelLead.creado_en ? new Date(activePanelLead.creado_en).toLocaleString('es-MX') : 'Fecha desconocida'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Score */}
                        {panelTab === 'score' && (
                            <div className="h-full overflow-y-auto p-5 text-[13px]">
                                <div className={`flex items-center gap-4 border rounded-xl p-4 shadow-sm mb-6
                                    ${activePanelLead.score >= 70 ? 'bg-emerald-50 border-emerald-200' : activePanelLead.score >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-xl font-bold bg-white
                                        ${activePanelLead.score >= 70 ? 'border-emerald-500 text-emerald-700' : activePanelLead.score >= 40 ? 'border-amber-500 text-amber-700' : 'border-red-500 text-red-700'}`}>
                                        {activePanelLead.score}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 text-[15px]">
                                            {activePanelLead.score >= 70 ? 'Lead caliente' : activePanelLead.score >= 40 ? 'Lead templado' : 'Lead frío'}
                                        </div>
                                        <div className="text-gray-500 text-[12px]">Top {Math.round((100 - activePanelLead.score) / 2 + 3)}% de todos los leads</div>
                                    </div>
                                </div>
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Factores de Calificación</h4>
                                <div className="space-y-4">
                                    {[
                                        { lbl: 'Presupuesto', v: Math.min(100, Math.round(activePanelLead.score * 1.05)), c: 'bg-emerald-500' },
                                        { lbl: 'Tiempo de respuesta', v: Math.round(activePanelLead.score * 0.98), c: 'bg-emerald-500' },
                                        { lbl: 'Completitud de info', v: Math.round(activePanelLead.score * 0.75), c: 'bg-amber-500' },
                                        { lbl: 'Engagement', v: Math.round(activePanelLead.score * 0.87), c: activePanelLead.score >= 60 ? 'bg-emerald-500' : 'bg-red-500' },
                                    ].map(f => (
                                        <div key={f.lbl}>
                                            <div className="flex justify-between text-[11px] mb-1.5 font-medium">
                                                <span className="text-gray-600">{f.lbl}</span>
                                                <span className="text-gray-900 font-bold">{f.v}</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${f.c} transition-all duration-500`} style={{ width: `${f.v}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Bulk Action Bar ──────────────────────────────────────────── */}
            {selectedLeads.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50">
                    {showBulkStatusMenu && (
                        <div className="bg-white border border-gray-200 shadow-lg rounded-t-xl p-4 mx-4 mb-0">
                            <div className="text-[12px] font-bold text-gray-600 mb-3 uppercase tracking-wide">Cambiar estado de {selectedLeads.size} leads</div>
                            <div className="grid grid-cols-3 gap-2">
                                {['NUEVO', 'EN PROCESO', 'CALIFICADO', 'CERRADO', 'DESCARTADO', 'PERDIDO'].map(s => (
                                    <button key={s} onClick={() => handleBulkChangeStatus(s)} className="px-3 py-2 border border-gray-200 rounded-lg text-[12px] hover:bg-gray-50 font-medium">{s}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    <BulkBar
                        count={selectedLeads.size}
                        onClear={() => { setSelectedLeads(new Set()); setShowBulkStatusMenu(false); }}
                        onDelete={handleBulkDelete}
                        onAssign={() => alert('Función de asignación masiva próximamente')}
                        onChangeStatus={() => setShowBulkStatusMenu(v => !v)}
                    />
                </div>
            )}

            {/* ── Simulate Client Message Modal ────────────────────────────── */}
            {showSimModal && activePanelLead && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-[15px] font-semibold text-gray-900">Simular mensaje del cliente</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">
                                    Escribe como si fueras <span className="font-medium text-gray-700">{activePanelLead.contacto?.nombre || 'el lead'}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowSimModal(false); setSimInput(''); }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5">
                            {/* Lead avatar context */}
                            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold border border-indigo-200/50 shrink-0">
                                    {activePanelLead.contacto?.nombre?.substring(0, 2).toUpperCase() || 'LD'}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[13px] font-medium text-gray-900 truncate">{activePanelLead.contacto?.nombre || 'Lead'}</div>
                                    <div className="text-[11px] text-gray-500">Mensaje entrante simulado</div>
                                </div>
                            </div>

                            <textarea
                                autoFocus
                                value={simInput}
                                onChange={e => setSimInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSimSubmit(); } }}
                                placeholder="Escribe aquí el mensaje del cliente..."
                                rows={4}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 resize-none bg-gray-50 focus:bg-white transition-colors"
                            />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                            <button
                                onClick={() => { setShowSimModal(false); setSimInput(''); }}
                                className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSimSubmit}
                                disabled={simSubmitting || !simInput.trim()}
                                className="px-5 py-2 text-[13px] font-medium bg-[#1a1a2e] text-white rounded-lg hover:bg-[#16213e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {simSubmitting
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                                    : <><MessageSquare className="w-3.5 h-3.5" /> Enviar como cliente</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create Lead Modal ────────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex justify-center items-end sm:items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h2 className="text-[15px] font-bold text-gray-900">Crear nuevo lead</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-800 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] sm:max-h-none">
                            {[
                                { key: 'nombre', label: 'Nombre *', type: 'text', placeholder: 'Ej. Juan Pérez' },
                                { key: 'correo', label: 'Correo', type: 'email', placeholder: 'juan@ejemplo.com' },
                                { key: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '+52 311 ...' },
                                { key: 'origen', label: 'Origen', type: 'text', placeholder: 'Meta Ads, Referido, Sitio web...' },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">{field.label}</label>
                                    <input
                                        type={field.type}
                                        value={formData[field.key]}
                                        onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                                        className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a2e] bg-gray-50 focus:bg-white transition-colors"
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">Prioridad</label>
                                <select value={formData.prioridad} onChange={e => setFormData(p => ({ ...p, prioridad: e.target.value }))} className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a2e] bg-gray-50 focus:bg-white">
                                    <option value="URGENTE">Urgente</option>
                                    <option value="ALTA">Alta</option>
                                    <option value="MEDIA">Media</option>
                                    <option value="BAJA">Baja</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">Notas iniciales</label>
                                <textarea
                                    value={formData.notas_iniciales}
                                    onChange={e => setFormData(p => ({ ...p, notas_iniciales: e.target.value }))}
                                    className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a2e] bg-gray-50 focus:bg-white resize-none"
                                    placeholder="Observaciones, intereses, contexto..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-[#f8f9fa] flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateLead}
                                disabled={submitting || !formData.nombre.trim()}
                                className="px-5 py-2 bg-[#1a1a2e] text-white rounded-lg text-[13px] font-medium hover:bg-[#16213e] flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                                ) : (
                                    <><Check className="w-3.5 h-3.5" /> Guardar Lead</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MoreVertical, Phone, Paperclip, Video, Check } from 'lucide-react';

export default function LeadChatDrawer({ lead, onClose }) {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (lead) {
            setMessages([
                { id: 1, text: `Hola, me interesa la propiedad ubicada en la zona norte.`, sender: 'them', time: '10:00 AM' },
                { id: 2, text: `¡Hola ${lead.contacto?.nombre || `Contacto`}! Claro que sí, un ejecutivo de RENAV te está atendiendo. ¿Requieres información comercial o te gustaría agendar una cita para verla?`, sender: 'me', time: '10:05 AM' },
            ]);
        }
    }, [lead]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const date = new Date();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setMessages([...messages, {
            id: Date.now(),
            text: newMessage,
            sender: 'me',
            time: timeStr
        }]);
        setNewMessage('');
    };

    if (!lead) return null;

    return (
        <div className="w-[400px] bg-slate-50 h-full flex flex-col border-l border-gray-200 flex-shrink-0 animate-slideInRight shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.04)]">
            {/* Header Corporate Style */}
            <div className="bg-[#0A1128] text-white px-5 py-4 flex items-center justify-between shadow-md z-10 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-5 text-[80px] font-serif pr-2 leading-none select-none">R</div>
                <div className="flex items-center gap-3 relative z-10">
                    <img
                        src={`https://i.pravatar.cc/150?u=${lead.id_contacto}`}
                        alt="avatar"
                        className="w-10 h-10 rounded-full border border-[#D4AF37] object-cover"
                    />
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm tracking-wide text-[#D4AF37]">
                            {lead.contacto?.nombre || `Contacto #${lead.id_contacto}`}
                        </span>
                        <span className="text-[11px] text-gray-300 font-medium">
                            {lead.contacto?.telefono || 'Lead Interesado'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-300 relative z-10">
                    <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors"><Phone className="w-4 h-4" /></button>
                    <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors"><Video className="w-4 h-4" /></button>
                    <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors"><MoreVertical className="w-4 h-4" /></button>
                    <div className="h-5 w-px bg-white/20 mx-1"></div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 hover:text-[#D4AF37] rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 relative custom-scrollbar bg-slate-50/50">
                <div className="text-center relative z-10 mb-6 mt-2">
                    <span className="bg-gray-200/80 text-gray-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        Interacción de Hoy
                    </span>
                </div>

                {messages.map(msg => (
                    <div key={msg.id} className={`flex relative z-10 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm relative ${msg.sender === 'me'
                                ? 'bg-white border border-gray-100 text-[#0A1128] rounded-br-sm'
                                : 'bg-[#0A1128] text-white rounded-bl-sm'
                            }`}>
                            <p className="text-[13px] leading-relaxed">{msg.text}</p>
                            <div className="flex items-center justify-end gap-1.5 mt-1.5">
                                <span className={`text-[9px] font-medium ${msg.sender === 'me' ? 'text-gray-400' : 'text-gray-400'}`}>{msg.time}</span>
                                {msg.sender === 'me' && (
                                    <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 flex items-center gap-3 z-10 border-t border-gray-200">
                <button className="text-gray-400 hover:text-[#0A1128] transition-colors p-2 rounded-full hover:bg-gray-100 flex-shrink-0">
                    <Paperclip className="w-5 h-5" />
                </button>
                <form onSubmit={handleSend} className="flex-1 flex items-center relative gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Redactar mensaje..."
                        className="w-full bg-gray-50 border border-gray-200 px-5 py-2.5 rounded-full text-[13px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-gray-800 transition-all placeholder:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="text-white bg-[#0A1128] hover:bg-[#1a2b5e] disabled:bg-gray-300 disabled:text-gray-500 transition-colors p-2.5 rounded-full shadow-sm flex-shrink-0 flex items-center justify-center transform disabled:scale-100 hover:scale-105"
                    >
                        <Send className="w-4 h-4" style={{ transform: 'translateX(-1px) translateY(1px)' }} />
                    </button>
                </form>
            </div>
            <style>{`
                @keyframes slideInRight {
                    from { margin-right: -400px; opacity: 0; }
                    to { margin-right: 0; opacity: 1; }
                }
                .animate-slideInRight {
                    animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}

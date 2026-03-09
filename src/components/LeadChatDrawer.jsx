import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MoreVertical, Phone, Image as ImageIcon, Paperclip } from 'lucide-react';

export default function LeadChatDrawer({ lead, onClose }) {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (lead) {
            setMessages([
                { id: 1, text: `Hola, me interesa la propiedad que vi en su página.`, sender: 'them', time: '10:00 AM' },
                { id: 2, text: `¡Hola ${lead.contacto?.nombre || `Contacto`}! Claro que sí, con gusto te brindamos información. ¿Buscabas alguna zona en específico?`, sender: 'me', time: '10:05 AM' },
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
        <div className="fixed inset-y-0 right-0 z-[60] flex shadow-2xl">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" onClick={onClose}></div>

            {/* Drawer */}
            <div className="relative z-[70] w-[450px] bg-[#efeae2] h-full flex flex-col border-l border-gray-200 transform transition-transform animate-slideInRight">
                {/* Header Whatsapp Style */}
                <div className="bg-[#005c4b] text-white px-4 py-3 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <img
                            src={`https://i.pravatar.cc/150?u=${lead.id_contacto}`}
                            alt="avatar"
                            className="w-10 h-10 rounded-full border-2 border-white/20 object-cover"
                        />
                        <div className="flex flex-col">
                            <span className="font-semibold text-[15px]">{lead.contacto?.nombre || `Contacto #${lead.id_contacto}`}</span>
                            <span className="text-xs text-white/70">
                                {lead.contacto?.telefono || 'en línea'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-white/90">
                        <Phone className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                        <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                        <X className="w-6 h-6 ml-2 cursor-pointer hover:text-white transition-colors" onClick={onClose} />
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 relative custom-scrollbar bg-[url('https://wallpapers.com/images/hd/whatsapp-chat-background-ixrgi5x4k3wylcld.jpg')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-[#efeae2]/80"></div> {/* Semi-transparent overlay to match Whatsapp Light mode better */}

                    <div className="text-center relative z-10 mb-4">
                        <span className="bg-[#e1f3fb] text-[#54656f] text-xs px-3 py-1 rounded-lg shadow-sm">Hoy</span>
                    </div>

                    {messages.map(msg => (
                        <div key={msg.id} className={`flex relative z-10 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg px-3 py-2 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative ${msg.sender === 'me'
                                ? 'bg-[#d9fdd3] rounded-tr-none'
                                : 'bg-white rounded-tl-none'
                                }`}>
                                <p className="text-[14px] text-[#111b21] leading-snug">{msg.text}</p>
                                <div className="flex items-center justify-end gap-1 mt-1 -mb-1">
                                    <span className="text-[10px] text-gray-500">{msg.time}</span>
                                    {msg.sender === 'me' && (
                                        <svg viewBox="0 0 16 15" width="16" height="15" className="text-[#53bdeb] ml-0.5">
                                            <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path>
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3 z-10 border-t border-gray-200">
                    <button className="text-[#54656f] hover:text-[#111b21] transition-colors">
                        <Paperclip className="w-[22px] h-[22px]" />
                    </button>
                    <button className="text-[#54656f] hover:text-[#111b21] transition-colors">
                        <ImageIcon className="w-[22px] h-[22px]" />
                    </button>
                    <form onSubmit={handleSend} className="flex-1 flex items-center mr-1">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un mensaje"
                            className="w-full bg-white px-4 py-2.5 rounded-lg text-sm focus:outline-none shadow-sm text-[#111b21]"
                        />
                        {newMessage.trim() ? (
                            <button type="submit" className="ml-3 text-[#00a884] hover:text-[#008f6f] transition-colors p-2 bg-white rounded-full shadow-sm flex-shrink-0 flex items-center justify-center h-10 w-10">
                                <Send className="w-5 h-5 ml-1" />
                            </button>
                        ) : (
                            <div className="ml-3 p-2 text-transparent flex-shrink-0 h-10 w-10"></div>
                        )}
                    </form>
                </div>
            </div>
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slideInRight {
                    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
}

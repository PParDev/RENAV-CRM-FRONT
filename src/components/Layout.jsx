import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, Contact, Home, Zap,
    UserCircle, FileText, CheckSquare, Calendar,
    Phone, Mail, LayoutTemplate, ChevronRight, Bell, Menu
} from 'lucide-react';
import LogoDashboard from '../assets/logos/RA__ISOLOGO_BLANCO.png';

const menuItems = [
    { name: 'Dashboard', label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Leads', label: 'Leads', to: '/leads', icon: Users },
    { name: 'Contacts', label: 'Contactos', to: '/contacts', icon: Contact },
    { name: 'Properties', label: 'Propiedades', to: '/properties', icon: Home },
    { name: 'Opportunities', label: 'Oportunidades', to: '/opportunities', icon: Zap },
    { name: 'Account', label: 'Cuenta', to: '/account', icon: UserCircle },
    { name: 'Invoices', label: 'Facturas', to: '/invoices', icon: FileText },
    { name: 'Tasks', label: 'Tareas', to: '/tasks', icon: CheckSquare },
    { name: 'Meetings', label: 'Reuniones', to: '/meetings', icon: Calendar },
    { name: 'Calls', label: 'Llamadas', to: '/calls', icon: Phone },
    { name: 'Emails', label: 'Correos', to: '/emails', icon: Mail },
    { name: 'EmailTemplates', label: 'Plantillas de Correo', to: '/email-templates', icon: LayoutTemplate },
];

export default function Layout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const location = useLocation();

    const currentRouteName = menuItems.find(item => item.to === location.pathname)?.label || 'Dashboard';

    return (
        <div className="flex h-screen w-screen bg-white overflow-hidden text-gray-900">
            {/* Sidebar */}
            <div
                className={`flex flex-col h-full bg-gray-50 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-16' : 'w-64'} z-20`}
            >
                {/* Logo / Header */}
                <div className="flex items-center gap-3 p-4 border-b border-white/10 h-16 flex-shrink-0 bg-[#0A1128]">
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-transparent">
                        <img src={LogoDashboard} alt="Renâv Logo" className="w-full h-full object-contain scale-[1.4] mix-blend-lighten" />
                    </div>
                    {!isSidebarCollapsed && (
                        <div className="flex flex-col">
                            <span className="font-serif text-2xl italic text-[#D4AF37] leading-none mb-0.5">Renâv</span>
                            <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-white/90">Real Estate Group</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar border-r border-gray-100">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 p-2 rounded-lg transition-colors group relative ${isActive
                                        ? 'bg-white text-blue-600 border border-gray-200 shadow-sm'
                                        : 'text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent'
                                    }`
                                }
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!isSidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}

                                {/* Tooltip for collapsed sidebar */}
                                {isSidebarCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-2 border-t border-r border-gray-100 space-y-1">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="flex items-center gap-3 p-2 w-full text-left rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
                    >
                        <Menu className="w-5 h-5 flex-shrink-0" />
                        {!isSidebarCollapsed && <span className="text-sm font-medium">Colapsar</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Topbar */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 flex-shrink-0 bg-[#0A1128]">
                    <div className="flex items-center gap-4">
                        <nav className="flex items-center text-sm font-medium text-gray-400 gap-2">
                            <span className="hover:text-white cursor-pointer transition-colors">CRM</span>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                            <span className="text-white">{currentRouteName}</span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A1128]"></span>
                        </button>
                        <div className="h-8 w-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold border border-[#D4AF37]/30">
                            PB
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6 bg-gray-50/30 custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Placeholder({ title }) {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 mb-2">
                <LayoutTemplate className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">Módulo de {title}</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Esta sección está actualmente en desarrollo. Pronto podrás gestionar tus datos de {title?.toLowerCase() || 'este módulo'} desde esta vista.
            </p>
            <button
                className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                onClick={() => navigate('/')}
            >
                Volver al Dashboard
            </button>
        </div>
    );
}

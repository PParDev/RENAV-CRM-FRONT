import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { setToken } from '../utils/auth.js';
import LogoRenav from '../assets/logos/RA__ISOLOGO_DORADO.png';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validatePassword = (password) => {
        // Mínimo 8 caracteres, al menos una minúscula, una mayúscula y un número
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return re.test(password);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        let isValid = true;

        if (!validateEmail(email)) {
            setEmailError('Por favor, ingresa un correo electrónico válido.');
            isValid = false;
        } else {
            setEmailError('');
        }

        if (!validatePassword(password)) {
            setPasswordError('La contraseña debe tener mínimo 8 caracteres, incluyendo al menos una letra mayúscula, una minúscula y un número.');
            isValid = false;
        } else {
            setPasswordError('');
        }

        if (!isValid) return;

        setIsLoading(true);
        setLoginError('');

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Credenciales inválidas');
            }

            const data = await response.json();

            // Guardamos el token real que viene del backend
            setToken(data.access_token);

            // Avisamos a la app que iniciamos sesión
            onLogin();
            // Redirigimos al Dashboard
            navigate('/');
        } catch (error) {
            setLoginError(error.message || 'Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1320] p-4 font-sans">
            <div className="w-full max-w-5xl bg-[#131E32] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-800/50">

                {/* Lado Izquierdo - Formulario de Login */}
                <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center relative">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-3">Iniciar Sesión</h2>
                        <p className="text-gray-400">Ingresa a tu cuenta para continuar.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6" noValidate>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Correo
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (emailError) setEmailError('');
                                    }}
                                    className={`block w-full pl-11 pr-4 py-3 border rounded-xl bg-[#090F1A] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C4A467] focus:border-transparent transition-all ${emailError ? 'border-red-500' : 'border-gray-700'}`}
                                    placeholder="tu@correo.com"
                                    required
                                />
                            </div>
                            {emailError && <p className="mt-2 text-sm text-red-500">{emailError}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (passwordError) setPasswordError('');
                                    }}
                                    className={`block w-full pl-11 pr-12 py-3 border rounded-xl bg-[#090F1A] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C4A467] focus:border-transparent transition-all ${passwordError ? 'border-red-500' : 'border-gray-700'}`}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {passwordError && <p className="mt-2 text-sm text-red-500">{passwordError}</p>}
                        </div>

                        {loginError && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mt-4">
                                <p className="text-sm text-red-500 text-center font-medium">{loginError}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-4">
                            <label className="flex items-center text-sm text-gray-400 hover:text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mr-2 h-4 w-4 rounded border-gray-600 text-[#C4A467] focus:ring-[#C4A467] bg-[#090F1A] focus:ring-offset-0"
                                />
                                Recordarme
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-3.5 px-4 mt-8 border border-transparent rounded-xl shadow-lg text-sm font-bold text-[#0B1320] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C4A467] focus:ring-offset-[#131E32] ${isLoading
                                ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                                : 'bg-[#C4A467] hover:bg-[#b09259]'
                                }`}
                        >
                            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500 space-y-2">
                        <p>
                            ¿Olvidaste la contraseña?{' '}
                            <button 
                            onClick={() => navigate('/recuperar-password')}
                            className="text-[#C4A467] hover:text-[#b09259] font-medium transition-colors">
                                Recupérala aquí
                            </button>
                        </p>
                    </div>
                </div>

                {/* Lado Derecho - Logo & Branding */}
                <div className="w-full md:w-1/2 bg-[#080d17] p-12 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Subtle background glow effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C4A467]/10 rounded-full blur-[100px] pointer-events-none"></div>

                    <img
                        src={LogoRenav}
                        alt="Renâv Logo"
                        className="w-100 md:w-100 object-contain drop-shadow-2xl z-10 transition-transform duration-500 hover:scale-105"
                    />
                </div>

            </div>
        </div>
    );
};

export default Login;

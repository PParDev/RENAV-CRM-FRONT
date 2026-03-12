import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import LogoRenav from "../assets/logos/RA__ISOLOGO_DORADO.png";

const RecuperarPassword = () => {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step, setStep] = useState(1);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const enviarCodigo = async () => {
    try {
      if (!email) {
        setError(true);
        setMensaje("Por favor ingresa un correo.");
        return;
      }

      const res = await fetch("http://localhost:3000/api/auth/recuperar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setError(false);
      setMensaje("Se envió un código a tu correo. Expirará en 15 minutos.");
      setStep(2);
    } catch (error) {
      setError(true);
      setMensaje(error.message);
    }
  };

  const cambiarPassword = async () => {
    try {
      if (!codigo) {
        setError(true);
        setMensaje("Ingresa el código de seguridad.");
        return;
      }
      if (!nuevaPassword || !confirmPassword) {
        setError(true);
        setMensaje("Ingresa y confirma tu nueva contraseña.");
        return;
      }
      if (nuevaPassword !== confirmPassword) {
        setError(true);
        setMensaje("Las contraseñas no coinciden.");
        return;
      }

      const res = await fetch("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          codigo,
          nuevaPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setError(false);
      setMensaje("Contraseña actualizada correctamente. Redirigiendo...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setError(true);
      setMensaje(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1320] p-4 font-sans">
      <div className="w-full max-w-5xl bg-[#131E32] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-800/50">

        {/* FORMULARIO */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">

          <h2 className="text-3xl font-bold text-white mb-4">
            Recuperar contraseña
          </h2>

          <p className="text-gray-400 mb-8">
            Ingresa tu correo y te enviaremos un código.
          </p>

          {step === 1 && (
            <>
              <div className="relative mb-6">
                <Mail className="absolute left-3 top-3 text-gray-500" />

                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#090F1A] border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#C4A467]"
                />
              </div>

              <button
                onClick={enviarCodigo}
                className="w-full py-3 rounded-xl bg-[#C4A467] hover:bg-[#b09259] text-[#0B1320] font-bold"
              >
                Enviar código
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="relative mb-4">
                <KeyRound className="absolute left-3 top-3 text-gray-500" />

                <input
                  placeholder="Código recibido"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#090F1A] border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#C4A467]"
                />
              </div>

              <div className="relative mb-4">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#090F1A] border border-gray-700 rounded-xl text-white pr-10 focus:ring-2 focus:ring-[#C4A467]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative mb-6">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#090F1A] border border-gray-700 rounded-xl text-white pr-10 focus:ring-2 focus:ring-[#C4A467]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                onClick={cambiarPassword}
                className="w-full py-3 rounded-xl bg-[#C4A467] hover:bg-[#b09259] text-[#0B1320] font-bold"
              >
                Cambiar contraseña
              </button>
            </>
          )}

          {mensaje && (
            <p className={`text-sm text-center mt-6 ${error ? 'text-red-500' : 'text-[#C4A467]'}`}>
              {mensaje}
            </p>
          )}
        </div>

        {/* LOGO */}
        <div className="w-full md:w-1/2 bg-[#080d17] flex items-center justify-center p-10">

          <img
            src={LogoRenav}
            alt="RENAV"
            className="w-80 drop-shadow-2xl"
          />

        </div>

      </div>
    </div>
  );
};

export default RecuperarPassword;
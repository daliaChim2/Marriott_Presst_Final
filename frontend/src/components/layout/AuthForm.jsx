import { useState } from "react";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import equiposImg from "../../assets/equipos.jpeg";


export default function AuthForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-rose-900 to-pink-900 relative">
      {/* Modal Recuperar Contraseña */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px] shadow-lg relative">
            <h3 className="text-xl font-semibold text-pink-500 mb-4">Recuperar Contraseña</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.
            </p>
            <div className="relative mb-4">
              <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="email"
                placeholder="Correo electrónico"
                className="form-control pl-10"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button className="btn btn-primary bg-pink-600 border-none hover:bg-pink-400">
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-2xl rounded-2xl flex w-[900px] overflow-hidden z-10">
        {/* Formulario */}
        <div className="w-1/2 p-8">
          <h2 className="text-3xl font-bold text-pink-600 text-center mb-6">
            {isRegister ? "SIGEA" : "SIGEA"}
          </h2>

          {/* Tabs */}
          <div className="mb-6 flex justify-center gap-4">
            <button
              onClick={() => setIsRegister(false)}
              className={`px-4 py-2 rounded-full transition font-semibold ${
                !isRegister
                  ? "bg-pink-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Iniciar sesion
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`px-4 py-2 rounded-full transition font-semibold ${
                isRegister
                  ? "bg-pink-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Formulario */}
          <form className="space-y-4">
            {isRegister && (
              <div className="relative">
                <FaUser className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  className="form-control pl-10"
                />
              </div>
            )}
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="email"
                placeholder="Correo electrónico"
                className="form-control pl-10"
              />
            </div>
            <div className="relative">
              <FaLock className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="password"
                placeholder="Contraseña"
                className="form-control pl-10"
              />
            </div>

            {/* Olvidaste tu contraseña */}
            {!isRegister && (
              <div className="text-right">
                <span
                  onClick={() => setShowResetModal(true)}
                  className="text-sm text-rose-300 hover:underline cursor-pointer"
                >
                 ¿Olvidaste tu contraseña?
                </span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full bg-rose-300 border-none hover:bg-pink-600"
            >
              {isRegister ? "Registrar Usuario" : "Comenzar sesión"}
            </button>
          </form>
        </div>

        {/* Imagen */}
        <div className="w-1/2 hidden md:block">
          <img
            src={equiposImg}
            alt="Equipos"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}

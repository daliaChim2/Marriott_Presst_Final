import React, { useEffect, useState } from "react";

export default function ModalEliminarEquipo({ equipo, onConfirmar, onCancelar }) {
  const [animado, setAnimado] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimado(true), 10);
    return () => clearTimeout(timer);
  }, []);

  if(!equipo) return null;

  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10">
        <div
        className={`bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm text-center transform transition-all duration-300 ${
            animado ? "scale-100 opacity-100" : ""
        } `}
        >
            <h2 className="text-xl font-bold text-red-600 mb-4">¿Deseas eliminar el equipo?</h2>
            <p className="text-gray-700 mb-6">¿estas seguro que deseas eliminar el equpo <strong>{equipo.nombre}</strong>?Esta accion no podra revertirse.
            </p>
            <div className="flex justify-center gap-4">
                <button 
                onClick={onCancelar}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                    Cancelar
                </button>
                <button 
                onClick={() => onConfirmar(equipo.id)}
                className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
                >
                    Eliminar
                </button>
            </div>
        </div>
    </div>
  );
}
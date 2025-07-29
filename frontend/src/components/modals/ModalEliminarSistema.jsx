import React, { useEffect, useState } from "react";

export default function ModalEliminarAcceso({ acceso, onConfirmar, onCancelar }) {
  const [animacion, setAnimacion] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimacion(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10">
      <div
        className={`bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-xl transform transition-all duration-300 ${
          animacion ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <h2 className="text-xl font-bold text-red-600 mb-4">
          ¿Eliminar acceso?
        </h2>
        <p className="mb-6 text-gray-700">
          ¿Estás seguro de que deseas eliminar el sistema{" "}
          <strong>{acceso.nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancelar}
            className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(acceso.id)}
            className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

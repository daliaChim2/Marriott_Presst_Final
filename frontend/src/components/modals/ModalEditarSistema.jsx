import React, { useState, useEffect } from "react";

export default function ModalEditarSistema({ sistema, onClose, onGuardar }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (sistema) {
      setNombre(sistema.nombre || "");
      setTipo(sistema.tipo || "");
      setDescripcion(sistema.descripcion || "");
      setActivo(sistema.activo ?? true);
    }
  }, [sistema]);

  const handleGuardar = () => {
    onGuardar({
      ...sistema,
      nombre,
      tipo,
      descripcion,
      activo,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 px-4 sm:px-0">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <h3 className="text-xl font-semibold text-blue-900 mb-4 text-center">
          Editar Sistema
        </h3>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nombre del sistema"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <input
            type="text"
            placeholder="Tipo de sistema"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />

          <textarea
            placeholder="Descripción"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-900"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          {/* Switch de estado */}
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-700">Estado del sistema</label>
            <div
              className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition ${
                activo ? "bg-green-500" : "bg-gray-400"
              }`}
              onClick={() => setActivo(!activo)}
            >
              <span
                className={`transform transition inline-block w-5 h-5 bg-white rounded-full ${
                  activo ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

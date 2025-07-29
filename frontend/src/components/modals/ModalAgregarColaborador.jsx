import React, { useState } from "react";

export default function ModalAgregarColaborador({ onClose, onSave }) {
  const [numero_colaborador, setNumeroColaborador] = useState("");
  const [nombre_completo, setNombreCompleto] = useState("");
  const [puesto, setPuesto] = useState("");
  const [area, setArea] = useState("");
  const [fecha_ingreso, setFechaIngreso] = useState("");
  const [estatus, setEstatus] = useState("Activo");
  const [observacion, setObservacion] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar campos mínimos
    if (
      !numero_colaborador.trim() ||
      !nombre_completo.trim() ||
      !puesto.trim() ||
      !area.trim() ||
      !fecha_ingreso.trim() ||
      !estatus.trim()
    ) {
      alert("Por favor llena todos los campos requeridos.");
      return;
    }

    const nuevoColaborador = {
      id_colaborador: Date.now(), // ID único
      numero_colaborador: numero_colaborador.trim(),
      nombre_completo: nombre_completo.trim(),
      puesto: puesto.trim(),
      area: area.trim(),
      fecha_ingreso,
      estatus,
      observacion: observacion.trim(),
    };

    onSave(nuevoColaborador);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 px-4 sm:px-0">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-rose-500 mb-4 text-center">
          Agregar Colaborador
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Número colaborador */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Número de colaborador
            </label>
            <input
              type="text"
              value={numero_colaborador}
              onChange={(e) => setNumeroColaborador(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombre_completo}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          {/* Puesto */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Puesto</label>
            <input
              type="text"
              value={puesto}
              onChange={(e) => setPuesto(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          {/* Área */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Área</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          {/* Fecha de ingreso */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha de ingreso
            </label>
            <input
              type="date"
              value={fecha_ingreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          {/* Estatus */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Estatus</label>
            <select
              value={estatus}
              onChange={(e) => setEstatus(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-rose-400 text-white hover:bg-rose-800"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

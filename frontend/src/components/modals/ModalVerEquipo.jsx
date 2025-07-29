import React from "react";

export default function ModalVerEquipo({ equipo, onClose }) {
  if (!equipo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 px-4 sm:px-0">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-blue-900 mb-4 text-center">
          Detalles del Equipo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-800">
          <div>
            <span className="font-semibold">Nombre:</span>
            <p>{equipo.nombre}</p>
          </div>
          <div>
            <span className="font-semibold">Tipo:</span>
            <p>{equipo.tipo}</p>
          </div>
          <div>
            <span className="font-semibold">Número de Serie:</span>
            <p>{equipo.serie}</p>
          </div>
          <div>
            <span className="font-semibold">Estado:</span>
            <p className={equipo.activo ? "text-green-700" : "text-red-700"}>
              {equipo.activo ? "Activo" : "Inactivo"}
            </p>
          </div>

          {equipo.colaborador && (
            <div className="sm:col-span-2">
              <span className="font-semibold">Asignado a:</span>
              <p>{equipo.colaborador}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

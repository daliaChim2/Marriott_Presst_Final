import { useEffect, useState } from "react";
import axios from "axios";

export default function Resguardos() {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // Nuevo: para avisos

  useEffect(() => {
    cargarPrestamos();
  }, []);

  const cargarPrestamos = async () => {
    setLoading(true);
    setError("");
    setSuccess(""); // Limpia mensaje al recargar
    try {
      const res = await axios.get("http://localhost:3000/api/prestamos");
      setPrestamos(res.data);
    } catch (e) {
      setError("Error al cargar préstamos");
    }
    setLoading(false);
  };

  // Previsualiza PDF en nueva pestaña
  const handleVerPDF = (prestamoId) => {
    window.open(`http://localhost:3000/api/resguardos/pdf/${prestamoId}`, "_blank");
  };

  // Imprime el PDF directo (abre en nueva pestaña y lanza print)
  const handleImprimirPDF = (prestamoId) => {
    const printWindow = window.open(`http://localhost:3000/api/resguardos/pdf/${prestamoId}`, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // Finalizar préstamo
  const handleFinalizar = async (prestamoId) => {
    if (!window.confirm("¿Finalizar este préstamo? Liberará todos los artículos.")) return;
    try {
      await axios.put(`http://localhost:3000/api/prestamos/finalizar/${prestamoId}`);
      setSuccess("¡Préstamo finalizado correctamente!");
      cargarPrestamos();
      setTimeout(() => setSuccess(""), 3500); // Limpia el mensaje después de 3.5s
    } catch (e) {
      setError("Error al finalizar el préstamo.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Préstamos y Resguardos</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {loading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-4 py-2 font-semibold">Folio</th>
                <th className="px-4 py-2 font-semibold">Empleado</th>
                <th className="px-4 py-2 font-semibold">Artículos</th>
                <th className="px-4 py-2 font-semibold">Fecha préstamo</th>
                <th className="px-4 py-2 font-semibold">Periodo</th>
                <th className="px-4 py-2 font-semibold">Estado</th>
                <th className="px-4 py-2 font-semibold">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {prestamos.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    No hay préstamos registrados.
                  </td>
                </tr>
              )}
              {prestamos.map(prest => (
                <tr key={prest.id} className="border-t border-gray-200 hover:bg-rose-50 transition">
                  <td className="px-4 py-2 font-mono">{prest.folio}</td>
                  <td className="px-4 py-2">
                    {prest.empleado_nombre} <br />
                    <span className="text-xs text-gray-500">({prest.numero_asociado})</span><br />
                    <span className="text-xs text-gray-400">{prest.hotel_empleado}</span>
                  </td>
                  <td className="px-4 py-2">
                    {(prest.articulos_id?.split(",") || []).map((id, i) => (
                      <div key={id} className="mb-1">
                        <span className="font-semibold">{id}</span> - {prest.articulos_marca?.split(",")[i]} {prest.articulos_modelo?.split(",")[i]}
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-2">{prest.fecha_prestamo?.substring(0, 10)}</td>
                  <td className="px-4 py-2">
                    {prest.periodo === "permanente"
                      ? "Permanente"
                      : `Hasta ${prest.fecha_vencimiento?.substring(0, 10) || "-"}`}
                  </td>
                  <td className="px-4 py-2">{prest.estado}</td>
                  <td className="px-4 py-2 flex flex-col gap-2 min-w-[140px]">
                    <button
                      onClick={() => handleVerPDF(prest.id)}
                      className="bg-gray-200 hover:bg-rose-200 text-gray-900 px-3 py-1 rounded-xl shadow font-semibold text-xs"
                    >
                      Previsualizar PDF
                    </button>
                    <button
                      onClick={() => handleImprimirPDF(prest.id)}
                      className="bg-rose-400 hover:bg-rose-500 text-white px-3 py-1 rounded-xl shadow font-semibold text-xs"
                    >
                      Imprimir PDF
                    </button>
                    {prest.estado === "activo" && (
                      <button
                        onClick={() => handleFinalizar(prest.id)}
                        className="bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded-xl shadow font-semibold text-xs"
                      >
                        Finalizar préstamo
                      </button>
                    )}
                    {prest.estado !== "activo" && (
                      <span className="text-xs text-gray-400 mt-2">Finalizado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



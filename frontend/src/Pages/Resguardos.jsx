import { useEffect, useState } from "react";
import axios from "axios";

export default function Resguardos() {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtros
  const [filtroEmpleado, setFiltroEmpleado] = useState("");
  const [empleadoOpciones, setEmpleadoOpciones] = useState([]);
  const [showEmpleadoOpciones, setShowEmpleadoOpciones] = useState(false);

  const [filtroSerie, setFiltroSerie] = useState("");
  const [serieOpciones, setSerieOpciones] = useState([]);
  const [showSerieOpciones, setShowSerieOpciones] = useState(false);

  const [filtroEstado, setFiltroEstado] = useState(""); // "", "activo", "finalizado", "cancelado"

  useEffect(() => {
    cargarPrestamos();
  }, []);

  // Autocompletado empleados
  useEffect(() => {
    if (!filtroEmpleado) {
      setEmpleadoOpciones([]);
      return;
    }
    const nombres = [
      ...new Set(
        prestamos
          .map((p) => p.empleado_nombre)
          .filter((n) =>
            n?.toLowerCase().includes(filtroEmpleado.trim().toLowerCase())
          )
      ),
    ];
    setEmpleadoOpciones(nombres);
  }, [filtroEmpleado, prestamos]);

  // Autocompletado serie
  useEffect(() => {
    if (!filtroSerie) {
      setSerieOpciones([]);
      return;
    }
    // Busca en todas las series de todos los préstamos
    const series = prestamos
      .flatMap((p) =>
        (p.articulos_numero_serie || "")
          .split(",")
          .map((serie) => serie.trim())
      )
      .filter(
        (serie) =>
          serie &&
          serie.toLowerCase().includes(filtroSerie.trim().toLowerCase())
      );
    setSerieOpciones([...new Set(series)]);
  }, [filtroSerie, prestamos]);

  const cargarPrestamos = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.get("http://localhost:3000/api/prestamos");
      setPrestamos(res.data);
    } catch (e) {
      setError("Error al cargar préstamos");
    }
    setLoading(false);
  };

  const handleVerPDF = (prestamoId) => {
    window.open(
      `http://localhost:3000/api/resguardos/pdf/${prestamoId}`,
      "_blank"
    );
  };

  const handleImprimirPDF = (prestamoId) => {
    const printWindow = window.open(
      `http://localhost:3000/api/resguardos/pdf/${prestamoId}`,
      "_blank"
    );
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleFinalizar = async (prestamoId) => {
    if (
      !window.confirm(
        "¿Finalizar este préstamo? Liberará todos los artículos."
      )
    )
      return;
    try {
      await axios.put(
        `http://localhost:3000/api/prestamos/finalizar/${prestamoId}`
      );
      setSuccess("¡Préstamo finalizado correctamente!");
      cargarPrestamos();
      setTimeout(() => setSuccess(""), 3500);
    } catch (e) {
      setError("Error al finalizar el préstamo.");
    }
  };

  // FILTRADO AVANZADO
  const prestamosFiltrados = prestamos.filter((p) => {
    // Filtro por empleado
    const matchEmpleado =
      !filtroEmpleado.trim() ||
      (p.empleado_nombre &&
        p.empleado_nombre
          .toLowerCase()
          .includes(filtroEmpleado.trim().toLowerCase()));

    // Filtro por número de serie
    let matchSerie = true;
    if (filtroSerie.trim()) {
      const serieArr = (p.articulos_numero_serie || "").split(",");
      matchSerie = serieArr.some((serie) =>
        serie
          .toLowerCase()
          .includes(filtroSerie.trim().toLowerCase())
      );
    }

    // Filtro por estado
    const matchEstado =
      !filtroEstado || p.estado === filtroEstado;

    return matchEmpleado && matchSerie && matchEstado;
  });

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Préstamos y Resguardos
      </h2>
      {/* --- FILTROS --- */}
      <div className="flex flex-wrap gap-4 mb-5 items-center">
        {/* Filtro por empleado (autocompletado) */}
        <div className="relative">
          <input
            type="text"
            className="border border-gray-300 rounded-xl px-3 py-2 w-56"
            placeholder="Filtrar por empleado..."
            value={filtroEmpleado}
            onChange={(e) => {
              setFiltroEmpleado(e.target.value);
              setShowEmpleadoOpciones(true);
            }}
            onFocus={() => setShowEmpleadoOpciones(true)}
            autoComplete="off"
          />
          {showEmpleadoOpciones &&
            empleadoOpciones.length > 0 && (
              <div className="absolute z-10 bg-white border rounded-xl shadow w-full mt-1">
                {empleadoOpciones.map((nombre) => (
                  <div
                    key={nombre}
                    className="px-3 py-1 hover:bg-rose-50 cursor-pointer text-sm"
                    onClick={() => {
                      setFiltroEmpleado(nombre);
                      setShowEmpleadoOpciones(false);
                    }}
                  >
                    {nombre}
                  </div>
                ))}
              </div>
            )}
        </div>
        {/* Filtro por número de serie (autocompletado) */}
        <div className="relative">
          <input
            type="text"
            className="border border-gray-300 rounded-xl px-3 py-2 w-56"
            placeholder="Filtrar por N° de serie..."
            value={filtroSerie}
            onChange={(e) => {
              setFiltroSerie(e.target.value);
              setShowSerieOpciones(true);
            }}
            onFocus={() => setShowSerieOpciones(true)}
            autoComplete="off"
          />
          {showSerieOpciones && serieOpciones.length > 0 && (
            <div className="absolute z-10 bg-white border rounded-xl shadow w-full mt-1">
              {serieOpciones.map((serie) => (
                <div
                  key={serie}
                  className="px-3 py-1 hover:bg-rose-50 cursor-pointer text-sm"
                  onClick={() => {
                    setFiltroSerie(serie);
                    setShowSerieOpciones(false);
                  }}
                >
                  {serie}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Filtro por estado */}
        <select
          className="border border-gray-300 rounded-xl px-3 py-2"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="finalizado">Finalizado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        {/* Botón limpiar */}
        {(filtroEmpleado || filtroSerie || filtroEstado) && (
          <button
            className="ml-2 text-xs px-2 py-1 rounded-xl bg-gray-100 hover:bg-gray-300 border"
            onClick={() => {
              setFiltroEmpleado("");
              setShowEmpleadoOpciones(false);
              setFiltroSerie("");
              setShowSerieOpciones(false);
              setFiltroEstado("");
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>
      {/* --- /FILTROS --- */}

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
              {prestamosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    No hay préstamos registrados.
                  </td>
                </tr>
              )}
              {prestamosFiltrados.map((prest) => (
                <tr
                  key={prest.id}
                  className="border-t border-gray-200 hover:bg-rose-50 transition"
                >
                  <td className="px-4 py-2 font-mono">{prest.folio}</td>
                  <td className="px-4 py-2">
                    {prest.empleado_nombre} <br />
                    <span className="text-xs text-gray-500">
                      ({prest.numero_asociado})
                    </span>
                    <br />
                    <span className="text-xs text-gray-400">
                      {prest.hotel_empleado}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {(prest.articulos_id?.split(",") || []).map((id, i) => (
                      <div key={id} className="mb-1">
                        <span className="font-semibold">{id}</span> -{" "}
                        {prest.articulos_marca?.split(",")[i]}{" "}
                        {prest.articulos_modelo?.split(",")[i]}
                        <br />
                        <span className="text-xs text-gray-500">
                          N° Serie:{" "}
                          {prest.articulos_numero_serie?.split(",")[i]}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-2">
                    {prest.fecha_prestamo?.substring(0, 10)}
                  </td>
                  <td className="px-4 py-2">
                    {prest.periodo === "permanente"
                      ? "Permanente"
                      : `Hasta ${
                          prest.fecha_vencimiento?.substring(0, 10) || "-"
                        }`}
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
                      <span className="text-xs text-gray-400 mt-2">
                        Finalizado
                      </span>
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

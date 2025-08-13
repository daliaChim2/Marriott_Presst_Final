import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import debounce from "lodash/debounce";

const normalize = (v) => (v == null ? "" : String(v)).toLowerCase();
const sortIcon = (active, dir) => (!active ? "↕" : dir === "asc" ? "▲" : "▼");
const toDate = (s) => (s ? new Date(s) : null);
const LS_KEY = "resguardos_ui_state_v1";

export default function Resguardos() {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtros específicos
  const [filtroEmpleado, setFiltroEmpleado] = useState("");
  const [empleadoOpciones, setEmpleadoOpciones] = useState([]);
  const [showEmpleadoOpciones, setShowEmpleadoOpciones] = useState(false);

  const [filtroSerie, setFiltroSerie] = useState("");
  const [serieOpciones, setSerieOpciones] = useState([]);
  const [showSerieOpciones, setShowSerieOpciones] = useState(false);

  const [filtroEstado, setFiltroEstado] = useState(""); // "", "activo", "finalizado", "cancelado"

  //  búsqueda global
  const [busquedaGlobalInput, setBusquedaGlobalInput] = useState("");
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const debouncedSetBusquedaGlobal = useRef(
    debounce((v) => setBusquedaGlobal(v.toLowerCase()), 250)
  ).current;

  //  orden
  const [sortBy, setSortBy] = useState("fecha_prestamo");
  const [sortDir, setSortDir] = useState("desc");

  // paginación
  const [pageSize, setPageSize] = useState(10); // 10/25/50/0 (0=todos)
  const [page, setPage] = useState(1);

  useEffect(() => {
    // cargar estado guardado
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      if (typeof saved.filtroEmpleado === "string") setFiltroEmpleado(saved.filtroEmpleado);
      if (typeof saved.filtroSerie === "string") setFiltroSerie(saved.filtroSerie);
      if (typeof saved.filtroEstado === "string") setFiltroEstado(saved.filtroEstado);
      if (typeof saved.busquedaGlobalInput === "string") setBusquedaGlobalInput(saved.busquedaGlobalInput);
      if (typeof saved.busquedaGlobal === "string") setBusquedaGlobal(saved.busquedaGlobal);
      if (typeof saved.sortBy === "string") setSortBy(saved.sortBy);
      if (typeof saved.sortDir === "string") setSortDir(saved.sortDir);
      if (typeof saved.pageSize === "number") setPageSize(saved.pageSize);
      if (typeof saved.page === "number") setPage(saved.page);
    } catch {}
  }, []);

  useEffect(() => {
    const state = {
      filtroEmpleado,
      filtroSerie,
      filtroEstado,
      busquedaGlobalInput,
      busquedaGlobal,
      sortBy,
      sortDir,
      pageSize,
      page,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [
    filtroEmpleado,
    filtroSerie,
    filtroEstado,
    busquedaGlobalInput,
    busquedaGlobal,
    sortBy,
    sortDir,
    pageSize,
    page,
  ]);

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
    const series = prestamos
      .flatMap((p) =>
        (p.articulos_numero_serie || "").split(",").map((s) => s.trim())
      )
      .filter(
        (serie) =>
          serie &&
          serie.toLowerCase().includes(filtroSerie.trim().toLowerCase())
      );
    setSerieOpciones([...new Set(series)]);
  }, [filtroSerie, prestamos]);

  useEffect(() => {
    debouncedSetBusquedaGlobal(busquedaGlobalInput);
  }, [busquedaGlobalInput, debouncedSetBusquedaGlobal]);

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

  // FINALIZAR PRESTAMO
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

  /* ========= FILTRADOS ========= */
  const porFiltros = useMemo(() => {
    return prestamos.filter((p) => {
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
          (serie || "")
            .toLowerCase()
            .includes(filtroSerie.trim().toLowerCase())
        );
      }

      // Filtro por estado
      const matchEstado = !filtroEstado || p.estado === filtroEstado;

      return matchEmpleado && matchSerie && matchEstado;
    });
  }, [prestamos, filtroEmpleado, filtroSerie, filtroEstado]);

  //  Búsqueda global (folio, empleado, asociado, hotel, estado, fechas, articulos)
  const filtrados = useMemo(() => {
    if (!busquedaGlobal) return porFiltros;

    return porFiltros.filter((p) => {
      const camposArticulos = [
        p.articulos_id,
        p.articulos_marca,
        p.articulos_modelo,
        p.articulos_numero_serie,
      ]
        .map(normalize)
        .join(" ");

      const hay = [
        p.folio,
        p.empleado_nombre,
        p.numero_asociado,
        p.hotel_empleado,
        p.estado,
        p.periodo,
        p.fecha_prestamo,
        p.fecha_vencimiento,
        camposArticulos,
      ]
        .map(normalize)
        .join(" ");

      return hay.includes(busquedaGlobal);
    });
  }, [porFiltros, busquedaGlobal]);

  /* ========= ORDEN ========= */
  const onSort = (campo) => {
    if (sortBy === campo) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(campo);
      setSortDir("asc");
    }
    setPage(1);
  };

  const sorted = useMemo(() => {
    const arr = [...filtrados];
    const dir = sortDir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      let va, vb;

      switch (sortBy) {
        case "folio":
        case "empleado_nombre":
        case "hotel_empleado":
        case "estado":
          va = normalize(a[sortBy]);
          vb = normalize(b[sortBy]);
          break;
        case "fecha_prestamo":
          va = toDate(a.fecha_prestamo)?.getTime() || 0;
          vb = toDate(b.fecha_prestamo)?.getTime() || 0;
          break;
        case "fecha_vencimiento":
          va = toDate(a.fecha_vencimiento)?.getTime() || 0;
          vb = toDate(b.fecha_vencimiento)?.getTime() || 0;
          break;
        default:
          va = normalize(a[sortBy] ?? "");
          vb = normalize(b[sortBy] ?? "");
      }

      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    return arr;
  }, [filtrados, sortBy, sortDir]);

  /* ========= PAGINACIÓN ========= */
  const total = sorted.length;
  const pageCount = pageSize === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);

  const pageSlice =
    pageSize === 0
      ? sorted
      : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const from =
    pageSize === 0 ? (total === 0 ? 0 : 1) : (currentPage - 1) * pageSize + 1;
  const to = pageSize === 0 ? total : Math.min(currentPage * pageSize, total);

  const gotoPage = (p) => setPage(Math.min(Math.max(p, 1), pageCount));

  const pageNumbers = useMemo(() => {
    const maxBtns = 7;
    if (pageCount <= maxBtns) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    const left = Math.max(1, currentPage - 2);
    const right = Math.min(pageCount, currentPage + 2);
    const base = [];
    if (left > 1) base.push(1, "…");
    for (let i = left; i <= right; i++) base.push(i);
    if (right < pageCount) base.push("…", pageCount);
    return base;
  }, [currentPage, pageCount]);

  // Helpers UI
  const clearFiltros = () => {
    setFiltroEmpleado("");
    setShowEmpleadoOpciones(false);
    setFiltroSerie("");
    setShowSerieOpciones(false);
    setFiltroEstado("");
    setBusquedaGlobalInput("");
    setBusquedaGlobal("");
    setPage(1);
    localStorage.removeItem(LS_KEY);
  };

  /* ========= RENDER ========= */
  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <h2 className="text-3xl font-bold text-rose-900 mb-6">
        Préstamos y Resguardos
      </h2>

      {/* --- FILTROS --- */}
      <div className="flex flex-wrap gap-4 mb-4 items-center bg-white p-3 rounded-xl shadow border border-gray-200">
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
              setPage(1);
            }}
            onFocus={() => setShowEmpleadoOpciones(true)}
            autoComplete="off"
          />
          {showEmpleadoOpciones && empleadoOpciones.length > 0 && (
            <div className="absolute z-10 bg-white border rounded-xl shadow w-full mt-1">
              {empleadoOpciones.map((nombre) => (
                <div
                  key={nombre}
                  className="px-3 py-1 hover:bg-rose-50 cursor-pointer text-sm"
                  onClick={() => {
                    setFiltroEmpleado(nombre);
                    setShowEmpleadoOpciones(false);
                    setPage(1);
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
              setPage(1);
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
                    setPage(1);
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
          onChange={(e) => {
            setFiltroEstado(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="finalizado">Finalizado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        {/* 🔎 Buscador global */}
        <div className="ml-auto flex items-center gap-2">
          <input
            value={busquedaGlobalInput}
            onChange={(e) => {
              setBusquedaGlobalInput(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar en toda la tabla…"
            className="border border-gray-300 rounded-xl px-3 py-2 w-64"
          />
          <button
            onClick={() => {
              setBusquedaGlobalInput("");
              setBusquedaGlobal("");
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
            title="Limpiar búsqueda"
          >
            X
          </button>

          {(filtroEmpleado || filtroSerie || filtroEstado || busquedaGlobalInput) && (
            <button
              className="text-xs px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 border"
              onClick={clearFiltros}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
      {/* --- /FILTROS --- */}

      {/* Barra superior de paginación */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
        <div className="flex items-center gap-2">
          <span>Mostrar</span>
          <select
            className="border rounded-lg px-2 py-1 bg-white"
            value={pageSize}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setPageSize(val);
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={0}>Todos</option>
          </select>
          <span>por página</span>
        </div>
        <div>
          Mostrando{" "}
          <span className="font-semibold">
            {sorted.length === 0 ? 0 : from}–{to}
          </span>{" "}
          de <span className="font-semibold">{sorted.length}</span>
        </div>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}

      {loading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-700 select-none">
                {[
                  ["folio", "Folio"],
                  ["empleado_nombre", "Empleado"],
                  [null, "Artículos"], // sin orden
                  ["fecha_prestamo", "Fecha préstamo"],
                  ["fecha_vencimiento", "Vence"],
                  ["estado", "Estado"],
                  [null, "Opciones"], // sin orden
                ].map(([key, label], idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-2 font-semibold ${
                      key ? "cursor-pointer hover:bg-gray-300" : ""
                    }`}
                    onClick={key ? () => onSort(key) : undefined}
                    title={key ? `Ordenar por ${label}` : ""}
                  >
                    <div className="flex items-center gap-2">
                      <span>{label}</span>
                      {key && (
                        <span className="text-xs opacity-70">
                          {sortIcon(sortBy === key, sortDir)}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageSlice.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    No hay préstamos registrados.
                  </td>
                </tr>
              )}
              {pageSlice.map((prest) => (
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
                      <div key={`${prest.id}-${id}-${i}`} className="mb-1">
                        <span className="font-semibold">{id}</span> —{" "}
                        {prest.articulos_marca?.split(",")[i]}{" "}
                        {prest.articulos_modelo?.split(",")[i]}
                        <br />
                        <span className="text-xs text-gray-500">
                          N° Serie: {prest.articulos_numero_serie?.split(",")[i]}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-2">
                    {prest.fecha_prestamo?.substring(0, 10)}
                  </td>
                  <td className="px-4 py-2">
                    {prest.periodo === "permanente"
                      ? "—"
                      : prest.fecha_vencimiento?.substring(0, 10) || "-"}
                  </td>
                  <td className="px-4 py-2">{prest.estado}</td>
                  <td className="px-4 py-2 flex flex-col gap-2 min-w-[140px]">
                    <button
                      onClick={() => handleVerPDF(prest.id)}
                      className="bg-gray-100 hover:bg-rose-400 hover:text-white text-rose-900 px-3 py-2 rounded-xl shadow font-bold text-xs"
                    >
                      Previsualizar PDF
                    </button>
                    <button
                      onClick={() => handleImprimirPDF(prest.id)}
                      className="bg-rose-900 hover:bg-rose-500 text-white px-3 py-1 rounded-xl shadow font-semibold text-xs"
                    >
                      Imprimir PDF
                    </button>
                    {prest.estado === "activo" ? (
                      <button
                        onClick={() => handleFinalizar(prest.id)}
                        className="bg-red-600 hover:bg-rose-400 text-white px-3 py-1 rounded-xl shadow font-semibold text-xs"
                      >
                        Finalizar préstamo
                      </button>
                    ) : (
                      <span className="text-s text-center text-rose-600 mt-2">
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

      {/* Controles de paginación */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-1 mt-3">
          <button
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => gotoPage(1)}
            disabled={currentPage === 1}
            title="Primera"
          >
            «
          </button>
          <button
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => gotoPage(currentPage - 1)}
            disabled={currentPage === 1}
            title="Anterior"
          >
            ‹
          </button>
          {pageNumbers.map((n, i) =>
            n === "…" ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => gotoPage(n)}
                className={`px-3 py-1 rounded-lg ${
                  n === currentPage
                    ? "bg-rose-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {n}
              </button>
            )
          )}
          <button
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => gotoPage(currentPage + 1)}
            disabled={currentPage === pageCount}
            title="Siguiente"
          >
            ›
          </button>
          <button
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => gotoPage(pageCount)}
            disabled={currentPage === pageCount}
            title="Última"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}

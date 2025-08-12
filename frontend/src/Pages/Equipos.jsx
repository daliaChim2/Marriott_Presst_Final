import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import debounce from "lodash/debounce";

/* ============ Subcomponentes ============ */
function AgregarTipoArticulo({ onAdded, tipos }) {
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [error, setError] = useState("");
  const handleAdd = async (e) => {
    e.preventDefault();
    if (
      tipos.some(
        (t) => t.nombre.trim().toLowerCase() === nuevoTipo.trim().toLowerCase()
      )
    ) {
      setError("Ya existe un tipo de artículo con ese nombre.");
      return;
    }
    try {
      await axios.post("http://localhost:3000/api/tipos-articulo", {
        nombre: nuevoTipo,
      });
      setNuevoTipo("");
      setError("");
      onAdded();
    } catch (e) {
      setError(e?.response?.data?.error || "Error al agregar");
    }
  };
  return (
    <form onSubmit={handleAdd} className="flex gap-2 items-end mb-2">
      <input
        value={nuevoTipo}
        onChange={(e) => setNuevoTipo(e.target.value)}
        required
        placeholder="Nuevo tipo de artículo"
        className="border px-2 py-1 rounded"
      />
      <button
        type="submit"
        className="bg-rose-900 hover:bg-rose-500 text-white px-3 rounded"
      >
        Agregar
      </button>
      {error && <span className="text-red-600 ml-2">{error}</span>}
    </form>
  );
}

function AgregarMarca({ onAdded }) {
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [error, setError] = useState("");
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/marcas", {
        nombre: nuevaMarca,
      });
      setNuevaMarca("");
      setError("");
      onAdded();
    } catch (e) {
      setError(e?.response?.data?.error || "Error al agregar");
    }
  };
  return (
    <form onSubmit={handleAdd} className="flex gap-2 items-end mb-4">
      <input
        value={nuevaMarca}
        onChange={(e) => setNuevaMarca(e.target.value)}
        required
        placeholder="Nueva marca"
        className="border px-2 py-1 rounded"
      />
      <button
        type="submit"
        className="bg-rose-900 hover:bg-rose-500 text-white px-3 rounded"
      >
        Agregar
      </button>
      {error && <span className="text-red-600 ml-2">{error}</span>}
    </form>
  );
}

/* ============ Utilidades ============ */
const normalize = (v) => (v == null ? "" : String(v)).toLowerCase();
const toNumber = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
};
const sortIcon = (active, dir) => (!active ? "↕" : dir === "asc" ? "▲" : "▼");
const mxn = (v) =>
  typeof v === "number"
    ? v.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
    : toNumber(v).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const LS_KEY = "equipos_ui_state_v1";

/* ============ Componente principal ============ */
export default function Equipos() {
  const [marcas, setMarcas] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    id: "",
    tipo_id: "",
    marca: "",
    modelo: "",
    numero_serie: "",
    estado: "disponible",
    hotel: "",
    empleado_id: "",
    costo: "",
    descripcion: "",
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Filtros específicos
  const [busqueda, setBusqueda] = useState({
    tipo: "",
    numero_serie: "",
    hotel: "",
  });

  // 🔎 Filtro global
  const [busquedaGlobalInput, setBusquedaGlobalInput] = useState("");
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const debouncedSetBusquedaGlobal = useRef(
    debounce((v) => setBusquedaGlobal(v.toLowerCase()), 250)
  ).current;

  // 🔽 Ordenamiento
  const [sortBy, setSortBy] = useState("id"); // campo
  const [sortDir, setSortDir] = useState("asc"); // 'asc' | 'desc'

  // ◀️▶️ Paginación
  const [pageSize, setPageSize] = useState(10); // 10/25/50/0 (0 = todos)
  const [page, setPage] = useState(1);

  const [error, setError] = useState("");
  const [showCostoWarning, setShowCostoWarning] = useState(false);
  const [costoEditable, setCostoEditable] = useState(false);
  const costoInputRef = useRef();

  /* ---- Cargar estado guardado (localStorage) ---- */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      if (saved.busqueda) setBusqueda(saved.busqueda);
      if (typeof saved.busquedaGlobalInput === "string")
        setBusquedaGlobalInput(saved.busquedaGlobalInput);
      if (typeof saved.busquedaGlobal === "string")
        setBusquedaGlobal(saved.busquedaGlobal);
      if (saved.sortBy) setSortBy(saved.sortBy);
      if (saved.sortDir) setSortDir(saved.sortDir);
      if (typeof saved.pageSize === "number") setPageSize(saved.pageSize);
      if (typeof saved.page === "number") setPage(saved.page);
    } catch {}
  }, []);

  /* ---- Guardar estado en localStorage ---- */
  useEffect(() => {
    const state = {
      busqueda,
      busquedaGlobalInput,
      busquedaGlobal,
      sortBy,
      sortDir,
      pageSize,
      page,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [
    busqueda,
    busquedaGlobalInput,
    busquedaGlobal,
    sortBy,
    sortDir,
    pageSize,
    page,
  ]);

  /* ---- Cargar datos ---- */
  useEffect(() => {
    fetchAll();
  }, []);
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resA, resE, resT, resM] = await Promise.all([
        axios.get("http://localhost:3000/api/articulos"),
        axios.get("http://localhost:3000/api/empleados"),
        axios.get("http://localhost:3000/api/tipos-articulo"),
        axios.get("http://localhost:3000/api/marcas"),
      ]);
      setArticulos(resA.data);
      setEmpleados(resE.data);
      setTipos(resT.data);
      setMarcas(resM.data);
    } catch {
      setError("Error al cargar datos");
    }
    setLoading(false);
  };

  /* ---- Edición en tiempo real (solo campos permitidos) ---- */
  const debouncedUpdate = useRef(
    debounce(async (campo, valor) => {
      if (!editId) return;
      try {
        await axios.put(`http://localhost:3000/api/articulos/${editId}`, {
          ...form,
          [campo]: valor,
        });
        fetchAll();
      } catch {
        setError("Error al actualizar en tiempo real");
      }
    }, 500)
  ).current;

  /* ---- Handlers ---- */
  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    if (editId) {
      if (["id", "estado", "hotel", "costo", "descripcion"].includes(name)) {
        if (name === "costo" && !costoEditable) return;
        debouncedUpdate(name, value);
      }
    }
  };

  const handleCostoClick = () => {
    if (!costoEditable) setShowCostoWarning(true);
  };
  const confirmCostoEdit = () => {
    setShowCostoWarning(false);
    setCostoEditable(true);
    setTimeout(() => costoInputRef.current?.focus(), 100);
  };
  const cancelCostoEdit = () => {
    setShowCostoWarning(false);
    setCostoEditable(false);
  };

  const handleAdd = () => {
    setEditId(null);
    setForm({
      id: "",
      tipo_id: "",
      marca: "",
      modelo: "",
      numero_serie: "",
      estado: "disponible",
      hotel: "",
      empleado_id: "",
      costo: "",
      descripcion: "",
    });
    setShowForm(true);
    setCostoEditable(false);
  };

  const handleEdit = (art) => {
    setForm({
      ...art,
      tipo_id: art.tipo_id || "",
      empleado_id: art.empleado_id || "",
    });
    setEditId(art.id);
    setShowForm(true);
    setCostoEditable(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editId) {
        await axios.put(`http://localhost:3000/api/articulos/${editId}`, form);
      } else {
        await axios.post("http://localhost:3000/api/articulos", form);
      }
      setShowForm(false);
      setEditId(null);
      setForm({
        id: "",
        tipo_id: "",
        marca: "",
        modelo: "",
        numero_serie: "",
        estado: "disponible",
        hotel: "",
        empleado_id: "",
        costo: "",
        descripcion: "",
      });
      setCostoEditable(false);
      fetchAll();
    } catch (e) {
      setError(e?.response?.data?.error || "Error en el registro/edición");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este artículo?")) {
      try {
        await axios.delete(`http://localhost:3000/api/articulos/${id}`);
        fetchAll();
      } catch {
        setError("No se pudo eliminar (quizá está ligado a un préstamo)");
      }
    }
  };

  /* ---- Filtros específicos ---- */
  const handleBusqueda = (e) => {
    setBusqueda({ ...busqueda, [e.target.name]: e.target.value });
    setPage(1);
  };
  const limpiarFiltros = () => {
    setBusqueda({ tipo: "", numero_serie: "", hotel: "" });
    setBusquedaGlobalInput("");
    setBusquedaGlobal("");
    setPage(1);
    localStorage.removeItem(LS_KEY);
  };

  const serieSugeridas = articulos
    .filter(
      (a) =>
        busqueda.numero_serie.length > 0 &&
        (a.numero_serie || "")
          .toLowerCase()
          .includes(busqueda.numero_serie.toLowerCase())
    )
    .map((a) => a.numero_serie);

  /* ---- Aplicar filtros específicos ---- */
  const porFiltros = useMemo(
    () =>
      articulos.filter(
        (art) =>
          (busqueda.tipo === "" ||
            (art.tipo_nombre || "").toLowerCase() ===
              busqueda.tipo.toLowerCase()) &&
          (art.numero_serie || "")
            .toLowerCase()
            .includes(busqueda.numero_serie.toLowerCase()) &&
          (busqueda.hotel === "" || art.hotel === busqueda.hotel)
      ),
    [articulos, busqueda]
  );

  /* ---- 🔎 Filtro global ---- */
  useEffect(() => {
    debouncedSetBusquedaGlobal(busquedaGlobalInput);
  }, [busquedaGlobalInput, debouncedSetBusquedaGlobal]);

  const filtrados = useMemo(() => {
    if (!busquedaGlobal) return porFiltros;
    return porFiltros.filter((a) => {
      const hay = [
        a.id,
        a.tipo_nombre,
        a.marca,
        a.modelo,
        a.numero_serie,
        a.estado,
        a.hotel,
        a.empleado_nombre,
        a.costo,
        a.descripcion,
      ]
        .map(normalize)
        .join(" ");
      return hay.includes(busquedaGlobal);
    });
  }, [porFiltros, busquedaGlobal]);

  /* ---- Ordenamiento ---- */
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
        case "costo":
          va = toNumber(a.costo);
          vb = toNumber(b.costo);
          break;
        case "estado":
          // Orden personalizado: disponible > mantenimiento > ocupado > fuera de servicio
          const orden = {
            disponible: 3,
            mantenimiento: 2,
            ocupado: 1,
            "fuera de servicio": 0,
          };
          va = orden[a.estado] ?? 0;
          vb = orden[b.estado] ?? 0;
          break;
        default:
          va = normalize(a[sortBy]);
          vb = normalize(b[sortBy]);
      }

      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filtrados, sortBy, sortDir]);

  /* ---- Paginación ---- */
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
    // ventana compacta de paginación
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

  const camposEditables = ["id", "estado", "hotel", "costo", "descripcion"];

  return (
    <div className="max-w-7xl mx-auto mt-8 px-2 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-rose-900 mb-6">
        Equipos / Artículos
      </h2>

      <AgregarMarca onAdded={fetchAll} />
      <AgregarTipoArticulo onAdded={fetchAll} tipos={tipos} />

      {/* ===== Barra de filtros ===== */}
      <div className="flex flex-wrap gap-2 mb-3 items-center bg-white p-3 rounded-xl shadow border border-gray-200">
        <select
          name="tipo"
          value={busqueda.tipo}
          onChange={handleBusqueda}
          className="border border-gray-300 rounded-xl px-3 py-2 bg-white"
        >
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.nombre}>
              {t.nombre}
            </option>
          ))}
        </select>

        <input
          name="numero_serie"
          value={busqueda.numero_serie}
          onChange={handleBusqueda}
          placeholder="Filtrar por número de serie"
          className="border border-gray-300 rounded-xl px-3 py-2"
          list="sugerenciasSerie"
        />
        <datalist id="sugerenciasSerie">
          {serieSugeridas.map((num, i) => (
            <option value={num} key={i} />
          ))}
        </datalist>

        <select
          name="hotel"
          value={busqueda.hotel || ""}
          onChange={handleBusqueda}
          className="border border-gray-300 rounded-xl px-3 py-2 bg-white"
        >
          <option value="">Todos los hoteles</option>
          <option value="JW Marriott">JW Marriott</option>
          <option value="Marriott Resort">Marriott Resort</option>
        </select>

        <button
          className="px-4 py-2 rounded-xl ml-1 bg-gray-100 hover:bg-gray-200"
          onClick={limpiarFiltros}
        >
          Limpiar filtros
        </button>

        {/* 🔎 Buscador Global */}
        <div className="ml-auto flex items-center gap-2">
          <input
            value={busquedaGlobalInput}
            onChange={(e) => setBusquedaGlobalInput(e.target.value)}
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
            ✕
          </button>

          <button
            onClick={handleAdd}
            className="bg-rose-900 hover:bg-rose-500 text-white font-semibold px-5 py-2 rounded-2xl shadow transition"
          >
            + Agregar artículo
          </button>
        </div>
      </div>

      {/* ——— Barra de paginación superior (opcional) ——— */}
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
            {total === 0 ? 0 : from}–{to}
          </span>{" "}
          de <span className="font-semibold">{total}</span>
        </div>
      </div>

      {/* ===== Tabla ===== */}
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div
          className="overflow-x-auto rounded-2xl shadow border border-gray-200 bg-white"
          style={{ minHeight: "480px", width: "100%" }}
        >
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr className="text-gray-700 select-none">
                {[
                  ["id", "Nombre equipo/artículo"],
                  ["tipo_nombre", "Tipo"],
                  ["marca", "Marca"],
                  ["modelo", "Modelo"],
                  ["numero_serie", "Núm. Serie"],
                  ["estado", "Estado"],
                  ["hotel", "Hotel"],
                  ["empleado_nombre", "Empleado"],
                  ["costo", "Costo"],
                  ["descripcion", "Descripción"],
                ].map(([key, label]) => (
                  <th
                    key={key}
                    className="px-4 py-2 font-semibold cursor-pointer hover:bg-gray-200"
                    onClick={() => onSort(key)}
                    title={`Ordenar por ${label}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{label}</span>
                      <span className="text-xs opacity-70">
                        {sortIcon(sortBy === key, sortDir)}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2 font-semibold">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((art) => (
                <tr
                  key={art.id}
                  className={`border-t ${
                    art.estado === "ocupado" ? "bg-rose-50" : "bg-white"
                  } hover:bg-rose-100 transition`}
                >
                  <td className="px-4 py-2">{art.id}</td>
                  <td className="px-4 py-2">{art.tipo_nombre}</td>
                  <td className="px-4 py-2">{art.marca}</td>
                  <td className="px-4 py-2">{art.modelo}</td>
                  <td className="px-4 py-2">{art.numero_serie}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold
                      ${
                        art.estado === "disponible"
                          ? "bg-green-100 text-green-800"
                          : art.estado === "ocupado"
                          ? "bg-yellow-100 text-yellow-800"
                          : art.estado === "mantenimiento"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {art.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2">{art.hotel}</td>
                  <td className="px-4 py-2">{art.empleado_nombre || "-"}</td>
                  <td className="px-4 py-2">{mxn(art.costo)}</td>
                  <td className="px-4 py-2">{art.descripcion}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(art)}
                      className="text-rose-800 bg-gray-200 hover:text-white hover:bg-gray-500 transition rounded-xl px-2 py-1 font-semibold shadow"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(art.id)}
                      className="text-white bg-rose-900 hover:bg-rose-500 transition rounded-xl px-2 py-1 font-semibold shadow"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {pageSlice.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400" colSpan={12}>
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ——— Controles de paginación ——— */}
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

      {/* ===== Modal Formulario ===== */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-30 bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full relative">
            <button
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                setCostoEditable(false);
              }}
              className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-rose-400"
            >
              ×
            </button>

            <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col w-36">
                <label className="text-xs text-gray-500 mb-1">
                  Nombre equipo/artículo
                </label>
                <input
                  name="id"
                  value={form.id}
                  onChange={handleInput}
                  required
                  disabled={!!editId && !camposEditables.includes("id")}
                  placeholder="Nombre del equipo/artículo"
                  className="border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Tipo</label>
                <select
                  name="tipo_id"
                  value={form.tipo_id}
                  onChange={handleInput}
                  required
                  disabled={!!editId}
                  className="border border-gray-300 rounded-xl px-3 py-2 bg-white"
                >
                  <option value="">Selecciona tipo...</option>
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col w-32">
                <label className="text-xs text-gray-500 mb-1">Marca</label>
                <select
                  name="marca"
                  value={form.marca}
                  onChange={handleInput}
                  required
                  disabled={!!editId}
                  className="border border-gray-300 rounded-xl px-3 py-2 bg-white"
                >
                  <option value="">Selecciona la marca...</option>
                  {marcas.map((m) => (
                    <option key={m.id} value={m.nombre}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col w-32">
                <label className="text-xs text-gray-500 mb-1">Modelo</label>
                <input
                  name="modelo"
                  value={form.modelo}
                  onChange={handleInput}
                  required
                  disabled={!!editId}
                  placeholder="Modelo"
                  className="border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex flex-col w-44">
                <label className="text-xs text-gray-500 mb-1">Número de serie</label>
                <input
                  name="numero_serie"
                  value={form.numero_serie}
                  onChange={handleInput}
                  required
                  disabled={!!editId}
                  placeholder="Número de serie"
                  className="border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Estado</label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleInput}
                  required
                  className="border border-gray-300 rounded-xl px-3 py-2 bg-white"
                >
                  <option value="disponible">Disponible</option>
                  <option value="ocupado">Ocupado</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="fuera de servicio">Fuera de servicio</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Hotel</label>
                <select
                  name="hotel"
                  value={form.hotel}
                  onChange={handleInput}
                  required
                  className="border border-gray-300 rounded-xl px-3 py-2 bg-white"
                >
                  <option value="">Selecciona hotel...</option>
                  <option value="JW Marriott">JW Marriott</option>
                  <option value="Marriott Resort">Marriott Resort</option>
                </select>
              </div>

              <div className="flex flex-col w-32 relative">
                <label className="text-xs text-gray-500 mb-1">Costo (MXN)</label>
                <input
                  type="number"
                  name="costo"
                  value={form.costo}
                  onChange={handleInput}
                  required
                  readOnly={!!editId && !costoEditable}
                  placeholder="Costo"
                  step="0.01"
                  min="0"
                  className="border border-gray-300 rounded-xl px-3 py-2"
                  onClick={handleCostoClick}
                  ref={costoInputRef}
                />
                {showCostoWarning && (
                  <div className="bg-rose-100 border border-rose-400 text-rose-800 rounded p-2 mt-1 z-10 absolute left-0 right-0">
                    Cambiar el costo puede afectar al usuario en préstamo.
                    <br />
                    ¿Seguro que quieres modificarlo?
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={confirmCostoEdit}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 rounded"
                      >
                        Estoy seguro
                      </button>
                      <button
                        type="button"
                        onClick={cancelCostoEdit}
                        className="bg-gray-300 px-2 rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col w-44">
                <label className="text-xs text-gray-500 mb-1">Descripción</label>
                <input
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleInput}
                  className="border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <button
                type="submit"
                className="bg-rose-400 hover:bg-rose-500 text-white px-4 py-2 rounded-2xl shadow transition font-semibold"
              >
                {editId ? "Actualizar" : "Agregar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm({
                    id: "",
                    tipo_id: "",
                    marca: "",
                    modelo: "",
                    numero_serie: "",
                    estado: "disponible",
                    hotel: "",
                    empleado_id: "",
                    costo: "",
                    descripcion: "",
                  });
                  setShowForm(false);
                  setCostoEditable(false);
                }}
                className="bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded-2xl shadow transition text-gray-800 font-semibold"
              >
                Cancelar
              </button>
            </form>

            {error && <div className="text-red-600 mt-4">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

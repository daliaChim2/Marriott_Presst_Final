import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import debounce from "lodash/debounce";

const normalize = (v) => (v == null ? "" : String(v)).toLowerCase();
const sortIcon = (active, dir) => (!active ? "↕" : dir === "asc" ? "▲" : "▼");
const LS_KEY = "colaboradores_ui_state_v2"; // nueva versión de estado UI

export default function Colaboradores() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [form, setForm] = useState({
    nombre: "",
    hotel: "",
    cargo: "",
    departamento: "",
    numero_asociado: "",
    enterpasssid: "",
    status: "activo",
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Filtros específicos
  const [busqueda, setBusqueda] = useState({
    nombre: "",
    hotel: "",
    numero_asociado: "",
    status: "",
  });

  // búsqueda global
  const [busquedaGlobalInput, setBusquedaGlobalInput] = useState("");
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const debouncedSetBusquedaGlobal = useRef(
    debounce((v) => setBusquedaGlobal(v.toLowerCase()), 250)
  ).current;

  // orden
  const [sortBy, setSortBy] = useState("nombre");
  const [sortDir, setSortDir] = useState("asc");

  // paginación
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // mensajes
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Cargar estado UI
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      if (saved.busqueda) setBusqueda(saved.busqueda);
      if (typeof saved.busquedaGlobalInput === "string") setBusquedaGlobalInput(saved.busquedaGlobalInput);
      if (typeof saved.busquedaGlobal === "string") setBusquedaGlobal(saved.busquedaGlobal);
      if (typeof saved.sortBy === "string") setSortBy(saved.sortBy);
      if (typeof saved.sortDir === "string") setSortDir(saved.sortDir);
      if (typeof saved.pageSize === "number") setPageSize(saved.pageSize);
      if (typeof saved.page === "number") setPage(saved.page);
    } catch {}
  }, []);

  // Guardar UI
  useEffect(() => {
    const ui = {
      busqueda,
      busquedaGlobalInput,
      busquedaGlobal,
      sortBy,
      sortDir,
      pageSize,
      page,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(ui));
  }, [busqueda, busquedaGlobalInput, busquedaGlobal, sortBy, sortDir, pageSize, page]);

  // Data
  useEffect(() => { fetchEmpleados(); }, []);
  const fetchEmpleados = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.get("http://localhost:3000/api/empleados");
      setEmpleados(res.data);
    } catch {
      setError("Error al cargar empleados");
    }
    setLoading(false);
  };

  // Handlers
  const handleBusqueda = (e) => {
    setBusqueda({ ...busqueda, [e.target.name]: e.target.value });
    setPage(1);
  };
  const handleInput = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleEdit = (emp) => {
    setForm({
      nombre: emp.nombre,
      hotel: emp.hotel,
      cargo: emp.cargo || "",
      departamento: emp.departamento || "",
      numero_asociado: emp.numero_asociado,
      enterpasssid: emp.enterpasssid || "",
      status: emp.status || "activo",
    });
    setEditId(emp.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este empleado?")) {
      try {
        await axios.delete(`http://localhost:3000/api/empleados/${id}`);
        setSuccess("¡Empleado eliminado correctamente!");
        setError("");
        fetchEmpleados();
        setTimeout(() => setSuccess(""), 2500);
      } catch {
        setError("No se pudo eliminar (quizá está ligado a un artículo o préstamo)");
        setSuccess("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (editId) {
        await axios.put(`http://localhost:3000/api/empleados/${editId}`, form);
        setSuccess("¡Colaborador actualizado!");
      } else {
        await axios.post("http://localhost:3000/api/empleados", form);
        setSuccess("¡Colaborador agregado correctamente!");
      }
      setForm({
        nombre: "",
        hotel: "",
        cargo: "",
        departamento: "",
        numero_asociado: "",
        enterpasssid: "",
        status: "activo",
      });
      setEditId(null);
      setShowForm(false);
      fetchEmpleados();
      setTimeout(() => setSuccess(""), 2500);
    } catch (e2) {
      setError(e2?.response?.data?.error || "Error en el registro/edición");
      setSuccess("");
    }
  };

  const handleShowAddForm = () => {
    setForm({
      nombre: "",
      hotel: "",
      cargo: "",
      departamento: "",
      numero_asociado: "",
      enterpasssid: "",
      status: "activo",
    });
    setEditId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setForm({
      nombre: "",
      hotel: "",
      cargo: "",
      departamento: "",
      numero_asociado: "",
      enterpasssid: "",
      status: "activo",
    });
    setEditId(null);
    setShowForm(false);
    setError("");
    setSuccess("");
  };

  // Filtros específicos
  const porFiltros = useMemo(() => {
    return empleados.filter((emp) =>
      emp.nombre.toLowerCase().includes((busqueda.nombre || "").toLowerCase()) &&
      emp.hotel.toLowerCase().includes((busqueda.hotel || "").toLowerCase()) &&
      emp.numero_asociado.toLowerCase().includes((busqueda.numero_asociado || "").toLowerCase()) &&
      (busqueda.status === "" || (emp.status || "").toLowerCase() === busqueda.status.toLowerCase())
    );
  }, [empleados, busqueda]);

  // búsqueda global
  useEffect(() => {
    debouncedSetBusquedaGlobal(busquedaGlobalInput);
  }, [busquedaGlobalInput, debouncedSetBusquedaGlobal]);

  const filtrados = useMemo(() => {
    if (!busquedaGlobal) return porFiltros;
    return porFiltros.filter((e) => {
      const hay = [
        e.nombre,
        e.hotel,
        e.cargo,
        e.departamento,
        e.numero_asociado,
        e.enterpasssid,
        e.status,
      ]
        .map(normalize)
        .join(" ");
      return hay.includes(busquedaGlobal);
    });
  }, [porFiltros, busquedaGlobal]);

  // Orden
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
      const va = normalize(a[sortBy] ?? "");
      const vb = normalize(b[sortBy] ?? "");
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    return arr;
  }, [filtrados, sortBy, sortDir]);

  // Paginación
  const total = sorted.length;
  const pageCount = pageSize === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);

  const pageSlice =
    pageSize === 0
      ? sorted
      : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const from = pageSize === 0 ? (total === 0 ? 0 : 1) : (currentPage - 1) * pageSize + 1;
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

  const clearUI = () => {
    setBusqueda({ nombre: "", hotel: "", numero_asociado: "", status: "" });
    setBusquedaGlobalInput("");
    setBusquedaGlobal("");
    setSortBy("nombre");
    setSortDir("asc");
    setPageSize(10);
    setPage(1);
    localStorage.removeItem(LS_KEY);
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <h2 className="text-3xl font-bold text-rose-900 mb-6">Colaboradores / Empleados</h2>

      {/* NOTIFICACIONES */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 animate-fadein">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 animate-fadein">
          {error}
        </div>
      )}

      {!showForm && (
        <button
          onClick={handleShowAddForm}
          className="bg-rose-900 hover:bg-rose-500 text-white px-4 py-2 mb-5 rounded-2xl shadow font-semibold"
        >
          Agregar colaborador
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 flex flex-wrap gap-3 items-end bg-gray-50 p-4 rounded-2xl shadow"
        >
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Nombre completo</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleInput}
              required
              placeholder="Nombre completo"
              className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Hotel</label>
            <select
              name="hotel"
              value={form.hotel}
              onChange={handleInput}
              required
              className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400 bg-white"
            >
              <option value="">Selecciona hotel...</option>
              <option value="JW Marriott">JW Marriott</option>
              <option value="Marriott Resort">Marriott Resort</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Cargo/Puesto</label>
            <input
              name="cargo"
              value={form.cargo}
              onChange={handleInput}
              required
              placeholder="Cargo/Puesto"
              className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Departamento</label>
            <input
              name="departamento"
              value={form.departamento}
              onChange={handleInput}
              required
              placeholder="Departamento"
              className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1"># Asociado</label>
            <input
              name="numero_asociado"
              value={form.numero_asociado}
              onChange={handleInput}
              required
              placeholder="# Asociado"
              className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Enterprise</label>
            <input
              name="enterpasssid"
              value={form.enterpasssid}
              onChange={handleInput}
              placeholder="Enterprise"
              className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400"
            />
          </div>

          {/* Estatus */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Estatus</label>
            <select
              name="status"
              value={form.status}
              onChange={handleInput}
              className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none bg-white"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-rose-900 hover:bg-rose-500 text-white px-4 py-2 rounded-2xl shadow transition font-semibold"
          >
            {editId ? "Actualizar" : "Agregar"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded-2xl shadow transition text-gray-800 font-semibold"
          >
            Cancelar
          </button>
        </form>
      )}

      {/* Barra de filtros + búsqueda global */}
      <div className="flex flex-wrap gap-2 mb-3 items-center bg-white p-3 rounded-xl shadow border border-gray-200">
        <input
          name="nombre"
          value={busqueda.nombre}
          onChange={handleBusqueda}
          placeholder="Buscar por nombre"
          className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400 transition"
        />
        <select
          name="hotel"
          value={busqueda.hotel}
          onChange={handleBusqueda}
          className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400 transition bg-white"
        >
          <option value="">Todos los hoteles</option>
          <option value="JW Marriott">JW Marriott</option>
          <option value="Marriott Resort">Marriott Resort</option>
        </select>
        <input
          name="numero_asociado"
          value={busqueda.numero_asociado}
          onChange={handleBusqueda}
          placeholder="Filtrar por # asociado"
          className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400 transition"
        />

        {/* Filtro por estatus */}
        <select
          name="status"
          value={busqueda.status}
          onChange={handleBusqueda}
          className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none bg-white"
        >
          <option value="">Todos los estatus</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        {/* Global */}
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
            ✕
          </button>

          {(busqueda.nombre || busqueda.hotel || busqueda.numero_asociado || busqueda.status || busquedaGlobalInput) && (
            <button
              className="text-xs px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 border"
              onClick={clearUI}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

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

      {/* Tabla */}
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-700 select-none">
                {[
                  ["nombre", "Nombre"],
                  ["hotel", "Hotel"],
                  ["cargo", "Cargo"],
                  ["departamento", "Departamento"],
                  ["numero_asociado", "# Asociado"],
                  ["enterpasssid", "Enterprise"],
                  ["status", "Estatus"],
                ].map(([key, label]) => (
                  <th
                    key={key}
                    className="px-4 py-2 font-semibold cursor-pointer hover:bg-gray-300"
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
              {pageSlice.map((emp) => (
                <tr key={emp.id} className="border-t border-gray-200 hover:bg-rose-50 transition">
                  <td className="px-4 py-2">{emp.nombre}</td>
                  <td className="px-4 py-2">{emp.hotel}</td>
                  <td className="px-4 py-2">{emp.cargo}</td>
                  <td className="px-4 py-2">{emp.departamento}</td>
                  <td className="px-4 py-2">{emp.numero_asociado}</td>
                  <td className="px-4 py-2">{emp.enterpasssid}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold
                        ${ (emp.status || 'activo') === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700' }
                      `}
                    >
                      {emp.status || 'activo'}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="text-rose-900 bg-gray-200 hover:bg-gray-400 transition rounded-xl px-2 py-1 font-semibold shadow"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="text-white bg-rose-900 hover:bg-rose-600 transition rounded-xl px-2 py-1 font-semibold shadow"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {pageSlice.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400" colSpan={8}>
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Controles de paginación */}
      {pageSize !== 0 && (
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

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import debounce from "lodash/debounce";

// Subcomponentes para agregar marcas y tipos
function AgregarTipoArticulo({ onAdded, tipos }) {
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [error, setError] = useState("");
  const handleAdd = async e => {
    e.preventDefault();
    if (tipos.some(t => t.nombre.trim().toLowerCase() === nuevoTipo.trim().toLowerCase())) {
      setError("Ya existe un tipo de artículo con ese nombre.");
      return;
    }
    try {
      await axios.post("http://localhost:3000/api/tipos-articulo", { nombre: nuevoTipo });
      setNuevoTipo("");
      setError("");
      onAdded();
    } catch (e) {
      setError(e?.response?.data?.error || "Error al agregar");
    }
  };
  return (
    <form onSubmit={handleAdd} className="flex gap-2 items-end mb-2">
      <input value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)} required
        placeholder="Nuevo tipo de artículo" className="border px-2 py-1 rounded" />
      <button type="submit" className="bg-rose-400 hover:bg-rose-500 text-white px-3 rounded">Agregar</button>
      {error && <span className="text-red-600 ml-2">{error}</span>}
    </form>
  );
}
function AgregarMarca({ onAdded }) {
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [error, setError] = useState("");
  const handleAdd = async e => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/marcas", { nombre: nuevaMarca });
      setNuevaMarca("");
      setError("");
      onAdded();
    } catch (e) {
      setError(e?.response?.data?.error || "Error al agregar");
    }
  };
  return (
    <form onSubmit={handleAdd} className="flex gap-2 items-end mb-4">
      <input value={nuevaMarca} onChange={e => setNuevaMarca(e.target.value)} required
        placeholder="Nueva marca" className="border px-2 py-1 rounded" />
      <button type="submit" className="bg-rose-400 hover:bg-rose-500 text-white px-3 rounded">Agregar</button>
      {error && <span className="text-red-600 ml-2">{error}</span>}
    </form>
  );
}

// -------- COMPONENTE PRINCIPAL ---------
export default function Equipos() {
  const [marcas, setMarcas] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    id: "", tipo_id: "", marca: "", modelo: "", numero_serie: "", estado: "disponible",
    hotel: "", empleado_id: "", costo: "", descripcion: ""
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState({ tipo: "", numero_serie: "", hotel: "" });
  const [error, setError] = useState("");
  const [showCostoWarning, setShowCostoWarning] = useState(false);
  const [costoEditable, setCostoEditable] = useState(false);
  const costoInputRef = useRef();

  // Cargar datos
  useEffect(() => { fetchAll(); }, []);
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

  // Debounced update para edición en tiempo real
  // (Sólo para campos permitidos, sólo si editando)
  const debouncedUpdate = useRef(
    debounce(async (campo, valor) => {
      if (!editId) return;
      try {
        await axios.put(`http://localhost:3000/api/articulos/${editId}`, { ...form, [campo]: valor });
        fetchAll();
      } catch {
        setError("Error al actualizar en tiempo real");
      }
    }, 500)
  ).current;

  // ---- Handlers ----
  const handleInput = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));

    // Actualiza en tiempo real si está editando y campo permitido
    if (editId) {
      if (
        ["id", "estado", "hotel", "costo", "descripcion"].includes(name) ||
        name === "numero_serie" // Si decides permitir editar número_serie, agrega aquí (pero usualmente no)
      ) {
        // Para costo, solo si está desbloqueado
        if (name === "costo" && !costoEditable) return;
        debouncedUpdate(name, value);
      }
    }
  };

  // Para campo costo: advierte antes de desbloquear edición
  const handleCostoClick = () => {
    if (!costoEditable) setShowCostoWarning(true);
  };
  const confirmCostoEdit = () => {
    setShowCostoWarning(false);
    setCostoEditable(true);
    setTimeout(() => {
      if (costoInputRef.current) costoInputRef.current.focus();
    }, 100);
  };
  const cancelCostoEdit = () => {
    setShowCostoWarning(false);
    setCostoEditable(false);
  };

  // Mostrar formulario (limpia datos si es agregar)
  const handleAdd = () => {
    setEditId(null);
    setForm({
      id: "", tipo_id: "", marca: "", modelo: "", numero_serie: "", estado: "disponible", hotel: "", empleado_id: "", costo: "", descripcion: ""
    });
    setShowForm(true);
    setCostoEditable(false);
  };

  // Editar: sólo se puede editar los campos permitidos
  const handleEdit = art => {
    setForm({
      ...art,
      tipo_id: art.tipo_id || "",
      empleado_id: art.empleado_id || "",
    });
    setEditId(art.id);
    setShowForm(true);
    setCostoEditable(false);
  };

  // Guardar/agregar manual (al enviar formulario)
  const handleSubmit = async e => {
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
        id: "", tipo_id: "", marca: "", modelo: "", numero_serie: "", estado: "disponible", hotel: "", empleado_id: "", costo: "", descripcion: ""
      });
      setCostoEditable(false);
      fetchAll();
    } catch (e) {
      setError(e?.response?.data?.error || "Error en el registro/edición");
    }
  };

  // Eliminar artículo
  const handleDelete = async id => {
    if (window.confirm("¿Eliminar este artículo?")) {
      try {
        await axios.delete(`http://localhost:3000/api/articulos/${id}`);
        fetchAll();
      } catch {
        setError("No se pudo eliminar (quizá está ligado a un préstamo)");
      }
    }
  };

  // Filtros
  const handleBusqueda = e => setBusqueda({ ...busqueda, [e.target.name]: e.target.value });
  const limpiarFiltros = () => setBusqueda({ tipo: "", numero_serie: "", hotel: "" });

  // Búsqueda en vivo (por número de serie)
  const serieSugeridas = articulos
    .filter(a => busqueda.numero_serie.length > 0 && a.numero_serie.toLowerCase().includes(busqueda.numero_serie.toLowerCase()))
    .map(a => a.numero_serie);

  // Filtros
  const articulosFiltrados = articulos.filter(art =>
    (busqueda.tipo === "" || (art.tipo_nombre || "").toLowerCase() === busqueda.tipo.toLowerCase()) &&
    art.numero_serie.toLowerCase().includes(busqueda.numero_serie.toLowerCase()) &&
    (busqueda.hotel === "" || art.hotel === busqueda.hotel)
  );

  // Campos editables
  const camposEditables = ["id", "estado", "hotel", "costo", "descripcion"];
  // (Puedes agregar "numero_serie" si quieres permitirlo, aunque normalmente no)

  return (
    <div className="max-w-7xl mx-auto mt-8 px-2 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Equipos / Artículos</h2>

      {/* Marcas y tipos */}
      <AgregarMarca onAdded={fetchAll} />
      <AgregarTipoArticulo onAdded={fetchAll} tipos={tipos} />

      {/* Barra de filtros */}
      <div className="flex flex-wrap gap-2 mb-6 items-center bg-white p-3 rounded-xl shadow border border-gray-200">
        <select
          name="tipo"
          value={busqueda.tipo}
          onChange={handleBusqueda}
          className="border border-gray-300 rounded-xl px-3 py-2 bg-white"
        >
          <option value="">Todos los tipos</option>
          {tipos.map(t => (
            <option key={t.id} value={t.nombre}>{t.nombre}</option>
          ))}
        </select>
        {/* Filtro de número de serie con datalist */}
        <input
          name="numero_serie"
          value={busqueda.numero_serie}
          onChange={handleBusqueda}
          placeholder="Filtrar por número de serie"
          className="border border-gray-300 rounded-xl px-3 py-2"
          list="sugerenciasSerie"
        />
        <datalist id="sugerenciasSerie">
          {serieSugeridas.map((num, i) =>
            <option value={num} key={i} />
          )}
        </datalist>
        {/* Filtro por hotel */}
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
          className="px-4 py-2 rounded-xl ml-2 bg-gray-100 hover:bg-gray-200"
          onClick={limpiarFiltros}
        >Limpiar filtros</button>
        {/* Botón agregar */}
        <button
          onClick={handleAdd}
          className="ml-auto bg-rose-400 hover:bg-rose-500 text-white font-semibold px-5 py-2 rounded-2xl shadow transition"
        >+ Agregar artículo</button>
      </div>

      {/* --- FORMULARIO MODAL --- */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-30 bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full relative">
            <button
              onClick={() => { setShowForm(false); setEditId(null); setCostoEditable(false); }}
              className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-rose-400"
            >×</button>
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
              {/* Nombre equipo/artículo (ID) */}
              <div className="flex flex-col w-36">
                <label className="text-xs text-gray-500 mb-1">Nombre equipo/artículo</label>
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
                <select name="tipo_id" value={form.tipo_id} onChange={handleInput} required
                  disabled={!!editId}
                  className="border border-gray-300 rounded-xl px-3 py-2 bg-white">
                  <option value="">Selecciona tipo...</option>
                  {tipos.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col w-32">
                <label className="text-xs text-gray-500 mb-1">Marca</label>
                <select name="marca" value={form.marca} onChange={handleInput} required
                  disabled={!!editId}
                  className="border border-gray-300 rounded-xl px-3 py-2 bg-white">
                  <option value="">Selecciona marca...</option>
                  {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                </select>
              </div>
              <div className="flex flex-col w-32">
                <label className="text-xs text-gray-500 mb-1">Modelo</label>
                <input name="modelo" value={form.modelo} onChange={handleInput} required
                  disabled={!!editId}
                  placeholder="Modelo" className="border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              <div className="flex flex-col w-44">
                <label className="text-xs text-gray-500 mb-1">Número de serie</label>
                <input name="numero_serie" value={form.numero_serie} onChange={handleInput} required
                  disabled={!!editId}
                  placeholder="Número de serie" className="border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              {/* Solo campos editables aquí abajo */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Estado</label>
                <select name="estado" value={form.estado} onChange={handleInput} required
                  className="border border-gray-300 rounded-xl px-3 py-2 bg-white">
                  <option value="disponible">Disponible</option>
                  <option value="ocupado">Ocupado</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="fuera de servicio">Fuera de servicio</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Hotel</label>
                <select name="hotel" value={form.hotel} onChange={handleInput} required
                  className="border border-gray-300 rounded-xl px-3 py-2 bg-white">
                  <option value="">Selecciona hotel...</option>
                  <option value="JW Marriott">JW Marriott</option>
                  <option value="Marriott Resort">Marriott Resort</option>
                </select>
              </div>
              {/* Costo con advertencia */}
              <div className="flex flex-col w-32">
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
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 rounded p-2 mt-1 z-10 absolute">
                    Cambiar el costo puede afectar al usuario en préstamo.<br />
                    ¿Seguro que quieres modificarlo?
                    <div className="flex gap-2 mt-2">
                      <button type="button" onClick={confirmCostoEdit} className="bg-green-500 hover:bg-green-600 text-white px-2 rounded">Estoy seguro</button>
                      <button type="button" onClick={cancelCostoEdit} className="bg-gray-300 px-2 rounded">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col w-44">
                <label className="text-xs text-gray-500 mb-1">Descripción</label>
                <input name="descripcion" value={form.descripcion} onChange={handleInput}
                  className="border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              <button type="submit"
                className="bg-rose-400 hover:bg-rose-500 text-white px-4 py-2 rounded-2xl shadow transition font-semibold">
                {editId ? "Actualizar" : "Agregar"}
              </button>
              <button type="button"
                onClick={() => { setEditId(null); setForm({ id: "", tipo_id: "", marca: "", modelo: "", numero_serie: "", estado: "disponible", hotel: "", empleado_id: "", costo: "", descripcion: "" }); setShowForm(false); setCostoEditable(false); }}
                className="bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded-2xl shadow transition text-gray-800 font-semibold">
                Cancelar
              </button>
            </form>
            {error && <div className="text-red-600 mt-4">{error}</div>}
          </div>
        </div>
      )}

      {/* --- TABLA --- */}
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow border border-gray-200 bg-white" style={{ minHeight: '480px', width: "100%" }}>
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr className="text-gray-700">
                <th className="px-4 py-2 font-semibold">Nombre equipo/artículo</th>
                <th className="px-4 py-2 font-semibold">Tipo</th>
                <th className="px-4 py-2 font-semibold">Marca</th>
                <th className="px-4 py-2 font-semibold">Modelo</th>
                <th className="px-4 py-2 font-semibold">Núm. Serie</th>
                <th className="px-4 py-2 font-semibold">Estado</th>
                <th className="px-4 py-2 font-semibold">Hotel</th>
                <th className="px-4 py-2 font-semibold">Empleado</th>
                <th className="px-4 py-2 font-semibold">Costo</th>
                <th className="px-4 py-2 font-semibold">Descripción</th>
                <th className="px-4 py-2 font-semibold">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {articulosFiltrados.map(art => (
                <tr key={art.id}
                  className={`border-t ${art.estado === 'ocupado' ? 'bg-rose-50' : 'bg-white'} hover:bg-rose-100 transition`}>
                  <td className="px-4 py-2">{art.id}</td>
                  <td className="px-4 py-2">{art.tipo_nombre}</td>
                  <td className="px-4 py-2">{art.marca}</td>
                  <td className="px-4 py-2">{art.modelo}</td>
                  <td className="px-4 py-2">{art.numero_serie}</td>
                  <td className="px-4 py-2">
                    <span className={`
                      inline-block px-2 py-1 rounded-full text-xs font-semibold
                      ${art.estado === 'disponible' ? 'bg-green-100 text-green-800'
                        : art.estado === 'ocupado' ? 'bg-yellow-100 text-yellow-800'
                          : art.estado === 'mantenimiento' ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'}
                    `}>
                      {art.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2">{art.hotel}</td>
                  <td className="px-4 py-2">{art.empleado_nombre || "-"}</td>
                  <td className="px-4 py-2">{art.costo}</td>
                  <td className="px-4 py-2">{art.descripcion}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => handleEdit(art)}
                      className="text-gray-800 bg-gray-200 hover:bg-gray-400 transition rounded-xl px-2 py-1 font-semibold shadow">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(art.id)}
                      className="text-white bg-rose-400 hover:bg-rose-600 transition rounded-xl px-2 py-1 font-semibold shadow">
                      Eliminar
                    </button>
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

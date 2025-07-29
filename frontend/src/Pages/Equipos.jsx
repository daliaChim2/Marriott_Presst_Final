import { useEffect, useState } from "react";
import axios from "axios";


// zzz

function AgregarTipoArticulo({ onAdded, tipos }) {
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [error, setError] = useState("");
  const handleAdd = async e => {
    e.preventDefault();
    // Validación: no permitir duplicados (sin importar mayúsculas/minúsculas)
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


// zzz
// zzzz

function AgregarMarca({ onAdded }) {
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [error, setError] = useState("");
  const handleAdd = async e => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/marcas", { nombre: nuevaMarca });
      setNuevaMarca("");
      setError("");
      onAdded(); // recarga la lista
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
// zzzz


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
  const [busqueda, setBusqueda] = useState({ tipo: "", numero_serie: "", hotel: "" });
  const [error, setError] = useState("");

  // Cargar artículos, empleados y tipos
  useEffect(() => { fetchAll(); }, []);
 const fetchAll = async () => {
    setLoading(true);
    try {
      const [resA, resE, resT, resM] = await Promise.all([
        axios.get("http://localhost:3000/api/articulos"),
        axios.get("http://localhost:3000/api/empleados"),
        axios.get("http://localhost:3000/api/tipos-articulo"),
        axios.get("http://localhost:3000/api/marcas"), // <--- AÑADIDO
      ]);
      setArticulos(resA.data);
      setEmpleados(resE.data);
      setTipos(resT.data);
      setMarcas(resM.data); // <--- AÑADIDO
    } catch {
      setError("Error al cargar datos");
    }
    setLoading(false);
  };

  const handleInput = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleBusqueda = e => setBusqueda({ ...busqueda, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      if (editId) {
        await axios.put(`http://localhost:3000/api/articulos/${editId}`, form);
      } else {
        await axios.post("http://localhost:3000/api/articulos", form);
      }
      setForm({ id: "", tipo_id: "", marca: "", modelo: "", numero_serie: "", estado: "disponible", hotel: "", empleado_id: "", costo: "", descripcion: "" });
      setEditId(null);
      fetchAll();
    } catch (e) {
      setError(e?.response?.data?.error || "Error en el registro/edición");
    }
  };

  const handleEdit = art => {
    setForm({
      ...art,
      tipo_id: art.tipo_id || "",
      empleado_id: art.empleado_id || "",
    });
    setEditId(art.id);
    setError("");
  };

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

  // Filtro por tipo y número de serie
 const articulosFiltrados = articulos.filter(art =>
  (busqueda.tipo === "" || (art.tipo_nombre || "").toLowerCase() === busqueda.tipo.toLowerCase()) &&
  art.numero_serie.toLowerCase().includes(busqueda.numero_serie.toLowerCase()) &&
  (busqueda.hotel === "" || art.hotel === busqueda.hotel)
);

console.log("articulos:", articulos);
console.log("articulosFiltrados:", articulosFiltrados);
console.log("busqueda:", busqueda);

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Equipos / Artículos</h2>
      
      {/* zzz */}
        <AgregarMarca onAdded={fetchAll} />
         <AgregarTipoArticulo onAdded={fetchAll} tipos={tipos} />
      {/* zzz */}

            <div className="flex flex-wrap gap-2 mb-6">
        {/* Filtro por tipo */}
        <select
          name="tipo"
          value={busqueda.tipo}
          onChange={handleBusqueda}
          className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400 bg-white"
        >
          <option value="">Todos los tipos</option>
          {tipos.map(t => (
            <option key={t.id} value={t.nombre}>{t.nombre}</option>
          ))}
        </select>
        {/* Filtro por número de serie */}
        <input name="numero_serie" value={busqueda.numero_serie} onChange={handleBusqueda}
          placeholder="Filtrar por número de serie"
          className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400 transition" />
        {/* Filtro por hotel */}
        <select
          name="hotel"
          value={busqueda.hotel || ""}
          onChange={handleBusqueda}
          className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400 bg-white"
        >
          <option value="">Todos los hoteles</option>
          <option value="JW Marriott">JW Marriott</option>
          <option value="Marriott Resort">Marriott Resort</option>
        </select>
      </div>

      {/* z */}
      
      {/* z */}
           
      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap gap-3 items-end bg-gray-50 p-4 rounded-2xl shadow">
        <div className="flex flex-col w-32">
          <label className="text-xs text-gray-500 mb-1">ID (LP001, etc.)</label>
          <input name="id" value={form.id} onChange={handleInput} required disabled={!!editId}
            placeholder="ID" className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Tipo</label>
          <select name="tipo_id" value={form.tipo_id} onChange={handleInput} required
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-rose-400">
            <option value="">Selecciona tipo...</option>
            {tipos.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
            <div className="flex flex-col w-32">
          <label className="text-xs text-gray-500 mb-1">Marca</label>
          <select name="marca" value={form.marca} onChange={handleInput} required
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-rose-400">
            <option value="">Selecciona marca...</option>
            {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
          </select>
        </div>

        <div className="flex flex-col w-32">
          <label className="text-xs text-gray-500 mb-1">Modelo</label>
          <input name="modelo" value={form.modelo} onChange={handleInput} required
            placeholder="Modelo" className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400" />
        </div>
        <div className="flex flex-col w-44">
          <label className="text-xs text-gray-500 mb-1">Número de serie</label>
          <input name="numero_serie" value={form.numero_serie} onChange={handleInput} required disabled={!!editId}
            placeholder="Número de serie" className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Estado</label>
          <select name="estado" value={form.estado} onChange={handleInput} required
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-rose-400">
            <option value="disponible">Disponible</option>
            <option value="ocupado">Ocupado</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="fuera de servicio">Fuera de servicio</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Hotel</label>
          <select name="hotel" value={form.hotel} onChange={handleInput} required
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-rose-400">
            <option value="">Selecciona hotel...</option>
            <option value="JW Marriott">JW Marriott</option>
            <option value="Marriott Resort">Marriott Resort</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Empleado asignado</label>
          <select name="empleado_id" value={form.empleado_id} onChange={handleInput}
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-rose-400">
            <option value="">Sin asignar</option>
            {empleados.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.numero_asociado})</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col w-32">
          <label className="text-xs text-gray-500 mb-1">Costo (MXN)</label>
          <input type="number" name="costo" value={form.costo} onChange={handleInput} required disabled={!!editId}
            placeholder="Costo" step="0.01" min="0" className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400" />
        </div>
        <div className="flex flex-col w-44">
          <label className="text-xs text-gray-500 mb-1">Descripción</label>
          <input name="descripcion" value={form.descripcion} onChange={handleInput}
            placeholder="Descripción" className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400" />
        </div>
        <button type="submit"
          className="bg-rose-400 hover:bg-rose-500 text-white px-4 py-2 rounded-2xl shadow transition font-semibold">
          {editId ? "Actualizar" : "Agregar"}
        </button>
        {editId && <button type="button"
          onClick={() => { setEditId(null); setForm({ id: "", tipo_id: "", marca: "", modelo: "", numero_serie: "", estado: "disponible", hotel: "", empleado_id: "", costo: "", descripcion: "" }); }}
          className="bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded-2xl shadow transition text-gray-800 font-semibold">
          Cancelar
        </button>}
      </form>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-4 py-2 font-semibold">ID</th>
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
                <tr key={art.id} className="border-t border-gray-200 hover:bg-rose-50 transition">
                  <td className="px-4 py-2">{art.id}</td>
                  <td className="px-4 py-2">{art.tipo_nombre}</td>
                  <td className="px-4 py-2">{art.marca}</td>
                  <td className="px-4 py-2">{art.modelo}</td>
                  <td className="px-4 py-2">{art.numero_serie}</td>
                  <td className="px-4 py-2">{art.estado}</td>
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

import { useEffect, useState } from "react";
import axios from "axios";

export default function Colaboradores() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: "", hotel: "", cargo: "", departamento: "", numero_asociado: "", enterpasssid: "" });
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState({ nombre: "", hotel: "", numero_asociado: "" });
  const [error, setError] = useState("");

  useEffect(() => { fetchEmpleados(); }, []);

  const fetchEmpleados = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/empleados");
      setEmpleados(res.data);
    } catch {
      setError("Error al cargar empleados");
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
        await axios.put(`http://localhost:3000/api/empleados/${editId}`, form);
      } else {
        await axios.post("http://localhost:3000/api/empleados", form);
      }
      setForm({ nombre: "", hotel: "", cargo: "", departamento: "", numero_asociado: "", enterpasssid: "" });
      setEditId(null);
      fetchEmpleados();
    } catch (e) {
      setError(e?.response?.data?.error || "Error en el registro/edición");
    }
  };

  const handleEdit = emp => {
    setForm(emp);
    setEditId(emp.id);
    setError("");
  };

  const handleDelete = async id => {
    if (window.confirm("¿Eliminar este empleado?")) {
      try {
        await axios.delete(`http://localhost:3000/api/empleados/${id}`);
        fetchEmpleados();
      } catch {
        setError("No se pudo eliminar (quizá está ligado a un artículo o préstamo)");
      }
    }
  };

  // Filtro múltiple por nombre, hotel, número asociado
  const empleadosFiltrados = empleados.filter(emp =>
    emp.nombre.toLowerCase().includes(busqueda.nombre.toLowerCase()) &&
    emp.hotel.toLowerCase().includes(busqueda.hotel.toLowerCase()) &&
    emp.numero_asociado.toLowerCase().includes(busqueda.numero_asociado.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Colaboradores / Empleados</h2>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <input name="nombre" value={busqueda.nombre} onChange={handleBusqueda}
          placeholder="Buscar por nombre"
          className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400 transition" />
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

        <input name="numero_asociado" value={busqueda.numero_asociado} onChange={handleBusqueda}
          placeholder="Filtrar por # asociado"
          className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400 transition" />
      </div>
      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap gap-3 items-end bg-gray-50 p-4 rounded-2xl shadow">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Nombre completo</label>
          <input name="nombre" value={form.nombre} onChange={handleInput} required placeholder="Nombre completo"
            className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400" />
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
            <option value="">Selecciona un hotel...</option>
            <option value="JW Marriott">JW Marriott</option>
            <option value="Marriott Resort">Marriott Resort</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Cargo/Puesto</label>
          <input name="cargo" value={form.cargo} onChange={handleInput} required placeholder="Cargo/Puesto"
            className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Departamento</label>
          <input name="departamento" value={form.departamento} onChange={handleInput} required placeholder="Departamento"
            className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1"># Asociado</label>
          <input name="numero_asociado" value={form.numero_asociado} onChange={handleInput} required placeholder="# Asociado"
            className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Enterpass SID</label>
          <input name="enterpasssid" value={form.enterpasssid} onChange={handleInput} placeholder="Enterpass SID"
            className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-400" />
        </div>
        <button type="submit"
          className="bg-rose-400 hover:bg-rose-500 text-white px-4 py-2 rounded-2xl shadow transition font-semibold">
          {editId ? "Actualizar" : "Agregar"}
        </button>
        {editId && <button type="button"
          onClick={() => { setEditId(null); setForm({ nombre: "", hotel: "", cargo: "", departamento: "", numero_asociado: "", enterpasssid: "" }); }}
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
                <th className="px-4 py-2 font-semibold">Nombre</th>
                <th className="px-4 py-2 font-semibold">Hotel</th>
                <th className="px-4 py-2 font-semibold">Cargo</th>
                <th className="px-4 py-2 font-semibold">Departamento</th>
                <th className="px-4 py-2 font-semibold"># Asociado</th>
                <th className="px-4 py-2 font-semibold">Enterpass SID</th>
                <th className="px-4 py-2 font-semibold">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {empleadosFiltrados.map(emp => (
                <tr key={emp.id} className="border-t border-gray-200 hover:bg-rose-50 transition">
                  <td className="px-4 py-2">{emp.nombre}</td>
                  <td className="px-4 py-2">{emp.hotel}</td>
                  <td className="px-4 py-2">{emp.cargo}</td>
                  <td className="px-4 py-2">{emp.departamento}</td>
                  <td className="px-4 py-2">{emp.numero_asociado}</td>
                  <td className="px-4 py-2">{emp.enterpasssid}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => handleEdit(emp)}
                      className="text-gray-800 bg-gray-200 hover:bg-gray-400 transition rounded-xl px-2 py-1 font-semibold shadow">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(emp.id)}
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

import { useEffect, useState } from "react";
import axios from "axios";

export default function Sistemas() {
  const usuarioLogueado = JSON.parse(localStorage.getItem("user") || "{}");

  const [empleados, setEmpleados] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [todosArticulos, setTodosArticulos] = useState([]);
  const [form, setForm] = useState({
    empleado_id: "",
    articulos: [],
    comentarios: "",
    fecha_prestamo: new Date().toISOString().slice(0, 10),
    periodo: "permanente",
    fecha_vencimiento: ""
  });
  const [busquedaSerie, setBusquedaSerie] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 1. Cargar empleados y artículos disponibles
  useEffect(() => {
    axios.get("http://localhost:3000/api/empleados")
      .then(res => setEmpleados(res.data))
      .catch(() => setError("Error al cargar empleados"));
    axios.get("http://localhost:3000/api/articulos/disponibles")
      .then(res => {
        setTodosArticulos(res.data);
        setArticulos([]); // Se llena en base al empleado seleccionado
      })
      .catch(() => setError("Error al cargar artículos"));
  }, []);

  // 2. Cuando se selecciona empleado, filtra artículos por hotel
  useEffect(() => {
    if (!form.empleado_id) {
      setArticulos([]);
      return;
    }
    const empleado = empleados.find(e => e.id === parseInt(form.empleado_id));
    if (empleado) {
      setArticulos(
        todosArticulos.filter(
          a => a.hotel === empleado.hotel
        )
      );
      // Limpia los artículos seleccionados que no son de ese hotel
      setForm(f => ({
        ...f,
        articulos: f.articulos.filter(id => {
          const art = todosArticulos.find(a => a.id === id);
          return art && art.hotel === empleado.hotel;
        })
      }));
    }
  }, [form.empleado_id, empleados, todosArticulos]);

  // 3. Buscador en vivo por número de serie sobre artículos disponibles del hotel
  const articulosFiltrados = articulos.filter(
    a =>
      a.numero_serie.toLowerCase().includes(busquedaSerie.toLowerCase()) ||
      a.id.toLowerCase().includes(busquedaSerie.toLowerCase())
  );

  // 4. Actualización automática fecha vencimiento (solo visual, backend igual calcula)
  useEffect(() => {
    if (form.periodo === "permanente") {
      const fecha = new Date(form.fecha_prestamo);
      fecha.setFullYear(fecha.getFullYear() + 1);
      setForm(f => ({ ...f, fecha_vencimiento: fecha.toISOString().slice(0, 10) }));
    }
  }, [form.fecha_prestamo, form.periodo]);

  // 5. Manejadores
  const handleChange = e => {
    const { name, value, type, selectedOptions } = e.target;
    if (type === "select-multiple") {
      setForm(f => ({
        ...f,
        [name]: Array.from(selectedOptions, o => o.value)
      }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  // 6. Seleccionar/deseleccionar artículos de la lista (click en la mini-lista)
  const handleAddArticulo = id => {
    if (!form.articulos.includes(id)) {
      setForm(f => ({ ...f, articulos: [...f.articulos, id] }));
    }
  };
  const handleRemoveArticulo = id => {
    setForm(f => ({ ...f, articulos: f.articulos.filter(x => x !== id) }));
  };

  // 7. Cambio de periodo
  const handlePeriodo = e => {
    const value = e.target.value;
    setForm(f => ({
      ...f,
      periodo: value,
      fecha_vencimiento: value === "permanente"
        ? (() => {
            const fecha = new Date(f.fecha_prestamo);
            fecha.setFullYear(fecha.getFullYear() + 1);
            return fecha.toISOString().slice(0, 10);
          })()
        : ""
    }));
  };

  // 8. Enviar formulario
  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.empleado_id || form.articulos.length === 0)
      return setError("Completa todos los campos obligatorios.");

    // Chequeo frontend: No permitir autopréstamo
    const empleadoSel = empleados.find(e => String(e.id) === String(form.empleado_id));
    if (empleadoSel && empleadoSel.nombre === usuarioLogueado.nombre) {
      setError("No puedes auto-prestarte artículos.");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/prestamos", {
        ...form,
        usuario_entrega: usuarioLogueado?.nombre || "",
      });
      setSuccess("Préstamo registrado correctamente.");
      setForm({
        empleado_id: "",
        articulos: [],
        comentarios: "",
        fecha_prestamo: new Date().toISOString().slice(0, 10),
        periodo: "permanente",
        fecha_vencimiento: ""
      });
      setBusquedaSerie("");
      // Recarga los artículos disponibles
      const res = await axios.get("http://localhost:3000/api/articulos/disponibles");
      setTodosArticulos(res.data);
      setArticulos([]);
    } catch (e) {
      setError(e?.response?.data?.error || "Error al registrar préstamo");
    }
  };

  // Obtén objetos de los artículos seleccionados para la mini-lista
  const articulosSeleccionados = articulos.filter(a => form.articulos.includes(a.id));

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white p-6 rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Registrar préstamo</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Empleado que recibe */}
        <div>
          <label className="block text-xs mb-1 text-gray-500">Empleado que recibe</label>
          <select
            name="empleado_id"
            value={form.empleado_id}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-xl px-3 py-2 w-full bg-white"
          >
            <option value="">Selecciona empleado...</option>
            {empleados
              .filter(e => e.nombre !== usuarioLogueado.nombre) // Oculta al usuario logueado
              .map(e => (
                <option key={e.id} value={e.id}>
                  {e.nombre} ({e.numero_asociado}) - {e.hotel}
                </option>
              ))}
          </select>
        </div>
        {/* Artículos con buscador por número de serie */}
        <div>
          <label className="block text-xs mb-1 text-gray-500">Artículos a prestar (por número de serie, nombre o ID)</label>
          <input
            value={busquedaSerie}
            onChange={e => setBusquedaSerie(e.target.value)}
            placeholder="Buscar por número de serie..."
            className="border border-gray-300 rounded-xl px-3 py-2 w-full bg-white mb-2"
            disabled={articulos.length === 0}
          />
          <div className="border rounded-xl bg-gray-50 mb-2 max-h-32 overflow-auto">
            {articulosFiltrados.length === 0 && (
              <div className="text-gray-400 px-3 py-2">No hay artículos disponibles</div>
            )}
            {articulosFiltrados
              .filter(a => !form.articulos.includes(a.id))
              .map(a => (
                <div
                  key={a.id}
                  onClick={() => handleAddArticulo(a.id)}
                  className="px-3 py-1 hover:bg-rose-100 cursor-pointer transition border-b last:border-0"
                >
                  <span className="font-semibold">{a.id}</span> — {a.tipo_nombre} {a.marca} {a.modelo} (<span className="font-mono">{a.numero_serie}</span>)
                </div>
              ))}
          </div>
          {/* Mini-lista de artículos seleccionados */}
          {form.articulos.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {articulosSeleccionados.map(a => (
                <span
                  key={a.id}
                  className="bg-rose-100 text-rose-900 px-3 py-1 rounded-full shadow cursor-pointer hover:bg-rose-300 transition text-xs"
                  onClick={() => handleRemoveArticulo(a.id)}
                  title="Quitar de la selección"
                >
                  {a.id} - {a.tipo_nombre} {a.marca} {a.modelo}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Responsable de sistemas */}
        <div>
          <label className="block text-xs mb-1 text-gray-500">Entregado por (responsable de sistemas)</label>
          <input
            value={usuarioLogueado?.nombre || ""}
            readOnly
            className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 w-full text-gray-700"
            disabled
          />
        </div>
        {/* Comentarios */}
        <div>
          <label className="block text-xs mb-1 text-gray-500">Comentarios/Observaciones</label>
          <textarea
            name="comentarios"
            value={form.comentarios}
            onChange={handleChange}
            rows={3}
            placeholder="Detalles físicos, observaciones u otros..."
            className="border border-rose-200 rounded-2xl px-3 py-2 w-full bg-rose-50 focus:border-rose-400 transition"
          />
        </div>
        {/* Fechas y periodo */}
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs mb-1 text-gray-500">Fecha de préstamo</label>
            <input type="date" name="fecha_prestamo" value={form.fecha_prestamo}
              onChange={handleChange} required disabled className="border border-gray-300 rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-500">Periodo</label>
            <select name="periodo" value={form.periodo} onChange={handlePeriodo}
              className="border border-gray-300 rounded-xl px-3 py-2 bg-white">
              <option value="permanente">Permanente</option>
              <option value="periodo">Por periodo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-500">Fecha de vencimiento</label>
            <input
              type="date"
              name="fecha_vencimiento"
              value={form.fecha_vencimiento}
              onChange={handleChange}
              required={form.periodo === "periodo"}
              disabled={form.periodo === "permanente"}
              className="border border-gray-300 rounded-xl px-3 py-2"
            />
          </div>
        </div>
        {/* Botón */}
        <button type="submit"
          className="bg-rose-400 hover:bg-rose-500 text-white px-6 py-2 rounded-2xl shadow font-semibold">
          Registrar
        </button>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
      </form>
    </div>
  );
}

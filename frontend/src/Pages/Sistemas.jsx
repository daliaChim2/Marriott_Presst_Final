import { useEffect, useState } from "react";
import axios from "axios";

export default function Sistemas() {
  const [empleados, setEmpleados] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [form, setForm] = useState({
    empleado_id: "",
    articulos: [],
    usuario_entrega: "",
    comentarios: "",
    fecha_prestamo: new Date().toISOString().slice(0, 10),
    periodo: "permanente",
    fecha_vencimiento: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Cargar empleados, artículos y responsables de sistemas
  useEffect(() => {
    axios.get("http://localhost:3000/api/empleados")
      .then(res => setEmpleados(res.data))
      .catch(() => setError("Error al cargar empleados"));
    axios.get("http://localhost:3000/api/articulos/disponibles")
      .then(res => setArticulos(res.data))
      .catch(() => setError("Error al cargar artículos"));
    axios.get("http://localhost:3000/api/empleados-sistemas")
      .then(res => setResponsables(res.data))
      .catch(() => setError("Error al cargar responsables de sistemas"));
  }, []);

  // Manejar cambios de formulario
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

  // Manejar cambio de periodo
  const handlePeriodo = e => {
    const value = e.target.value;
    setForm(f => ({
      ...f,
      periodo: value,
      fecha_vencimiento: value === "permanente" ? "" : f.fecha_vencimiento
    }));
  };

  // Enviar formulario
  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.empleado_id || form.articulos.length === 0 || !form.usuario_entrega)
      return setError("Completa todos los campos obligatorios.");
    try {
      await axios.post("http://localhost:3000/api/prestamos", {
        ...form,
      });
      setSuccess("Préstamo registrado correctamente.");
      setForm({
        empleado_id: "",
        articulos: [],
        usuario_entrega: "",
        comentarios: "",
        fecha_prestamo: new Date().toISOString().slice(0, 10),
        periodo: "permanente",
        fecha_vencimiento: ""
      });
      // Recarga los artículos disponibles
      const res = await axios.get("http://localhost:3000/api/articulos/disponibles");
      setArticulos(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || "Error al registrar préstamo");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white p-6 rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Registrar préstamo</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Empleado que recibe */}
        <div>
          <label className="block text-xs mb-1 text-gray-500">Empleado que recibe</label>
          <select name="empleado_id" value={form.empleado_id} onChange={handleChange} required
            className="border border-gray-300 rounded-xl px-3 py-2 w-full bg-white">
            <option value="">Selecciona empleado...</option>
            {empleados.map(e => (
              <option key={e.id} value={e.id}>
                {e.nombre} ({e.numero_asociado}) - {e.hotel}
              </option>
            ))}
          </select>
        </div>
        {/* Artículos */}
        <div>
          <label className="block text-xs mb-1 text-gray-500">Artículos a prestar</label>
          <select
            name="articulos"
            value={form.articulos}
            onChange={handleChange}
            multiple
            required
            className="border border-gray-300 rounded-xl px-3 py-2 w-full bg-white"
            size={articulos.length > 4 ? 5 : articulos.length || 1}
          >
            {articulos.map(a => (
              <option key={a.id} value={a.id}>
                [{a.id}] {a.tipo_nombre} - {a.marca} {a.modelo} (N° Serie: {a.numero_serie})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Mantén Ctrl/Cmd para seleccionar varios.</p>
        </div>
        {/* Responsable de sistemas */}
        <div>
          <label className="block text-xs mb-1 text-gray-500">Entregado por (responsable de sistemas)</label>
          <select name="usuario_entrega" value={form.usuario_entrega} onChange={handleChange} required
            className="border border-gray-300 rounded-xl px-3 py-2 w-full bg-white">
            <option value="">Selecciona responsable...</option>
            {responsables.map(s => (
              <option key={s.id} value={s.nombre}>
                {s.nombre} {s.puesto ? `(${s.puesto})` : ""}
              </option>
            ))}
          </select>
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
          {form.periodo === "periodo" &&
            <div>
              <label className="block text-xs mb-1 text-gray-500">Fecha de vencimiento</label>
              <input type="date" name="fecha_vencimiento" value={form.fecha_vencimiento}
                onChange={handleChange} required className="border border-gray-300 rounded-xl px-3 py-2" />
            </div>
          }
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

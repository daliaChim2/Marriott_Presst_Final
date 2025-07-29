import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/Auth/AuthLayout";
import { registerUser } from "../../services/authService";

export default function Register() {
  const [form, setForm] = useState({
    nombre: "",
    username: "",
    correo: "",
    password: "",
    pregunta_seguridad: "",
    respuesta_seguridad: "",
  });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await registerUser(form);
      setMsg("Usuario registrado correctamente. Ahora puedes iniciar sesión.");
      setTimeout(() => navigate("/login"), 1600);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Error al registrar. Intenta con otro usuario o correo."
      );
    }
  };

  return (
    <AuthLayout title="Crear cuenta">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-rose-500 text-sm">{error}</p>}
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-gray-50 text-gray-900 placeholder-gray-400"
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Nombre de usuario"
          value={form.username}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-gray-50 text-gray-900 placeholder-gray-400"
          required
        />
        <input
          type="email"
          name="correo"
          placeholder="Correo electrónico"
          value={form.correo}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-gray-50 text-gray-900 placeholder-gray-400"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-gray-50 text-gray-900 placeholder-gray-400"
          required
        />
        <input
          type="text"
          name="pregunta_seguridad"
          placeholder="Pregunta de seguridad (ej: ¿Tu primer mascota?)"
          value={form.pregunta_seguridad}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-gray-50 text-gray-900 placeholder-gray-400"
          required
        />
        <input
          type="text"
          name="respuesta_seguridad"
          placeholder="Respuesta de seguridad"
          value={form.respuesta_seguridad}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-gray-50 text-gray-900 placeholder-gray-400"
          required
        />
        <button
          type="submit"
          className="w-full bg-rose-400 hover:bg-rose-500 text-white py-2 rounded-xl font-semibold"
        >
          Registrarme
        </button>
      </form>
      <div className="mt-4 text-center">
        <a
          href="/login"
          className="text-rose-400 hover:text-rose-500 hover:underline text-sm"
        >
          ¿Ya tienes cuenta? Inicia sesión
        </a>
      </div>
    </AuthLayout>
  );
}

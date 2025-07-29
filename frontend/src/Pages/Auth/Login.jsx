import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/Auth/AuthLayout';
import { loginUser } from '../../services/authService';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  try {
    const res = await loginUser(form);

    // GUARDA el usuario completo (JSON) y el token
    localStorage.setItem('user', JSON.stringify(res.user));
    localStorage.setItem('token', res.token);

    navigate('/dashboard');
  } catch (err) {
    setError(
      err?.response?.data?.error ||
      'Usuario o contraseña incorrectos. Intenta de nuevo.'
    );
  }
};

  return (
    <AuthLayout title="Iniciar Sesión">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-rose-500 text-sm">{error}</p>}
        <input
          type="text"
          name="username"
          placeholder="Usuario"
          value={form.username}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-gray-50 text-gray-900 placeholder-gray-400 transition"
          autoFocus
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-gray-50 text-gray-900 placeholder-gray-400 transition"
          required
        />
        <button
          type="submit"
          className="w-full bg-rose-400 hover:bg-rose-500 text-white py-2 rounded-xl font-semibold shadow transition-all duration-150"
        >
          Ingresar
        </button>
      </form>
      <div className="mt-4 text-center">
        <a
          href="/recuperar"
          className="text-rose-400 hover:text-rose-500 hover:underline text-sm"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </AuthLayout>
  );
}

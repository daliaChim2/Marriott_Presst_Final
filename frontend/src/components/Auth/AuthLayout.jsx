import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-500 via-black to-rose-500 flex items-center justify-center">
      <div className="w-full max-w-md bg-gradient-to-br from-rose-400 via-white to-pink-400 rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-rose-900 text-center mb-6">{title}</h2>
        {children}
        <p className="text-center text-gray-400 text-sm mt-6">
          <Link to={title === 'Iniciar Sesión' ? '/register' : '/login'} className="text-rose-600 hover:underline">
            {title === 'Iniciar Sesión' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </Link>
        </p>
      </div>
    </div>
  );
}

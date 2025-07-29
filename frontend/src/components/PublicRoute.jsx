// src/components/PublicRoute.jsx
import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  // Si ya hay token, no permite ver login/register y redirige a dashboard
  return !token ? children : <Navigate to="/dashboard" />;
}

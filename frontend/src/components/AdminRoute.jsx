import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  // Solo permite si hay token y el rol es 'admin'
  return (token && role === "admin") ? children : <Navigate to="/dashboard" />;
}

import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  // Solo permite el acceso si hay token
  return token ? children : <Navigate to="/login" />;
}

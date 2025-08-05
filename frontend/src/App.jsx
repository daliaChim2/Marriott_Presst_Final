import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
// import Dashboard from "./Pages/Dashboard";
import Colaboradores from "./Pages/Colaboradores";
import Equipos from "./Pages/Equipos";
import Sistemas from "./Pages/Sistemas";
import Resguardos from "./Pages/Resguardos";
import PruebaConexion from "./PruebaConexion";

import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";

import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute"; 

export default function App() {
  return (
    <Routes>
      {/* RUTAS PÚBLICAS, protegidas con PublicRoute */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* RUTAS PRIVADAS */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Colaboradores />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/sistemas" element={<Sistemas />} />
        <Route path="/resguardos" element={<Resguardos />} />
        <Route path="/prueba-conexion" element={<PruebaConexion />} />
      </Route>

      {/* RUTA DESCONOCIDA  pruebas quitarluego si es necesario*/}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

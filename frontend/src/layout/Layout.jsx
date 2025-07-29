import React from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />

      {/* Margen izquierdo solo si pantalla es mediana o más */}
      <div className="flex-1 flex flex-col overflow-auto bg-gray-100 ml-20 md:ml-64 transition-all duration-300">
        <Header />
        <div className="p-2 flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;

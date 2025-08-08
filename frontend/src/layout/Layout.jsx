import React from "react";
import Sidebar from "../components/layout/Sidebar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />

      {/* Cambia el margen izquierdo a 12 */}
      <div className="flex-1 flex flex-col overflow-auto bg-slate-50 ml-12 transition-all duration-300">
        <div className="p-6 flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;

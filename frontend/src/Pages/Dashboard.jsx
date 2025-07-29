import { useState } from "react";
import { FaUserTie, FaLaptop, FaKey, FaFileAlt } from "react-icons/fa";

export default function Inicio() {
  const historial = [
    { fecha: "2025-06-18", usuario: "Jose Luis", accion: "Asignación", detalle: "Se asignó equipo Dell a Carlos Martínez." },
    { fecha: "2025-06-17", usuario: "Luis Díaz", accion: "Edición", detalle: "Se actualizó acceso al sistema para Ana Torres." },
    { fecha: "2025-06-16", usuario: "Carla Méndez", accion: "Resguardo", detalle: "Se generó resguardo para laptop HP." },
    { fecha: "2025-06-15", usuario: "Mario López", accion: "Asignación", detalle: "Se asignó acceso SIGEA a Luis Romero." },
    { fecha: "2025-06-14", usuario: "Ana Gómez", accion: "Edición", detalle: "Se actualizó información del colaborador 002." },
    { fecha: "2025-06-13", usuario: "Jose Luis", accion: "Asignación", detalle: "Se asignó equipo Lenovo a Mariana Díaz." },
    { fecha: "2025-06-12", usuario: "Luis Díaz", accion: "Resguardo", detalle: "Se firmó resguardo por parte de Antonio Salas." },
    { fecha: "2025-06-11", usuario: "Carla Méndez", accion: "Asignación", detalle: "Se asignó acceso a correo corporativo." },
    { fecha: "2025-06-10", usuario: "Mario López", accion: "Edición", detalle: "Se cambió equipo del colaborador 004." },
    { fecha: "2025-06-09", usuario: "Ana Gómez", accion: "Resguardo", detalle: "Se generó resguardo de regreso de equipo Dell." },
    { fecha: "2025-06-08", usuario: "Jose Luis", accion: "Asignación", detalle: "Se asignó sistema de inventario a Pedro Juárez." },
    { fecha: "2025-06-07", usuario: "Luis Díaz", accion: "Edición", detalle: "Se editó puesto del colaborador 007." },
  ];

  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const registrosPaginados = historial.slice(inicio, inicio + registrosPorPagina);
  const totalPaginas = Math.ceil(historial.length / registrosPorPagina);

  const renderPaginacion = () => {
    const elementos = [];
    if (totalPaginas <= 7) {
      for (let i = 1; i <= totalPaginas; i++) elementos.push(i);
    } else {
      elementos.push(1);
      if (paginaActual > 4) elementos.push("...");
      const start = Math.max(2, paginaActual - 1);
      const end = Math.min(totalPaginas - 1, paginaActual + 1);
      for (let i = start; i <= end; i++) elementos.push(i);
      if (paginaActual < totalPaginas - 3) elementos.push("...");
      elementos.push(totalPaginas);
    }

    return (
      <div className="flex justify-center mt-4 gap-2">
        <button
          onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
          className="px-3 py-1 rounded-md text-sm bg-rose-500 text-white"
        >
          {"<"}
        </button>
        {elementos.map((el, index) => (
          <button
            key={index}
            onClick={() => typeof el === "number" && setPaginaActual(el)}
            disabled={el === "..."}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              paginaActual === el
                ? "bg-white text-rose-500 border border-rose-800"
                : "bg-rose-700 text-white"
            } ${el === "..." ? "cursor-default" : "cursor-pointer"}`}
          >
            {el}
          </button>
        ))}
        <button
          onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
          className="px-3 py-1 rounded-md text-sm bg-rose-500 text-white"
        >
          {">"}
        </button>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-10 bg-gray-100 min-h-screen">
      <p className="text-gray-700 text-center mb-8 max-w-2xl mx-auto">
        Este sistema te permite gestionar de forma eficiente la asignación de equipos, accesos a sistemas, colaboradores y la generación de resguardos digitales.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-10">
        <Card icon={<FaUserTie />} label="Colaboradores" />
        <Card icon={<FaLaptop />} label="Equipos" />
        <Card icon={<FaKey />} label="prestamos" />
        <Card icon={<FaFileAlt />} label="Resguardos" />
      </div>

      {/* Historial de Actividad Ajustado */}
      <div className="bg-white rounded-xl shadow-md p-6 max-w-4xl mx-auto">
  <h2 className="text-xl font-semibold text-rose-500 mb-4 text-center">Historial de Actividad</h2>
  <div className="overflow-x-auto rounded-md border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-rose-500 text-white">
        <tr>
          <th className="py-2 px-3 text-left font-medium tracking-wide">Fecha</th>
          <th className="py-2 px-3 text-left font-medium tracking-wide">Usuario</th>
          <th className="py-2 px-3 text-left font-medium tracking-wide">Acción</th>
          <th className="py-2 px-3 text-left font-medium tracking-wide">Detalle</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {registrosPaginados.map((item, index) => (
          <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
            <td className="py-1.5 px-3 whitespace-nowrap">{item.fecha}</td>
            <td className="py-1.5 px-3 whitespace-nowrap">{item.usuario}</td>
            <td className="py-1.5 px-3 whitespace-nowrap">{item.accion}</td>
            <td className="py-1.5 px-3">{item.detalle}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  <div className="mt-4">{renderPaginacion()}</div>
</div>

    </div>
  );
}

function Card({ icon, label }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center hover:shadow-xl transition duration-300">
      <div className="text-4xl text-rose-500 mb-4">{icon}</div>
      <h2 className="text-lg font-semibold text-center text-gray-800">{label}</h2>
    </div>
  );
}

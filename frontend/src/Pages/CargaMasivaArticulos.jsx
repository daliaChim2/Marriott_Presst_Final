// src/Pages/CargaMasivaArticulos.jsx
// AGREGAR CARGA AUTOMATICA***----------REFRESH----------------
import BulkUploader from "../components/BulkUploader";

export default function CargaMasivaArticulos() {
  const handleDone = (report) => {
    console.log("Carga masiva completada:", report);
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-rose-900 mb-6">Carga Masiva de Artículos</h2>
      <BulkUploader tipo="articulos" onDone={handleDone} />
    </div>
  );
}


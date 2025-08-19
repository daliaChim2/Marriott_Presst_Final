// src/Pages/CargaMasivaPrestamos.jsx
import BulkUploader from "../components/BulkUploader";

export default function CargaMasivaPrestamos() {
  return (
    <div className="p-4">
       <h2 className="text-3xl font-bold text-rose-900 mb-6">Carga Masiva de Préstamos</h2>
      <BulkUploader
        tipo="prestamos"
        onDone={(report) => {
          console.log("Carga masiva de préstamos completada:", report);
          alert("Carga masiva de préstamos completada");
        }}
      />
    </div>
  );
}

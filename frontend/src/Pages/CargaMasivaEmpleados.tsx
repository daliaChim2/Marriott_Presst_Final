import BulkUploader from "../components/BulkUploader";

export default function CargaMasivaEmpleados() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-rose-900 mb-6">Carga Masiva de Empleados</h2>
      <BulkUploader tipo="empleados" onDone={(data) => console.log("Reporte backend:", data)} />
        
    </div>
  );
}

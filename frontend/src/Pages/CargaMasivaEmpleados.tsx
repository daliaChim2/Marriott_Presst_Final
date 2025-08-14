import BulkUploader from "../components/BulkUploader";

export default function CargaMasivaEmpleados() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold mb-4">Carga masiva de empleados</h1>
      <BulkUploader tipo="empleados" onDone={(data) => console.log("Reporte backend:", data)} />
        
    </div>
  );
}

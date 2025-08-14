import { useMemo, useState } from "react";
import Papa from "papaparse";
import axios from "axios";

const PRESETS = {
  empleados: {
    columns: ["nombre","hotel","cargo","departamento","numero_asociado","enterpasssid","status"],
    endpoint: "http://localhost:3000/api/empleados/bulk?mode=upsert"
  },
  articulos: {
    columns: ["id","tipo_nombre","marca","modelo","numero_serie","estado","hotel","costo","descripcion","empleado_numero_asociado"],
    endpoint: "http://localhost:3000/api/articulos/bulk?mode=upsert"
  },
  prestamos: {
    columns: ["numero_asociado","usuario_entrega","fecha_prestamo","periodo","fecha_vencimiento","comentarios","articulos_ids"],
    endpoint: "http://localhost:3000/api/prestamos/bulk"
  }
};

/**
 * props:
 * - tipo: "empleados" | "articulos" | "prestamos"
 * - onDone?: (report) => void   // para refrescar la tabla al terminar
 */
export default function BulkUploader({ tipo, onDone }) {
  const cfg = PRESETS[tipo];
  const [rows, setRows] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const templateCsv = useMemo(() => cfg.columns.join(",") + "\n", [cfg.columns]);

  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setReport(null); setRows([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const normalized = res.data.map(obj => {
          const o = {};
          for (const k of Object.keys(obj)) {
            o[k.trim()] = typeof obj[k] === "string" ? obj[k].trim() : obj[k];
          }
          return o;
        });
        setRows(normalized);
      },
      error: (err) => setError("Error al leer CSV: " + err.message)
    });
  };

  // Si quieres mandar en lotes (chunks), descomenta y usa sendInChunks(rows, 300)
  const sendInChunks = async (allRows, size = 300) => {
    const chunks = [];
    for (let i = 0; i < allRows.length; i += size) {
      chunks.push(allRows.slice(i, i + size));
    }
    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      const { data } = await axios.post(cfg.endpoint, { rows: chunks[i] });
      results.push(data);
    }
    return results;
  };

  const enviar = async () => {
    if (rows.length === 0) return setError("No hay filas para enviar.");
    setError(""); setReport(null); setLoading(true);
    try {
      // 1) envío directo
      const { data } = await axios.post(cfg.endpoint, { rows });
      setReport(data);
      onDone?.(data);

      // 2) o por lotes:
      // const data = await sendInChunks(rows, 300);
      // setReport({ message: "Carga por lotes completa", parts: data });
      // onDone?.(data);
    } catch (e) {
      setError(e?.response?.data?.error || "Error al enviar los datos");
      setReport(e?.response?.data || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border p-4 shadow">
      <div className="mb-1 text-sm text-gray-600">
        <b>Plantilla esperada ({tipo}):</b> {cfg.columns.join(" , ")}
      </div>
      <a
        className="text-rose-700 underline text-sm"
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(templateCsv)}`}
        download={`plantilla_${tipo}.csv`}
      >
        Descargar plantilla CSV
      </a>

      <div className="mt-3">
        <input type="file" accept=".csv" onChange={handleFile} />
      </div>

      {rows.length > 0 && (
        <>
          <div className="text-sm mt-2 text-gray-600">Filas cargadas: {rows.length}</div>
          <div className="max-h-64 overflow-auto border rounded mt-2">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {cfg.columns.map(c => <th key={c} className="px-2 py-1 text-left">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => (
                  <tr key={i} className="border-t">
                    {cfg.columns.map(c => <td key={c} className="px-2 py-1">{r[c] ?? ""}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && (
              <div className="text-center text-xs text-gray-500 py-2">… mostrando primeras 100 filas</div>
            )}
          </div>
        </>
      )}

      <div className="mt-3 flex gap-2 items-center">
        <button
          onClick={enviar}
          className="bg-rose-900 hover:bg-rose-500 text-white px-4 py-2 rounded-2xl shadow disabled:opacity-50"
          disabled={loading || rows.length === 0}
        >
          {loading ? "Enviando…" : "Cargar en bloque"}
        </button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>

      {report && (
        <pre className="mt-3 bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify(report, null, 2)}</pre>
      )}
    </div>
  );
}

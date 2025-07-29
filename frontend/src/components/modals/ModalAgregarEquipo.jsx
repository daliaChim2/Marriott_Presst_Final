import { useState, useEffect, useRef } from "react";

export function ModalEquipo({ isOpen, onClose, onSave, equipo }) {
  const [tipo, setTipo] = useState(equipo?.tipo || "");
  const [marca, setMarca] = useState(equipo?.marca || "");
  const [numeroSerie, setNumeroSerie] = useState(equipo?.numeroSerie || "");
  const [estado, setEstado] = useState(equipo?.estado || "disponible");
  const [hotel, setHotel] = useState(equipo?.hotel || "JW");
  const [costo, setCosto] = useState(equipo?.costo || "");
  const [feedback, setFeedback] = useState(null); // 'success' | 'error'

  const dialogRef = useRef(null);

  // Sincroniza el formulario cuando pasas de agregar a editar
  useEffect(() => {
    setTipo(equipo?.tipo || "");
    setMarca(equipo?.marca || "");
    setNumeroSerie(equipo?.numeroSerie || "");
    setEstado(equipo?.estado || "disponible");
    setHotel(equipo?.hotel || "JW");
    setCosto(equipo?.costo || "");
  }, [equipo]);

  // Escape para cerrar
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Clic fuera del cuadro cierra modal
  const handleBackdropClick = (e) => {
    if (dialogRef.current && e.target === dialogRef.current) onClose();
  };

  // Muestra un toast arriba‑derecha
  const Toast = ({ type, message }) => (
    <div
      className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-xl text-white z-[60] transition-opacity duration-300 ${
        type === "success" ? "bg-emerald-500" : "bg-red-500"
      }`}
    >
      {message}
    </div>
  );

  const handleSubmit = async () => {
    if (!tipo || !marca || !numeroSerie || !costo) return;
    try {
      await Promise.resolve(onSave({ tipo, marca, numeroSerie, estado, hotel, costo }));
      setFeedback({ type: "success", message: "¡Artículo guardado exitosamente!" });
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Ocurrió un error al guardar." });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {feedback && <Toast {...feedback} />}
      <div
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 px-4 sm:px-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-equipo-title"
      >
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
          <h3 id="modal-equipo-title" className="text-xl font-semibold text-rose-500 mb-4 text-center">
            {equipo ? "Editar Artículo" : "Agregar Artículo"}
          </h3>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de artículo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              >
                <option value="" disabled>Seleccione tipo</option>
                <option value="laptop">Laptop</option>
                <option value="celular">Celular</option>
                <option value="tableta">Tableta</option>
                <option value="teclado">Teclado</option>
                <option value="impresora">Impresora</option>
                <option value="monitor">Monitor</option>
              </select>
            </div>

            {/* Marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Marca</label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            {/* Número de serie */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Número de serie</label>
              <input
                type="text"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            {/* Costo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Costo (MXN)</label>
              <input
                type="number"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                disabled={!!equipo?.id} // no modificable si ya existe
                min="0"
                step="0.01"
                placeholder="Ej. 4500.00"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100"
                required
              />
            </div>

            {/* Estado y Hotel */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="disponible">Disponible</option>
                  <option value="ocupado">Ocupado</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="fuera_servicio">Fuera de servicio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hotel</label>
                <select
                  value={hotel}
                  onChange={(e) => setHotel(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="JW">JW Marriott</option>
                  <option value="MR">Marriott Resort</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-800"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
 
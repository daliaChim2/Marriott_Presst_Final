import { useEffect } from "react";

function PruebaConexion() {
  useEffect(() => {
    fetch("http://localhost:3001/colaboradores")
      .then((res) => res.json())
      .then((data) => {
        console.log("Colaboradores desde backend:", data);
      })
      .catch((err) => {
        console.error("Error al conectar con backend:", err);
      });
  }, []);

  return <div>Probando conexión con el backend...</div>;
}

export default PruebaConexion;
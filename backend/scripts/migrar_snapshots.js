// utils/migrar_snapshots.js

const db = require('../src/config/db');

async function migrarSnapshots() {
  // Busca préstamos que NO tienen snapshot
  db.query(
    `SELECT p.*, e.nombre AS empleado_nombre, e.cargo AS empleado_cargo, e.departamento AS empleado_departamento, 
            e.numero_asociado AS empleado_numero_asociado, e.hotel AS empleado_hotel,
            es.nombre AS responsable_nombre, es.puesto AS responsable_puesto,
            GROUP_CONCAT(a.id) AS articulos_id,
            GROUP_CONCAT(a.marca) AS articulos_marca,
            GROUP_CONCAT(a.modelo) AS articulos_modelo,
            GROUP_CONCAT(a.numero_serie) AS articulos_numero_serie,
            GROUP_CONCAT(a.descripcion) AS articulos_descripcion,
            GROUP_CONCAT(a.costo) AS articulos_costo,
            GROUP_CONCAT(ta.nombre) AS articulos_tipo
    FROM prestamos p
    LEFT JOIN empleados e ON p.empleado_id = e.id
    LEFT JOIN empleados_sistemas es ON p.entregado_por_id = es.id
    LEFT JOIN prestamo_articulos pa ON pa.prestamo_id = p.id
    LEFT JOIN articulos a ON pa.articulo_id = a.id
    LEFT JOIN tipos_articulo ta ON a.tipo_id = ta.id
    WHERE p.id NOT IN (SELECT prestamo_id FROM resguardo_snapshots)
    GROUP BY p.id
    `,
    async (err, prestamos) => {
      if (err) {
        console.error('Error al obtener préstamos:', err);
        process.exit(1);
      }
      console.log(`Total préstamos a migrar: ${prestamos.length}`);
      let count = 0;
      for (const p of prestamos) {
        // --- Prepara los artículos como array de objetos completos ---
        const ids = (p.articulos_id || '').split(',');
        const marcas = (p.articulos_marca || '').split(',');
        const modelos = (p.articulos_modelo || '').split(',');
        const numeros = (p.articulos_numero_serie || '').split(',');
        const descripciones = (p.articulos_descripcion || '').split(',');
        const costos = (p.articulos_costo || '').split(',');
        const tipos = (p.articulos_tipo || '').split(',');
        const articulosArr = ids.map((id, i) => ({
          id,
          marca: marcas[i] || '',
          modelo: modelos[i] || '',
          numero_serie: numeros[i] || '',
          descripcion: descripciones[i] || '',
          costo: costos[i] || '',
          tipo: tipos[i] || ''
        }));

        // --- Inserta el snapshot ---
        await new Promise((resolve, reject) => {
          db.query(
            `INSERT INTO resguardo_snapshots 
              (prestamo_id, empleado_nombre, empleado_cargo, empleado_departamento, empleado_numero_asociado, empleado_hotel, responsable_nombre, responsable_puesto, articulos_json, fecha_prestamo, fecha_vencimiento, periodo, comentarios, folio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id, p.empleado_nombre, p.empleado_cargo, p.empleado_departamento,
              p.empleado_numero_asociado, p.empleado_hotel,
              p.responsable_nombre || p.usuario_entrega, p.responsable_puesto || 'Responsable de sistemas',
              JSON.stringify(articulosArr),
              p.fecha_prestamo, p.fecha_vencimiento, p.periodo, p.comentarios, p.folio
            ],
            (err2) => {
              if (err2) {
                console.error(`Error al migrar préstamo ${p.id}:`, err2);
                return reject(err2);
              }
              count++;
              console.log(`Snapshot creado para préstamo ${p.id} (folio: ${p.folio})`);
              resolve();
            }
          );
        });
      }
      console.log(`¡Migración completada! Total snapshots creados: ${count}`);
      process.exit(0);
    }
  );
}

// EJECUTAR
migrarSnapshots();

// ejecutar-> " node scripts/migrar_snapshots.js " para los prestamos viejos nates de la actualizacion de los pdfs para el snapshot
// esto desde la carpeta de backend
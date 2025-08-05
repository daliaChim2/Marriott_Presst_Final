# Marriott Presst Final

Sistema para el control de préstamos y resguardos de artículos en Marriott.

## Descripción

Esta aplicación permite registrar, gestionar y dar seguimiento a préstamos de equipos y artículos para colaboradores de Marriott. Incluye administración de usuarios y roles, generación de reportes en PDF y control de inventario. El sistema está compuesto por un backend (Node.js + Express) y un frontend (React + Vite + Tailwind CSS).

## Instalación

1. Clonar este repositorio:

   git clone https://github.com/daliaChim2/Marriott_Presst_Final.git
   cd Marriott_Presst_Final

2. Instalar dependencias del backend:

   cd backend
   npm install

3. Configurar las variables de entorno en el backend (archivo .env):
   - Datos de conexión a la base de datos.
   - Puerto.
   - Clave secreta para JWT.
   - Otros parámetros necesarios.

4. Iniciar el backend:

   npm run dev

5. Instalar dependencias del frontend:

   cd ../frontend
   npm install

6. Iniciar el frontend:

   npm run dev

7. Acceso al sistema:
   - Abrir http://localhost:5173 en el navegador.

## Funcionalidades principales

- Autenticación de usuarios y administradores.
- Registro y administración de usuarios con diferentes roles.
- Registro, edición y consulta de préstamos de artículos.
- Control de inventario de equipos y dispositivos.
- Generación de resguardos en PDF con diseño requerido.
- Visualización de historial de préstamos.
- Mensajes claros sobre errores, acciones realizadas o instrucciones al usuario.
- Cierre de sesión seguro.

## Estructura del proyecto

Marriott_Presst_Final/
  backend/
    src/
    .env
    ...
  frontend/
    src/
    ...
  README.md

## Notas

- El archivo .env no está incluido en el repositorio por motivos de seguridad.
- Para la generación de PDFs es necesario tener correctamente configurados los datos de los empleados y artículos en el sistema.
- Los módulos y rutas principales están documentados en el código fuente.

## Autores

- Jimmy (bcream290@gmail.com)
- Dalia (@daliaChim2)

## Licencia

Proyecto privado. Uso interno en Marriott.

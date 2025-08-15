const express = require('express');
const router = express.Router();
const empleadosController = require('../controllers/empleadosController');

// CRUD normal
router.get('/', empleadosController.getAll);
router.post('/', empleadosController.create);
router.put('/:id', empleadosController.update);
router.delete('/:id', empleadosController.delete);

// Ruta para carga masiva
router.post('/bulk', empleadosController.bulkUpload);

module.exports = router;

const express = require('express');
const router = express.Router();
const articulosController = require('../controllers/articulosController');

router.get('/', articulosController.getAll);
router.get('/disponibles', articulosController.getDisponibles);
router.post('/', articulosController.create);
router.put('/:id', articulosController.update);
router.delete('/:id', articulosController.delete);

module.exports = router;

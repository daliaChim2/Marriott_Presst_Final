const express = require('express');
const router = express.Router();
const prestamosController = require('../controllers/prestamosController');

router.get('/', prestamosController.getAll);
router.post('/', prestamosController.create);

router.put('/finalizar/:prestamoId', prestamosController.finalizar);


module.exports = router;

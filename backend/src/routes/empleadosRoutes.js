const express = require('express');
const router = express.Router();
const empleadosController = require('../controllers/empleadosController');

router.get('/', empleadosController.getAll);
router.post('/', empleadosController.create);
router.put('/:id', empleadosController.update);
router.delete('/:id', empleadosController.delete);

module.exports = router;

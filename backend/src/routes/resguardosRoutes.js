const express = require('express');
const router = express.Router();
const controller = require('../controllers/resguardosController');

router.get('/pdf/:prestamoId', controller.generarPDF);

module.exports = router;


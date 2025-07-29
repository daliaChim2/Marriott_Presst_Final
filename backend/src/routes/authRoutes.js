const express = require('express');
const router = express.Router();
const auth = require('../controllers/authcontroller');

router.post('/login', auth.login);
router.post('/register', auth.register);
router.post('/recuperar-password', auth.recuperarPassword);

module.exports = router;

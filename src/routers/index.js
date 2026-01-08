const express = require('express');
const router = express.Router();
const controller = require('../controllers/formularioController');

router.get('/', controller.formulario);
router.post('/salvar', controller.salvarFormulario);

module.exports = router;

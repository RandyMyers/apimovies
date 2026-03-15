const express = require('express');
const router = express.Router();
const creditController = require('../controllers/creditController');

router.get('/:id', creditController.getCredit);

module.exports = router;

const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');

router.get('/:id/alternative-names', networkController.getNetworkAlternativeNames);
router.get('/:id/images', networkController.getNetworkImages);
router.get('/:id', networkController.getNetwork);

module.exports = router;

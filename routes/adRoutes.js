const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');

// Public: get active ads for a given position and locale
router.get('/active', adController.getActiveAds);

// Public: track ad click (no auth required)
router.post('/:id/click', adController.trackClick);

module.exports = router;








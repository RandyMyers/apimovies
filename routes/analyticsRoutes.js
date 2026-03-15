const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { optionalAuth } = require('../middleware/auth');

router.post('/ingest', optionalAuth, analyticsController.ingest);

module.exports = router;

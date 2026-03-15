const express = require('express');
const router = express.Router();
const userTVController = require('../controllers/userTVController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Track TV show (create or update)
router.post('/:tvId', userTVController.trackTV);
router.put('/:tvId', userTVController.updateTVTracking);
router.delete('/:tvId', userTVController.removeTVTracking);

// Get user's tracked TV shows
router.get('/', userTVController.getUserTVShows);
router.get('/:tvId', userTVController.getUserTV);

module.exports = router;


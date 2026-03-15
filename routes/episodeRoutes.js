const express = require('express');
const router = express.Router();
const episodeController = require('../controllers/episodeController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Mark episode as watched/unwatched
router.post('/:tvId/season/:seasonNumber/episode/:episodeNumber/watched', episodeController.markEpisodeWatched);
router.delete('/:tvId/season/:seasonNumber/episode/:episodeNumber/watched', episodeController.markEpisodeUnwatched);

// Get episode tracking status
router.get('/:tvId/season/:seasonNumber/episode/:episodeNumber/status', episodeController.getEpisodeStatus);

module.exports = router;


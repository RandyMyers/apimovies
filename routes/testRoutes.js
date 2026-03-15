const express = require('express');
const router = express.Router();
const tmdbService = require('../services/tmdbService');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Test endpoint to verify TMDb API response structure
router.get('/test-tv/:tvId', optionalAuth, async (req, res) => {
  try {
    const { tvId } = req.params;
    const tvDetails = await tmdbService.getTVDetails(tvId);
    
    res.json({
      success: true,
      tvId: parseInt(tvId),
      showName: tvDetails.name,
      next_episode_to_air: tvDetails.next_episode_to_air,
      last_episode_to_air: tvDetails.last_episode_to_air,
      in_production: tvDetails.in_production,
      status: tvDetails.status,
      number_of_seasons: tvDetails.number_of_seasons,
      seasons: tvDetails.seasons?.map(s => ({
        season_number: s.season_number,
        episode_count: s.episode_count,
        air_date: s.air_date,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data,
    });
  }
});

module.exports = router;


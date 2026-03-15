const tmdbService = require('../services/tmdbService');

// Get a single TMDb review by review ID (from TMDb API, not app reviews)
exports.getTmdbReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const data = await tmdbService.getTmdbReview(reviewId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

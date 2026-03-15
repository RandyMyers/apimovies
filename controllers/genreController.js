const tmdbService = require('../services/tmdbService');

// GET /api/v1/genres/movie/list - TMDB: genre/movie/list
exports.getMovieGenres = async (req, res) => {
  try {
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getMovieGenres(language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/v1/genres/tv/list - TMDB: genre/tv/list
exports.getTVGenres = async (req, res) => {
  try {
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVGenres(language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

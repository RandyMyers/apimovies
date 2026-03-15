const tmdbService = require('../services/tmdbService');

exports.getKeyword = async (req, res) => {
  try {
    const keywordId = parseInt(req.params.id);
    const data = await tmdbService.getKeyword(keywordId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getKeywordMovies = async (req, res) => {
  try {
    const keywordId = parseInt(req.params.id);
    const options = {
      page: parseInt(req.query.page) || 1,
      language: req.query.language || 'en-US',
      includeAdult: req.query.include_adult === 'true',
    };
    const data = await tmdbService.getKeywordMovies(keywordId, options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

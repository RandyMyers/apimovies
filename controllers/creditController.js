const tmdbService = require('../services/tmdbService');

exports.getCredit = async (req, res) => {
  try {
    const creditId = req.params.id;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getCredit(creditId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

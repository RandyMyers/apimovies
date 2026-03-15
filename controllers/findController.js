const tmdbService = require('../services/tmdbService');

exports.findByExternalId = async (req, res) => {
  try {
    const externalId = req.params.externalId || req.query.external_id;
    if (!externalId) {
      return res.status(400).json({ error: 'external_id is required (path or query)' });
    }
    const externalSource = req.query.external_source || 'imdb_id';
    const language = req.query.language || 'en-US';
    const data = await tmdbService.findByExternalId(externalId, externalSource, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

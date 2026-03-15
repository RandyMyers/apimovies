const tmdbService = require('../services/tmdbService');

exports.getNetwork = async (req, res) => {
  try {
    const networkId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getNetwork(networkId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNetworkAlternativeNames = async (req, res) => {
  try {
    const networkId = parseInt(req.params.id);
    const data = await tmdbService.getNetworkAlternativeNames(networkId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNetworkImages = async (req, res) => {
  try {
    const networkId = parseInt(req.params.id);
    const data = await tmdbService.getNetworkImages(networkId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

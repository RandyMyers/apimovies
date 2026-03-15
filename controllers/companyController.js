const tmdbService = require('../services/tmdbService');

exports.getCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getCompany(companyId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCompanyAlternativeNames = async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const data = await tmdbService.getCompanyAlternativeNames(companyId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCompanyImages = async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const data = await tmdbService.getCompanyImages(companyId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

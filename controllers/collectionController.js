const tmdbService = require('../services/tmdbService');

// Get collection details
exports.getCollection = async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    
    const data = await tmdbService.getCollection(collectionId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCollectionImages = async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getCollectionImages(collectionId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCollectionTranslations = async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getCollectionTranslations(collectionId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCollectionImages = async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getCollectionImages(collectionId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCollectionTranslations = async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getCollectionTranslations(collectionId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const tmdbService = require('../services/tmdbService');

// Get popular people (must be before /:id route)
exports.getPersonPopular = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getPersonPopular(page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonLatest = async (req, res) => {
  try {
    const data = await tmdbService.getPersonLatest();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonChanges = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
    };
    const data = await tmdbService.getPersonChanges(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get person details
exports.getPersonDetails = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const appendToResponse = req.query.append_to_response || '';
    
    const data = await tmdbService.getPersonDetails(personId, {
      language,
      appendToResponse,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get person's movie credits
exports.getPersonMovieCredits = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    
    const data = await tmdbService.getPersonMovieCredits(personId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get person's TV credits
exports.getPersonTVCredits = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    
    const data = await tmdbService.getPersonTVCredits(personId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Person extras
exports.getPersonCombinedCredits = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getPersonCombinedCredits(personId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonExternalIds = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const data = await tmdbService.getPersonExternalIds(personId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonImages = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const data = await tmdbService.getPersonImages(personId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonTaggedImages = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getPersonTaggedImages(personId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonTranslations = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const data = await tmdbService.getPersonTranslations(personId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Person extras (TMDB unused endpoints)
exports.getPersonPopular = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getPersonPopular(page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonCombinedCredits = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getPersonCombinedCredits(personId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonExternalIds = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const data = await tmdbService.getPersonExternalIds(personId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonImages = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const data = await tmdbService.getPersonImages(personId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonTaggedImages = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getPersonTaggedImages(personId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonTranslations = async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const data = await tmdbService.getPersonTranslations(personId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonLatest = async (req, res) => {
  try {
    const data = await tmdbService.getPersonLatest();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPersonChanges = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
    };
    const data = await tmdbService.getPersonChanges(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const tmdbService = require('../services/tmdbService');

// Universal search (movies, TV, people)
exports.searchMulti = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const includeAdult = req.query.include_adult === 'true';
    
    const data = await tmdbService.searchMulti(query, {
      page,
      language,
      includeAdult,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchCollections = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.searchCollections(query, { page, language });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchCompanies = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.searchCompanies(query, { page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchKeywords = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.searchKeywords(query, { page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search collections by name
exports.searchCollections = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.searchCollections(query, { page, language });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search companies
exports.searchCompanies = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.searchCompanies(query, { page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search keywords
exports.searchKeywords = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.searchKeywords(query, { page });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


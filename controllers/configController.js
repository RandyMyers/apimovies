const tmdbService = require('../services/tmdbService');

// Configuration
exports.getConfiguration = async (req, res) => {
  try {
    const data = await tmdbService.getConfiguration();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getConfigurationCountries = async (req, res) => {
  try {
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getConfigurationCountries(language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getConfigurationLanguages = async (req, res) => {
  try {
    const data = await tmdbService.getConfigurationLanguages();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getConfigurationPrimaryTranslations = async (req, res) => {
  try {
    const data = await tmdbService.getConfigurationPrimaryTranslations();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getConfigurationTimezones = async (req, res) => {
  try {
    const data = await tmdbService.getConfigurationTimezones();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getConfigurationJobs = async (req, res) => {
  try {
    const data = await tmdbService.getConfigurationJobs();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Certifications
exports.getMovieCertifications = async (req, res) => {
  try {
    const data = await tmdbService.getMovieCertifications();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVCertifications = async (req, res) => {
  try {
    const data = await tmdbService.getTVCertifications();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Watch providers (global lists)
exports.getWatchProviderRegions = async (req, res) => {
  try {
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getWatchProviderRegions(language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWatchProviderMovies = async (req, res) => {
  try {
    const options = {
      language: req.query.language || 'en-US',
      watchRegion: req.query.watch_region,
    };
    const data = await tmdbService.getWatchProviderMovies(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWatchProviderTV = async (req, res) => {
  try {
    const options = {
      language: req.query.language || 'en-US',
      watchRegion: req.query.watch_region,
    };
    const data = await tmdbService.getWatchProviderTV(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

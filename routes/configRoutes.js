const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// Configuration
router.get('/configuration', configController.getConfiguration);
router.get('/configuration/countries', configController.getConfigurationCountries);
router.get('/configuration/languages', configController.getConfigurationLanguages);
router.get('/configuration/primary-translations', configController.getConfigurationPrimaryTranslations);
router.get('/configuration/timezones', configController.getConfigurationTimezones);
router.get('/configuration/jobs', configController.getConfigurationJobs);

// Certifications
router.get('/certifications/movie', configController.getMovieCertifications);
router.get('/certifications/tv', configController.getTVCertifications);

// Watch providers (global)
router.get('/watch-providers/regions', configController.getWatchProviderRegions);
router.get('/watch-providers/movie', configController.getWatchProviderMovies);
router.get('/watch-providers/tv', configController.getWatchProviderTV);

module.exports = router;

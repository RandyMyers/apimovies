const express = require('express');
const router = express.Router();
const tmdbReviewController = require('../controllers/tmdbReviewController');

// Single TMDb review by TMDb review ID (not app review ID)
router.get('/:id', tmdbReviewController.getTmdbReview);

module.exports = router;

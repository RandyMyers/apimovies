const express = require('express');
const router = express.Router();
const userMovieController = require('../controllers/userMovieController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Track movie (create or update)
router.post('/:movieId', userMovieController.trackMovie);
router.put('/:movieId', userMovieController.updateMovieTracking);
router.delete('/:movieId', userMovieController.removeMovieTracking);

// Get user's tracked movies
router.get('/', userMovieController.getUserMovies);
router.get('/:movieId', userMovieController.getUserMovie);

module.exports = router;


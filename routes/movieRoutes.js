const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { authenticate } = require('../middleware/auth');

// Public routes (specific paths before :id)
router.get('/popular', movieController.getPopularMovies);
router.get('/top-rated', movieController.getTopRatedMovies);
router.get('/upcoming', movieController.getUpcomingMovies);
router.get('/now-playing', movieController.getNowPlayingMovies);
router.get('/trending', movieController.getTrendingMovies);
router.get('/search', movieController.searchMovies);
router.get('/discover', movieController.discoverMovies);
router.get('/latest', movieController.getMovieLatest);
router.get('/changes', movieController.getMovieChanges);
router.get('/:id', movieController.getMovieDetails);
router.get('/:id/videos', movieController.getMovieVideos);
router.get('/:id/images', movieController.getMovieImages);
router.get('/:id/credits', movieController.getMovieCredits);
router.get('/:id/similar', movieController.getSimilarMovies);
router.get('/:id/recommendations', movieController.getMovieRecommendations);
router.get('/:id/watch-providers', movieController.getMovieWatchProviders);
router.get('/:id/reviews', movieController.getMovieReviews);
router.get('/:id/alternative-titles', movieController.getMovieAlternativeTitles);
router.get('/:id/external-ids', movieController.getMovieExternalIds);
router.get('/:id/keywords', movieController.getMovieKeywords);
router.get('/:id/release-dates', movieController.getMovieReleaseDates);
router.get('/:id/translations', movieController.getMovieTranslations);
router.get('/:id/lists', movieController.getMovieLists);

// Protected routes (require authentication)
router.post('/:id/watchlist', authenticate, movieController.addToWatchlist);
router.delete('/:id/watchlist', authenticate, movieController.removeFromWatchlist);
router.post('/:id/favorite', authenticate, movieController.addToFavorites);
router.delete('/:id/favorite', authenticate, movieController.removeFromFavorites);
router.post('/:id/rating', authenticate, movieController.rateMovie);

module.exports = router;


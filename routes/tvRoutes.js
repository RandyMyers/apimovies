const express = require('express');
const router = express.Router();
const tvController = require('../controllers/tvController');
const { authenticate } = require('../middleware/auth');

// Public routes (specific paths before :id)
router.get('/popular', tvController.getPopularTV);
router.get('/top-rated', tvController.getTopRatedTV);
router.get('/on-the-air', tvController.getOnTheAirTV);
router.get('/trending', tvController.getTrendingTV);
router.get('/search', tvController.searchTV);
router.get('/discover', tvController.discoverTV);
router.get('/latest', tvController.getTVLatest);
router.get('/changes', tvController.getTVChanges);
router.get('/episode-group/:episodeGroupId', tvController.getTVEpisodeGroup);
router.get('/:id/season/:seasonNumber', tvController.getTVSeasonDetails);
router.get('/:id/season/:seasonNumber/credits', tvController.getTVSeasonCredits);
router.get('/:id/season/:seasonNumber/images', tvController.getTVSeasonImages);
router.get('/:id/season/:seasonNumber/videos', tvController.getTVSeasonVideos);
router.get('/:id/season/:seasonNumber/episode/:episodeNumber/credits', tvController.getTVEpisodeCredits);
router.get('/:id/season/:seasonNumber/episode/:episodeNumber/images', tvController.getTVEpisodeImages);
router.get('/:id/season/:seasonNumber/episode/:episodeNumber/videos', tvController.getTVEpisodeVideos);
router.get('/:id', tvController.getTVDetails);
router.get('/:id/videos', tvController.getTVVideos);
router.get('/:id/images', tvController.getTVImages);
router.get('/:id/credits', tvController.getTVCredits);
router.get('/:id/aggregate-credits', tvController.getTVAggregateCredits);
router.get('/:id/similar', tvController.getSimilarTV);
router.get('/:id/recommendations', tvController.getTVRecommendations);
router.get('/:id/watch-providers', tvController.getTVWatchProviders);
router.get('/:id/reviews', tvController.getTVReviews);
router.get('/:id/alternative-titles', tvController.getTVAlternativeTitles);
router.get('/:id/content-ratings', tvController.getTVContentRatings);
router.get('/:id/keywords', tvController.getTVKeywords);
router.get('/:id/translations', tvController.getTVTranslations);
router.get('/:id/lists', tvController.getTVLists);
router.get('/:id/episode-groups', tvController.getTVEpisodeGroups);
router.get('/:id/screened-theatrically', tvController.getTVScreenedTheatrically);

// Protected routes
router.post('/:id/watchlist', authenticate, tvController.addToWatchlist);
router.delete('/:id/watchlist', authenticate, tvController.removeFromWatchlist);
router.post('/:id/favorite', authenticate, tvController.addToFavorites);
router.delete('/:id/favorite', authenticate, tvController.removeFromFavorites);
router.post('/:id/rating', authenticate, tvController.rateTV);

module.exports = router;


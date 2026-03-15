const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/movie/:movieId', reviewController.getMovieReviews);
router.get('/tv/:tvId', reviewController.getTVReviews);
router.get('/user/:userId', reviewController.getUserReviews);
router.get('/:id', reviewController.getReview);

// Protected routes
router.post('/', authenticate, reviewController.createReview);
router.put('/:id', authenticate, reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);
router.post('/:id/like', authenticate, reviewController.likeReview);
router.delete('/:id/like', authenticate, reviewController.unlikeReview);

module.exports = router;


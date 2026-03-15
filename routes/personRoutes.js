const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');

// Public routes (specific paths before :id)
router.get('/popular', personController.getPersonPopular);
router.get('/latest', personController.getPersonLatest);
router.get('/changes', personController.getPersonChanges);
router.get('/:id', personController.getPersonDetails);
router.get('/:id/movie-credits', personController.getPersonMovieCredits);
router.get('/:id/tv-credits', personController.getPersonTVCredits);
router.get('/:id/combined-credits', personController.getPersonCombinedCredits);
router.get('/:id/external-ids', personController.getPersonExternalIds);
router.get('/:id/images', personController.getPersonImages);
router.get('/:id/tagged-images', personController.getPersonTaggedImages);
router.get('/:id/translations', personController.getPersonTranslations);

module.exports = router;


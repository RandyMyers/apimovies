const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');

// Public routes (specific before :id)
router.get('/:id/images', collectionController.getCollectionImages);
router.get('/:id/translations', collectionController.getCollectionTranslations);
router.get('/:id', collectionController.getCollection);

module.exports = router;


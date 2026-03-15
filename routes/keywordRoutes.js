const express = require('express');
const router = express.Router();
const keywordController = require('../controllers/keywordController');

router.get('/:id/movies', keywordController.getKeywordMovies);
router.get('/:id', keywordController.getKeyword);

module.exports = router;

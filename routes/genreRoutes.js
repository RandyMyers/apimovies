const express = require('express');
const router = express.Router();
const genreController = require('../controllers/genreController');

router.get('/movie/list', genreController.getMovieGenres);
router.get('/tv/list', genreController.getTVGenres);

module.exports = router;

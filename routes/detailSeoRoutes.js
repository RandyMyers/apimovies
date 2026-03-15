const express = require('express');
const router = express.Router();
const detailSeoController = require('../controllers/detailSeoController');

// Public: get SEO meta for a movie or TV detail page (uses site from query/header)
router.get('/meta', detailSeoController.getMeta);

module.exports = router;

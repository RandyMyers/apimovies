const express = require('express');
const router = express.Router();
const findController = require('../controllers/findController');

// GET /api/v1/find/tt0133093?external_source=imdb_id or GET /api/v1/find?external_id=tt0133093&external_source=imdb_id
router.get('/:externalId?', findController.findByExternalId);

module.exports = router;

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Universal search (multi-search)
router.get('/', searchController.searchMulti);
router.get('/collections', searchController.searchCollections);
router.get('/companies', searchController.searchCompanies);
router.get('/keywords', searchController.searchKeywords);

module.exports = router;


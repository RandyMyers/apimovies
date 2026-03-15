const express = require('express');
const router = express.Router();
const productDealController = require('../controllers/productDealController');

// Public: get product deals for a movie or TV show
router.get('/', productDealController.getProductDeals);

module.exports = router;

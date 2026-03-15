const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

router.get('/:id/alternative-names', companyController.getCompanyAlternativeNames);
router.get('/:id/images', companyController.getCompanyImages);
router.get('/:id', companyController.getCompany);

module.exports = router;

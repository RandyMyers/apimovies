const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');
const { authenticate } = require('../middleware/auth');

// All list routes require authentication
router.use(authenticate);

// Special list routes (must be before /:id to avoid "watchlist" matching as id)
router.get('/watchlist/all', listController.getWatchlist);
router.get('/favorites/all', listController.getFavorites);

// List routes
router.get('/', listController.getUserLists);
router.post('/', listController.createList);
router.get('/:id', listController.getList);
router.put('/:id', listController.updateList);
router.delete('/:id', listController.deleteList);

// List item routes
router.get('/:id/items', listController.getListItems);
router.post('/:id/items', listController.addListItem);
router.delete('/:id/items/:itemId', listController.removeListItem);

module.exports = router;

